import { Clock, Play } from "lucide-react";

import type { RecentGame } from "../../types/session";

type RecentlyPlayedProps = {
  recentGames: RecentGame[];
  isLoading: boolean;
  error: string | null;
};

function formatPlaytime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "Unknown";

  const diffSeconds = Math.round((now - then) / 1000);
  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) {
    const m = Math.floor(diffSeconds / 60);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diffSeconds < 86400) {
    const h = Math.floor(diffSeconds / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(diffSeconds / 86400);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

function SkeletonCard(): React.JSX.Element {
  return (
    <div className="flex w-44 shrink-0 animate-pulse flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/50 p-3">
      <div className="aspect-[16/9] rounded-lg bg-slate-800" />
      <div className="h-4 w-3/4 rounded bg-slate-800" />
      <div className="h-3 w-1/2 rounded bg-slate-800" />
    </div>
  );
}

function RecentGameCard({ game }: { game: RecentGame }): React.JSX.Element {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
  return (
    <div className="group/recent flex w-44 shrink-0 flex-col gap-2 rounded-xl border border-white/8 bg-slate-900/60 p-3 transition hover:border-cyan-300/20 hover:bg-slate-800/60">
      <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.15),transparent_40%),linear-gradient(135deg,#172554,#111827)]">
        {game.game_cover_path ? <img alt={`${game.game_title} cover`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" src={`${apiBase}/metadata/games/${game.game_id}/cover`} /> : <Play size={16} className="text-cyan-100/30" />}
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
      </div>
      <h3
        className="truncate text-sm font-medium text-slate-100"
        title={game.game_title}
      >
        {game.game_title}
      </h3>
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1" title="Total playtime">
          <Clock size={11} />
          {formatPlaytime(game.total_play_time_seconds)}
        </span>
        <span title="Last played">{formatRelativeTime(game.last_played_at)}</span>
      </div>
    </div>
  );
}

export function RecentlyPlayed({
  recentGames,
  isLoading,
  error,
}: RecentlyPlayedProps): React.JSX.Element | null {
  // Hide the section entirely when there are no recent games and not loading
  if (!isLoading && !error && recentGames.length === 0) return null;

  return (
    <section className="mb-8" aria-label="Recently Played">
      <h2 className="mb-4 text-lg font-semibold text-slate-200">
        Recently Played
      </h2>

      {error && (
        <p className="text-sm text-rose-400/80" role="alert">
          {error}
        </p>
      )}

      {isLoading && !error && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && recentGames.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
          {recentGames.map((game) => (
            <RecentGameCard game={game} key={game.game_id} />
          ))}
        </div>
      )}
    </section>
  );
}
