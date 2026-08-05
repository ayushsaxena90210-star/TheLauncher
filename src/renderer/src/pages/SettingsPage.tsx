import {
  Archive, CheckCircle2, CircleAlert, Database, FolderPlus,
  HardDrive, Image, Loader2, MonitorCog, Monitor, Moon, Paintbrush, RefreshCw, Sun, Trash2,
} from "lucide-react";
import { useState } from "react";

import { ScanFoldersDialog } from "../components/library/ScanFoldersDialog";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { useFolderScanner } from "../hooks/useFolderScanner";
import { useSettings } from "../hooks/useSettings";
import type { AccentColor, ThemePreference } from "../types/settings";

type SectionId = "appearance" | "library" | "metadata" | "cache" | "launcher";

type Props = {
  onThemeChange: (theme: ThemePreference) => void;
  onAccentChange: (accent: AccentColor) => void;
  onReducedMotionChange: (value: boolean) => void;
};

const NAV: { id: SectionId; label: string; group: string; icon: typeof Paintbrush }[] = [
  { id: "appearance", label: "Appearance",      group: "GENERAL",  icon: Paintbrush },
  { id: "library",    label: "Scan folders",    group: "LIBRARY",  icon: FolderPlus },
  { id: "metadata",   label: "Metadata",        group: "DATA",     icon: Database   },
  { id: "cache",      label: "Cache",           group: "DATA",     icon: Archive    },
  { id: "launcher",   label: "Desktop",         group: "LAUNCHER", icon: MonitorCog },
];

const ACCENT_OPTIONS: { value: AccentColor; label: string; hsl: string }[] = [
  { value: "cyan",    label: "Cyan",    hsl: "hsl(186 94% 73%)" },
  { value: "indigo",  label: "Indigo",  hsl: "hsl(239 84% 67%)" },
  { value: "violet",  label: "Violet",  hsl: "hsl(262 83% 70%)" },
  { value: "emerald", label: "Emerald", hsl: "hsl(158 64% 52%)" },
  { value: "amber",   label: "Amber",   hsl: "hsl(43 96% 56%)"  },
  { value: "rose",    label: "Rose",    hsl: "hsl(347 77% 66%)" },
];

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let result = value / 1024;
  let index = 0;
  while (result >= 1024 && index < units.length - 1) { result /= 1024; index += 1; }
  return `${result.toFixed(result >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function fmtDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not yet";
}

export function SettingsPage({ onThemeChange, onAccentChange, onReducedMotionChange }: Props): React.JSX.Element {
  const { overview, isLoading, error, refresh, setOverview } = useSettings();
  const [section, setSection] = useState<SectionId>("appearance");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const scanner = useFolderScanner();

  const act = async (name: string, action: () => Promise<unknown>): Promise<void> => {
    setBusy(name); setActionError(null);
    try { await action(); await refresh(); }
    catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to complete that action."); }
    finally { setBusy(null); }
  };

  const setTheme = async (theme: ThemePreference): Promise<void> => {
    if (!overview) return;
    onThemeChange(theme);
    setOverview({ ...overview, settings: { ...overview.settings, theme } });
    await act("theme", () => window.launcher.updateSettings({ theme }));
  };

  const setAccent = async (accent: AccentColor): Promise<void> => {
    if (!overview) return;
    onAccentChange(accent);
    setOverview({ ...overview, settings: { ...overview.settings, accent_color: accent } });
    await act("accent", () => window.launcher.updateSettings({ accent_color: accent }));
  };

  const setReducedMotion = async (value: boolean): Promise<void> => {
    if (!overview) return;
    onReducedMotionChange(value);
    setOverview({ ...overview, settings: { ...overview.settings, reduced_motion: value } });
    await act("reduced_motion", () => window.launcher.updateSettings({ reduced_motion: value }));
  };

  const addFolder = async (): Promise<void> => {
    const result = await window.launcher.pickScanFolders();
    if (!result.cancelled && result.paths[0]) {
      await act("folder", () => window.launcher.addScanRoot(result.paths[0]));
    }
  };

  const rescan = async (): Promise<void> => {
    const { roots } = await window.launcher.savedScanRoots();
    if (!roots.length) {
      setActionError("Add at least one scan folder before rescanning.");
      return;
    }
    // startScan triggers the IPC scanner which fires events picked up by useFolderScanner
    await window.launcher.startScan(roots);
  };

  const importScannedGames = async (candidateIds: string[]): Promise<void> => {
    await scanner.importSelected(candidateIds);
  };

  if (isLoading && !overview) {
    return (
      <div className="settings-loading" role="status" aria-label="Loading settings">
        <Loader2 aria-hidden="true" className="animate-spin" />
        Loading settings…
      </div>
    );
  }

  if (!overview) {
    return (
      <ErrorState
        title="Settings unavailable"
        message={error ?? "The local service did not return settings."}
        onRetry={() => void refresh()}
      />
    );
  }

  const { cache, metadata } = overview;
  const currentTheme = overview.settings.theme;
  const currentAccent = (overview.settings.accent_color as AccentColor | undefined) ?? "cyan";
  const currentReducedMotion = Boolean(overview.settings.reduced_motion);

  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <div>
          <p className="eyebrow">LOCAL PREFERENCES</p>
          <h1 style={{ margin: "4px 0 8px", fontSize: 30, letterSpacing: "-0.03em" }}>Settings</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>Configure how your local library behaves.</p>
        </div>
      </header>

      {/* Status row */}
      <div className="settings-status" aria-label="Local service status">
        <span className="settings-status-chip">
          <CheckCircle2 aria-hidden="true" size={14} style={{ color: "var(--color-success)" }} />
          Backend connected
        </span>
        <span className="settings-status-chip">
          <Database
            aria-hidden="true"
            size={14}
            style={{ color: metadata.configured ? "var(--color-success)" : "var(--color-warning)" }}
          />
          {metadata.provider} {metadata.configured ? "ready" : "not configured"}
        </span>
        <span className="settings-status-chip">
          <HardDrive aria-hidden="true" size={14} />
          {overview.library_size} {overview.library_size === 1 ? "game" : "games"}
        </span>
        <span className="settings-status-chip">
          <Image aria-hidden="true" size={14} />
          {bytes(cache.size_bytes)} cache
        </span>
      </div>

      {actionError && (
        <ErrorState compact message={actionError} style={{ marginBottom: 16 }} />
      )}

      <div className="settings-workspace">
        {/* ── Sidebar navigation ── */}
        <aside className="settings-nav" aria-label="Settings navigation">
          {NAV.map((item, index) => {
            const Icon = item.icon;
            const prev = NAV[index - 1];
            const showGroup = !prev || prev.group !== item.group;
            return (
              <div key={item.id}>
                {showGroup && <p className="settings-nav__group-label">{item.group}</p>}
                <button
                  className={`settings-nav__item ${section === item.id ? "is-selected" : ""}`}
                  onClick={() => setSection(item.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={16} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </aside>

        {/* ── Panel ── */}
        <div className="settings-panel">

          {/* APPEARANCE */}
          {section === "appearance" && (
            <>
              <SectionHeader title="Appearance" copy="Choose the interface theme and accent colour. Changes apply immediately." />

              <div className="setting-card">
                <p className="setting-card__label">THEME</p>
                <div className="theme-options">
                  {([
                    { value: "light",  label: "Light",  Icon: Sun     },
                    { value: "dark",   label: "Dark",   Icon: Moon    },
                    { value: "system", label: "System", Icon: Monitor },
                  ] as { value: ThemePreference; label: string; Icon: typeof Sun }[]).map(({ value, label, Icon }) => (
                    <button
                      aria-pressed={currentTheme === value}
                      className={`theme-option ${currentTheme === value ? "is-selected" : ""}`}
                      disabled={busy === "theme"}
                      key={value}
                      onClick={() => void setTheme(value)}
                      type="button"
                    >
                      <span className={`theme-swatch theme-swatch--${value}`} />
                      <Icon aria-hidden="true" size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-card">
                <p className="setting-card__label">ACCENT COLOUR</p>
                <div className="accent-options">
                  {ACCENT_OPTIONS.map(({ value, label, hsl }) => (
                    <button
                      aria-pressed={currentAccent === value}
                      className={`accent-option ${currentAccent === value ? "is-selected" : ""}`}
                      disabled={busy === "accent"}
                      key={value}
                      onClick={() => void setAccent(value)}
                      type="button"
                    >
                      <span className="accent-swatch" style={{ background: hsl }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-card">
                <p className="setting-card__label">ACCESSIBILITY</p>
                <div className="setting-row">
                  <div className="setting-row-text">
                    <strong>Reduce motion</strong>
                    <small>Disables animations and transitions throughout the interface.</small>
                  </div>
                  <button
                    aria-pressed={currentReducedMotion}
                    className={`ds-toggle ${currentReducedMotion ? "is-on" : ""}`}
                    disabled={busy === "reduced_motion"}
                    onClick={() => void setReducedMotion(!currentReducedMotion)}
                    type="button"
                  >
                    <span className="ds-toggle__thumb" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* LIBRARY / SCAN FOLDERS */}
          {section === "library" && (
            <>
              <SectionHeader
                title="Library"
                copy="Save folders that should be available for future local scans."
                action={<Button isLoading={busy === "folder"} onClick={() => void addFolder()} variant="primary" size="sm"><FolderPlus size={15} />Add folder</Button>}
              />

              <div className="setting-card">
                <p className="setting-card__label">SCAN FOLDERS</p>
                {overview.scan_roots.length > 0 ? overview.scan_roots.map((root) => (
                  <div className="setting-row" key={root.id}>
                    <div className="setting-row-text">
                      <strong>{root.path}</strong>
                      <small>Included in saved library scans</small>
                    </div>
                    <Button
                      disabled={busy === root.id}
                      isLoading={busy === root.id}
                      onClick={() => void act(root.id, () => window.launcher.removeScanRoot(root.id))}
                      size="sm"
                      variant="quiet"
                    >
                      Remove
                    </Button>
                  </div>
                )) : (
                  <div className="settings-empty">
                    <Archive aria-hidden="true" size={20} />
                    <div>
                      <strong>No saved scan folders</strong>
                      <p>Add a local folder to make future scans faster.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="setting-card">
                <p className="setting-card__label">DEFAULT SCAN BEHAVIOR</p>
                <div className="setting-row">
                  <div className="setting-row-text">
                    <strong>Queue metadata after import</strong>
                    <small>When the provider is configured, newly imported games can be enriched automatically.</small>
                  </div>
                  <button
                    aria-pressed={overview.settings.scan_options.queue_metadata}
                    className={`ds-toggle ${overview.settings.scan_options.queue_metadata ? "is-on" : ""}`}
                    onClick={() =>
                      void act("scan-options", () =>
                        window.launcher.updateSettings({
                          scan_options: { queue_metadata: !overview.settings.scan_options.queue_metadata },
                        })
                      )
                    }
                    type="button"
                  >
                    <span className="ds-toggle__thumb" />
                  </button>
                </div>
                <div style={{ paddingTop: 14 }}>
                  <Button
                    isLoading={busy === "rescan"}
                    onClick={() => void rescan()}
                    variant="primary"
                    size="sm"
                  >
                    <RefreshCw aria-hidden="true" size={15} />
                    Rescan saved folders
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* METADATA */}
          {section === "metadata" && (
            <>
              <SectionHeader title="Metadata" copy="Metadata remains optional — local-library features work without it." />
              <div className="setting-card">
                <p className="setting-card__label">ACTIVE PROVIDER</p>
                <div className="setting-row">
                  <div className="setting-row-text">
                    <strong>{metadata.provider}</strong>
                    <small>{metadata.configured ? `Configured · ${metadata.queue_size} queued` : "Not configured — add local Twitch credentials to enable IGDB."}</small>
                  </div>
                  <span className={`status-pill ${metadata.configured ? "status-pill--good" : ""}`}>
                    {metadata.configured ? <CheckCircle2 aria-hidden="true" size={13} /> : <CircleAlert aria-hidden="true" size={13} />}
                    {metadata.configured ? "Ready" : "Unavailable"}
                  </span>
                </div>
                <div className="setting-row">
                  <div className="setting-row-text">
                    <strong>Last metadata refresh</strong>
                    <small>{fmtDate(metadata.last_refresh_at)}</small>
                  </div>
                  <Button
                    disabled={!metadata.configured || busy === "metadata"}
                    isLoading={busy === "metadata"}
                    onClick={() => void act("metadata", () => window.launcher.refreshAllMetadata())}
                    size="sm"
                    variant="quiet"
                  >
                    Refresh library
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* CACHE */}
          {section === "cache" && (
            <>
              <SectionHeader title="Cache" copy="Artwork is stored locally and can be removed without touching game installations." />
              <div className="setting-card">
                <p className="setting-card__label">ARTWORK CACHE</p>
                <div className="settings-cache-grid">
                  <CacheStat label="Cache size"           value={bytes(cache.size_bytes)}           />
                  <CacheStat label="Cached artwork"       value={`${cache.artwork_count} files`}    />
                  <CacheStat label="Last metadata refresh" value={fmtDate(cache.last_metadata_refresh_at)} />
                  <CacheStat label="Last cleanup"         value={fmtDate(cache.last_cleanup_at)}    />
                </div>
                <div className="cache-location">Location: {cache.location}</div>
                <div className="button-row">
                  <Button
                    disabled={busy === "rebuild"}
                    isLoading={busy === "rebuild"}
                    onClick={() => void act("rebuild", () => window.launcher.rebuildCache())}
                    size="sm"
                    variant="quiet"
                  >
                    Rebuild cache
                  </Button>
                  <Button
                    disabled={busy === "clear"}
                    isLoading={busy === "clear"}
                    onClick={() => {
                      if (window.confirm("Clear all locally cached artwork? Game installations will not be changed.")) {
                        void act("clear", () => window.launcher.clearCache());
                      }
                    }}
                    size="sm"
                    variant="danger"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    Clear cache
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* LAUNCHER / DESKTOP */}
          {section === "launcher" && (
            <>
              <SectionHeader title="Desktop" copy="Window behavior and desktop-integration preferences." />
              <div className="setting-card">
                <p className="setting-card__label">WINDOW BEHAVIOR</p>
                <div className="settings-empty">
                  <MonitorCog aria-hidden="true" size={20} />
                  <div>
                    <strong>No desktop preferences yet</strong>
                    <p>Startup and window behavior controls are reserved here without changing current launcher behavior.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scan dialog surfaced from Settings rescan */}
      <ScanFoldersDialog
        error={scanner.error}
        isImporting={scanner.isImporting}
        onCancel={() => void scanner.cancel()}
        onClose={scanner.dismiss}
        onImport={importScannedGames}
        scan={scanner.scan}
      />
    </section>
  );
}

function SectionHeader({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return (
    <header className="settings-section-header">
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {action}
    </header>
  );
}

function CacheStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
