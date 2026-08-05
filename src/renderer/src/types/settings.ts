export type ThemePreference = "light" | "dark" | "system";
export type AccentColor = "cyan" | "indigo" | "violet" | "emerald" | "amber" | "rose";
export type ScanRoot = { id: string; path: string; enabled: boolean; created_at: string };
export type CacheStatus = { location: string; size_bytes: number; artwork_count: number; last_metadata_refresh_at: string | null; last_cleanup_at: string | null };
export type AppSettings = {
  theme: ThemePreference;
  scan_options: { queue_metadata: boolean };
  accent_color: AccentColor;
  reduced_motion: boolean;
};
export type SettingsOverview = {
  settings: AppSettings;
  scan_roots: ScanRoot[];
  library_size: number;
  metadata: { provider: string; configured: boolean; queue_size: number; last_refresh_at: string | null };
  cache: CacheStatus;
};
