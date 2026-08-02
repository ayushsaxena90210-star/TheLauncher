import { useState } from "react";

import { ApiError } from "../services/client";
import { gameService } from "../services/gameService";

export function useDeleteGame(onSuccess: () => Promise<void>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteGame = async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      await gameService.remove(id);
      await onSuccess();
      return true;
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Unable to delete the game.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteGame, isDeleting, error };
}
