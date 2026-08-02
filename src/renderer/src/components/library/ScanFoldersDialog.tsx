import { FolderSearch, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ScanCandidate, ScanStatus } from "../../types/scanner";

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
  useEffect(() => setSelected((scan?.candidates ?? []).filter((candidate) => !candidate.already_imported && !candidate.reason_skipped).map((candidate) => candidate.id)), [scan?.scan_id, scan?.state]);
  if (!scan && !error) return null;
  const summary = scan?.summary ?? { folders_scanned: 0, directories_visited: 0, executables_checked: 0, games_detected: 0, already_imported_games: 0, excluded_items: 0, permission_warnings: 0, successfully_imported_games: 0 };
  const scanning = scan?.state === "scanning";
  const completed = scan?.state === "completed";
  const toggle = (candidate: ScanCandidate) => setSelected((current) => current.includes(candidate.id) ? current.filter((id) => id !== candidate.id) : [...current, candidate.id]);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation">
    <div aria-labelledby="scan-dialog-title" aria-modal="true" className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl" role="dialog">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-cyan-300">Library</p><h2 className="mt-1 text-xl font-semibold" id="scan-dialog-title">{scanning ? "Scanning folders" : completed ? "Review discovered games" : "Folder scan"}</h2></div><button aria-label="Close scan dialog" className="rounded-lg p-2 text-slate-400 hover:bg-white/5" disabled={scanning || isImporting} onClick={onClose} type="button"><X size={18} /></button></div>
      {error && <p className="mt-5 rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
      {scan && <><div className="mt-5 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-cyan-200"><FolderSearch size={18} />{scanning ? "Searching for game executables…" : `Scan ${scan.state}`}</div>{scan.current_path && <p className="mt-2 truncate text-xs text-slate-500" title={scan.current_path}>{scan.current_path}</p>}<div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4"><Stat label="Folders" value={summary.folders_scanned} /><Stat label="Directories" value={summary.directories_visited} /><Stat label="Executables" value={summary.executables_checked} /><Stat label="Detected" value={summary.games_detected} /></div></div>
      {completed && <><p className="mt-5 text-sm text-slate-400">Choose games to add. Already imported games are shown but cannot be selected.</p><div className="mt-3 overflow-hidden rounded-xl border border-white/10">{scan.candidates.length === 0 ? <p className="p-5 text-sm text-slate-400">No eligible game executables were found.</p> : scan.candidates.map((candidate) => <label className="flex cursor-pointer items-start gap-3 border-b border-white/5 p-4 last:border-0 hover:bg-white/[0.03]" key={candidate.id}><input checked={selected.includes(candidate.id)} disabled={candidate.already_imported || Boolean(candidate.reason_skipped)} onChange={() => toggle(candidate)} type="checkbox" /><span className="min-w-0 flex-1"><span className="block font-medium text-slate-100">{candidate.display_name}</span><span className="mt-1 block truncate text-xs text-slate-500" title={candidate.executable_path}>{candidate.executable_path}</span>{candidate.reason_skipped && <span className="mt-1 block text-xs text-amber-300">{candidate.reason_skipped}</span>}</span></label>)}</div><p className="mt-4 text-xs text-slate-500">{summary.folders_scanned} folders scanned · {summary.directories_visited} directories visited · {summary.executables_checked} executables checked · {summary.games_detected} games detected · {summary.already_imported_games} already imported · {summary.excluded_items} excluded · {summary.permission_warnings} permission warnings · {summary.successfully_imported_games} successfully imported</p></>}
      {(scan.state === "cancelled" || scan.state === "failed") && <p className="mt-5 text-sm text-slate-400">{summary?.directories_visited ?? 0} directories were visited before the scan stopped.</p>}
      <div className="mt-6 flex justify-end gap-3">{scanning ? <button className="rounded-lg bg-rose-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-rose-300" onClick={onCancel} type="button">Cancel scan</button> : <><button className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5" disabled={isImporting} onClick={onClose} type="button">Close</button>{completed && <button className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-60" disabled={isImporting || selected.length === 0} onClick={() => void onImport(selected)} type="button">{isImporting ? "Importing…" : `Import selected (${selected.length})`}</button>}</>}</div></>}
    </div></div>;
}

function Stat({ label, value }: { label: string; value: number }): React.JSX.Element { return <div><span className="block text-slate-500">{label}</span><span className="font-semibold text-slate-100">{value}</span></div>; }
