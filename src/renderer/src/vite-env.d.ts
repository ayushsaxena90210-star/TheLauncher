/// <reference types="vite/client" />

type BackendHealth = {
  status: "ok" | "unavailable";
  service: "backend";
  detail?: string;
};

declare global {
  interface Window {
    launcher: {
      getBackendHealth: () => Promise<BackendHealth>;
    };
  }
}

export {};
