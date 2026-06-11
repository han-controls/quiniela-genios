'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Botón para sincronizar resultados a demanda (reemplaza al cron).
export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      await fetch('/api/refresh', { method: 'POST' });
    } catch {
      // Si falla la red, recargamos igual para reflejar lo que haya en DB.
    } finally {
      // Recarga para re-leer partidos, marcadores y puntos actualizados.
      window.location.reload();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
      <RefreshCw className={loading ? 'animate-spin' : ''} />
      {loading ? 'Actualizando…' : 'Actualizar'}
    </Button>
  );
}
