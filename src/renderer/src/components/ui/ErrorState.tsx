/** Shared ErrorState primitive. Replaces ad-hoc error views across the app. */
import { AlertCircle } from "lucide-react";

import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string | null | undefined;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
  compact = false,
  style,
}: ErrorStateProps): React.JSX.Element {
  if (compact) {
    return (
      <div
        className={className}
        role="alert"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "12px 14px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-danger-border)",
          background: "var(--color-danger-bg)",
          color: "var(--color-danger)",
          fontSize: 13,
          ...style,
        }}
      >
        <AlertCircle aria-hidden="true" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{message}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            style={{ marginLeft: "auto", flexShrink: 0 }}
            variant="ghost"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      role="alert"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        textAlign: "center",
        padding: 32,
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-danger-border)",
        background: "var(--color-danger-bg)",
        ...style,
      }}
    >
      <div>
        <AlertCircle
          aria-hidden="true"
          size={36}
          style={{ color: "var(--color-danger)", margin: "0 auto 14px" }}
        />
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>{title}</h2>
        <p style={{ margin: "0 auto 20px", maxWidth: 360, fontSize: 13, color: "var(--color-text-muted)" }}>
          {message ?? "An unexpected error occurred."}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="quiet">
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
