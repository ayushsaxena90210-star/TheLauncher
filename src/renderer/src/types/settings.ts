export type ThemePreference = "light" | "dark" | "system";
export type ScanRoot = { id: string; path: string; enabled: boolean; created_at: string };
export type CacheStatus = { location: string; size_bytes: number; artwork_count: number; last_metadata_refresh_at: string | null; last_cleanup_at: string | null };
export type SettingsOverview = { settings: { theme: ThemePreference; scan_options: { queue_metadata: boolean } }; scan_roots: ScanRoot[]; library_size: number; metadata: { provider: string; configured: boolean; queue_size: number; last_refresh_at: string | null }; cache: CacheStatus };
