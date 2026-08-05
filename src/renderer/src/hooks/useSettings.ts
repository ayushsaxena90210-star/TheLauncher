import { useCallback, useEffect, useState } from "react";
import type { SettingsOverview } from "../types/settings";

export function useSettings() {
  const [overview, setOverview] = useState<SettingsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOverview(await window.launcher.getSettingsOverview() as unknown as SettingsOverview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { overview, isLoading, error, refresh, setOverview };
}
