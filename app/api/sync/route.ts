import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorldCupMatches, mapStatus, type ApiMatch } from '@/lib/football-api';
import { predictionPoints, specialPoints } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Construye la fila de `matches` a partir de un partido de la API.
function toMatchRow(m: ApiMatch) {
  return {
    api_id: m.id,
    stage: m.stage,
    group_name: m.group,
    home_team: m.homeTeam.name ?? 'Por definir',
    away_team: m.awayTeam.name ?? 'Por definir',
    home_flag: m.homeTeam.crest,
    away_flag: m.awayTeam.crest,
    match_date: m.utcDate,
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
    status: mapStatus(m.status),
  };
}

async function handleSync(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient();

  // 1) Traer partidos de la API y hacer upsert (conflicto en api_id).
  const apiMatches = await getWorldCupMatches();
  const rows = apiMatches.map(toMatchRow);

  if (rows.length > 0) {
    const { error } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'api_id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 2) Recalcular puntos de predicciones de partidos terminados.
  const { data: finished } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .eq('status', 'finished')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  let updatedPredictions = 0;

  if (finished && finished.length > 0) {
    const matchIds = finished.map((m) => m.id);
    const { data: preds } = await supabase
      .from('predictions')
      .select('id, match_id, bet_type, pred_home, pred_away, pred_outcome, points')
      .in('match_id', matchIds);

    const scoreById = new Map(
      finished.map((m) => [m.id, { h: m.home_score as number, a: m.away_score as number }]),
    );

    for (const p of preds ?? []) {
      const real = scoreById.get(p.match_id);
      if (!real) continue;
      const pts = predictionPoints(p, real.h, real.a);
      if (pts !== p.points) {
        const { error } = await supabase
          .from('predictions')
          .update({ points: pts })
          .eq('id', p.id);
        if (!error) updatedPredictions++;
      }
    }
  }

  // 3) Recalcular puntos especiales si ya se conocen semifinalistas/campeón.
  const updatedSpecial = await recomputeSpecial(supabase);

  return NextResponse.json({
    ok: true,
    matches: rows.length,
    updatedPredictions,
    updatedSpecial,
  });
}

// Determina semifinalistas (equipos en SEMI_FINALS) y campeón (ganador de FINAL),
// luego actualiza los puntos de cada special_prediction.
async function recomputeSpecial(
  supabase: ReturnType<typeof createClient>,
): Promise<number> {
  const { data: semiMatches } = await supabase
    .from('matches')
    .select('home_team, away_team')
    .eq('stage', 'SEMI_FINALS');

  const semifinalists = new Set<string>();
  for (const m of semiMatches ?? []) {
    if (m.home_team && m.home_team !== 'Por definir') semifinalists.add(m.home_team);
    if (m.away_team && m.away_team !== 'Por definir') semifinalists.add(m.away_team);
  }

  let champion: string | null = null;
  const { data: finalMatch } = await supabase
    .from('matches')
    .select('home_team, away_team, home_score, away_score, status')
    .eq('stage', 'FINAL')
    .maybeSingle();

  if (
    finalMatch &&
    finalMatch.status === 'finished' &&
    finalMatch.home_score != null &&
    finalMatch.away_score != null
  ) {
    champion =
      finalMatch.home_score >= finalMatch.away_score
        ? finalMatch.home_team
        : finalMatch.away_team;
  }

  // Si todavía no hay nada que puntuar, no tocamos nada.
  if (semifinalists.size === 0 && !champion) return 0;

  const actual = { champion, semifinalists: [...semifinalists] };

  const { data: specials } = await supabase
    .from('special_predictions')
    .select('id, champion, semi_1, semi_2, semi_3, semi_4, points');

  let updated = 0;
  for (const s of specials ?? []) {
    const pts = specialPoints(
      { champion: s.champion, semis: [s.semi_1, s.semi_2, s.semi_3, s.semi_4] },
      actual,
    );
    if (pts !== s.points) {
      const { error } = await supabase
        .from('special_predictions')
        .update({ points: pts })
        .eq('id', s.id);
      if (!error) updated++;
    }
  }

  return updated;
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

// Permitir GET para el Cron de Vercel (que hace GET por defecto).
export async function GET(req: NextRequest) {
  return handleSync(req);
}
