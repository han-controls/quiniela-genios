'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/lib/types';

function Team({ name, flag, align = 'left' }: { name: string; flag: string | null; align?: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {flag ? (
        <Image src={flag} alt={name} width={28} height={28} className="h-7 w-7 object-contain" />
      ) : (
        <span className="inline-block h-7 w-7 rounded-full bg-muted" />
      )}
      <span className="truncate text-sm font-semibold">{name}</span>
    </div>
  );
}

function LiveRow({ match }: { match: Match }) {
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-secondary/40 p-3">
      <Team name={match.home_team} flag={match.home_flag} />
      <div className="flex flex-col items-center">
        <span className="text-2xl font-extrabold tabular-nums">
          {home} <span className="text-muted-foreground">–</span> {away}
        </span>
        <Badge variant="live" className="mt-1 text-[10px]">EN VIVO</Badge>
      </div>
      <Team name={match.away_team} flag={match.away_flag} align="right" />
    </div>
  );
}

function NextRow({ match }: { match: Match }) {
  const dt = new Date(match.match_date);
  const label = dt.toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="space-y-2">
      <div className="text-center text-xs uppercase tracking-wide text-muted-foreground">
        Próximo partido
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-secondary/40 p-3">
        <Team name={match.home_team} flag={match.home_flag} />
        <span className="text-sm font-bold text-muted-foreground">vs</span>
        <Team name={match.away_team} flag={match.away_flag} align="right" />
      </div>
      <div className="text-center text-xs capitalize text-muted-foreground">{label}</div>
    </div>
  );
}

export function LivePanel() {
  const [live, setLive] = useState<Match[]>([]);
  const [next, setNext] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    const { data: liveData } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .order('match_date', { ascending: true });

    const liveMatches = (liveData as Match[]) ?? [];
    setLive(liveMatches);

    if (liveMatches.length === 0) {
      const { data: nextData } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      setNext((nextData as Match) ?? null);
    } else {
      setNext(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel('live-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Nada que mostrar aún (sin partidos en vivo ni próximos): no ocupamos espacio.
  if (loading || (live.length === 0 && !next)) return null;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        {live.length > 0 ? (
          <>
            <div className="flex items-center justify-center gap-2 text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              En vivo
            </div>
            {live.map((m) => (
              <LiveRow key={m.id} match={m} />
            ))}
          </>
        ) : (
          next && <NextRow match={next} />
        )}
      </CardContent>
    </Card>
  );
}
