import { useCallback, useEffect, useState } from "react";

import type { ScanImportResult, ScanStatus } from "../types/scanner";

export function useFolderScanner() {
  const [scan, setScan] = useState<ScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const update = (nextScan: ScanStatus) => setScan(nextScan);
    const failed = (nextScan: ScanStatus) => { setScan(nextScan); setError(nextScan.error ?? "Folder scan failed."); };
    const unsubscribers = [window.launcher.onScanProgress(update), window.launcher.onScanCompleted(update), window.launcher.onScanCancelled(update), window.launcher.onScanFailed(failed)];
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    const selection = await window.launcher.pickScanFolders();
    if (selection.cancelled || selection.paths.length === 0) return false;
    try {
      setScan(await window.launcher.startScan(selection.paths));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start folder scan.");
      return false;
    }
  }, []);

  const cancel = useCallback(async () => {
    if (scan?.state === "scanning") await window.launcher.cancelScan(scan.scan_id);
  }, [scan]);

  const importSelected = useCallback(async (candidateIds: string[]): Promise<ScanImportResult | null> => {
    if (!scan) return null;
    setIsImporting(true);
    setError(null);
    try {
      const result = await window.launcher.importScanCandidates(scan.scan_id, candidateIds);
      setScan((current) => current && current.scan_id === result.scan_id ? { ...current, summary: result.summary } : current);
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to import selected games.");
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [scan]);

  return { scan, error, isImporting, start, cancel, importSelected, dismiss: () => { setScan(null); setError(null); } };
}
