import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../services/client";
import { sessionService } from "../services/sessionService";
import type { RecentGame } from "../types/session";

/**
 * Fetches and caches recently played games.
 *
 * Follows the same cache-then-refresh pattern as useGames().
 * Refreshes only when explicitly requested — after a successful
 * game launch or a game:exited event. Never polls.
 */
export function useRecentGames() {
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sessionService.recentGames();
      if (mountedRef.current) setRecentGames(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof ApiError ? err.message : "Unable to load recent games.");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    void refresh();

    // Refresh when a game exits
    const unsubscribe = window.launcher.onGameExited(() => {
      void refresh();
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [refresh]);

  return { recentGames, isLoading, error, refresh };
}
