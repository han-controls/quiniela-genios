// Wrapper de football-data.org v4

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';
const SEASON = '2026';

export type DbStatus = 'pending' | 'live' | 'finished';

// Forma parcial de un partido tal como lo devuelve la API v4.
export interface ApiMatch {
  id: number;
  stage: string;
  group: string | null;
  utcDate: string;
  status: string;
  homeTeam: { name: string | null; crest: string | null };
  awayTeam: { name: string | null; crest: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface ApiMatchesResponse {
  matches: ApiMatch[];
}

// Mapeo de status de la API → status de la DB.
export function mapStatus(apiStatus: string): DbStatus {
  switch (apiStatus) {
    case 'FINISHED':
      return 'finished';
    case 'IN_PLAY':
    case 'PAUSED':
    case 'EXTRA_TIME':
    case 'PENALTY_SHOOTOUT':
      return 'live';
    default:
      // SCHEDULED, TIMED, POSTPONED, CANCELLED, SUSPENDED, AWARDED...
      return 'pending';
  }
}

/**
 * Obtiene todos los partidos del Mundial 2026.
 * `revalidate: 120` cachea la respuesta 2 min para respetar el límite del plan free.
 */
export async function getWorldCupMatches(): Promise<ApiMatch[]> {
  const token = process.env.FOOTBALL_API_KEY;
  if (!token) throw new Error('FOOTBALL_API_KEY no está configurada');

  const res = await fetch(
    `${BASE_URL}/competitions/${COMPETITION}/matches?season=${SEASON}`,
    {
      headers: { 'X-Auth-Token': token },
      next: { revalidate: 120 },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = (await res.json()) as ApiMatchesResponse;
  return data.matches ?? [];
}
