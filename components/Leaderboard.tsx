'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePlayer } from '@/lib/usePlayer';
import { POINTS_EXACT, POINTS_OUTCOME } from '@/lib/scoring';
import type { LeaderboardRow } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

export function Leaderboard() {
  const { player } = usePlayer();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    const [{ data: players }, { data: preds }, { data: specials }] = await Promise.all([
      supabase.from('players').select('id, name'),
      supabase.from('predictions').select('player_id, points'),
      supabase.from('special_predictions').select('player_id, points'),
    ]);

    const byPlayer = new Map<string, LeaderboardRow>();
    for (const p of players ?? []) {
      byPlayer.set(p.id, {
        player_id: p.id,
        name: p.name,
        total: 0,
        exact: 0,
        outcomes: 0,
        special: 0,
      });
    }

    for (const pr of preds ?? []) {
      const row = byPlayer.get(pr.player_id);
      if (!row) continue;
      row.total += pr.points ?? 0;
      if (pr.points === POINTS_EXACT) row.exact++;
      else if (pr.points === POINTS_OUTCOME) row.outcomes++;
    }

    for (const sp of specials ?? []) {
      const row = byPlayer.get(sp.player_id);
      if (!row) continue;
      row.special += sp.points ?? 0;
      row.total += sp.points ?? 0;
    }

    const sorted = [...byPlayer.values()].sort(
      (a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name),
    );
    setRows(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const supabase = createClient();
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'special_predictions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  if (loading) return <p className="py-10 text-center text-muted-foreground">Cargando tabla…</p>;

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aún no hay participantes. ¡Sé el primero en entrar!
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead className="text-right">Pts</TableHead>
            <TableHead className="hidden text-right sm:table-cell" title="Marcadores exactos">3pt</TableHead>
            <TableHead className="hidden text-right sm:table-cell" title="Resultados 1X2">1pt</TableHead>
            <TableHead className="hidden text-right sm:table-cell" title="Especiales">Esp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const me = player?.id === r.player_id;
            return (
              <TableRow key={r.player_id} className={me ? 'bg-grass/10' : undefined}>
                <TableCell className="font-bold text-muted-foreground">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {r.name} {me && <span className="text-xs text-grass">(tú)</span>}
                </TableCell>
                <TableCell className="text-right font-extrabold text-grass">{r.total}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">{r.exact}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">{r.outcomes}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">{r.special}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
