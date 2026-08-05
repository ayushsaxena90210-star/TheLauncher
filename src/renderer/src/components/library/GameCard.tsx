import { AlertCircle, CalendarDays, FolderOpen, Loader2, MoreHorizontal, Pencil, Play, Sparkles, Trash2 } from "lucide-react";

import type { Game } from "../../types/game";

type LaunchState = "idle" | "launching" | "running" | "error";

type GameCardProps = {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  onLaunch: (game: Game) => void;
  onOpenFileLocation: (game: Game) => void;
  launchState: LaunchState;
  launchError: string | null;
  metadataState: "idle" | "queued" | "fetching" | "success" | "failed";
  onFetchMetadata: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });

const metadataLabel: Record<GameCardProps["metadataState"], string> = {
  idle: "Fetch details", queued: "Details queued", fetching: "Fetching details",
  success: "Metadata updated", failed: "Retry details",
};

function coverUrl(gameId: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
  return `${apiBase}/metadata/games/${gameId}/cover`;
}

export function GameCard({
  game, onEdit, onDelete, onLaunch, onOpenFileLocation,
  launchState, launchError, metadataState, onFetchMetadata, onOpenDetails,
}: GameCardProps): React.JSX.Element {
  const createdAt = new Date(game.created_at);
  const createdLabel = Number.isNaN(createdAt.valueOf()) ? "Unknown date" : dateFormatter.format(createdAt);
  const isPlayDisabled = launchState !== "idle";

  // ── Play button styles via design-system tokens ──────────────────────
  const playBtnStyle: React.CSSProperties = (() => {
    if (launchState === "running") return {
      background: "rgba(52,211,153,0.10)", color: "#34d399",
      border: "1px solid rgba(52,211,153,0.30)",
    };
    if (launchState === "error") return {
      background: "var(--color-danger-bg)", color: "var(--color-danger)",
      border: "1px solid var(--color-danger-border)",
    };
    if (launchState === "launching") return {
      background: "rgba(15,23,42,0.60)", color: "var(--color-text-muted)",
      border: "1px solid var(--color-border-subtle)",
      cursor: "wait",
    };
    // idle — use primary accent
    return { background: "var(--color-accent)", color: "var(--color-accent-fg)", border: "0" };
  })();

  return (
    <article
      style={{
        overflow: "hidden", borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border-medium)",
        background: "var(--color-surface-2)",
        boxShadow: "var(--shadow-card)",
        transition: "transform var(--duration-base) var(--ease-default), border-color var(--duration-base) var(--ease-default)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-border)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.borderColor = ""; }}
    >
      {/* Cover image */}
      <button
        aria-label={`Open ${game.title} details`}
        onClick={() => onOpenDetails(game)}
        style={{
          position: "relative", display: "block", width: "100%",
          aspectRatio: "16/9", overflow: "hidden", cursor: "pointer", padding: 0, border: 0,
          background: "radial-gradient(circle at 30% 20%, rgba(var(--accent-raw), 0.15), transparent 40%), var(--color-surface-3)",
        }}
        type="button"
      >
        {game.cover_path ? (
          <img
            alt={`${game.title} cover`}
            loading="lazy"
            src={coverUrl(game.id)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", color: "var(--color-text-faint)", textTransform: "uppercase" }}>
            Cover art
          </span>
        )}
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,6,23,0.45), transparent)" }} />
      </button>

      {/* Card body */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <button
              onClick={() => onOpenDetails(game)}
              style={{
                display: "block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)", background: "transparent",
                border: 0, padding: 0, textAlign: "left", cursor: "pointer",
                transition: "color var(--duration-fast) var(--ease-default)",
              }}
              title={game.title}
              type="button"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ""; }}
            >
              {game.title}
            </button>
            <p
              style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={game.executable_path}
            >
              {game.executable_path}
            </p>
          </div>
          <MoreHorizontal aria-hidden="true" size={17} style={{ flexShrink: 0, color: "var(--color-text-faint)" }} />
        </div>

        <p style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-faint)" }}>
          <CalendarDays aria-hidden="true" size={13} />
          Added {createdLabel}
        </p>
        {game.genres && (
          <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--color-accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={game.genres}>
            {game.genres}
          </p>
        )}

        {/* Play button */}
        <div style={{ marginTop: 14 }}>
          <button
            disabled={isPlayDisabled}
            onClick={() => onLaunch(game)}
            style={{
              display: "inline-flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, cursor: isPlayDisabled ? "default" : "pointer",
              transition: "filter var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default)",
              ...playBtnStyle,
            }}
            type="button"
            onMouseEnter={(e) => { if (!isPlayDisabled) (e.currentTarget as HTMLElement).style.filter = "brightness(1.10)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
          >
            {launchState === "launching" && <><Loader2 aria-hidden="true" className="animate-spin" size={14} /> Launching…</>}
            {launchState === "running" && (
              <>
                <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#34d399", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.75 }} />
                  <span style={{ position: "relative", display: "block", width: 10, height: 10, borderRadius: "50%", background: "#34d399" }} />
                </span>
                Running
              </>
            )}
            {launchState === "error" && <><AlertCircle aria-hidden="true" size={14} /> Launch Failed</>}
            {launchState === "idle"  && <><Play aria-hidden="true" fill="currentColor" size={14} /> Play</>}
          </button>
          {launchError && (
            <p role="alert" style={{ margin: "5px 0 0", fontSize: 11, color: "var(--color-danger)" }}>{launchError}</p>
          )}
        </div>

        {/* Secondary actions */}
        <div
          style={{
            marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7,
            paddingTop: 10, borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <ActionBtn
            disabled={metadataState === "queued" || metadataState === "fetching"}
            onClick={() => onFetchMetadata(game)}
            title={metadataLabel[metadataState]}
          >
            {metadataState === "queued" || metadataState === "fetching"
              ? <Loader2 aria-hidden="true" className="animate-spin" size={13} />
              : <Sparkles aria-hidden="true" size={13} />}
            {metadataLabel[metadataState]}
          </ActionBtn>
          <ActionBtn onClick={() => onOpenFileLocation(game)} title="Open file location">
            <FolderOpen aria-hidden="true" size={13} /> Location
          </ActionBtn>
          <ActionBtn onClick={() => onEdit(game)}>
            <Pencil aria-hidden="true" size={13} /> Edit
          </ActionBtn>
          <ActionBtn danger onClick={() => onDelete(game)}>
            <Trash2 aria-hidden="true" size={13} /> Delete
          </ActionBtn>
        </div>
      </div>
    </article>
  );
}

function ActionBtn({
  children, onClick, disabled, title, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 500,
        border: 0, background: "transparent", cursor: disabled ? "wait" : "pointer",
        color: danger ? "var(--color-danger)" : "var(--color-text-muted)",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default)",
      }}
      title={title}
      type="button"
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background = danger ? "var(--color-danger-bg)" : "rgba(255,255,255,0.07)";
          if (!danger) (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "";
        (e.currentTarget as HTMLElement).style.color = danger ? "var(--color-danger)" : "var(--color-text-muted)";
      }}
    >
      {children}
    </button>
  );
}
