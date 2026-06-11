-- ============================================================
-- Row Level Security — lectura pública, escritura libre (sin auth)
-- Idempotente: se puede re-ejecutar sin errores.
-- Ejecutar DESPUÉS de schema.sql.
-- ============================================================

alter table players             enable row level security;
alter table matches             enable row level security;
alter table predictions         enable row level security;
alter table special_predictions enable row level security;

-- players
drop policy if exists "public read players"   on players;
drop policy if exists "public insert players" on players;
create policy "public read players"   on players for select using (true);
create policy "public insert players" on players for insert with check (true);

-- matches (update lo usa el sync; insert por si se siembra manual)
drop policy if exists "public read matches"   on matches;
drop policy if exists "public insert matches" on matches;
drop policy if exists "public update matches" on matches;
create policy "public read matches"   on matches for select using (true);
create policy "public insert matches" on matches for insert with check (true);
create policy "public update matches" on matches for update using (true);

-- predictions
drop policy if exists "public read preds"   on predictions;
drop policy if exists "public insert preds" on predictions;
drop policy if exists "public update preds" on predictions;
create policy "public read preds"   on predictions for select using (true);
create policy "public insert preds" on predictions for insert with check (true);
create policy "public update preds" on predictions for update using (true);

-- special_predictions
drop policy if exists "public read special"   on special_predictions;
drop policy if exists "public insert special" on special_predictions;
drop policy if exists "public update special" on special_predictions;
create policy "public read special"   on special_predictions for select using (true);
create policy "public insert special" on special_predictions for insert with check (true);
create policy "public update special" on special_predictions for update using (true);
