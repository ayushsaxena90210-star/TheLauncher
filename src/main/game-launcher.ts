/**
 * Game launching, process lifecycle management, and desktop integration.
 *
 * All launch and desktop integration logic is self-contained here.
 * The Electron main index.ts only registers IPC handlers — this class
 * owns validation, spawning, session tracking, exit handling, renderer
 * notification, and desktop convenience features (e.g. Open File Location).
 *
 * Security: Always uses child_process.spawn() without a shell.
 * Never uses exec(), execSync(), or shell: true.
 */

import { execFile, spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

import { BrowserWindow, shell } from "electron";

import { backendClient } from "./backend-client.js";

export type LaunchResult =
  | { success: true; sessionId: string }
  | { success: false; error: string };

export type GameExitedEvent = {
  gameId: string;
  sessionId: string;
  durationSeconds: number;
};

export type OpenFileLocationResult =
  | { success: true }
  | { success: false; error: string };

type RunningGame = {
  process: ChildProcess | null;
  pid: number;
  sessionId: string;
  gameId: string;
  startedAt: Date;
};

function isGameProcessRunning(executablePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve(false);
      return;
    }
    const exeName = path.basename(executablePath).toLowerCase();
    const stem = path.basename(executablePath, path.extname(executablePath)).toLowerCase();

    execFile("tasklist", ["/NH"], { maxBuffer: 1024 * 1024 }, (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
        return;
      }
      const lower = stdout.toLowerCase();
      const isRunning =
        lower.includes(exeName) ||
        lower.includes(`${stem}.exe`) ||
        lower.includes(`${stem}-win64-shipping.exe`);
      resolve(isRunning);
    });
  });
}

export class GameLauncher {
  private runningGames = new Map<string, RunningGame>();
  private pollers = new Map<string, ReturnType<typeof setInterval>>();

  /**
   * Launch a game by ID using native OS shell execution and process monitoring.
   */
  async launch(gameId: string): Promise<LaunchResult> {
    if (this.runningGames.has(gameId)) {
      return { success: false, error: "Game is already running." };
    }

    // Fetch game from FastAPI
    let executablePath: string;
    let gameTitle: string;
    try {
      const game = await backendClient.getGame(gameId);
      executablePath = game.executable_path;
      gameTitle = game.title;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not retrieve game information.",
      };
    }

    // Normalize path for Windows Explorer compatibility
    const normalizedPath = path.resolve(executablePath);

    // Validate executable exists on disk
    try {
      await access(normalizedPath);
    } catch {
      return {
        success: false,
        error: `Executable not found at: ${normalizedPath}`,
      };
    }

    // Launch application via native OS Shell
    const errorMessage = await shell.openPath(normalizedPath);
    if (errorMessage) {
      return {
        success: false,
        error: `Failed to launch game: ${errorMessage}`,
      };
    }

    // Create session in backend
    let sessionId: string;
    try {
      const session = await backendClient.createSession(gameId);
      sessionId = session.id;
    } catch (error) {
      console.error("[launcher] Failed to create session:", error);
      return {
        success: false,
        error: "Game launched, but session creation failed.",
      };
    }

    const startedAt = new Date();
    this.runningGames.set(gameId, {
      process: null,
      pid: 0,
      sessionId,
      gameId,
      startedAt,
    });

    console.log(`[launcher] Started ${gameTitle} via native shell (session: ${sessionId})`);
    this.startProcessMonitor(gameId, normalizedPath);

    return { success: true, sessionId };
  }

  isRunning(gameId: string): boolean {
    return this.runningGames.has(gameId);
  }

  private startProcessMonitor(gameId: string, executablePath: string): void {
    // Initial 3-second grace period for process initialization
    setTimeout(() => {
      if (!this.runningGames.has(gameId)) return;

      const poller = setInterval(async () => {
        if (!this.runningGames.has(gameId)) {
          clearInterval(poller);
          this.pollers.delete(gameId);
          return;
        }

        const running = await isGameProcessRunning(executablePath);
        if (!running) {
          clearInterval(poller);
          this.pollers.delete(gameId);
          void this.handleExit(gameId);
        }
      }, 3000);

      this.pollers.set(gameId, poller);
    }, 3000);
  }

  /**
   * Open Windows Explorer with the game's executable selected.
   */
  async openFileLocation(gameId: string): Promise<OpenFileLocationResult> {
    // Fetch game from FastAPI
    let executablePath: string;
    try {
      const game = await backendClient.getGame(gameId);
      executablePath = game.executable_path;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not retrieve game information.",
      };
    }

    const normalizedPath = path.resolve(executablePath);

    // Validate executable exists on disk
    try {
      await access(normalizedPath);
    } catch {
      return {
        success: false,
        error: `Executable not found at: ${normalizedPath}`,
      };
    }

    // Open Explorer with the file selected (no shell)
    try {
      const explorer = spawn("explorer.exe", [`/select,${normalizedPath}`]);

      return new Promise<OpenFileLocationResult>((resolve) => {
        let settled = false;

        explorer.on("error", (err) => {
          if (settled) return;
          settled = true;
          resolve({
            success: false,
            error: `Failed to open file location: ${err.message}`,
          });
        });

        explorer.on("spawn", () => {
          if (settled) return;
          settled = true;
          resolve({ success: true });
        });
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to open file location.",
      };
    }
  }

  private async handleExit(gameId: string): Promise<void> {
    const entry = this.runningGames.get(gameId);
    if (!entry) return;

    this.runningGames.delete(gameId);

    const poller = this.pollers.get(gameId);
    if (poller) {
      clearInterval(poller);
      this.pollers.delete(gameId);
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(1, Math.round(
      (endedAt.getTime() - entry.startedAt.getTime()) / 1000
    ));

    // Complete the session in FastAPI
    try {
      await backendClient.completeSession(
        entry.sessionId,
        endedAt.toISOString(),
        durationSeconds
      );
      console.log(
        `[launcher] Session ${entry.sessionId} completed (${durationSeconds}s)`
      );
    } catch (error) {
      console.error(
        `[launcher] Failed to complete session ${entry.sessionId}:`,
        error
      );
    }

    // Notify all renderer windows
    const event: GameExitedEvent = {
      gameId,
      sessionId: entry.sessionId,
      durationSeconds,
    };
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("game:exited", event);
    }
  }

  /**
   * Complete any currently active sessions on app shutdown.
   */
  async cleanup(): Promise<void> {
    for (const poller of this.pollers.values()) {
      clearInterval(poller);
    }
    this.pollers.clear();

    for (const [gameId, entry] of this.runningGames) {
      const endedAt = new Date();
      const durationSeconds = Math.max(1, Math.round(
        (endedAt.getTime() - entry.startedAt.getTime()) / 1000
      ));
      try {
        await backendClient.completeSession(
          entry.sessionId,
          endedAt.toISOString(),
          durationSeconds
        );
        console.log(
          `[launcher] Cleaned up active session ${entry.sessionId} (${durationSeconds}s)`
        );
      } catch (error) {
        console.error(
          `[launcher] Failed to complete session ${entry.sessionId} during cleanup:`,
          error
        );
      }
    }
    this.runningGames.clear();
  }
}

export const gameLauncher = new GameLauncher();
