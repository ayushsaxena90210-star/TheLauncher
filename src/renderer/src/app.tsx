import { Download, Gamepad2, Home, Library, Settings, Sparkles } from "lucide-react";

import { LibraryPage } from "./pages/LibraryPage";
import { GameDetailsPage } from "./pages/GameDetailsPage";
import { Navigate, Route, Routes } from "react-router-dom";

const navigation = [
  { label: "Home", icon: Home, active: false },
  { label: "Library", icon: Library, active: true },
  { label: "Discover", icon: Sparkles, active: false },
  { label: "Downloads", icon: Download, active: false },
];

export function App(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_68%_0%,#1d355b_0%,transparent_28%),#0b1020] text-slate-100">
      <div className="drag-region h-9" />
      <div className="flex min-h-[calc(100vh-2.25rem)]">
        <aside className="w-64 shrink-0 border-r border-white/8 bg-slate-950/40 px-4 py-5">
          <div className="mb-10 flex items-center gap-3 px-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Gamepad2 size={22} strokeWidth={2.6} /></div><div><p className="font-semibold tracking-tight">The Launcher</p><p className="text-xs text-slate-400">Your local library</p></div></div>
          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map(({ label, icon: Icon, active }) => <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-cyan-400/12 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`} disabled={!active} key={label} title={active ? undefined : "Planned for a later phase"} type="button"><Icon size={18} />{label}</button>)}
          </nav>
          <div className="mt-auto flex h-[55vh] items-end"><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100" disabled title="Settings are planned for Phase 8" type="button"><Settings size={18} />Settings</button></div>
        </aside>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10"><Routes><Route path="/library" element={<LibraryPage />} /><Route path="/game/:gameId" element={<GameDetailsPage />} /><Route path="*" element={<Navigate replace to="/library" />} /></Routes></main>
      </div>
    </div>
  );
}
