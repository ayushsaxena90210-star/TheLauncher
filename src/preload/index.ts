import { contextBridge, ipcRenderer } from "electron";

export type BackendHealth = {
  status: "ok" | "unavailable";
  service: "backend";
  detail?: string;
};

export type LaunchResult =
  | { success: true; sessionId: string }
  | { success: false; error: string };

export type GameExitedEvent = {
  gameId: string;
  sessionId: string;
  durationSeconds: number;
};

export type OpenFileLocationResult =
  | { success: true }
  | { success: false; error: string };

export type ScanCandidate = {
  id: string; display_name: string; executable_path: string; root_folder: string;
  already_imported: boolean; reason_skipped: string | null; file_size: number | null; modified_at: string | null;
};
export type ScanSummary = {
  folders_scanned: number; directories_visited: number; executables_checked: number; games_detected: number;
  already_imported_games: number; excluded_items: number; permission_warnings: number; successfully_imported_games: number;
};
export type ScanStatus = { scan_id: string; state: "scanning" | "cancelled" | "completed" | "failed"; current_path: string | null; summary: ScanSummary; candidates: ScanCandidate[]; warnings: string[]; error: string | null };
export type ScanImportResult = { scan_id: string; imported_count: number; skipped_count: number; summary: ScanSummary };
export type MetadataEnqueueResult = { game_id: string; state: "queued" | "pending"; message: string | null };
export type MetadataGameStatus = { game_id: string; metadata_status: "queued" | "fetching" | "success" | "failed" | null };

function subscribeScanEvent(channel: string, callback: (scan: ScanStatus) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, scan: ScanStatus): void => callback(scan);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const launcherApi = {
  getBackendHealth: (): Promise<BackendHealth> => ipcRenderer.invoke("backend:get-health"),

  launchGame: (gameId: string): Promise<LaunchResult> =>
    ipcRenderer.invoke("game:launch", gameId),

  onGameExited: (callback: (event: GameExitedEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: GameExitedEvent): void => {
      callback(data);
    };
    ipcRenderer.on("game:exited", handler);
    return () => {
      ipcRenderer.removeListener("game:exited", handler);
    };
  },

  openFileLocation: (gameId: string): Promise<OpenFileLocationResult> =>
    ipcRenderer.invoke("game:open-file-location", gameId),

  pickScanFolders: (): Promise<{ cancelled: boolean; paths: string[] }> => ipcRenderer.invoke("scanner:pick-folders"),
  startScan: (roots: string[]): Promise<ScanStatus> => ipcRenderer.invoke("scanner:start", roots),
  cancelScan: (scanId: string): Promise<ScanStatus> => ipcRenderer.invoke("scanner:cancel", scanId),
  importScanCandidates: (scanId: string, candidateIds: string[]): Promise<ScanImportResult> => ipcRenderer.invoke("scanner:import", scanId, candidateIds),
  onScanProgress: (callback: (scan: ScanStatus) => void): (() => void) => subscribeScanEvent("scanner:progress", callback),
  onScanCompleted: (callback: (scan: ScanStatus) => void): (() => void) => subscribeScanEvent("scanner:completed", callback),
  onScanCancelled: (callback: (scan: ScanStatus) => void): (() => void) => subscribeScanEvent("scanner:cancelled", callback),
  onScanFailed: (callback: (scan: ScanStatus) => void): (() => void) => subscribeScanEvent("scanner:failed", callback),
  enqueueMetadata: (gameId: string): Promise<MetadataEnqueueResult> => ipcRenderer.invoke("metadata:enqueue", gameId),
  onMetadataUpdated: (callback: (status: MetadataGameStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: MetadataGameStatus): void => callback(data);
    ipcRenderer.on("metadata:updated", handler);
    return () => ipcRenderer.removeListener("metadata:updated", handler);
  },
};

contextBridge.exposeInMainWorld("launcher", launcherApi);
