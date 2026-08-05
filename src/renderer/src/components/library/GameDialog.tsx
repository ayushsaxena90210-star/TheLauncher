import { useEffect, useState } from "react";

import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
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

  const err = validationError ?? submitError;

  return (
    <Dialog
      closeDisabled={isSubmitting}
      isOpen={isOpen}
      labelledBy="game-dialog-title"
      maxWidth="540px"
      onClose={onClose}
      hideCloseButton={false}
    >
      <div style={{ marginBottom: 4 }}>
        <p className="page-eyebrow" style={{ marginBottom: 4 }}>Library</p>
        <h2 id="game-dialog-title" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {isEditing ? "Edit game" : "Add a game"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>
          Game title
          <input
            autoFocus
            className="ds-input"
            disabled={isSubmitting}
            onChange={(e) => setValues((c) => ({ ...c, title: e.target.value }))}
            placeholder="e.g. Hollow Knight"
            style={{ marginTop: 6 }}
            value={values.title}
          />
        </label>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>
          Executable path
          <input
            className="ds-input"
            disabled={isSubmitting}
            onChange={(e) => setValues((c) => ({ ...c, executablePath: e.target.value }))}
            placeholder="C:\Games\Example\game.exe"
            style={{ marginTop: 6 }}
            value={values.executablePath}
          />
          <span style={{ display: "block", marginTop: 5, fontSize: 11, color: "var(--color-text-faint)" }}>
            Use the absolute path to the game executable.
          </span>
        </label>

        {game && (game.description || game.release_date || game.genres) && (
          <section
            aria-label="Game metadata"
            style={{
              padding: 12, borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-subtle)",
              background: "rgba(0,0,0,0.12)",
              fontSize: 12,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--color-accent)" }}>Metadata</p>
            {game.release_date && <p style={{ margin: "0 0 3px", color: "var(--color-text-muted)" }}>Released {game.release_date}</p>}
            {game.genres && <p style={{ margin: "0 0 3px", color: "var(--color-text-muted)" }}>{game.genres}</p>}
            {game.description && (
              <p style={{ margin: "6px 0 0", maxHeight: 80, overflowY: "auto", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                {game.description}
              </p>
            )}
          </section>
        )}

        {err && (
          <div
            role="alert"
            style={{
              padding: "10px 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", color: "var(--color-danger)",
              border: "1px solid var(--color-danger-border)", fontSize: 13,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
          <Button disabled={isSubmitting} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={isSubmitting} isLoading={isSubmitting} type="submit" variant="primary">
            {isEditing ? "Save changes" : "Add game"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
