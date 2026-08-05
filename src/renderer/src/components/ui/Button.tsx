/**
 * Button – unified interactive element.
 * Replaces all one-off button classes across the codebase.
 * All visual styles come from design-system.css .btn-* classes.
 */
import { Loader2 } from "lucide-react";
import type React from "react";

type Variant = "primary" | "quiet" | "danger" | "ghost" | "icon";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  iconOnly?: boolean;
}

function classes(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "quiet",
  size = "md",
  isLoading = false,
  iconOnly = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  const sizeClass =
    iconOnly ? `btn--icon-${size === "sm" ? "sm" : "md"}`
    : size === "sm" ? "btn--sm"
    : size === "lg" ? "btn--lg"
    : "btn--md";

  return (
    <button
      className={classes("btn", `btn--${variant}`, sizeClass, className)}
      disabled={disabled ?? isLoading}
      type="button"
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
