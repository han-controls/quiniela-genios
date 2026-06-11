'use client';

import { useEffect, useState } from 'react';

export interface StoredPlayer {
  id: string;
  name: string;
}

const KEY = 'quiniela_player';

export function getStoredPlayer(): StoredPlayer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPlayer) : null;
  } catch {
    return null;
  }
}

export function setStoredPlayer(player: StoredPlayer) {
  window.localStorage.setItem(KEY, JSON.stringify(player));
}

export function clearStoredPlayer() {
  window.localStorage.removeItem(KEY);
}

// Hook reactivo para leer el jugador de localStorage.
export function usePlayer() {
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlayer(getStoredPlayer());
    setLoaded(true);
  }, []);

  return { player, loaded };
}
