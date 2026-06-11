import { Leaderboard } from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tabla de posiciones</h1>
        <p className="mt-1 text-sm text-slate-400">
          Se actualiza en tiempo real conforme terminan los partidos.
        </p>
      </div>
      <Leaderboard />
    </div>
  );
}
