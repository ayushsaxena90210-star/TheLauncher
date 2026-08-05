import { FolderSearch, Gamepad2, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DeleteGameDialog } from "../components/library/DeleteGameDialog";
import { GameDialog } from "../components/library/GameDialog";
import { GameGrid } from "../components/library/GameGrid";
import { RecentlyPlayed } from "../components/library/RecentlyPlayed";
import { ScanFoldersDialog } from "../components/library/ScanFoldersDialog";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useGameContext } from "../context/GameContext";
import { useCreateGame } from "../hooks/useCreateGame";
import { useDeleteGame } from "../hooks/useDeleteGame";
import { useFolderScanner } from "../hooks/useFolderScanner";
import { useLaunchGame } from "../hooks/useLaunchGame";
import { useMetadata } from "../hooks/useMetadata";
import { useRecentGames } from "../hooks/useRecentGames";
import { useUpdateGame } from "../hooks/useUpdateGame";
import type { Game, GameFormValues } from "../types/game";

const FILE_LOCATION_ERROR_MS = 4_000;

export function LibraryPage(): React.JSX.Element {
  const navigate = useNavigate();

  // ── Data: use GameContext for the shared game list ──────────────────────
  const { games, isLoading, error, refresh } = useGameContext();
  const { launchGame, getLaunchState } = useLaunchGame();
  const { recentGames, isLoading: recentLoading, error: recentError, refresh: refreshRecent } = useRecentGames();
  const scanner = useFolderScanner();
  const metadata = useMetadata();

  // ── UI state ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [fileLocationError, setFileLocationError] = useState<string | null>(null);

  // ── Mutations ───────────────────────────────────────────────────────────
  const { createGame, isCreating, error: createError } = useCreateGame(refresh);
  const { updateGame, isUpdating, error: updateError } = useUpdateGame(refresh);
  const { deleteGame, isDeleting, error: deleteError } = useDeleteGame(refresh);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLaunch = useCallback(
    async (game: Game): Promise<void> => {
      const result = await launchGame(game.id);
      if (result?.success) void refreshRecent();
    },
    [launchGame, refreshRecent],
  );

  const handleOpenFileLocation = useCallback(async (game: Game): Promise<void> => {
    setFileLocationError(null);
    const result = await window.launcher.openFileLocation(game.id);
    if (!result.success) {
      setFileLocationError(result.error);
      setTimeout(() => setFileLocationError(null), FILE_LOCATION_ERROR_MS);
    }
  }, []);

  const filteredGames = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase();
    return q ? games.filter((g) => g.title.toLocaleLowerCase().includes(q)) : games;
  }, [games, searchTerm]);

  const openAddDialog = () => { setGameToEdit(null); setIsGameDialogOpen(true); };
  const openEditDialog = (game: Game) => { setGameToEdit(game); setIsGameDialogOpen(true); };

  const submitGame = async (values: GameFormValues): Promise<boolean> => {
    const input = { title: values.title, executable_path: values.executablePath };
    return gameToEdit
      ? (await updateGame(gameToEdit.id, input)) !== null
      : (await createGame(input)) !== null;
  };

  const confirmDelete = async () => {
    if (gameToDelete && await deleteGame(gameToDelete.id)) setGameToDelete(null);
  };

  const importScannedGames = async (candidateIds: string[]): Promise<void> => {
    const result = await scanner.importSelected(candidateIds);
    if (result) await refresh();
  };

  const fetchMetadata = async (game: Game): Promise<void> => {
    await metadata.fetchMetadata(game.id);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading && games.length === 0) {
    return (
      <>
        <header style={{ marginBottom: 32 }}>
          <p className="page-eyebrow">Your collection</p>
          <h1 style={{ margin: "4px 0 8px", fontSize: 30, letterSpacing: "-0.03em" }}>Game Library</h1>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Page header */}
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
        <div>
          <p className="page-eyebrow">Your collection</p>
          <h1 style={{ margin: "4px 0 8px", fontSize: 30, letterSpacing: "-0.03em" }}>Game Library</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {games.length === 1 ? "1 game" : `${games.length} games`} in your local library
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => void scanner.start()} variant="quiet">
            <FolderSearch aria-hidden="true" size={16} />
            Scan folders
          </Button>
          <Button onClick={openAddDialog} variant="primary">
            <Plus aria-hidden="true" size={16} />
            Add game
          </Button>
        </div>
      </header>

      {/* Recently played */}
      <RecentlyPlayed recentGames={recentGames} isLoading={recentLoading} error={recentError} />

      {/* Search bar */}
      <div style={{ margin: "28px 0 8px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <label
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", maxWidth: 400,
            padding: "10px 14px",
            border: "1px solid var(--color-border-medium)",
            borderRadius: "var(--radius-xl)",
            background: "rgba(0,0,0,0.18)",
            fontSize: 13,
            color: "var(--color-text-muted)",
          }}
        >
          <Search aria-hidden="true" size={16} style={{ flexShrink: 0 }} />
          <input
            aria-label="Search games"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your library"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: "none", fontSize: 13, color: "var(--color-text-primary)" }}
            value={searchTerm}
          />
        </label>
        {!isLoading && !error && games.length > 0 && (
          <p style={{ fontSize: 12, color: "var(--color-text-faint)", margin: 0 }}>
            {filteredGames.length} shown
          </p>
        )}
      </div>

      {/* Inline alerts */}
      {fileLocationError && (
        <ErrorState compact message={fileLocationError} style={{ marginTop: 12 }} />
      )}
      {metadata.error && (
        <ErrorState compact message={metadata.error} style={{ marginTop: 8 }} />
      )}

      {/* Game grid */}
      <section aria-label="Games" style={{ marginTop: 16 }}>
        {error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : filteredGames.length === 0 ? (
          <EmptyState
            icon={Gamepad2}
            title={games.length > 0 ? "No games match your search" : "Your library is empty"}
            description={
              games.length > 0
                ? "Try a different game title or clear the search to see your full library."
                : "Add a locally installed game to start building your library."
            }
            action={games.length === 0 ? "Add game" : undefined}
            onAction={games.length === 0 ? openAddDialog : undefined}
          />
        ) : (
          <GameGrid
            games={filteredGames}
            getLaunchState={getLaunchState}
            getMetadataState={metadata.getMetadataState}
            onDelete={setGameToDelete}
            onEdit={openEditDialog}
            onFetchMetadata={(game) => void fetchMetadata(game)}
            onLaunch={handleLaunch}
            onOpenDetails={(game) => navigate(`/game/${game.id}`)}
            onOpenFileLocation={handleOpenFileLocation}
          />
        )}
      </section>

      {/* Dialogs */}
      <GameDialog
        game={gameToEdit}
        isOpen={isGameDialogOpen}
        isSubmitting={isCreating || isUpdating}
        onClose={() => setIsGameDialogOpen(false)}
        onSubmit={submitGame}
        submitError={gameToEdit ? updateError : createError}
      />
      <DeleteGameDialog
        error={deleteError}
        game={gameToDelete}
        isDeleting={isDeleting}
        onClose={() => setGameToDelete(null)}
        onConfirm={confirmDelete}
      />
      <ScanFoldersDialog
        error={scanner.error}
        isImporting={scanner.isImporting}
        onCancel={() => void scanner.cancel()}
        onClose={scanner.dismiss}
        onImport={importScannedGames}
        scan={scanner.scan}
      />
    </>
  );
}
