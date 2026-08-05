/**
 * Typed HTTP client for Electron main → local FastAPI communication.
 *
 * This is intentionally separate from the renderer's client.ts because
 * the main process uses Node's global fetch, not a browser fetch, and
 * only needs the subset of endpoints required for game launching.
 *
 * TODO: Reducing the two HTTP round trips (getGame + createSession) into
 * a single "launch-and-start-session" endpoint is a future optimization.
 */

const BACKEND_BASE_URL = "http://127.0.0.1:8765/api/v1";

export type GameRecord = {
  id: string;
  title: string;
  executable_path: string;
  install_path: string | null;
  cover_path: string | null;
  description: string | null;
  release_date: string | null;
  igdb_id: number | null;
  metadata_source: string | null;
  metadata_confidence: number | null;
  genres: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionRecord = {
  id: string;
  game_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

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

export type ScanImportResult = {
  scan_id: string;
  imported_count: number;
  skipped_count: number;
  summary: ScanSummary;
};

export type MetadataEnqueueResult = {
  game_id: string;
  state: "queued" | "pending";
  message: string | null;
};

export type MetadataGameStatus = {
  game_id: string;
  metadata_status: "queued" | "fetching" | "success" | "failed" | null;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: { message?: string } | string };
      const detail = body?.detail;
      if (typeof detail === "object" && detail?.message) message = detail.message;
      else if (typeof detail === "string") message = detail;
    } catch {
      // Non-JSON error response — keep the generic message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const backendClient = {
  getGame: (gameId: string): Promise<GameRecord> =>
    request<GameRecord>(`/games/${gameId}`),

  createSession: (gameId: string): Promise<SessionRecord> =>
    request<SessionRecord>("/sessions", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId }),
    }),

  completeSession: (
    sessionId: string,
    endedAt: string,
    durationSeconds: number
  ): Promise<SessionRecord> =>
    request<SessionRecord>(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ ended_at: endedAt, duration_seconds: durationSeconds }),
    }),

  startScan: (roots: string[]): Promise<ScanStatus> =>
    request<ScanStatus>("/scanner/scans", { method: "POST", body: JSON.stringify({ roots }) }),

  getScan: (scanId: string): Promise<ScanStatus> => request<ScanStatus>(`/scanner/scans/${scanId}`),

  cancelScan: (scanId: string): Promise<ScanStatus> =>
    request<ScanStatus>(`/scanner/scans/${scanId}/cancel`, { method: "POST" }),

  importScanCandidates: (scanId: string, candidateIds: string[]): Promise<ScanImportResult> =>
    request<ScanImportResult>(`/scanner/scans/${scanId}/imports`, {
      method: "POST",
      body: JSON.stringify({ candidate_ids: candidateIds }),
    }),

  enqueueMetadata: (gameId: string): Promise<MetadataEnqueueResult> =>
    request<MetadataEnqueueResult>(`/metadata/games/${gameId}/enqueue`, { method: "POST" }),
  refreshMetadata: (gameId: string): Promise<MetadataEnqueueResult> =>
    request<MetadataEnqueueResult>(`/metadata/games/${gameId}/refresh`, { method: "POST" }),

  getMetadataGameStatus: (gameId: string): Promise<MetadataGameStatus> =>
    request<MetadataGameStatus>(`/metadata/games/${gameId}/status`),
};
