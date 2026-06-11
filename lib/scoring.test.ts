import { describe, it, expect } from 'vitest';
import { predictionPoints, specialPoints, outcome } from './scoring';

describe('outcome', () => {
  it('detects home win, draw, away win', () => {
    expect(outcome(2, 1)).toBe('1');
    expect(outcome(1, 1)).toBe('X');
    expect(outcome(0, 3)).toBe('2');
  });
});

describe('predictionPoints (aditivo: ganador +1, marcador +2)', () => {
  it('solo ganador acertado = 1', () => {
    expect(
      predictionPoints({ pred_home: null, pred_away: null, pred_outcome: '1' }, 3, 0),
    ).toBe(1);
  });

  it('solo marcador exacto = 2', () => {
    expect(
      predictionPoints({ pred_home: 2, pred_away: 1, pred_outcome: null }, 2, 1),
    ).toBe(2);
  });

  it('ganador + marcador, ambos correctos = 3', () => {
    expect(
      predictionPoints({ pred_home: 2, pred_away: 1, pred_outcome: '1' }, 2, 1),
    ).toBe(3);
  });

  it('apostó ambos pero solo acierta el ganador = 1', () => {
    expect(
      predictionPoints({ pred_home: 2, pred_away: 1, pred_outcome: '1' }, 4, 0),
    ).toBe(1);
  });

  it('marcador exacto sin apostar ganador no suma el +1 (=2)', () => {
    expect(
      predictionPoints({ pred_home: 0, pred_away: 0, pred_outcome: null }, 0, 0),
    ).toBe(2);
  });

  it('todo incorrecto = 0', () => {
    expect(
      predictionPoints({ pred_home: 1, pred_away: 0, pred_outcome: '1' }, 0, 2),
    ).toBe(0);
  });

  it('empate: ganador X acertado = 1', () => {
    expect(
      predictionPoints({ pred_home: null, pred_away: null, pred_outcome: 'X' }, 2, 2),
    ).toBe(1);
  });
});

describe('specialPoints', () => {
  it('awards 10 for correct champion', () => {
    const pts = specialPoints(
      { champion: 'Brazil', semis: [] },
      { champion: 'Brazil', semifinalists: [] },
    );
    expect(pts).toBe(10);
  });
  it('awards 3 per correct semifinalist regardless of order', () => {
    const pts = specialPoints(
      { champion: null, semis: ['France', 'Spain', 'Wrong', 'Brazil'] },
      { champion: 'Argentina', semifinalists: ['Brazil', 'France', 'Spain', 'England'] },
    );
    expect(pts).toBe(9);
  });
  it('caps semifinalists and adds champion (max 22)', () => {
    const pts = specialPoints(
      { champion: 'Argentina', semis: ['Brazil', 'France', 'Spain', 'England'] },
      { champion: 'Argentina', semifinalists: ['Brazil', 'France', 'Spain', 'England'] },
    );
    expect(pts).toBe(22);
  });
  it('does not double-count duplicate guesses', () => {
    const pts = specialPoints(
      { champion: null, semis: ['Brazil', 'Brazil', 'Brazil', 'Brazil'] },
      { champion: null, semifinalists: ['Brazil', 'France', 'Spain', 'England'] },
    );
    expect(pts).toBe(3);
  });
});
