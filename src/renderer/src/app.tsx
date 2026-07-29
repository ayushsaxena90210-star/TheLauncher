import { useEffect, useState } from "react";
import {
  Download,
  Gamepad2,
  Home,
  Library,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

type HealthState = "checking" | "ready" | "unavailable";

const navigation = [
  { label: "Home", icon: Home, active: true },
  { label: "Library", icon: Library },
  { label: "Discover", icon: Sparkles },
  { label: "Downloads", icon: Download },
];

export function App(): React.JSX.Element {
  const [healthState, setHealthState] = useState<HealthState>("checking");

  useEffect(() => {
    if (!("launcher" in window)) {
      setHealthState("unavailable");
      return;
    }

    void window.launcher
      .getBackendHealth()
      .then((health) => {
        setHealthState(health.status === "ok" ? "ready" : "unavailable");
      })
      .catch(() => setHealthState("unavailable"));
  }, []);

  const backendLabel =
    healthState === "checking"
      ? "Checking local service"
      : healthState === "ready"
        ? "Local service ready"
        : "Local service unavailable";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_68%_0%,#1d355b_0%,transparent_28%),#0b1020] text-slate-100">
      <div className="drag-region h-9" />
      <div className="flex min-h-[calc(100vh-2.25rem)]">
        <aside className="w-64 border-r border-white/8 bg-slate-950/40 px-4 py-5">
          <div className="mb-10 flex items-center gap-3 px-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950">
              <Gamepad2 size={22} strokeWidth={2.6} />
            </div>
            <div>
              <p className="font-semibold tracking-tight">The Launcher</p>
              <p className="text-xs text-slate-400">Your local library</p>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map(({ label, icon: Icon, active }) => (
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-cyan-400/12 text-cyan-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
                key={label}
                type="button"
                disabled={!active}
                title={active ? undefined : "Planned for a later phase"}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex h-[55vh] items-end">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100" type="button" disabled title="Settings are planned for Phase 8">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </aside>

        <main className="flex-1 px-10 py-8">
          <header className="flex items-center justify-between gap-8">
            <div>
              <p className="text-sm font-medium text-cyan-300">Phase 1 foundation</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back</h1>
            </div>
            <label className="flex w-80 items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
              <Search size={18} />
              <span>Search your library — coming soon</span>
            </label>
          </header>

          <section className="mt-12 max-w-4xl rounded-2xl border border-white/10 bg-slate-900/65 p-8 shadow-2xl shadow-black/15">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-cyan-300">Foundation verified</p>
                <h2 className="mt-2 text-2xl font-semibold">The desktop shell is ready for the library.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                  Electron is running the desktop window and a local FastAPI service. Phase 2 adds the durable SQLite foundation; game management begins in Phase 3.
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${healthState === "ready" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}>
                {backendLabel}
              </span>
            </div>
          </section>

          <section className="mt-8 grid max-w-4xl grid-cols-3 gap-4">
            {[
              ["0", "Games in library"],
              ["0h", "Tracked playtime"],
              ["—", "Next: persistence"],
            ].map(([value, label]) => (
              <article className="rounded-xl border border-white/8 bg-white/[0.035] p-5" key={label}>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
