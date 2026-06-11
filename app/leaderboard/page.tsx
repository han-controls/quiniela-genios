import { Leaderboard } from '@/components/Leaderboard';
import { RefreshButton } from '@/components/RefreshButton';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tabla de posiciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las apuestas se reflejan al instante. Usa “Actualizar” para traer
            los marcadores y puntos más recientes.
          </p>
        </div>
        <RefreshButton />
      </div>
      <Leaderboard />
    </div>
  );
}
