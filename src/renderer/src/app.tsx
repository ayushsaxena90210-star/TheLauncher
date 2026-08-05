import { Download, Gamepad2, Home, Library, Maximize2, Minimize2, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { GameDetailsPage } from "./pages/GameDetailsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { ThemePreference } from "./types/settings";

const navigation = [
  { label: "Home", icon: Home, path: "/home", planned: true },
  { label: "Library", icon: Library, path: "/library" },
  { label: "Discover", icon: Sparkles, path: "/discover", planned: true },
  { label: "Downloads", icon: Download, path: "/downloads", planned: true },
];

function resolvedTheme(preference: ThemePreference): "light" | "dark" {
  return preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
}

export function App(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [maximized, setMaximized] = useState(false);
  useEffect(() => { let active = true; void window.launcher.getSettingsOverview().then((value) => { if (active) setTheme(value.settings.theme); }).catch(() => undefined); return () => { active = false; }; }, []);
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const update = () => { document.documentElement.dataset.theme = resolvedTheme(theme); }; update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, [theme]);
  return <div className="app-shell">
    <header className="titlebar drag-region"><span className="titlebar__name">The Launcher</span><div className="titlebar__controls no-drag"><button aria-label="Minimize" onClick={() => void window.launcher.minimizeWindow()} type="button"><Minimize2 size={15} /></button><button aria-label={maximized ? "Restore" : "Maximize"} onClick={() => void window.launcher.toggleMaximizeWindow().then(setMaximized)} type="button"><Maximize2 size={14} /></button><button aria-label="Close" className="titlebar__close" onClick={() => void window.launcher.closeWindow()} type="button"><X size={16} /></button></div></header>
    <div className="app-layout"><aside className="app-sidebar"><button className="app-brand no-drag" onClick={() => navigate("/library")} type="button"><span><Gamepad2 size={21} strokeWidth={2.5} /></span><div><strong>The Launcher</strong><small>Your local library</small></div></button><nav aria-label="Primary navigation" className="app-nav">{navigation.map(({ label, icon: Icon, path, planned }) => <button aria-current={location.pathname === path ? "page" : undefined} className={location.pathname === path ? "is-active" : ""} disabled={planned} key={label} onClick={() => navigate(path)} title={planned ? "Planned for a later phase" : undefined} type="button"><Icon size={18} /><span>{label}</span></button>)}</nav><div className="app-sidebar__bottom"><button aria-current={location.pathname === "/settings" ? "page" : undefined} className={location.pathname === "/settings" ? "is-active" : ""} onClick={() => navigate("/settings")} type="button"><Settings size={18} /><span>Settings</span></button></div></aside><main className="app-content"><Routes><Route path="/library" element={<LibraryPage />} /><Route path="/game/:gameId" element={<GameDetailsPage />} /><Route path="/settings" element={<SettingsPage onThemeChange={setTheme} />} /><Route path="*" element={<Navigate replace to="/library" />} /></Routes></main></div>
  </div>;
}
