import { FolderSearch, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { DeleteGameDialog } from "../components/library/DeleteGameDialog";
import { EmptyState } from "../components/library/EmptyState";
import { ErrorState } from "../components/library/ErrorState";
import { GameDialog } from "../components/library/GameDialog";
import { GameGrid } from "../components/library/GameGrid";
import { LoadingState } from "../components/library/LoadingState";
import { RecentlyPlayed } from "../components/library/RecentlyPlayed";
import { ScanFoldersDialog } from "../components/library/ScanFoldersDialog";
import { useCreateGame } from "../hooks/useCreateGame";
import { useDeleteGame } from "../hooks/useDeleteGame";
import { useGames } from "../hooks/useGames";
import { useLaunchGame } from "../hooks/useLaunchGame";
import { useMetadata } from "../hooks/useMetadata";
import { useRecentGames } from "../hooks/useRecentGames";
import { useUpdateGame } from "../hooks/useUpdateGame";
import { useFolderScanner } from "../hooks/useFolderScanner";
import type { Game, GameFormValues } from "../types/game";

const FILE_LOCATION_ERROR_MS = 4000;

export function LibraryPage(): React.JSX.Element {
  // --- Data hooks (grouped) ---
  const { games, isLoading, error, refresh } = useGames();
  const { launchGame, getLaunchState } = useLaunchGame();
  const { recentGames, isLoading: recentLoading, error: recentError, refresh: refreshRecent } = useRecentGames();
  const scanner = useFolderScanner();
  const metadata = useMetadata();

  // --- UI state ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [fileLocationError, setFileLocationError] = useState<string | null>(null);

  // --- Mutation hooks ---
  const { createGame, isCreating, error: createError } = useCreateGame(refresh);
  const { updateGame, isUpdating, error: updateError } = useUpdateGame(refresh);
  const { deleteGame, isDeleting, error: deleteError } = useDeleteGame(refresh);

  // --- Handlers ---
  const handleLaunch = useCallback(
    async (game: Game): Promise<void> => {
      const result = await launchGame(game.id);
      // Refresh Recently Played after a successful launch
      if (result?.success) {
        void refreshRecent();
      }
    },
    [launchGame, refreshRecent]
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
    const normalizedTerm = searchTerm.trim().toLocaleLowerCase();
    return normalizedTerm
      ? games.filter((game) => game.title.toLocaleLowerCase().includes(normalizedTerm))
      : games;
  }, [games, searchTerm]);

  const openAddDialog = () => {
    setGameToEdit(null);
    setIsGameDialogOpen(true);
  };
  const openEditDialog = (game: Game) => {
    setGameToEdit(game);
    setIsGameDialogOpen(true);
  };
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
    if (result) {
      await refresh();
    }
  };
  const fetchMetadata = async (game: Game): Promise<void> => {
    await metadata.fetchMetadata(game.id);
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-sm font-medium text-cyan-300">Your collection</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Game Library</h1><p className="mt-2 text-sm text-slate-400">{games.length === 1 ? "1 game" : `${games.length} games`} in your local library</p></div>
        <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/5" onClick={() => void scanner.start()} type="button"><FolderSearch size={17} />Scan folders</button><button className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" onClick={openAddDialog} type="button"><Plus size={17} />Add game</button></div>
      </header>

      <RecentlyPlayed recentGames={recentGames} isLoading={recentLoading} error={recentError} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <label className="flex w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-400 focus-within:border-cyan-300/70"><Search size={18} className="shrink-0" /><input aria-label="Search games" className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search your library" value={searchTerm} /></label>
        {!isLoading && !error && games.length > 0 && <p className="text-sm text-slate-500">{filteredGames.length} shown</p>}
      </div>

      {fileLocationError && (
        <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300" role="alert">
          {fileLocationError}
        </div>
      )}
      {metadata.error && <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300" role="alert">{metadata.error}</div>}

      <section className="mt-6" aria-label="Games">
        {isLoading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => void refresh()} /> : filteredGames.length === 0 ? <EmptyState isFiltered={games.length > 0} onAddGame={openAddDialog} /> : <GameGrid games={filteredGames} getLaunchState={getLaunchState} getMetadataState={metadata.getMetadataState} onDelete={setGameToDelete} onEdit={openEditDialog} onFetchMetadata={(game) => void fetchMetadata(game)} onLaunch={handleLaunch} onOpenFileLocation={handleOpenFileLocation} />}
      </section>
      <GameDialog game={gameToEdit} isOpen={isGameDialogOpen} isSubmitting={isCreating || isUpdating} onClose={() => setIsGameDialogOpen(false)} onSubmit={submitGame} submitError={gameToEdit ? updateError : createError} />
      <DeleteGameDialog error={deleteError} game={gameToDelete} isDeleting={isDeleting} onClose={() => setGameToDelete(null)} onConfirm={confirmDelete} />
      <ScanFoldersDialog error={scanner.error} isImporting={scanner.isImporting} onCancel={() => void scanner.cancel()} onClose={scanner.dismiss} onImport={importScannedGames} scan={scanner.scan} />
    </>
  );
}
