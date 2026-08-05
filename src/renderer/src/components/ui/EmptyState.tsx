/** Shared EmptyState primitive. Replaces ad-hoc empty views across the app. */
import type { LucideIcon } from "lucide-react";
import { Gamepad2 } from "lucide-react";

import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Gamepad2,
  title,
  description,
  action,
  onAction,
  className = "",
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 280,
        textAlign: "center",
        padding: 32,
        borderRadius: "var(--radius-2xl)",
        border: "1px dashed var(--color-border-strong)",
        background: "var(--color-surface-2)",
      }}
    >
      <div>
        <div
          style={{
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            width: 52,
            height: 52,
            borderRadius: "var(--radius-xl)",
            background: "var(--color-accent-dim)",
            color: "var(--color-accent)",
          }}
        >
          <Icon aria-hidden="true" size={26} />
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 600 }}>{title}</h2>
        {description && (
          <p
            style={{
              margin: "0 auto 20px",
              maxWidth: 360,
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--color-text-muted)",
            }}
          >
            {description}
          </p>
        )}
        {action && onAction && (
          <Button onClick={onAction} variant="primary" size="md">
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}
