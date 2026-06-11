'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePlayer } from '@/lib/usePlayer';
import { MatchCard } from '@/components/MatchCard';
import { RefreshButton } from '@/components/RefreshButton';
import {
  type Match,
  type Prediction,
  STAGE_ORDER,
  STAGE_LABELS,
} from '@/lib/types';

// Clave de día (en hora local) para agrupar; ej. "2026-06-11".
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Encabezado legible de un día; ej. "jueves 11 de junio".
function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Agrupa una lista de partidos (ya ordenada por fecha) en bloques por día.
function groupByDay(matches: Match[]): { key: string; label: string; items: Match[] }[] {
  const groups: { key: string; label: string; items: Match[] }[] = [];
  for (const m of matches) {
    const key = dayKey(m.match_date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, label: dayLabel(m.match_date), items: [m] });
  }
  return groups;
}

export default function PredictionsPage() {
  const { player, loaded } = usePlayer();
  const [matches, setMatches] = useState<Match[]>([]);
  const [preds, setPreds] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    const supabase = createClient();

    async function load() {
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });
      setMatches((m as Match[]) ?? []);

      if (player) {
        const { data: p } = await supabase
          .from('predictions')
          .select('*')
          .eq('player_id', player.id);
        const map: Record<string, Prediction> = {};
        for (const pr of (p as Prediction[]) ?? []) map[pr.match_id] = pr;
        setPreds(map);
      }
      setLoading(false);
    }

    load();
  }, [loaded, player]);

  if (loaded && !player) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-300">Primero entra con tu nombre.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-grass px-4 py-2 font-semibold text-slate-950"
        >
          Ir a la entrada
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="py-10 text-center text-slate-400">Cargando partidos…</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        Todavía no hay partidos sincronizados. Ejecuta la sincronización
        (<code className="text-slate-300">/api/sync</code>) o espera al cron.
      </div>
    );
  }

  // Agrupar por fase, respetando el orden del torneo.
  const stages = [...new Set(matches.map((m) => m.stage))].sort(
    (a, b) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <RefreshButton />
      </div>
      {stages.map((stage) => (
        <section key={stage} className="space-y-4">
          <h2 className="sticky top-14 z-10 -mx-4 bg-background/90 px-4 py-2 text-lg font-bold text-grass backdrop-blur">
            {STAGE_LABELS[stage] ?? stage}
          </h2>
          {groupByDay(matches.filter((m) => m.stage === stage)).map((day) => (
            <div key={day.key} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold capitalize text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {day.label}
                <span className="h-px flex-1 bg-border" />
              </h3>
              {day.items.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  prediction={preds[m.id] ?? null}
                  playerId={player?.id ?? null}
                />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
