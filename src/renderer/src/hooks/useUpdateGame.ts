import { useState } from "react";

import { ApiError } from "../services/client";
import { gameService } from "../services/gameService";
import type { Game, UpdateGameInput } from "../types/game";

export function useUpdateGame(onSuccess: () => Promise<void>) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGame = async (id: string, input: UpdateGameInput): Promise<Game | null> => {
    setIsUpdating(true);
    setError(null);
    try {
      const game = await gameService.update(id, input);
      await onSuccess();
      return game;
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Unable to update the game.");
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateGame, isUpdating, error };
}
