import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

const backendUrl = "http://127.0.0.1:8765/health";

export type BackendHealth = {
  status: "ok" | "unavailable";
  service: "backend";
  detail?: string;
};

export class BackendProcess {
  private process: ChildProcess | null = null;

  async start(): Promise<void> {
    if (await this.isReachable()) return;

    const pythonExecutable =
      process.env.PYTHON_EXECUTABLE ??
      (process.platform === "win32" ? "py" : "python3");
    const isDevelopment = Boolean(process.env.ELECTRON_RENDERER_URL);
    const backendWorkingDirectory = isDevelopment
      ? process.cwd()
      : path.join(process.resourcesPath, "backend");
    const backendModule = isDevelopment ? "backend.app.main:app" : "app.main:app";

    this.process = spawn(
      pythonExecutable,
      [
        "-m",
        "uvicorn",
        backendModule,
        "--host",
        "127.0.0.1",
        "--port",
        "8765",
      ],
      {
        cwd: backendWorkingDirectory,
        stdio: "pipe",
        windowsHide: true,
      }
    );

    this.process.stderr?.on("data", (data: Buffer) => {
      console.error(`[backend] ${data.toString().trim()}`);
    });

    await this.waitUntilReachable();
  }

  async getHealth(): Promise<BackendHealth> {
    try {
      const response = await fetch(backendUrl, { signal: AbortSignal.timeout(1500) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return (await response.json()) as BackendHealth;
    } catch (error) {
      return {
        status: "unavailable",
        service: "backend",
        detail: error instanceof Error ? error.message : "Unknown backend error",
      };
    }
  }

  stop(): void {
    this.process?.kill();
    this.process = null;
  }

  private async isReachable(): Promise<boolean> {
    return (await this.getHealth()).status === "ok";
  }

  private async waitUntilReachable(): Promise<void> {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await this.isReachable()) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    this.stop();
    throw new Error(
      "The local backend did not start. Install backend requirements and check the Electron console."
    );
  }
}

export const backendProcess = new BackendProcess();
