// Tipos de dominio compartidos

export type MatchStatus = 'pending' | 'live' | 'finished';

export interface Match {
  id: string;
  api_id: number;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
}

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export interface Prediction {
  id: string;
  player_id: string;
  match_id: string;
  pred_home: number;
  pred_away: number;
  points: number;
}

export interface SpecialPrediction {
  id: string;
  player_id: string;
  champion: string | null;
  semi_1: string | null;
  semi_2: string | null;
  semi_3: string | null;
  semi_4: string | null;
  points: number;
}

export interface LeaderboardRow {
  player_id: string;
  name: string;
  total: number;
  exact: number;     // marcadores exactos (3 pts c/u)
  outcomes: number;  // resultados 1X2 (1 pt c/u)
  special: number;   // puntos especiales
}

// Orden de fases para agrupar/ordenar en la UI
export const STAGE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0,
  LAST_32: 1,
  LAST_16: 2,
  QUARTER_FINALS: 3,
  SEMI_FINALS: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

export const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  LAST_32: 'Dieciseisavos',
  LAST_16: 'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
};
