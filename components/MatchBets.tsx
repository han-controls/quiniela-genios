'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { type Outcome, outcomeLabel } from '@/lib/types';

interface Props {
  matchId: string;
  finished: boolean;
  currentPlayerId: string | null;
  homeTeam: string;
  awayTeam: string;
}

interface Bet {
  player_id: string;
  name: string;
  label: string;
  points: number;
}

// PostgREST devuelve la relación embebida como objeto (to-one) o null.
interface Row {
  player_id: string;
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: Outcome | null;
  points: number;
  players: { name: string } | null;
}

export function MatchBets({ matchId, finished, currentPlayerId, homeTeam, awayTeam }: Props) {
  const [bets, setBets] = useState<Bet[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from('predictions')
        .select('player_id, pred_home, pred_away, pred_outcome, points, players(name)')
        .eq('match_id', matchId)
        .returns<Row[]>();

      const rows: Bet[] = (data ?? []).map((r) => {
        const parts: string[] = [];
        if (r.pred_outcome) parts.push(outcomeLabel(r.pred_outcome, homeTeam, awayTeam));
        if (r.pred_home != null && r.pred_away != null) parts.push(`${r.pred_home}–${r.pred_away}`);
        return {
          player_id: r.player_id,
          name: r.players?.name ?? '—',
          label: parts.join(' · '),
          points: r.points,
        };
      });

      rows.sort((a, b) =>
        finished ? b.points - a.points || a.name.localeCompare(b.name) : a.name.localeCompare(b.name),
      );
      setBets(rows);
      setLoading(false);
    }
    load();
  }, [matchId, finished]);

  if (loading) {
    return <p className="py-2 text-center text-xs text-muted-foreground">Cargando apuestas…</p>;
  }

  if (!bets || bets.length === 0) {
    return <p className="py-2 text-center text-xs text-muted-foreground">Nadie apostó en este partido.</p>;
  }

  return (
    <ul className="mt-2 space-y-1 border-t border-border pt-2">
      {bets.map((b) => {
        const me = b.player_id === currentPlayerId;
        return (
          <li
            key={b.player_id}
            className={`flex items-center justify-between rounded-md px-2 py-1 text-sm ${me ? 'bg-grass/10' : ''}`}
          >
            <span className="truncate">
              {b.name} {me && <span className="text-xs text-grass">(tú)</span>}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-bold tabular-nums">{b.label}</span>
              {finished && (
                <Badge variant="outline" className="bg-grass/15 text-grass">
                  +{b.points}
                </Badge>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
