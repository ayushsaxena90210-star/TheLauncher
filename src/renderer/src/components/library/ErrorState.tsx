import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps): React.JSX.Element {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-rose-300/15 bg-rose-950/15 p-8 text-center">
      <div>
        <AlertTriangle className="mx-auto text-rose-300" size={28} />
        <h2 className="mt-4 text-lg font-semibold">Couldn’t load your library</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{message}</p>
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
