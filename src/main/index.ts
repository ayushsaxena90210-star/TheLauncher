import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";

import { backendProcess } from "./backend-process.js";
import { backendClient, type MetadataGameStatus, type ScanStatus } from "./backend-client.js";
import { gameLauncher } from "./game-launcher.js";

const createWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1060,
    minHeight: 680,
    show: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.on("console-message", (_event, _level, message) => {
    console.error(`[renderer] ${message}`);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
};

const scanPollers = new Map<string, ReturnType<typeof setInterval>>();
const metadataPollers = new Map<string, ReturnType<typeof setInterval>>();

function broadcastScannerEvent(channel: string, payload: ScanStatus): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

function stopScanPolling(scanId: string): void {
  const poller = scanPollers.get(scanId);
  if (poller) clearInterval(poller);
  scanPollers.delete(scanId);
}

function monitorScan(scanId: string): void {
  const poll = async (): Promise<void> => {
    try {
      const scan = await backendClient.getScan(scanId);
      broadcastScannerEvent("scanner:progress", scan);
      if (scan.state === "completed") {
        stopScanPolling(scanId);
        broadcastScannerEvent("scanner:completed", scan);
      } else if (scan.state === "cancelled") {
        stopScanPolling(scanId);
        broadcastScannerEvent("scanner:cancelled", scan);
      } else if (scan.state === "failed") {
        stopScanPolling(scanId);
        broadcastScannerEvent("scanner:failed", scan);
      }
    } catch (error) {
      stopScanPolling(scanId);
      broadcastScannerEvent("scanner:failed", {
        scan_id: scanId, state: "failed", current_path: null,
        summary: { folders_scanned: 0, directories_visited: 0, executables_checked: 0, games_detected: 0, already_imported_games: 0, excluded_items: 0, permission_warnings: 0, successfully_imported_games: 0 },
        candidates: [], warnings: [], error: error instanceof Error ? error.message : "Unable to retrieve scan status.",
      });
    }
  };
  void poll();
  scanPollers.set(scanId, setInterval(() => void poll(), 300));
}

function stopMetadataPolling(gameId: string): void {
  const poller = metadataPollers.get(gameId);
  if (poller) clearInterval(poller);
  metadataPollers.delete(gameId);
}

function monitorMetadata(gameId: string): void {
  const poll = async (): Promise<void> => {
    try {
      const metadata: MetadataGameStatus = await backendClient.getMetadataGameStatus(gameId);
      if (metadata.metadata_status === "success" || metadata.metadata_status === "failed") {
        stopMetadataPolling(gameId);
        for (const window of BrowserWindow.getAllWindows()) window.webContents.send("metadata:updated", metadata);
      }
    } catch (error) {
      stopMetadataPolling(gameId);
      console.error(`[main] Metadata polling failed for ${gameId}:`, error);
    }
  };
  void poll();
  metadataPollers.set(gameId, setInterval(() => void poll(), 500));
}

app.whenReady().then(async () => {
  app.setAppUserModelId("com.thelauncher.app");

  if (!process.env.ELECTRON_RENDERER_URL && !process.env.LAUNCHER_DATABASE_PATH) {
    process.env.LAUNCHER_DATABASE_PATH = path.join(app.getPath("userData"), "the-launcher.db");
  }

  ipcMain.handle("backend:get-health", () => backendProcess.getHealth());
  ipcMain.handle("game:launch", (_event, gameId: string) => gameLauncher.launch(gameId));
  ipcMain.handle("game:open-file-location", (_event, gameId: string) =>
    gameLauncher.openFileLocation(gameId)
  );
  ipcMain.handle("scanner:pick-folders", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory", "multiSelections"] });
    return { cancelled: result.canceled, paths: result.filePaths };
  });
  ipcMain.handle("scanner:start", async (_event, roots: string[]) => {
    const scan = await backendClient.startScan(roots);
    monitorScan(scan.scan_id);
    return scan;
  });
  ipcMain.handle("scanner:cancel", async (_event, scanId: string) => backendClient.cancelScan(scanId));
  ipcMain.handle("scanner:import", (_event, scanId: string, candidateIds: string[]) =>
    backendClient.importScanCandidates(scanId, candidateIds)
  );
  ipcMain.handle("metadata:enqueue", async (_event, gameId: string) => {
    const result = await backendClient.enqueueMetadata(gameId);
    monitorMetadata(gameId);
    return result;
  });

  await backendProcess.start();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (e) => {
  e.preventDefault();
  void (async () => {
    try {
      await gameLauncher.cleanup();
    } catch (error) {
      console.error("[main] Failed cleanup during quit:", error);
    } finally {
      for (const scanId of scanPollers.keys()) stopScanPolling(scanId);
      for (const gameId of metadataPollers.keys()) stopMetadataPolling(gameId);
      backendProcess.stop();
      app.exit(0);
    }
  })();
});
