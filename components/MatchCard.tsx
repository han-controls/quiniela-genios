'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Users } from 'lucide-react';
import { type Match, type Prediction, type Outcome, outcomeLabel } from '@/lib/types';
import { PredictionForm, type SavedBet } from './PredictionForm';
import { MatchBets } from './MatchBets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  match: Match;
  prediction?: Prediction | null;
  playerId: string | null;
}

// Vista mínima de "mi apuesta" (sirve para la prop inicial y para una recién guardada).
interface MyBetView {
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: Outcome | null;
  points?: number;
}

function TeamRow({ name, flag }: { name: string; flag: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {flag ? (
        <Image src={flag} alt={name} width={24} height={24} className="h-6 w-6 object-contain" />
      ) : (
        <span className="inline-block h-6 w-6 rounded-full bg-muted" />
      )}
      <span className="truncate text-sm font-medium">{name}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'live') return <Badge variant="live">EN VIVO</Badge>;
  if (status === 'finished') return <Badge variant="secondary">Finalizado</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
}

export function MatchCard({ match, prediction, playerId }: Props) {
  const [showBets, setShowBets] = useState(false);
  const [pred, setPred] = useState<MyBetView | null>(prediction ?? null);

  const dt = new Date(match.match_date);
  const timeLabel = dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const locked = match.status !== 'pending';
  const finished = match.status === 'finished';
  const showScore =
    (finished || match.status === 'live') &&
    match.home_score != null &&
    match.away_score != null;

  function betLabel(p: MyBetView): string {
    const parts: string[] = [];
    if (p.pred_outcome) parts.push(outcomeLabel(p.pred_outcome, match.home_team, match.away_team));
    if (p.pred_home != null && p.pred_away != null) parts.push(`${p.pred_home}–${p.pred_away}`);
    return parts.join(' · ');
  }

  function handleSaved(saved: SavedBet) {
    setPred({ ...saved, points: 0 });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">🕑 {timeLabel}</span>
          <StatusBadge status={match.status} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamRow name={match.home_team} flag={match.home_flag} />
          <div className="text-center font-bold">
            {showScore ? (
              <span className={`text-lg tabular-nums ${match.status === 'live' ? 'text-grass' : ''}`}>
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="text-muted-foreground">vs</span>
            )}
          </div>
          <div className="flex justify-end">
            <TeamRow name={match.away_team} flag={match.away_flag} />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {!playerId ? (
            <p className="text-center text-xs text-muted-foreground">
              Entra con tu nombre para apostar.
            </p>
          ) : (
            <>
              {pred ? (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Tu apuesta:{' '}
                    <strong className="text-foreground">{betLabel(pred)}</strong>
                    {finished && (
                      <Badge className="ml-2 bg-grass/20 text-grass" variant="outline">
                        +{pred.points ?? 0} pts
                      </Badge>
                    )}
                  </span>
                  {!locked && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">🔒 Apuesta definitiva</p>
                  )}
                </div>
              ) : !locked ? (
                <PredictionForm
                  playerId={playerId}
                  matchId={match.id}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  onSaved={handleSaved}
                />
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No apostaste en este partido
                </p>
              )}

              {locked && (
                <>
                  <button
                    onClick={() => setShowBets((v) => !v)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {showBets ? 'Ocultar apuestas' : 'Ver apuestas'}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${showBets ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showBets && (
                    <MatchBets
                      matchId={match.id}
                      finished={finished}
                      currentPlayerId={playerId}
                      homeTeam={match.home_team}
                      awayTeam={match.away_team}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
