'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePlayer } from '@/lib/usePlayer';
import type { Match, SpecialPrediction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Form = {
  champion: string;
  semi_1: string;
  semi_2: string;
  semi_3: string;
  semi_4: string;
};

const EMPTY: Form = { champion: '', semi_1: '', semi_2: '', semi_3: '', semi_4: '' };

export default function SpecialPage() {
  const { player, loaded } = usePlayer();
  const [teams, setTeams] = useState<string[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    const supabase = createClient();

    async function load() {
      const { data: matches } = await supabase
        .from('matches')
        .select('home_team, away_team, stage, status');

      const set = new Set<string>();
      let semisStarted = false;
      for (const m of (matches as Pick<Match, 'home_team' | 'away_team' | 'stage' | 'status'>[]) ?? []) {
        if (m.home_team && m.home_team !== 'Por definir') set.add(m.home_team);
        if (m.away_team && m.away_team !== 'Por definir') set.add(m.away_team);
        if (m.stage === 'SEMI_FINALS' && m.status !== 'pending') semisStarted = true;
      }
      setTeams([...set].sort());
      setLocked(semisStarted);

      if (player) {
        const { data: sp } = await supabase
          .from('special_predictions')
          .select('*')
          .eq('player_id', player.id)
          .maybeSingle();
        if (sp) {
          const s = sp as SpecialPrediction;
          setForm({
            champion: s.champion ?? '',
            semi_1: s.semi_1 ?? '',
            semi_2: s.semi_2 ?? '',
            semi_3: s.semi_3 ?? '',
            semi_4: s.semi_4 ?? '',
          });
        }
      }
      setLoading(false);
    }

    load();
  }, [loaded, player]);

  async function save() {
    if (!player) return;
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from('special_predictions').upsert(
      {
        player_id: player.id,
        champion: form.champion || null,
        semi_1: form.semi_1 || null,
        semi_2: form.semi_2 || null,
        semi_3: form.semi_3 || null,
        semi_4: form.semi_4 || null,
      },
      { onConflict: 'player_id' },
    );
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  if (loaded && !player) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Primero entra con tu nombre.</p>
          <Button asChild className="mt-4">
            <Link href="/">Ir a la entrada</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p className="py-10 text-center text-muted-foreground">Cargando…</p>;

  const TeamSelect = ({ field, label }: { field: keyof Form; label: string }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        disabled={locked}
        value={form[field] || undefined}
        onValueChange={(v) => setForm((f) => ({ ...f, [field]: v }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="— Selecciona —" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predicciones especiales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campeón: <strong className="text-grass">10 pts</strong> · cada semifinalista:{' '}
          <strong className="text-grass">3 pts</strong>. Se bloquea al iniciar las semifinales.
        </p>
      </div>

      {locked && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-300">
          Las semifinales ya comenzaron: las predicciones especiales están bloqueadas.
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-muted-foreground">
          Aún no hay equipos disponibles. Sincroniza los partidos primero.
        </p>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-5">
            <TeamSelect field="champion" label="🏆 Campeón del Mundial" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TeamSelect field="semi_1" label="Semifinalista 1" />
              <TeamSelect field="semi_2" label="Semifinalista 2" />
              <TeamSelect field="semi_3" label="Semifinalista 3" />
              <TeamSelect field="semi_4" label="Semifinalista 4" />
            </div>

            {!locked && (
              <Button onClick={save} size="lg" className="w-full">
                {saved ? '✓ Guardado' : 'Guardar predicciones'}
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
