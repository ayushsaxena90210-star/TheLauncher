import { AlertCircle, CalendarDays, FolderOpen, Loader2, MoreHorizontal, Pencil, Play, Sparkles, Trash2 } from "lucide-react";

import type { Game } from "../../types/game";

type LaunchState = "idle" | "launching" | "running" | "error";

type GameCardProps = {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  onLaunch: (game: Game) => void;
  onOpenFileLocation: (game: Game) => void;
  launchState: LaunchState;
  launchError: string | null;
  metadataState: "idle" | "queued" | "fetching" | "success" | "failed";
  onFetchMetadata: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const playButtonStyles: Record<LaunchState, string> = {
  idle: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.98]",
  launching: "bg-slate-800 text-slate-400 cursor-wait",
  running: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  error: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
};

const metadataLabel: Record<GameCardProps["metadataState"], string> = {
  idle: "Fetch details", queued: "Details queued", fetching: "Fetching details", success: "Metadata updated", failed: "Retry details",
};

function coverUrl(gameId: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
  return `${apiBase}/metadata/games/${gameId}/cover`;
}

export function GameCard({ game, onEdit, onDelete, onLaunch, onOpenFileLocation, launchState, launchError, metadataState, onFetchMetadata, onOpenDetails }: GameCardProps): React.JSX.Element {
  const createdAt = new Date(game.created_at);
  const createdLabel = Number.isNaN(createdAt.valueOf()) ? "Unknown date" : dateFormatter.format(createdAt);
  const isPlayDisabled = launchState !== "idle";

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-200/25">
      <button aria-label={`Open ${game.title} details`} className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.2),transparent_35%),linear-gradient(135deg,#172554,#111827)]" onClick={() => onOpenDetails(game)} type="button">
        {game.cover_path ? <img alt={`${game.title} cover`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" src={coverUrl(game.id)} /> : <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-100/50">Cover art</span>}
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button className="truncate text-left font-semibold text-slate-100 hover:text-cyan-200" onClick={() => onOpenDetails(game)} title={game.title} type="button">{game.title}</button>
            <p className="mt-1 truncate text-xs text-slate-400" title={game.executable_path}>{game.executable_path}</p>
          </div>
          <MoreHorizontal className="shrink-0 text-slate-500" size={19} aria-hidden="true" />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays size={14} /> Added {createdLabel}
        </p>
        {game.genres && <p className="mt-2 truncate text-xs text-cyan-200/75" title={game.genres}>{game.genres}</p>}
        <div className="mt-4">
          <button
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${playButtonStyles[launchState]}`}
            disabled={isPlayDisabled}
            onClick={() => onLaunch(game)}
            type="button"
          >
            {launchState === "launching" && <><Loader2 size={14} className="animate-spin" /> Launching…</>}
            {launchState === "running" && (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Running
              </>
            )}
            {launchState === "error" && <><AlertCircle size={14} /> Launch Failed</>}
            {launchState === "idle" && <><Play size={14} fill="currentColor" /> Play</>}
          </button>
          {launchError && (
            <p className="mt-1.5 text-xs text-rose-400" role="alert">{launchError}</p>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/8 pt-3">
          <button className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-wait disabled:opacity-60" disabled={metadataState === "queued" || metadataState === "fetching"} onClick={() => onFetchMetadata(game)} type="button" title={metadataLabel[metadataState]}>
            {metadataState === "queued" || metadataState === "fetching" ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {metadataLabel[metadataState]}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white" onClick={() => onOpenFileLocation(game)} type="button" title="Open file location">
            <FolderOpen size={14} /> Location
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white" onClick={() => onEdit(game)} type="button">
            <Pencil size={14} /> Edit
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-rose-300 hover:bg-rose-400/10" onClick={() => onDelete(game)} type="button">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}
