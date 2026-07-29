import { X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Game, GameFormValues } from "../../types/game";

type GameDialogProps = {
  game?: Game | null;
  isOpen: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (values: GameFormValues) => Promise<boolean>;
};

const emptyValues: GameFormValues = { title: "", executablePath: "" };

export function GameDialog({ game, isOpen, isSubmitting, submitError, onClose, onSubmit }: GameDialogProps): React.JSX.Element | null {
  const [values, setValues] = useState<GameFormValues>(emptyValues);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEditing = Boolean(game);

  useEffect(() => {
    setValues(game ? { title: game.title, executablePath: game.executable_path } : emptyValues);
    setValidationError(null);
  }, [game, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = values.title.trim();
    const executablePath = values.executablePath.trim();
    if (!title || !executablePath) {
      setValidationError("A title and executable path are required.");
      return;
    }
    setValidationError(null);
    if (await onSubmit({ title, executablePath })) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation">
      <div aria-labelledby="game-dialog-title" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-300">Library</p>
            <h2 className="mt-1 text-xl font-semibold" id="game-dialog-title">{isEditing ? "Edit game" : "Add a game"}</h2>
          </div>
          <button aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" disabled={isSubmitting} onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">Game title
            <input autoFocus className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-300" disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Hollow Knight" value={values.title} />
          </label>
          <label className="block text-sm font-medium text-slate-200">Executable path
            <input className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-300" disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, executablePath: event.target.value }))} placeholder="C:\\Games\\Example\\game.exe" value={values.executablePath} />
            <span className="mt-1.5 block text-xs font-normal text-slate-500">Use the absolute path to the game executable.</span>
          </label>
          {(validationError || submitError) && <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{validationError ?? submitError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add game"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
