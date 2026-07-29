import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../services/client";
import { gameService } from "../services/gameService";
import type { Game } from "../types/game";

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setGames(await gameService.list());
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Unable to load your library.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { games, isLoading, error, refresh };
}
