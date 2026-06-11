# Quiniela Mundial 2026 ⚽

App web para predecir los partidos del FIFA World Cup 2026 (USA · Canadá · México),
competir en una tabla en tiempo real y acertar campeón + semifinalistas. Sin login:
solo escribes tu nombre.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (PostgreSQL + Realtime) · football-data.org v4 · Deploy en Vercel.

## Puesta en marcha local

```bash
npm install
npm run dev        # http://localhost:3000
```

### 1. Base de datos (Supabase)

En tu proyecto Supabase → **SQL Editor**, ejecuta en orden:

1. `supabase/schema.sql`
2. `supabase/rls.sql`

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) o anon key legacy |
| `FOOTBALL_API_KEY` | https://www.football-data.org |
| `SYNC_SECRET` | String aleatorio largo (protege `/api/sync`) |

### 3. Primera sincronización

Con el server corriendo, dispara el sync manual:

```bash
curl -X POST "http://localhost:3000/api/sync?secret=TU_SYNC_SECRET"
```

Esto puebla la tabla `matches` y calcula puntos de partidos terminados.

## Sistema de puntos

| Predicción | Puntos |
|---|---|
| Marcador exacto | 3 |
| Resultado 1X2 correcto | 1 |
| Campeón correcto | 10 |
| Cada semifinalista correcto | 3 (máx. 12) |

## Tests

```bash
npm test           # lógica de puntuación (lib/scoring.test.ts)
```

## Deploy (Vercel)

1. Conecta el repo en Vercel.
2. Configura las 4 variables de entorno.
3. En `vercel.json`, reemplaza `REEMPLAZAR_CON_TU_SYNC_SECRET` por tu `SYNC_SECRET`
   (el cron corre cada 5 min y sincroniza resultados).
4. Push a `main` → deploy automático.

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Entrada por nombre + sistema de puntos |
| `/predictions` | Partidos por fase con formularios de marcador |
| `/special` | Campeón y 4 semifinalistas |
| `/leaderboard` | Tabla de posiciones en tiempo real |
| `/api/sync` | Sync con la API + cálculo de puntos (GET/POST, requiere `?secret=`) |
