import { ArrowLeft, Copy, ExternalLink, FolderOpen, MoreHorizontal, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DeleteGameDialog } from "../components/library/DeleteGameDialog";
import { GameDialog } from "../components/library/GameDialog";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useDeleteGame } from "../hooks/useDeleteGame";
import { useGameDetails } from "../hooks/useGameDetails";
import { useLaunchGame } from "../hooks/useLaunchGame";
import { useUpdateGame } from "../hooks/useUpdateGame";
import type { Game, GameFormValues } from "../types/game";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
const coverUrl = (id: string) => `${apiBase}/metadata/games/${id}/cover`;
const screenshotUrl = (id: string, index: number) => `${apiBase}/metadata/games/${id}/screenshots/${index}`;

function playtime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function fmtDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
    : "Never";
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-border-subtle)", padding: "11px 0" }} className="last-of-type:border-0">
      <dt style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)" }}>{label}</dt>
      <dd style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{value ?? "—"}</dd>
    </div>
  );
}

export function GameDetailsPage(): React.JSX.Element {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { game, activity, screenshots, isLoading, error, refresh } = useGameDetails(gameId);
  const { launchGame, getLaunchState } = useLaunchGame();
  const [selectedScreenshot, setSelectedScreenshot] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { updateGame, isUpdating, error: updateError } = useUpdateGame(refresh);
  const { deleteGame, isDeleting, error: deleteError } = useDeleteGame(async () => { navigate("/library"); });
  const launch = useCallback(async () => { if (game) await launchGame(game.id); }, [game, launchGame]);

  // ── Loading skeleton ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Button
          onClick={() => navigate("/library")}
          size="sm"
          variant="ghost"
          style={{ alignSelf: "flex-start", marginBottom: 8 }}
        >
          <ArrowLeft size={15} />
          Back to library
        </Button>
        <Skeleton height="300px" width="100%" style={{ borderRadius: "var(--radius-2xl)" }} />
        <Skeleton height="240px" width="100%" style={{ borderRadius: "var(--radius-2xl)" }} />
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────
  if (!game || error) {
    return (
      <>
        <Button onClick={() => navigate("/library")} size="sm" variant="ghost" style={{ marginBottom: 20, alignSelf: "flex-start" }}>
          <ArrowLeft size={15} />
          Back to library
        </Button>
        <ErrorState
          title="Game unavailable"
          message={error ?? "This game could not be found."}
          onRetry={() => void refresh()}
        />
      </>
    );
  }

  const launchState = getLaunchState(game.id);
  const submitEdit = async (values: GameFormValues) =>
    (await updateGame(game.id, { title: values.title, executable_path: values.executablePath })) !== null;

  const refreshMetadata = async () => {
    setActionError(null);
    try { await window.launcher.refreshMetadata(game.id); await refresh(); }
    catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to refresh metadata."); }
  };

  const copyPath = async () => {
    setActionError(null);
    try { await navigator.clipboard.writeText(game.executable_path); }
    catch { setActionError("Unable to copy the executable path."); }
  };

  const openLocation = async () => {
    const result = await window.launcher.openFileLocation(game.id);
    if (!result.success) setActionError(result.error);
  };

  const isLaunching = launchState.state === "launching";
  const isRunning  = launchState.state === "running";

  return (
    <>
      {/* Back link */}
      <Button
        onClick={() => navigate("/library")}
        size="sm"
        variant="ghost"
        style={{ marginBottom: 20, alignSelf: "flex-start" }}
      >
        <ArrowLeft size={15} />
        Back to library
      </Button>

      {/* Hero banner */}
      <section
        className="ds-card"
        style={{ position: "relative", minHeight: 280, overflow: "hidden" }}
      >
        {game.cover_path && (
          <img
            alt=""
            aria-hidden="true"
            src={coverUrl(game.id)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28, filter: "blur(22px)", transform: "scale(1.12)", zIndex: 0 }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, var(--color-surface-3) 30%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 24, padding: "28px 32px" }}>
          {/* Cover art */}
          <div
            style={{
              width: 120, height: 160, flexShrink: 0, borderRadius: "var(--radius-xl)",
              overflow: "hidden", border: "1px solid var(--color-border-medium)",
              background: "var(--color-surface-1)", boxShadow: "var(--shadow-card)",
            }}
          >
            {game.cover_path
              ? <img alt={`${game.title} cover`} src={coverUrl(game.id)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 11, color: "var(--color-text-faint)" }}>No cover</div>
            }
          </div>

          {/* Metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="page-eyebrow">{game.metadata_source?.toUpperCase() ?? "LOCAL LIBRARY"}</p>
            <h1 style={{ margin: "6px 0 10px", fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {game.title}
            </h1>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-secondary)" }}>
              {[game.genres, game.platforms, game.rating ? `${game.rating.toFixed(1)} / 100` : null]
                .filter(Boolean)
                .join("  ·  ") || "Metadata available after enrichment"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
              {playtime(activity?.total_play_time_seconds ?? 0)} played  ·  Last played {fmtDate(activity?.last_played_at ?? null)}  ·  {activity?.launch_count ?? 0} launches
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 8, alignSelf: "flex-end" }}>
            <Button
              disabled={launchState.state !== "idle"}
              isLoading={isLaunching}
              onClick={() => void launch()}
              variant="primary"
              size="lg"
            >
              {!isLaunching && <Play aria-hidden="true" fill="currentColor" size={16} />}
              {isRunning ? "Running" : isLaunching ? "Launching…" : "Play"}
            </Button>
            <Button iconOnly onClick={() => void refreshMetadata()} title="Refresh metadata" variant="icon">
              <RefreshCw size={16} />
            </Button>
            <Button iconOnly onClick={() => void openLocation()} title="Open file location" variant="icon">
              <FolderOpen size={16} />
            </Button>
            <Button
              iconOnly
              onClick={() => setShowActions((v) => !v)}
              title="More actions"
              variant="icon"
            >
              <MoreHorizontal size={16} />
            </Button>

            {showActions && (
              <div
                className="ds-menu"
                style={{ position: "absolute", right: 0, bottom: "calc(100% + 8px)", minWidth: 200, zIndex: 30 }}
              >
                <button className="ds-menu-item" onClick={() => { setEditOpen(true); setShowActions(false); }} type="button">
                  <Pencil size={14} />
                  Edit game
                </button>
                <button className="ds-menu-item" onClick={() => { void copyPath(); setShowActions(false); }} type="button">
                  <Copy size={14} />
                  Copy executable path
                </button>
                {game.official_website && (
                  <a className="ds-menu-item" href={game.official_website} rel="noreferrer" target="_blank">
                    <ExternalLink size={14} />
                    Official website
                  </a>
                )}
                <button className="ds-menu-item ds-menu-item--danger" onClick={() => { setDeleteOpen(true); setShowActions(false); }} type="button">
                  <Trash2 size={14} />
                  Remove game
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {actionError && (
        <ErrorState compact message={actionError} style={{ marginTop: 14 }} />
      )}

      {/* Content grid */}
      <div style={{ marginTop: 28, display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1fr) 300px" }}>
        {/* Left: About + Screenshots + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* About */}
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>About</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "var(--color-text-secondary)", whiteSpace: "pre-line" }}>
              {game.description ?? "No description added yet. Refresh metadata to look up this game in IGDB."}
            </p>
          </section>

          {/* Screenshots */}
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>Screenshots</h2>
            {screenshots.length > 0 ? (
              <div>
                <div
                  style={{
                    aspectRatio: "16/9", overflow: "hidden",
                    borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-medium)",
                    background: "var(--color-surface-3)",
                  }}
                >
                  <img
                    alt={`${game.title} screenshot`}
                    src={screenshotUrl(game.id, screenshots[selectedScreenshot] ?? screenshots[0])}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {screenshots.map((index, position) => (
                    <button
                      key={index}
                      onClick={() => setSelectedScreenshot(position)}
                      type="button"
                      style={{
                        width: 96, height: 60, flexShrink: 0, overflow: "hidden",
                        borderRadius: "var(--radius-md)", cursor: "pointer", padding: 0,
                        border: position === selectedScreenshot
                          ? "2px solid var(--color-accent)"
                          : "1px solid var(--color-border-medium)",
                      }}
                    >
                      <img
                        alt={`Screenshot ${position + 1}`}
                        loading="lazy"
                        src={screenshotUrl(game.id, index)}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 24, borderRadius: "var(--radius-xl)",
                  border: "1px dashed var(--color-border-medium)",
                  fontSize: 13, color: "var(--color-text-faint)", textAlign: "center",
                }}
              >
                No cached screenshots are available for this game.
              </div>
            )}
          </section>

          {/* Activity */}
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>Activity</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {([
                ["Total playtime", playtime(activity?.total_play_time_seconds ?? 0)],
                ["Last played", fmtDate(activity?.last_played_at ?? null)],
                ["Launch count", activity?.launch_count ?? 0],
              ] as [string, string | number][]).map(([label, value]) => (
                <div
                  key={label}
                  className="ds-card"
                  style={{ padding: 16 }}
                >
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)" }}>{label}</p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="ds-card" style={{ overflow: "hidden" }}>
              {activity?.sessions.length ? (
                activity.sessions.map((session, i) => (
                  <div
                    key={session.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", fontSize: 13,
                      borderTop: i > 0 ? "1px solid var(--color-border-subtle)" : undefined,
                    }}
                  >
                    <span>{fmtDate(session.started_at)}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{playtime(session.duration_seconds ?? 0)}</span>
                  </div>
                ))
              ) : (
                <p style={{ padding: 16, fontSize: 13, color: "var(--color-text-faint)" }}>No completed sessions yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right: Details sidebar */}
        <aside>
          <div className="ds-card" style={{ padding: 20 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>Details</h2>
            <dl style={{ margin: 0 }}>
              <Detail label="Release date" value={game.release_date} />
              <Detail label="Developers" value={game.developers} />
              <Detail label="Publishers" value={game.publishers} />
              <Detail label="Genres" value={game.genres} />
              <Detail label="Platforms" value={game.platforms} />
              <Detail label="Rating" value={game.rating ? `${game.rating.toFixed(1)} / 100` : null} />
              <Detail label="Age rating" value={game.age_rating} />
              <Detail label="Themes" value={game.themes} />
              <Detail label="Franchises" value={game.franchises} />
              <Detail label="Game modes" value={game.game_modes} />
              <Detail label="Metadata source" value={game.metadata_source?.toUpperCase()} />
            </dl>
            <h2 style={{ margin: "20px 0 12px", fontSize: 17, fontWeight: 600 }}>Technical</h2>
            <dl style={{ margin: 0 }}>
              <Detail label="Executable" value={game.executable_path} />
              <Detail label="Install folder" value={game.install_path} />
              <Detail label="Import date" value={fmtDate(game.created_at)} />
              <Detail label="Metadata updated" value={fmtDate(game.updated_at)} />
            </dl>
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <GameDialog
        game={editOpen ? game : null}
        isOpen={editOpen}
        isSubmitting={isUpdating}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
        submitError={updateError}
      />
      <DeleteGameDialog
        error={deleteError}
        game={deleteOpen ? game : null}
        isDeleting={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => { if (await deleteGame(game.id)) navigate("/library"); }}
      />
    </>
  );
}
