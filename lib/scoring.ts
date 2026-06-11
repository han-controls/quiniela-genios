// Lógica de puntuación — aislada y testeable (sin dependencias de DB)

export const POINTS_EXACT = 3;
export const POINTS_OUTCOME = 1;
export const POINTS_CHAMPION = 10;
export const POINTS_SEMIFINALIST = 3;

export type Outcome = '1' | 'X' | '2';

export function outcome(home: number, away: number): Outcome {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

/**
 * Puntos de una predicción de marcador contra el resultado real.
 * - 3 pts: marcador exacto
 * - 1 pt: resultado 1X2 correcto (sin marcador exacto)
 * - 0 pts: resultado incorrecto
 */
export function matchPoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
): number {
  if (predHome === realHome && predAway === realAway) return POINTS_EXACT;
  if (outcome(predHome, predAway) === outcome(realHome, realAway)) return POINTS_OUTCOME;
  return 0;
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
