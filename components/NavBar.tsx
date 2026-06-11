'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayer } from '@/lib/usePlayer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const links = [
  { href: '/predictions', label: 'Partidos' },
  { href: '/special', label: 'Especiales' },
  { href: '/leaderboard', label: 'Tabla' },
];

export function NavBar() {
  const pathname = usePathname();
  const { player } = usePlayer();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ⚽ Quiniela <span className="text-grass">2026</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {l.label}
              </Link>
            );
          })}
          {player && (
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              {player.name}
            </Badge>
          )}
        </div>
      </nav>
    </header>
  );
}
