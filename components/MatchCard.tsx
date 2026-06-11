'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Users } from 'lucide-react';
import { type Match, type Prediction, outcomeLabel } from '@/lib/types';
import { PredictionForm } from './PredictionForm';
import { MatchBets } from './MatchBets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  match: Match;
  prediction?: Prediction | null;
  playerId: string | null;
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
  const dt = new Date(match.match_date);
  const timeLabel = dt.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const locked = match.status !== 'pending';
  const finished = match.status === 'finished';
  const showScore =
    (finished || match.status === 'live') &&
    match.home_score != null &&
    match.away_score != null;

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
          {!locked ? (
            !playerId ? (
              <p className="text-center text-xs text-muted-foreground">
                Entra con tu nombre para predecir.
              </p>
            ) : (
              <PredictionForm
                playerId={playerId}
                matchId={match.id}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                initial={prediction}
              />
            )
          ) : (
            <>
              {playerId && (
                <div className="text-center text-sm">
                  {prediction ? (
                    <span className="text-muted-foreground">
                      Tu predicción:{' '}
                      <strong className="text-foreground">
                        {prediction.bet_type === 'winner' && prediction.pred_outcome
                          ? outcomeLabel(prediction.pred_outcome, match.home_team, match.away_team)
                          : `${prediction.pred_home}–${prediction.pred_away}`}
                      </strong>
                      {finished && (
                        <Badge className="ml-2 bg-grass/20 text-grass" variant="outline">
                          +{prediction.points} pts
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No apostaste en este partido</span>
                  )}
                </div>
              )}

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
        </div>
      </CardContent>
    </Card>
  );
}
