import { useCallback, useEffect, useState } from "react";

type MetadataState = "idle" | "queued" | "fetching" | "success" | "failed";

export function useMetadata() {
  const [states, setStates] = useState<Record<string, MetadataState>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => window.launcher.onMetadataUpdated((status) => {
    setStates((current) => ({ ...current, [status.game_id]: status.metadata_status ?? "idle" }));
  }), []);

  const fetchMetadata = useCallback(async (gameId: string): Promise<boolean> => {
    setError(null);
    try {
      const result = await window.launcher.enqueueMetadata(gameId);
      setStates((current) => ({ ...current, [gameId]: result.state === "pending" ? "queued" : result.state }));
      return true;
    } catch (caught) {
      setStates((current) => ({ ...current, [gameId]: "failed" }));
      setError(caught instanceof Error ? caught.message : "Unable to queue metadata fetching.");
      return false;
    }
  }, []);

  return { error, fetchMetadata, getMetadataState: (gameId: string): MetadataState => states[gameId] ?? "idle" };
}
