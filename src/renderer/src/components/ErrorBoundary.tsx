import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void { console.error("Unhandled renderer error", error, errorInfo); }
  render(): ReactNode {
    return this.state.hasError
      ? <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-slate-100"><div><h1 className="text-xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm text-slate-400">Restart the app to return to your library.</p></div></div>
      : this.props.children;
  }
}
