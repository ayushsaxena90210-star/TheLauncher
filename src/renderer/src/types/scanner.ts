export type ScanCandidate = {
  id: string;
  display_name: string;
  executable_path: string;
  root_folder: string;
  already_imported: boolean;
  reason_skipped: string | null;
  file_size: number | null;
  modified_at: string | null;
};

export type ScanSummary = {
  folders_scanned: number;
  directories_visited: number;
  executables_checked: number;
  games_detected: number;
  already_imported_games: number;
  excluded_items: number;
  permission_warnings: number;
  successfully_imported_games: number;
};

export type ScanStatus = {
  scan_id: string;
  state: "scanning" | "cancelled" | "completed" | "failed";
  current_path: string | null;
  summary: ScanSummary;
  candidates: ScanCandidate[];
  warnings: string[];
  error: string | null;
};

export type ScanImportResult = { scan_id: string; imported_count: number; skipped_count: number; summary: ScanSummary };
