import { ArrowLeft, Copy, ExternalLink, FolderOpen, Loader2, MoreHorizontal, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DeleteGameDialog } from "../components/library/DeleteGameDialog";
import { GameDialog } from "../components/library/GameDialog";
import { useDeleteGame } from "../hooks/useDeleteGame";
import { useGameDetails } from "../hooks/useGameDetails";
import { useLaunchGame } from "../hooks/useLaunchGame";
import { useUpdateGame } from "../hooks/useUpdateGame";
import type { Game, GameFormValues } from "../types/game";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";
const coverUrl = (id: string) => `${apiBase}/metadata/games/${id}/cover`;
const screenshotUrl = (id: string, index: number) => `${apiBase}/metadata/games/${id}/screenshots/${index}`;

function playtime(seconds: number): string { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours}h ${minutes}m` : `${minutes}m`; }
function date(value: string | null): string { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Never played"; }
function Detail({ label, value }: { label: string; value: string | number | null | undefined }) { return <div className="border-b border-white/7 py-3 last:border-0"><dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-200">{value ?? "—"}</dd></div>; }

export function GameDetailsPage(): React.JSX.Element {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { game, activity, screenshots, isLoading, error, refresh } = useGameDetails(gameId);
  const { launchGame, getLaunchState } = useLaunchGame();
  const [selectedScreenshot, setSelectedScreenshot] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { updateGame, isUpdating, error: updateError } = useUpdateGame(refresh);
  const { deleteGame, isDeleting, error: deleteError } = useDeleteGame(async () => { navigate("/library"); });
  const launch = useCallback(async () => { if (game) await launchGame(game.id); }, [game, launchGame]);

  if (isLoading) return <div className="animate-pulse space-y-6"><div className="h-80 rounded-2xl bg-slate-800/70" /><div className="h-64 rounded-2xl bg-slate-900" /></div>;
  if (!game || error) return <section className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-7"><h1 className="text-xl font-semibold">Game unavailable</h1><p className="mt-2 text-slate-400">{error ?? "This game could not be found."}</p><button className="mt-5 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => navigate("/library")} type="button">Back to library</button></section>;

  const launchState = getLaunchState(game.id);
  const submitEdit = async (values: GameFormValues) => (await updateGame(game.id, { title: values.title, executable_path: values.executablePath })) !== null;
  const refreshMetadata = async () => { setActionError(null); try { await window.launcher.refreshMetadata(game.id); await refresh(); } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to refresh metadata."); } };
  const copyPath = async () => { setActionError(null); try { await navigator.clipboard.writeText(game.executable_path); } catch { setActionError("Unable to copy the executable path."); } };
  const openLocation = async () => { const result = await window.launcher.openFileLocation(game.id); if (!result.success) setActionError(result.error); };

  return <>
    <button className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-200" onClick={() => navigate("/library")} type="button"><ArrowLeft size={16} />Back to library</button>
    <section className="relative isolate min-h-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/20">
      {game.cover_path && <img alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-35 blur-2xl" src={coverUrl(game.id)} />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/45" />
      <div className="flex h-full flex-col justify-end gap-5 p-7 md:flex-row md:items-end md:p-9">
        <div className="h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-slate-800 shadow-xl">{game.cover_path ? <img alt={`${game.title} cover`} className="h-full w-full object-cover" src={coverUrl(game.id)} /> : <div className="grid h-full place-items-center text-xs text-slate-500">No cover</div>}</div>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-cyan-300">{game.metadata_source?.toUpperCase() ?? "LOCAL LIBRARY"}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{game.title}</h1><p className="mt-3 text-sm text-slate-300">{[game.genres, game.platforms, game.rating ? `${game.rating.toFixed(1)} / 100` : null].filter(Boolean).join("  •  ") || "Metadata available after enrichment"}</p><p className="mt-3 text-sm text-slate-400">{playtime(activity?.total_play_time_seconds ?? 0)} played  •  {date(activity?.last_played_at ?? null)}  •  {activity?.launch_count ?? 0} launches</p></div>
        <div className="relative flex shrink-0 flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-60" disabled={launchState.state !== "idle"} onClick={() => void launch()} type="button">{launchState.state === "launching" ? <Loader2 className="animate-spin" size={17} /> : <Play fill="currentColor" size={17} />}{launchState.state === "running" ? "Running" : "Play"}</button><button className="rounded-lg border border-white/15 p-3 text-slate-200 hover:bg-white/10" onClick={() => void refreshMetadata()} title="Refresh metadata" type="button"><RefreshCw size={17} /></button><button className="rounded-lg border border-white/15 p-3 text-slate-200 hover:bg-white/10" onClick={() => void openLocation()} title="Open file location" type="button"><FolderOpen size={17} /></button><button className="rounded-lg border border-white/15 p-3 text-slate-200 hover:bg-white/10" onClick={() => setShowActions((value) => !value)} title="More actions" type="button"><MoreHorizontal size={17} /></button>{showActions && <div className="absolute right-0 bottom-14 z-20 w-52 rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-xl"><button className="menu-action" onClick={() => setEditOpen(true)} type="button"><Pencil size={15} />Edit game</button><button className="menu-action" onClick={() => void copyPath()} type="button"><Copy size={15} />Copy executable path</button>{game.official_website && <a className="menu-action" href={game.official_website} rel="noreferrer" target="_blank"><ExternalLink size={15} />Official website</a>}<button className="menu-action text-rose-300 hover:bg-rose-400/10" onClick={() => setDeleteOpen(true)} type="button"><Trash2 size={15} />Remove game</button></div>}</div>
      </div>
    </section>
    {actionError && <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">{actionError}</p>}
    <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="space-y-8"><section><h2 className="text-xl font-semibold">About</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{game.description ?? "No description has been added yet. Refresh metadata to look up this game in IGDB."}</p></section><section><h2 className="text-xl font-semibold">Screenshots</h2>{screenshots.length ? <div className="mt-4"><div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-slate-900"><img alt={`${game.title} screenshot`} className="h-full w-full object-cover" src={screenshotUrl(game.id, screenshots[selectedScreenshot] ?? screenshots[0])} /></div><div className="mt-3 flex gap-3 overflow-x-auto pb-1">{screenshots.map((index, position) => <button className={`h-16 w-28 shrink-0 overflow-hidden rounded-lg border ${position === selectedScreenshot ? "border-cyan-300" : "border-white/10"}`} key={index} onClick={() => setSelectedScreenshot(position)} type="button"><img alt={`Screenshot ${position + 1}`} className="h-full w-full object-cover" loading="lazy" src={screenshotUrl(game.id, index)} /></button>)}</div></div> : <p className="mt-3 rounded-xl border border-dashed border-white/15 p-6 text-sm text-slate-500">No cached screenshots are available for this game.</p>}</section><section><h2 className="text-xl font-semibold">Activity</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Total playtime", playtime(activity?.total_play_time_seconds ?? 0)], ["Last played", date(activity?.last_played_at ?? null)], ["Launch count", activity?.launch_count ?? 0]].map(([label, value]) => <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4" key={String(label)}><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-100">{value}</p></div>)}</div><div className="mt-4 divide-y divide-white/8 rounded-xl border border-white/10 bg-slate-900/40">{activity?.sessions.length ? activity.sessions.map((session) => <div className="flex items-center justify-between px-4 py-3 text-sm" key={session.id}><span>{date(session.started_at)}</span><span className="text-slate-400">{playtime(session.duration_seconds ?? 0)}</span></div>) : <p className="p-4 text-sm text-slate-500">No completed sessions yet.</p>}</div></section></main>
      <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/55 p-5"><h2 className="text-lg font-semibold">Details</h2><dl className="mt-3"><Detail label="Release date" value={game.release_date} /><Detail label="Developers" value={game.developers} /><Detail label="Publishers" value={game.publishers} /><Detail label="Genres" value={game.genres} /><Detail label="Platforms" value={game.platforms} /><Detail label="Rating" value={game.rating ? `${game.rating.toFixed(1)} / 100` : null} /><Detail label="Age rating" value={game.age_rating} /><Detail label="Themes" value={game.themes} /><Detail label="Franchises" value={game.franchises} /><Detail label="Game modes" value={game.game_modes} /><Detail label="Metadata source" value={game.metadata_source?.toUpperCase()} /></dl><h2 className="mt-6 text-lg font-semibold">Technical</h2><dl className="mt-3"><Detail label="Executable" value={game.executable_path} /><Detail label="Install folder" value={game.install_path} /><Detail label="Import date" value={date(game.created_at)} /><Detail label="Metadata updated" value={date(game.updated_at)} /></dl></aside>
    </div>
    <GameDialog game={editOpen ? game : null} isOpen={editOpen} isSubmitting={isUpdating} onClose={() => setEditOpen(false)} onSubmit={submitEdit} submitError={updateError} />
    <DeleteGameDialog error={deleteError} game={deleteOpen ? game : null} isDeleting={isDeleting} onClose={() => setDeleteOpen(false)} onConfirm={async () => { if (await deleteGame(game.id)) navigate("/library"); }} />
  </>;
}
