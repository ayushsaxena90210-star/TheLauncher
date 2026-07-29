import { useState } from "react";

import { ApiError } from "../services/client";
import { gameService } from "../services/gameService";
import type { CreateGameInput, Game } from "../types/game";

export function useCreateGame(onSuccess: () => Promise<void>) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (input: CreateGameInput): Promise<Game | null> => {
    setIsCreating(true);
    setError(null);
    try {
      const game = await gameService.create(input);
      await onSuccess();
      return game;
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Unable to add the game.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createGame, isCreating, error };
}
