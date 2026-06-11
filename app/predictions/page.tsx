'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePlayer } from '@/lib/usePlayer';
import { MatchCard } from '@/components/MatchCard';
import {
  type Match,
  type Prediction,
  STAGE_ORDER,
  STAGE_LABELS,
} from '@/lib/types';

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
      <h1 className="text-2xl font-bold">Partidos</h1>
      {stages.map((stage) => (
        <section key={stage} className="space-y-3">
          <h2 className="sticky top-0 z-10 bg-slate-950/90 py-1 text-lg font-bold text-grass backdrop-blur">
            {STAGE_LABELS[stage] ?? stage}
          </h2>
          {matches
            .filter((m) => m.stage === stage)
            .map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={preds[m.id] ?? null}
                playerId={player?.id ?? null}
              />
            ))}
        </section>
      ))}
    </div>
  );
}
