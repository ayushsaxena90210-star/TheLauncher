import { contextBridge, ipcRenderer } from "electron";

export type BackendHealth = {
  status: "ok" | "unavailable";
  service: "backend";
  detail?: string;
};

const launcherApi = {
  getBackendHealth: (): Promise<BackendHealth> => ipcRenderer.invoke("backend:get-health"),
};

contextBridge.exposeInMainWorld("launcher", launcherApi);
