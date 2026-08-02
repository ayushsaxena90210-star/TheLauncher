import { useCallback, useEffect, useRef, useState } from "react";

type LaunchState = "idle" | "launching" | "running" | "error";

type GameLaunchState = {
  state: LaunchState;
  error: string | null;
};

const IDLE_STATE: GameLaunchState = { state: "idle", error: null };
const ERROR_DISPLAY_MS = 5000;

export function useLaunchGame() {
  const [launchStates, setLaunchStates] = useState<Record<string, GameLaunchState>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = window.launcher.onGameExited((event) => {
      if (!mountedRef.current) return;
      setLaunchStates((prev) => {
        const next = { ...prev };
        delete next[event.gameId];
        return next;
      });
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const launchGame = useCallback(async (gameId: string): Promise<Awaited<ReturnType<typeof window.launcher.launchGame>> | undefined> => {
    setLaunchStates((prev) => ({
      ...prev,
      [gameId]: { state: "launching", error: null },
    }));

    const result = await window.launcher.launchGame(gameId);
    if (!mountedRef.current) return undefined;

    if (result.success) {
      setLaunchStates((prev) => ({
        ...prev,
        [gameId]: { state: "running", error: null },
      }));
    } else {
      setLaunchStates((prev) => ({
        ...prev,
        [gameId]: { state: "error", error: result.error },
      }));

      // Auto-clear error state so the user can retry
      setTimeout(() => {
        if (!mountedRef.current) return;
        setLaunchStates((prev) => {
          const current = prev[gameId];
          if (current?.state !== "error") return prev;
          const next = { ...prev };
          delete next[gameId];
          return next;
        });
      }, ERROR_DISPLAY_MS);
    }

    return result;
  }, []);

  const getLaunchState = useCallback(
    (gameId: string): GameLaunchState => launchStates[gameId] ?? IDLE_STATE,
    [launchStates]
  );

  return { launchGame, getLaunchState };
}
