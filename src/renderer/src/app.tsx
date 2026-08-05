/**
 * App – root shell: title bar, sidebar, and routed content.
 * Applies theme, accent colour, and reduced-motion preferences to <html>.
 */
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppSidebar } from "./components/shell/AppSidebar";
import { GameProvider } from "./context/GameContext";
import { GameDetailsPage } from "./pages/GameDetailsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { AccentColor, ThemePreference } from "./types/settings";

const DEFAULT_ACCENT: AccentColor = "cyan";

function resolvedTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

function applyAccent(accent: AccentColor) {
  document.documentElement.dataset.accent = accent;
}

function applyReducedMotion(value: boolean) {
  if (value) {
    document.documentElement.dataset.reducedMotion = "true";
  } else {
    delete document.documentElement.dataset.reducedMotion;
  }
}

/** Inner shell – needs to be inside HashRouter so AppSidebar can read location */
function AppShell(): React.JSX.Element {
  const location = useLocation();
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [accent, setAccent] = useState<AccentColor>(DEFAULT_ACCENT);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let active = true;
    void window.launcher.getSettingsOverview().then((value) => {
      if (!active) return;
      const s = value.settings as typeof value.settings & { accent_color?: string; reduced_motion?: boolean };
      setTheme(s.theme);
      setAccent((s.accent_color as AccentColor | undefined) ?? DEFAULT_ACCENT);
      setReducedMotion(Boolean(s.reduced_motion));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Apply theme
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.dataset.theme = resolvedTheme(theme);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  // Apply accent colour
  useEffect(() => { applyAccent(accent); }, [accent]);

  // Apply reduced motion
  useEffect(() => { applyReducedMotion(reducedMotion); }, [reducedMotion]);

  const handleThemeChange = (t: ThemePreference) => setTheme(t);
  const handleAccentChange = (a: AccentColor) => setAccent(a);
  const handleReducedMotionChange = (v: boolean) => setReducedMotion(v);

  // Keep active page in the sidebar via location
  void location; // ensure location is used for re-renders on navigate

  return (
    <div className="app-shell">
      {/* ── Title bar ────────────────────────────────────── */}
      <header className="titlebar drag-region">
        <span className="titlebar__name no-drag" aria-label="The Launcher">
          The Launcher
        </span>
        <div className="titlebar__controls no-drag">
          <button
            aria-label="Minimize"
            onClick={() => void window.launcher.minimizeWindow()}
            type="button"
          >
            <Minus size={15} />
          </button>
          <button
            aria-label={maximized ? "Restore" : "Maximize"}
            onClick={() => void window.launcher.toggleMaximizeWindow().then(setMaximized)}
            type="button"
          >
            {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            aria-label="Close"
            className="titlebar__close"
            onClick={() => void window.launcher.closeWindow()}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── Two-panel layout ─────────────────────────────── */}
      <div className="app-layout">
        <GameProvider>
          <AppSidebar />
          <main className="app-content">
            <Routes>
              <Route path="/library" element={<LibraryPage />} />
              <Route
                path="/game/:gameId"
                element={<GameDetailsPage />}
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    onThemeChange={handleThemeChange}
                    onAccentChange={handleAccentChange}
                    onReducedMotionChange={handleReducedMotionChange}
                  />
                }
              />
              <Route path="*" element={<Navigate replace to="/library" />} />
            </Routes>
          </main>
        </GameProvider>
      </div>
    </div>
  );
}

export function App(): React.JSX.Element {
  return <AppShell />;
}
