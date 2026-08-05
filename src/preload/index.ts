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
export type ThemePreference = "light" | "dark" | "system";
export type AccentColor = "cyan" | "indigo" | "violet" | "emerald" | "amber" | "rose";
export type ScanRoot = { id: string; path: string; enabled: boolean; created_at: string };
export type CacheStatus = { location: string; size_bytes: number; artwork_count: number; last_metadata_refresh_at: string | null; last_cleanup_at: string | null };
export type AppSettings = { theme: ThemePreference; scan_options: { queue_metadata: boolean }; accent_color: AccentColor; reduced_motion: boolean };
export type SettingsOverview = { settings: AppSettings; scan_roots: ScanRoot[]; library_size: number; metadata: { provider: string; configured: boolean; queue_size: number; last_refresh_at: string | null }; cache: CacheStatus };
export type CacheOperation = CacheStatus & { removed_count: number; removed_bytes: number };

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
  refreshMetadata: (gameId: string): Promise<MetadataEnqueueResult> => ipcRenderer.invoke("metadata:refresh", gameId),
  onMetadataUpdated: (callback: (status: MetadataGameStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: MetadataGameStatus): void => callback(data);
    ipcRenderer.on("metadata:updated", handler);
    return () => ipcRenderer.removeListener("metadata:updated", handler);
  },
  getSettingsOverview: (): Promise<SettingsOverview> => ipcRenderer.invoke("settings:get-overview"),
  updateSettings: (payload: Partial<SettingsOverview["settings"]>): Promise<SettingsOverview["settings"]> => ipcRenderer.invoke("settings:update", payload),
  addScanRoot: (path: string): Promise<ScanRoot> => ipcRenderer.invoke("settings:add-scan-root", path),
  removeScanRoot: (rootId: string): Promise<void> => ipcRenderer.invoke("settings:remove-scan-root", rootId),
  savedScanRoots: (): Promise<{ roots: string[] }> => ipcRenderer.invoke("settings:saved-scan-roots"),
  clearCache: (): Promise<CacheOperation> => ipcRenderer.invoke("settings:clear-cache"),
  rebuildCache: (): Promise<CacheOperation> => ipcRenderer.invoke("settings:rebuild-cache"),
  refreshAllMetadata: (): Promise<{ queued_count: number }> => ipcRenderer.invoke("settings:refresh-metadata"),
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
  toggleMaximizeWindow: (): Promise<boolean> => ipcRenderer.invoke("window:toggle-maximize"),
  closeWindow: (): Promise<void> => ipcRenderer.invoke("window:close"),
};

contextBridge.exposeInMainWorld("launcher", launcherApi);
