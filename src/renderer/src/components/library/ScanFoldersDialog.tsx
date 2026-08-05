import { FolderSearch } from "lucide-react";
import { useEffect, useState } from "react";

import type { ScanCandidate, ScanStatus } from "../../types/scanner";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

type Props = {
  scan: ScanStatus | null;
  error: string | null;
  isImporting: boolean;
  onCancel: () => void;
  onClose: () => void;
  onImport: (candidateIds: string[]) => Promise<void>;
};

export function ScanFoldersDialog({ scan, error, isImporting, onCancel, onClose, onImport }: Props): React.JSX.Element | null {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(
      (scan?.candidates ?? [])
        .filter((c) => !c.already_imported && !c.reason_skipped)
        .map((c) => c.id),
    );
  }, [scan?.scan_id, scan?.state]);

  if (!scan && !error) return null;

  const summary = scan?.summary ?? {
    folders_scanned: 0, directories_visited: 0, executables_checked: 0,
    games_detected: 0, already_imported_games: 0, excluded_items: 0,
    permission_warnings: 0, successfully_imported_games: 0,
  };

  const scanning  = scan?.state === "scanning";
  const completed = scan?.state === "completed";

  const toggle = (c: ScanCandidate) =>
    setSelected((cur) => cur.includes(c.id) ? cur.filter((id) => id !== c.id) : [...cur, c.id]);

  const dialogTitle = scanning ? "Scanning folders" : completed ? "Review discovered games" : "Folder scan";

  return (
    <Dialog
      closeDisabled={scanning || isImporting}
      isOpen={Boolean(scan) || Boolean(error)}
      labelledBy="scan-dialog-title"
      maxWidth="720px"
      onClose={onClose}
    >
      <div style={{ marginBottom: 4 }}>
        <p className="page-eyebrow" style={{ marginBottom: 4 }}>Library</p>
        <h2 id="scan-dialog-title" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{dialogTitle}</h2>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            margin: "16px 0 0", padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger-bg)", color: "var(--color-danger)",
            border: "1px solid var(--color-danger-border)", fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {scan && (
        <>
          {/* Progress box */}
          <div
            style={{
              marginTop: 20, padding: 16,
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border-medium)",
              background: "rgba(0,0,0,0.14)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-accent)", fontWeight: 500 }}>
              <FolderSearch aria-hidden="true" size={17} />
              {scanning ? "Searching for game executables…" : `Scan ${scan.state}`}
            </div>
            {scan.current_path && (
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={scan.current_path}>
                {scan.current_path}
              </p>
            )}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {([
                ["Folders",     summary.folders_scanned],
                ["Directories", summary.directories_visited],
                ["Executables", summary.executables_checked],
                ["Detected",    summary.games_detected],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label}>
                  <span style={{ display: "block", fontSize: 10, color: "var(--color-text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                  <span style={{ display: "block", marginTop: 4, fontWeight: 600, fontSize: 14 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Candidates list */}
          {completed && (
            <>
              <p style={{ margin: "16px 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                Choose games to add. Already imported games are shown but cannot be selected.
              </p>
              <div
                style={{
                  maxHeight: 320, overflowY: "auto",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--color-border-medium)",
                  background: "var(--color-surface-2)",
                }}
              >
                {scan.candidates.length === 0 ? (
                  <p style={{ padding: 20, fontSize: 13, color: "var(--color-text-faint)", textAlign: "center" }}>
                    No eligible game executables were found.
                  </p>
                ) : (
                  scan.candidates.map((candidate, i) => (
                    <label
                      key={candidate.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                        cursor: candidate.already_imported || candidate.reason_skipped ? "default" : "pointer",
                        borderTop: i > 0 ? "1px solid var(--color-border-subtle)" : undefined,
                      }}
                    >
                      <input
                        checked={selected.includes(candidate.id)}
                        disabled={candidate.already_imported || Boolean(candidate.reason_skipped)}
                        onChange={() => toggle(candidate)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                        type="checkbox"
                      />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontWeight: 500, fontSize: 13 }}>{candidate.display_name}</span>
                        <span
                          style={{ display: "block", marginTop: 2, fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={candidate.executable_path}
                        >
                          {candidate.executable_path}
                        </span>
                        {candidate.already_imported && (
                          <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "var(--color-text-faint)" }}>Already imported</span>
                        )}
                        {candidate.reason_skipped && (
                          <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "var(--color-warning)" }}>{candidate.reason_skipped}</span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-faint)" }}>
                {summary.folders_scanned} folders · {summary.directories_visited} directories · {summary.executables_checked} executables · {summary.games_detected} detected · {summary.already_imported_games} already imported · {summary.excluded_items} excluded · {summary.permission_warnings} warnings · {summary.successfully_imported_games} imported
              </p>
            </>
          )}

          {(scan.state === "cancelled" || scan.state === "failed") && (
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
              {summary.directories_visited} directories were visited before the scan stopped.
            </p>
          )}
        </>
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        {scanning ? (
          <Button onClick={onCancel} variant="danger">Cancel scan</Button>
        ) : (
          <>
            <Button disabled={isImporting} onClick={onClose} variant="ghost">Close</Button>
            {completed && (
              <Button
                disabled={isImporting || selected.length === 0}
                isLoading={isImporting}
                onClick={() => void onImport(selected)}
                variant="primary"
              >
                {isImporting ? "Importing…" : `Import selected (${selected.length})`}
              </Button>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
