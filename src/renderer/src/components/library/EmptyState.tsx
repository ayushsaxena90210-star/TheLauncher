import { Gamepad2, Plus } from "lucide-react";

type EmptyStateProps = {
  onAddGame: () => void;
  isFiltered?: boolean;
};

export function EmptyState({ onAddGame, isFiltered = false }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-900/35 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          <Gamepad2 size={24} />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          {isFiltered ? "No games match your search" : "Your library is empty"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          {isFiltered
            ? "Try a different game title or clear the search to see your full library."
            : "Add a locally installed game to start building your library."}
        </p>
        {!isFiltered && (
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            onClick={onAddGame}
            type="button"
          >
            <Plus size={17} />
            Add game
          </button>
        )}
      </div>
    </div>
  );
}
