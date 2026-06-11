'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Prediction, Outcome } from '@/lib/types';

export type SavedBet = Pick<Prediction, 'pred_home' | 'pred_away' | 'pred_outcome'>;

interface Props {
  playerId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  onSaved?: (saved: SavedBet) => void;
}

type SaveState = 'idle' | 'saving' | 'error';

export function PredictionForm({ playerId, matchId, homeTeam, awayTeam, onSaved }: Props) {
  const [pick, setPick] = useState<Outcome | ''>('');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [state, setState] = useState<SaveState>('idle');

  const hasWinner = pick !== '';
  const hasScore = home !== '' && away !== '';

  async function save() {
    // Al menos una de las dos apuestas; el marcador debe estar completo si se empieza.
    if (!hasWinner && !hasScore) return setState('error');
    if ((home !== '') !== (away !== '')) return setState('error');

    const saved: SavedBet = {
      pred_outcome: hasWinner ? (pick as Outcome) : null,
      pred_home: hasScore ? Number(home) : null,
      pred_away: hasScore ? Number(away) : null,
    };

    setState('saving');
    // insert (no upsert): la apuesta es definitiva, no se puede cambiar.
    const { error } = await supabaseInsert(playerId, matchId, saved);
    if (error) {
      setState('error');
      return;
    }
    onSaved?.(saved);
  }

  const pickButton = (value: Outcome, label: string) => (
    <button
      type="button"
      onClick={() => setPick((p) => (p === value ? '' : value))}
      className={cn(
        'flex-1 rounded-md border px-2 py-2 text-xs font-semibold transition-colors',
        pick === value ? 'border-grass bg-grass text-primary-foreground' : 'border-input hover:bg-accent',
      )}
    >
      {label}
    </button>
  );

  const scoreInput = (value: string, setter: (v: string) => void, label: string) => (
    <Input
      aria-label={label}
      inputMode="numeric"
      pattern="[0-9]"
      maxLength={1}
      value={value}
      onChange={(e) => setter(e.target.value.replace(/[^0-9]/g, '').slice(0, 1))}
      className="h-11 w-11 p-0 text-center text-xl font-bold"
    />
  );

  return (
    <div className="space-y-3">
      {/* Apuesta de ganador (+1) */}
      <div className="space-y-1">
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Ganador · +1 pt
        </p>
        <div className="flex items-stretch gap-2">
          {pickButton('1', homeTeam)}
          {pickButton('X', 'Empate')}
          {pickButton('2', awayTeam)}
        </div>
      </div>

      {/* Apuesta de marcador exacto (+2) */}
      <div className="space-y-1">
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Marcador exacto · +2 pts
        </p>
        <div className="flex items-center justify-center gap-3">
          {scoreInput(home, setHome, 'Goles local')}
          <span className="text-muted-foreground">–</span>
          {scoreInput(away, setAway, 'Goles visitante')}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 pt-1">
        <Button onClick={save} size="sm" disabled={state === 'saving'}>
          {state === 'saving' ? 'Guardando…' : 'Guardar apuesta'}
        </Button>
        {state === 'error' ? (
          <span className="text-xs text-destructive">
            Apuesta al ganador, al marcador o a ambos
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            🔒 Una vez guardada no podrás cambiarla
          </span>
        )}
      </div>
    </div>
  );
}

async function supabaseInsert(playerId: string, matchId: string, saved: SavedBet) {
  const supabase = createClient();
  return supabase
    .from('predictions')
    .insert({ player_id: playerId, match_id: matchId, ...saved });
}
