-- ============================================================
-- Migración: permitir apuesta "solo ganador" (1X2) además del marcador exacto
-- Ejecutar una vez en el SQL Editor (es idempotente).
-- ============================================================

-- Tipo de apuesta: 'score' (marcador exacto) | 'winner' (solo quién gana)
alter table predictions
  add column if not exists bet_type text not null default 'score';

-- En apuestas tipo 'winner' no hay marcador, así que estos pasan a ser opcionales.
alter table predictions alter column pred_home drop not null;
alter table predictions alter column pred_away drop not null;

-- Resultado 1X2 elegido cuando bet_type = 'winner': '1' (local) | 'X' (empate) | '2' (visitante)
alter table predictions
  add column if not exists pred_outcome text;

-- Integridad: cada fila debe ser un marcador completo o un ganador, según su tipo.
alter table predictions drop constraint if exists predictions_bet_shape;
alter table predictions add constraint predictions_bet_shape check (
  (bet_type = 'score'  and pred_home is not null and pred_away is not null)
  or
  (bet_type = 'winner' and pred_outcome in ('1', 'X', '2'))
);
