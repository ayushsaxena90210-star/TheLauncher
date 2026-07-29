import { CalendarDays, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Game } from "../../types/game";

type GameCardProps = {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function GameCard({ game, onEdit, onDelete }: GameCardProps): React.JSX.Element {
  const createdAt = new Date(game.created_at);
  const createdLabel = Number.isNaN(createdAt.valueOf()) ? "Unknown date" : dateFormatter.format(createdAt);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-200/25">
      <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.2),transparent_35%),linear-gradient(135deg,#172554,#111827)]">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-100/50">Cover art</span>
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-100" title={game.title}>{game.title}</h2>
            <p className="mt-1 truncate text-xs text-slate-400" title={game.executable_path}>{game.executable_path}</p>
          </div>
          <MoreHorizontal className="shrink-0 text-slate-500" size={19} aria-hidden="true" />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays size={14} /> Added {createdLabel}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white" onClick={() => onEdit(game)} type="button">
            <Pencil size={14} /> Edit
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-400/10" onClick={() => onDelete(game)} type="button">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}
