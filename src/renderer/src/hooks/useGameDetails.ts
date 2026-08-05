import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../services/client";
import { gameService } from "../services/gameService";
import { sessionService } from "../services/sessionService";
import type { Game } from "../types/game";
import type { GameActivity } from "../types/session";

export function useGameDetails(gameId: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [activity, setActivity] = useState<GameActivity | null>(null);
  const [screenshots, setScreenshots] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!gameId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextGame, nextActivity, nextScreenshots] = await Promise.all([
        gameService.get(gameId), sessionService.activity(gameId), gameService.screenshots(gameId),
      ]);
      setGame(nextGame);
      setActivity(nextActivity);
      setScreenshots(nextScreenshots.map((item) => item.index));
    } catch (caught) {
      setError(caught instanceof ApiError && caught.code === "game_not_found" ? "This game is no longer in your library." : "Unable to load this game.");
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => window.launcher.onGameExited(() => { void refresh(); }), [refresh]);

  return { game, activity, screenshots, isLoading, error, refresh };
}
