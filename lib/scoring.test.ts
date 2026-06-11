import { describe, it, expect } from 'vitest';
import { matchPoints, specialPoints, outcome } from './scoring';

describe('outcome', () => {
  it('detects home win, draw, away win', () => {
    expect(outcome(2, 1)).toBe('1');
    expect(outcome(1, 1)).toBe('X');
    expect(outcome(0, 3)).toBe('2');
  });
});

describe('matchPoints', () => {
  it('gives 3 for exact score', () => {
    expect(matchPoints(2, 1, 2, 1)).toBe(3);
  });
  it('gives 1 for correct 1X2 without exact score', () => {
    expect(matchPoints(3, 1, 1, 0)).toBe(1);
  });
  it('gives 0 for wrong outcome', () => {
    expect(matchPoints(1, 0, 0, 1)).toBe(0);
  });
  it('gives 3 for exact draw', () => {
    expect(matchPoints(1, 1, 1, 1)).toBe(3);
  });
  it('gives 1 for correct draw with different score', () => {
    expect(matchPoints(0, 0, 2, 2)).toBe(1);
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
    expect(pts).toBe(9); // France, Spain, Brazil
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
