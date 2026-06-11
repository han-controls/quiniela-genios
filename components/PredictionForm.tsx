'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Prediction } from '@/lib/types';

interface Props {
  playerId: string;
  matchId: string;
  initial?: Pick<Prediction, 'pred_home' | 'pred_away'> | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function PredictionForm({ playerId, matchId, initial }: Props) {
  const [home, setHome] = useState<string>(initial ? String(initial.pred_home) : '');
  const [away, setAway] = useState<string>(initial ? String(initial.pred_away) : '');
  const [state, setState] = useState<SaveState>('idle');

  async function save() {
    if (home === '' || away === '') {
      setState('error');
      return;
    }
    setState('saving');
    const supabase = createClient();
    const { error } = await supabase.from('predictions').upsert(
      {
        player_id: playerId,
        match_id: matchId,
        pred_home: Number(home),
        pred_away: Number(away),
      },
      { onConflict: 'player_id,match_id' },
    );
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

  return (
    <div className="flex items-center justify-center gap-3">
      {scoreInput(home, setHome, 'Goles local')}
      <span className="text-muted-foreground">–</span>
      {scoreInput(away, setAway, 'Goles visitante')}
      <Button
        onClick={save}
        size="sm"
        disabled={state === 'saving'}
        className="ml-2"
      >
        {state === 'saving' ? '…' : state === 'saved' ? '✓' : 'Guardar'}
      </Button>
      {state === 'error' && (
        <span className="text-xs text-destructive">Revisa el marcador</span>
      )}
    </div>
  );
}
