/**
 * GameContext – provides the shared game list and selected-game routing state.
 * All pages/components read games from here to avoid duplicate network fetches.
 */
import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useGames } from "../hooks/useGames";
import type { Game } from "../types/game";

interface GameContextValue {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** The gameId from the current URL, or null when not on /game/:id */
  activeGameId: string | null;
  /** Navigate to a game's detail page */
  selectGame: (id: string) => void;
  /** Navigate back to /library */
  clearGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { games, isLoading, error, refresh } = useGames();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive activeGameId from the URL so the URL stays as the single source of truth.
  const activeGameId = useMemo(() => {
    const match = location.pathname.match(/^\/game\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const selectGame = useCallback((id: string) => navigate(`/game/${id}`), [navigate]);
  const clearGame = useCallback(() => navigate("/library"), [navigate]);

  const value = useMemo<GameContextValue>(
    () => ({ games, isLoading, error, refresh, activeGameId, selectGame, clearGame }),
    [games, isLoading, error, refresh, activeGameId, selectGame, clearGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used inside <GameProvider>.");
  return ctx;
}
