import { AlertTriangle } from "lucide-react";

import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
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
    <Dialog
      closeDisabled={isDeleting}
      isOpen={Boolean(game)}
      labelledBy="delete-dialog-title"
      maxWidth="440px"
      onClose={onClose}
      hideCloseButton={true}
    >
      <AlertTriangle aria-hidden="true" size={28} style={{ color: "var(--color-warning)" }} />
      <h2 id="delete-dialog-title" style={{ margin: "14px 0 8px", fontSize: 20, fontWeight: 600 }}>
        Remove {game.title}?
      </h2>
      <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.7, color: "var(--color-text-muted)" }}>
        This removes the game from your library only. Its executable and installed files will not be deleted.
      </p>
      {error && (
        <div
          role="alert"
          style={{
            margin: "12px 0", padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger-bg)", color: "var(--color-danger)",
            border: "1px solid var(--color-danger-border)", fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Button disabled={isDeleting} onClick={onClose} variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={isDeleting}
          isLoading={isDeleting}
          onClick={() => void onConfirm()}
          variant="danger"
        >
          {isDeleting ? "Removing…" : "Remove game"}
        </Button>
      </div>
    </Dialog>
  );
}
