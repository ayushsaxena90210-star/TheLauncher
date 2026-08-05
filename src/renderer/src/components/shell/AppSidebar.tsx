/**
 * AppSidebar – Hydra-inspired two-panel sidebar.
 * Shows app brand, navigation items, and a scrollable game list.
 */
import { Gamepad2, Library, Search, Settings, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useGameContext } from "../../context/GameContext";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
const coverUrl = (id: string) => `${apiBase}/metadata/games/${id}/cover`;

type NavItem = {
  id: string;
  label: string;
  icon: typeof Library;
  path: string;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "library", label: "Library", icon: Library, path: "/library" },
  { id: "discover", label: "Discover", icon: Sparkles, path: "/discover", disabled: true },
];

export function AppSidebar(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { games, activeGameId } = useGameContext();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? games.filter((g) => g.title.toLocaleLowerCase().includes(q)) : games;
  }, [games, query]);

  const isNavActive = (path: string) =>
    path === "/library"
      ? location.pathname === "/library" || location.pathname.startsWith("/game/")
      : location.pathname === path;

  return (
    <aside aria-label="Application sidebar" className="app-sidebar" role="complementary">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand__icon" aria-hidden="true">
          <Gamepad2 size={19} strokeWidth={2.5} />
        </div>
        <div>
          <strong className="sidebar-brand__name">The Launcher</strong>
          <small className="sidebar-brand__sub">Your local library</small>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">Navigate</p>
        <nav aria-label="Primary navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon, path, disabled }) => (
            <button
              aria-current={isNavActive(path) ? "page" : undefined}
              className={`sidebar-nav-item ${isNavActive(path) ? "is-active" : ""}`}
              disabled={disabled}
              key={id}
              onClick={() => navigate(path)}
              title={disabled ? "Coming in a later phase" : undefined}
              type="button"
            >
              <Icon aria-hidden="true" size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Library game list */}
      <div className="sidebar-section--library">
        <p className="sidebar-section-label">Your games</p>
        <label className="sidebar-library-search">
          <Search aria-hidden="true" size={13} />
          <input
            aria-label="Filter games"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            type="search"
            value={query}
          />
        </label>

        <div aria-label="Games" className="sidebar-game-list" role="list">
          {filtered.length === 0 && (
            <div className="sidebar-empty-library">
              {games.length === 0
                ? "No games yet.\nAdd a game or scan your folders."
                : "No games match your filter."}
            </div>
          )}
          {filtered.map((game) => (
            <button
              aria-current={activeGameId === game.id ? "true" : undefined}
              className={`sidebar-game-item ${activeGameId === game.id ? "is-active" : ""}`}
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              role="listitem"
              title={game.title}
              type="button"
            >
              {/* Thumbnail */}
              <div className="sidebar-game-thumb">
                {game.cover_path ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    src={coverUrl(game.id)}
                  />
                ) : (
                  <div className="sidebar-game-thumb__placeholder" aria-hidden="true">
                    <Gamepad2 size={14} />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="sidebar-game-info">
                <div className="sidebar-game-title">{game.title}</div>
                {game.genres && (
                  <div className="sidebar-game-sub">{game.genres.split(",")[0]?.trim()}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="sidebar-bottom">
        <button
          aria-current={location.pathname === "/settings" ? "page" : undefined}
          className={`sidebar-nav-item ${location.pathname === "/settings" ? "is-active" : ""}`}
          onClick={() => navigate("/settings")}
          type="button"
        >
          <Settings aria-hidden="true" size={17} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
