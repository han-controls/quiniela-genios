import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Endpoint público para el botón "Actualizar". No expone el SYNC_SECRET.
// La llamada a football-data está cacheada 120s, así que clics repetidos
// no golpean la API externa más de una vez cada 2 minutos.
export async function POST() {
  try {
    const result = await runSync(createClient());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al actualizar' },
      { status: 500 },
    );
  }
}
