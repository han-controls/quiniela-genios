-- ============================================================
-- Migración: ganador (1X2) y marcador exacto son apuestas INDEPENDIENTES
-- y aditivas (+1 ganador, +2 marcador, máx 3). Reemplaza el modelo "uno u otro".
-- Ejecutar una vez en el SQL Editor (idempotente).
-- ============================================================

-- Ya no usamos bet_type: cada apuesta puede tener ganador, marcador o ambos.
alter table predictions drop constraint if exists predictions_bet_shape;
alter table predictions drop column if exists bet_type;

-- Asegurar que las columnas existan y sean opcionales.
alter table predictions add column if not exists pred_outcome text;
alter table predictions alter column pred_home drop not null;
alter table predictions alter column pred_away drop not null;

-- Cada fila debe tener al menos una de las dos apuestas.
alter table predictions drop constraint if exists predictions_bet_present;
alter table predictions add constraint predictions_bet_present check (
  pred_outcome in ('1', 'X', '2')
  or (pred_home is not null and pred_away is not null)
);
