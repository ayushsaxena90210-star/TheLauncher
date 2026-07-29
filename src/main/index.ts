import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";

import { backendProcess } from "./backend-process.js";

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

app.whenReady().then(async () => {
  app.setAppUserModelId("com.thelauncher.app");

  if (!process.env.ELECTRON_RENDERER_URL && !process.env.LAUNCHER_DATABASE_PATH) {
    process.env.LAUNCHER_DATABASE_PATH = path.join(app.getPath("userData"), "the-launcher.db");
  }

  ipcMain.handle("backend:get-health", () => backendProcess.getHealth());

  await backendProcess.start();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => backendProcess.stop());
