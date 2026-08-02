import { AlertTriangle } from "lucide-react";

import type { Game } from "../../types/game";

type DeleteGameDialogProps = {
  game: Game | null;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteGameDialog({ game, isDeleting, error, onClose, onConfirm }: DeleteGameDialogProps): React.JSX.Element | null {
  if (!game) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation">
      <div aria-labelledby="delete-dialog-title" aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" role="dialog">
        <AlertTriangle className="text-amber-300" size={28} />
        <h2 className="mt-4 text-xl font-semibold" id="delete-dialog-title">Remove {game.title}?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">This removes the game from your library only. Its executable and installed files will not be deleted.</p>
        {error && <p className="mt-4 rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5" disabled={isDeleting} onClick={onClose} type="button">Cancel</button>
          <button className="rounded-lg bg-rose-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-rose-300 disabled:cursor-wait disabled:opacity-60" disabled={isDeleting} onClick={() => void onConfirm()} type="button">{isDeleting ? "Removing…" : "Remove game"}</button>
        </div>
      </div>
    </div>
  );
}
