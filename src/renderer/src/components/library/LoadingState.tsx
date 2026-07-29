export function LoadingState(): React.JSX.Element {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-white/10 bg-slate-900/50">
      <div className="flex items-center gap-3 text-sm text-slate-300" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
        Loading your library…
      </div>
    </div>
  );
}
