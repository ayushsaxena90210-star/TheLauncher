/**
 * Dialog – accessible modal with focus trap, Escape handler, and backdrop.
 * Styles from design-system.css .dialog-* classes.
 */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** ID matching an element inside the dialog that provides the accessible name */
  labelledBy?: string;
  maxWidth?: string;
  children: React.ReactNode;
  /** Hide the default close (×) button */
  hideCloseButton?: boolean;
  closeDisabled?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function Dialog({
  isOpen,
  onClose,
  title,
  labelledBy,
  maxWidth = "512px",
  children,
  hideCloseButton = false,
  closeDisabled = false,
}: DialogProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    // Focus the first focusable element inside the dialog
    const firstFocusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    firstFocusable?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeDisabled) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen, onClose, closeDisabled]);

  if (!isOpen) return null;

  const ariaProps = labelledBy
    ? { "aria-labelledby": labelledBy }
    : title
    ? { "aria-label": title }
    : {};

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div
        aria-modal="true"
        ref={panelRef}
        role="dialog"
        style={{ maxWidth }}
        className="dialog-panel"
        {...ariaProps}
      >
        {(title || !hideCloseButton) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            {title && (
              <h2 id={labelledBy} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                aria-label="Close dialog"
                className="btn btn--ghost btn--icon-sm"
                disabled={closeDisabled}
                onClick={onClose}
                style={{ marginLeft: "auto", flexShrink: 0 }}
                type="button"
              >
                <X size={17} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
