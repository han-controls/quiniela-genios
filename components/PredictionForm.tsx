'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Prediction, BetType, Outcome } from '@/lib/types';

interface Props {
  playerId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  initial?: Pick<Prediction, 'bet_type' | 'pred_home' | 'pred_away' | 'pred_outcome'> | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function PredictionForm({ playerId, matchId, homeTeam, awayTeam, initial }: Props) {
  const [mode, setMode] = useState<BetType>(initial?.bet_type ?? 'score');
  const [home, setHome] = useState<string>(initial?.pred_home != null ? String(initial.pred_home) : '');
  const [away, setAway] = useState<string>(initial?.pred_away != null ? String(initial.pred_away) : '');
  const [pick, setPick] = useState<Outcome | ''>(initial?.pred_outcome ?? '');
  const [state, setState] = useState<SaveState>('idle');

  async function save() {
    const supabase = createClient();
    let row: Record<string, unknown>;

    if (mode === 'score') {
      if (home === '' || away === '') return setState('error');
      row = {
        player_id: playerId,
        match_id: matchId,
        bet_type: 'score',
        pred_home: Number(home),
        pred_away: Number(away),
        pred_outcome: null,
      };
    } else {
      if (pick === '') return setState('error');
      row = {
        player_id: playerId,
        match_id: matchId,
        bet_type: 'winner',
        pred_home: null,
        pred_away: null,
        pred_outcome: pick,
      };
    }

    setState('saving');
    const { error } = await supabase
      .from('predictions')
      .upsert(row, { onConflict: 'player_id,match_id' });
    setState(error ? 'error' : 'saved');
    if (!error) setTimeout(() => setState('idle'), 1500);
  }

  const scoreInput = (value: string, setter: (v: string) => void, label: string) => (
    <Input
      aria-label={label}
      inputMode="numeric"
      pattern="[0-9]"
      maxLength={1}
      value={value}
      onChange={(e) => setter(e.target.value.replace(/[^0-9]/g, '').slice(0, 1))}
      className="h-12 w-12 p-0 text-center text-xl font-bold"
    />
  );

  const pickButton = (value: Outcome, label: string) => (
    <button
      type="button"
      onClick={() => setPick(value)}
      className={cn(
        'flex-1 rounded-md border px-2 py-2 text-xs font-semibold transition-colors',
        pick === value
          ? 'border-grass bg-grass text-primary-foreground'
          : 'border-input hover:bg-accent',
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Toggle de tipo de apuesta */}
      <div className="mx-auto flex w-fit rounded-lg bg-secondary p-0.5 text-xs">
        {(['score', 'winner'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-3 py-1 font-medium transition-colors',
              mode === m ? 'bg-background text-foreground shadow' : 'text-muted-foreground',
            )}
          >
            {m === 'score' ? 'Marcador' : 'Solo ganador'}
          </button>
        ))}
      </div>

      {mode === 'score' ? (
        <div className="flex items-center justify-center gap-3">
          {scoreInput(home, setHome, 'Goles local')}
          <span className="text-muted-foreground">–</span>
          {scoreInput(away, setAway, 'Goles visitante')}
        </div>
      ) : (
        <div className="flex items-stretch gap-2">
          {pickButton('1', homeTeam)}
          {pickButton('X', 'Empate')}
          {pickButton('2', awayTeam)}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button onClick={save} size="sm" disabled={state === 'saving'}>
          {state === 'saving' ? '…' : state === 'saved' ? '✓ Guardado' : 'Guardar'}
        </Button>
        {state === 'error' && (
          <span className="text-xs text-destructive">Completa tu apuesta</span>
        )}
      </div>
    </div>
  );
}
