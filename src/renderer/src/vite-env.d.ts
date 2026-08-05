/// <reference types="vite/client" />

type BackendHealth = {
  status: "ok" | "unavailable";
  service: "backend";
  detail?: string;
};

type LaunchResult =
  | { success: true; sessionId: string }
  | { success: false; error: string };

type GameExitedEvent = {
  gameId: string;
  sessionId: string;
  durationSeconds: number;
};

type OpenFileLocationResult =
  | { success: true }
  | { success: false; error: string };

type ScanCandidate = { id: string; display_name: string; executable_path: string; root_folder: string; already_imported: boolean; reason_skipped: string | null; file_size: number | null; modified_at: string | null };
type ScanSummary = { folders_scanned: number; directories_visited: number; executables_checked: number; games_detected: number; already_imported_games: number; excluded_items: number; permission_warnings: number; successfully_imported_games: number };
type ScanStatus = { scan_id: string; state: "scanning" | "cancelled" | "completed" | "failed"; current_path: string | null; summary: ScanSummary; candidates: ScanCandidate[]; warnings: string[]; error: string | null };
type ScanImportResult = { scan_id: string; imported_count: number; skipped_count: number; summary: ScanSummary };
type MetadataEnqueueResult = { game_id: string; state: "queued" | "pending"; message: string | null };
type MetadataGameStatus = { game_id: string; metadata_status: "queued" | "fetching" | "success" | "failed" | null };
type ThemePreference = "light" | "dark" | "system";
type AccentColor = "cyan" | "indigo" | "violet" | "emerald" | "amber" | "rose";
type ScanRoot = { id: string; path: string; enabled: boolean; created_at: string };
type CacheStatus = { location: string; size_bytes: number; artwork_count: number; last_metadata_refresh_at: string | null; last_cleanup_at: string | null };
type AppSettings = { theme: ThemePreference; scan_options: { queue_metadata: boolean }; accent_color: AccentColor; reduced_motion: boolean };
type SettingsOverview = { settings: AppSettings; scan_roots: ScanRoot[]; library_size: number; metadata: { provider: string; configured: boolean; queue_size: number; last_refresh_at: string | null }; cache: CacheStatus };
type CacheOperation = CacheStatus & { removed_count: number; removed_bytes: number };

declare global {
  interface Window {
    launcher: {
      getBackendHealth: () => Promise<BackendHealth>;
      launchGame: (gameId: string) => Promise<LaunchResult>;
      onGameExited: (callback: (event: GameExitedEvent) => void) => () => void;
      openFileLocation: (gameId: string) => Promise<OpenFileLocationResult>;
      pickScanFolders: () => Promise<{ cancelled: boolean; paths: string[] }>;
      startScan: (roots: string[]) => Promise<ScanStatus>;
      cancelScan: (scanId: string) => Promise<ScanStatus>;
      importScanCandidates: (scanId: string, candidateIds: string[]) => Promise<ScanImportResult>;
      onScanProgress: (callback: (scan: ScanStatus) => void) => () => void;
      onScanCompleted: (callback: (scan: ScanStatus) => void) => () => void;
      onScanCancelled: (callback: (scan: ScanStatus) => void) => () => void;
      onScanFailed: (callback: (scan: ScanStatus) => void) => () => void;
      enqueueMetadata: (gameId: string) => Promise<MetadataEnqueueResult>;
      refreshMetadata: (gameId: string) => Promise<MetadataEnqueueResult>;
      onMetadataUpdated: (callback: (status: MetadataGameStatus) => void) => () => void;
      getSettingsOverview: () => Promise<SettingsOverview>;
      updateSettings: (payload: Partial<SettingsOverview["settings"]>) => Promise<SettingsOverview["settings"]>;
      addScanRoot: (path: string) => Promise<ScanRoot>;
      removeScanRoot: (rootId: string) => Promise<void>;
      savedScanRoots: () => Promise<{ roots: string[] }>;
      clearCache: () => Promise<CacheOperation>;
      rebuildCache: () => Promise<CacheOperation>;
      refreshAllMetadata: () => Promise<{ queued_count: number }>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
    };
  }
}

export {};
