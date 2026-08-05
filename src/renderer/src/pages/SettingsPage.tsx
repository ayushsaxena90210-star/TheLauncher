import { Archive, CheckCircle2, CircleAlert, Database, FolderPlus, HardDrive, Image, Loader2, MonitorCog, Paintbrush, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { useSettings } from "../hooks/useSettings";
import type { ThemePreference } from "../types/settings";

type SectionId = "appearance" | "library" | "metadata" | "cache" | "launcher";
type Props = { onThemeChange: (theme: ThemePreference) => void };

const navigation: { id: SectionId; label: string; group: string; icon: typeof Paintbrush }[] = [
  { id: "appearance", label: "Appearance", group: "GENERAL", icon: Paintbrush },
  { id: "library", label: "Scan folders", group: "LIBRARY", icon: FolderPlus },
  { id: "metadata", label: "Metadata Provider", group: "DATA", icon: Database },
  { id: "cache", label: "Cache", group: "DATA", icon: Archive },
  { id: "launcher", label: "Desktop", group: "LAUNCHER", icon: MonitorCog },
];

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let result = value / 1024;
  let index = 0;
  while (result >= 1024 && index < units.length - 1) { result /= 1024; index += 1; }
  return `${result.toFixed(result >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
function date(value: string | null): string { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet"; }

export function SettingsPage({ onThemeChange }: Props): React.JSX.Element {
  const { overview, isLoading, error, refresh, setOverview } = useSettings();
  const [section, setSection] = useState<SectionId>("appearance");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (name: string, action: () => Promise<unknown>): Promise<void> => {
    setBusy(name); setActionError(null);
    try { await action(); await refresh(); } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to complete that action."); }
    finally { setBusy(null); }
  };
  const setTheme = async (theme: ThemePreference): Promise<void> => {
    if (!overview) return;
    onThemeChange(theme);
    setOverview({ ...overview, settings: { ...overview.settings, theme } });
    await act("theme", () => window.launcher.updateSettings({ theme }));
  };
  const addFolder = async (): Promise<void> => {
    const result = await window.launcher.pickScanFolders();
    if (!result.cancelled && result.paths[0]) await act("folder", () => window.launcher.addScanRoot(result.paths[0]));
  };
  const rescan = async (): Promise<void> => {
    await act("rescan", async () => {
      const { roots } = await window.launcher.savedScanRoots();
      if (!roots.length) throw new Error("Add at least one scan folder before rescanning.");
      await window.launcher.startScan(roots);
    });
  };

  if (isLoading && !overview) return <div className="settings-loading"><Loader2 className="animate-spin" /> Loading settings…</div>;
  if (!overview) return <section className="settings-error"><CircleAlert size={20} /><div><strong>Settings unavailable</strong><p>{error ?? "The local service did not return settings."}</p><button onClick={() => void refresh()} type="button">Try again</button></div></section>;
  const { cache, metadata } = overview;

  return <section className="settings-page">
    <header className="settings-page__header"><div><p className="eyebrow">LOCAL PREFERENCES</p><h1>Settings</h1><p>Configure how your local library behaves.</p></div></header>
    <div className="settings-status" aria-label="Local service status">
      <span><CheckCircle2 size={15} /> Backend connected</span><span><Database size={15} className={metadata.configured ? "status-good" : "status-muted"} /> {metadata.provider} {metadata.configured ? "ready" : "not configured"}</span><span><HardDrive size={15} /> {overview.library_size} {overview.library_size === 1 ? "game" : "games"}</span><span><Image size={15} /> {bytes(cache.size_bytes)} cache</span>
    </div>
    {actionError && <div className="settings-alert" role="alert">{actionError}</div>}
    <div className="settings-workspace">
      <aside className="settings-nav" aria-label="Settings navigation">
        {navigation.map((item, index) => { const Icon = item.icon; const previous = navigation[index - 1]; const showGroup = !previous || previous.group !== item.group; return <div key={item.id}>{showGroup && <p className="settings-nav__group">{item.group}</p>}<button className={section === item.id ? "is-selected" : ""} onClick={() => setSection(item.id)} type="button"><Icon size={17} />{item.label}</button></div>; })}
      </aside>
      <div className="settings-panel">
        {section === "appearance" && <><SectionTitle title="Appearance" copy="Choose the interface theme. Changes apply immediately." /><div className="setting-card"><p className="setting-card__label">THEME</p><div className="theme-options">{(["light", "dark", "system"] as ThemePreference[]).map((theme) => <button aria-pressed={overview.settings.theme === theme} className={overview.settings.theme === theme ? "is-selected" : ""} disabled={busy === "theme"} key={theme} onClick={() => void setTheme(theme)} type="button"><span className={`theme-swatch theme-swatch--${theme}`} />{theme[0].toUpperCase() + theme.slice(1)}</button>)}</div></div></>}
        {section === "library" && <><SectionTitle title="Library" copy="Save folders that should be available for future local scans." action="Add folder" busy={busy === "folder"} onAction={() => void addFolder()} /><div className="setting-card"><p className="setting-card__label">SCAN FOLDERS</p>{overview.scan_roots.length ? overview.scan_roots.map((root) => <div className="setting-row" key={root.id}><div><strong>{root.path}</strong><small>Included in saved library scans</small></div><button className="button-quiet" disabled={busy === root.id} onClick={() => void act(root.id, () => window.launcher.removeScanRoot(root.id))} type="button">Remove</button></div>) : <Empty label="No saved scan folders" copy="Add a local folder to make future scans faster." action="Add folder" onAction={() => void addFolder()} />}</div><div className="setting-card"><p className="setting-card__label">DEFAULT SCAN BEHAVIOR</p><div className="setting-row"><div><strong>Queue metadata after import</strong><small>When the provider is configured, newly imported games can be enriched automatically.</small></div><button aria-pressed={overview.settings.scan_options.queue_metadata} className={`toggle ${overview.settings.scan_options.queue_metadata ? "is-on" : ""}`} onClick={() => void act("scan-options", () => window.launcher.updateSettings({ scan_options: { queue_metadata: !overview.settings.scan_options.queue_metadata } }))} type="button"><span /></button></div><button className="button-primary" disabled={busy === "rescan"} onClick={() => void rescan()} type="button"><RefreshCw size={16} className={busy === "rescan" ? "animate-spin" : ""} />Rescan saved folders</button></div></>}
        {section === "metadata" && <><SectionTitle title="Metadata Provider" copy="Metadata remains optional and local-library features work without it." /><div className="setting-card"><p className="setting-card__label">ACTIVE PROVIDER</p><div className="setting-row"><div><strong>{metadata.provider}</strong><small>{metadata.configured ? `Configured · ${metadata.queue_size} queued` : "Not configured — add local Twitch credentials to enable IGDB."}</small></div><span className={`status-pill ${metadata.configured ? "is-good" : ""}`}>{metadata.configured ? "Ready" : "Unavailable"}</span></div><div className="setting-row"><div><strong>Last metadata refresh</strong><small>{date(metadata.last_refresh_at)}</small></div><button className="button-quiet" disabled={!metadata.configured || busy === "metadata"} onClick={() => void act("metadata", () => window.launcher.refreshAllMetadata())} type="button">Refresh library</button></div></div></>}
        {section === "cache" && <><SectionTitle title="Cache" copy="Artwork is stored locally and can be removed without touching game installations." /><div className="setting-card"><p className="setting-card__label">ARTWORK CACHE</p><div className="stats-grid"><Stat label="Cache size" value={bytes(cache.size_bytes)} /><Stat label="Cached artwork" value={`${cache.artwork_count} files`} /><Stat label="Last metadata refresh" value={date(cache.last_metadata_refresh_at)} /><Stat label="Last cleanup" value={date(cache.last_cleanup_at)} /></div><div className="cache-location">Location: {cache.location}</div><div className="button-row"><button className="button-quiet" disabled={busy === "rebuild"} onClick={() => void act("rebuild", () => window.launcher.rebuildCache())} type="button">Rebuild cache</button><button className="button-danger" disabled={busy === "clear"} onClick={() => { if (window.confirm("Clear all locally cached artwork? Game installations will not be changed.")) void act("clear", () => window.launcher.clearCache()); }} type="button"><Trash2 size={16} />Clear cache</button></div></div></>}
        {section === "launcher" && <><SectionTitle title="Desktop" copy="Desktop preferences will be added in a future in-scope milestone." /><div className="setting-card"><p className="setting-card__label">WINDOW BEHAVIOR</p><Empty label="No desktop preferences yet" copy="Startup and window behavior controls are reserved here without changing current launcher behavior." /></div></>}
      </div>
    </div>
  </section>;
}

function SectionTitle({ title, copy, action, busy, onAction }: { title: string; copy: string; action?: string; busy?: boolean; onAction?: () => void }) { return <header className="settings-section-title"><div><h2>{title}</h2><p>{copy}</p></div>{action && <button className="button-primary" disabled={busy} onClick={onAction} type="button"><FolderPlus size={16} />{action}</button>}</header>; }
function Empty({ label, copy, action, onAction }: { label: string; copy: string; action?: string; onAction?: () => void }) { return <div className="settings-empty"><Archive size={20} /><div><strong>{label}</strong><p>{copy}</p>{action && <button className="button-link" onClick={onAction} type="button">{action}</button>}</div></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
