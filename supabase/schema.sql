-- ============================================================
-- Quiniela Mundial 2026 — Esquema de base de datos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Jugadores (sin auth)
create table if not exists players (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now()
);

-- Búsqueda case-insensitive por nombre
create unique index if not exists players_name_lower_idx
  on players (lower(name));

-- Partidos (sincronizados de la API)
create table if not exists matches (
  id         uuid default gen_random_uuid() primary key,
  api_id     int unique not null,
  stage      text not null,           -- GROUP_STAGE | LAST_16 | QUARTER_FINALS | ...
  group_name text,                    -- GROUP_A … GROUP_L (null en eliminatorias)
  home_team  text not null,
  away_team  text not null,
  home_flag  text,                    -- URL escudo/bandera
  away_flag  text,
  match_date timestamptz not null,
  home_score int,                     -- null hasta que termine
  away_score int,
  status     text default 'pending'   -- pending | live | finished
);

create index if not exists matches_stage_idx on matches (stage);
create index if not exists matches_date_idx on matches (match_date);

-- Predicciones por partido.
-- Ganador (1X2) y marcador exacto son apuestas independientes y aditivas:
--   +1 acertar ganador, +2 acertar marcador (máx 3). Al menos una es obligatoria.
create table if not exists predictions (
  id           uuid default gen_random_uuid() primary key,
  player_id    uuid references players(id) on delete cascade,
  match_id     uuid references matches(id) on delete cascade,
  pred_home    int,             -- apuesta de marcador (opcional)
  pred_away    int,
  pred_outcome text,            -- apuesta de ganador: '1' | 'X' | '2' (opcional)
  points       int default 0,
  unique(player_id, match_id),
  constraint predictions_bet_present check (
    pred_outcome in ('1', 'X', '2')
    or (pred_home is not null and pred_away is not null)
  )
);

create index if not exists predictions_match_idx on predictions (match_id);
create index if not exists predictions_player_idx on predictions (player_id);

-- Predicciones especiales (campeón y semifinalistas)
create table if not exists special_predictions (
  id        uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade unique,
  champion  text,
  semi_1    text,
  semi_2    text,
  semi_3    text,
  semi_4    text,
  points    int default 0
);

-- ============================================================
-- Realtime: publicar cambios de matches, predictions y players
-- ============================================================
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table players;
