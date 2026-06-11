// Lógica de puntuación — aislada y testeable (sin dependencias de DB)

// Ganador (1X2) y marcador exacto son apuestas independientes y aditivas:
export const POINTS_WINNER = 1; // acertar quién gana (1X2)
export const POINTS_EXACT = 2; // acertar el marcador exacto
// Acertar ambos = 3 (1 + 2)

export const POINTS_CHAMPION = 10;
export const POINTS_SEMIFINALIST = 3;

export type Outcome = '1' | 'X' | '2';

export function outcome(home: number, away: number): Outcome {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

// Forma mínima de una predicción para puntuarla. Ambas partes son opcionales:
// pred_outcome = apuesta de ganador; pred_home/pred_away = apuesta de marcador.
export interface ScorablePrediction {
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: string | null;
}

/**
 * Puntos de una predicción contra el resultado real (aditivo):
 * - +1 si apostó ganador (1X2) y acertó
 * - +2 si apostó marcador exacto y acertó
 * Máximo 3 (ambos correctos). Sin apuestas o fallos → 0.
 */
export function predictionPoints(
  pred: ScorablePrediction,
  realHome: number,
  realAway: number,
): number {
  let points = 0;

  if (pred.pred_outcome && pred.pred_outcome === outcome(realHome, realAway)) {
    points += POINTS_WINNER;
  }

  if (
    pred.pred_home != null &&
    pred.pred_away != null &&
    pred.pred_home === realHome &&
    pred.pred_away === realAway
  ) {
    points += POINTS_EXACT;
  }

  return points;
}

/**
 * Puntos de las predicciones especiales.
 * - 10 pts: campeón correcto
 * - 3 pts por cada semifinalista correcto (orden indiferente, máx. 12)
 */
export function specialPoints(
  pred: { champion?: string | null; semis: (string | null | undefined)[] },
  actual: { champion?: string | null; semifinalists: string[] },
): number {
  let points = 0;

  if (pred.champion && actual.champion && pred.champion === actual.champion) {
    points += POINTS_CHAMPION;
  }

  const actualSemis = new Set(actual.semifinalists);
  const counted = new Set<string>();
  for (const s of pred.semis) {
    if (s && actualSemis.has(s) && !counted.has(s)) {
      counted.add(s);
      points += POINTS_SEMIFINALIST;
    }
  }

  return points;
}
