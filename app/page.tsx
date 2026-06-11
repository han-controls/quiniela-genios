"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStoredPlayer, setStoredPlayer } from "@/lib/usePlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LivePanel } from "@/components/LivePanel";

const SCORING = [
  { label: "Marcador exacto", pts: "3 pts" },
  { label: "Resultado 1X2 correcto", pts: "1 pt" },
  { label: "Campeón del Mundial", pts: "10 pts" },
  { label: "Cada semifinalista", pts: "3 pts" },
];

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getStoredPlayer();
    if (existing) setName(existing.name);
  }, []);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe tu nombre para entrar.");
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: existing, error: selErr } = await supabase
        .from("players")
        .select("id, name")
        .ilike("name", trimmed)
        .limit(1)
        .maybeSingle();

      if (selErr) throw selErr;

      let player = existing;

      if (!player) {
        const { data: created, error: insErr } = await supabase
          .from("players")
          .insert({ name: trimmed })
          .select("id, name")
          .single();
        if (insErr) throw insErr;
        player = created;
      }

      setStoredPlayer({ id: player.id, name: player.name });
      router.push("/predictions");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo entrar. Intenta de nuevo.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-pitch/40 bg-gradient-to-br from-pitch/30 to-card">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Quiniela Mundial <span className="text-grass">2026</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            USA · Canadá · México. Predice los marcadores, acierta al campeón y
            compite con tu grupo. Sin registro: solo tu nombre.
          </p>

          <form
            onSubmit={handleEnter}
            className="mx-auto mt-6 flex max-w-sm flex-col gap-3"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre o apodo"
              maxLength={40}
              className="h-12 text-center text-lg"
            />
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <LivePanel />

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-lg font-bold">
            Sistema de puntos
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {SCORING.map((s) => (
              <li
                key={s.label}
                className="flex flex-col items-center rounded-lg bg-secondary/60 p-3 text-center"
              >
                <span className="text-2xl font-extrabold text-grass">
                  {s.pts}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
