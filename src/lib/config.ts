import path from "path";
import { app } from "electron";
import log from "electron-log/main";

export const consoleLog = app.isPackaged ? log.log : console.log;
export const consoleError = app.isPackaged ? log.error : console.error;

export class AppConfig {
  readonly isPackaged: boolean;
  readonly isDev: boolean;
  readonly rootDir: string;
  readonly dataDir: string;

  constructor() {
    // TODO: Remove isPackaged, only use isDev
    this.isPackaged = app.isPackaged;
    this.isDev = process.env.WEBPACK_SERVE === "true";
    this.rootDir = this.isPackaged
      ? process.resourcesPath
      : path.join(__dirname, "..", "..");
    this.dataDir = this.isPackaged ? app.getPath("userData") : this.rootDir;
    log.initialize();
    app.setAppLogsPath(path.join(this.dataDir, "logs"));

    consoleLog("App config initialized");
  }

  get pythonPath() {
    if (this.isPackaged) {
      const basePath = path.join(process.resourcesPath, "python");
      switch (process.platform) {
        case "win32":
          return path.join(basePath, "Scripts", "python.exe");
        case "linux":
          return path.join(basePath, "bin", "python3");
        default:
          throw new Error("Unsupported platform: " + process.platform);
      }
    }
    return process.platform === "win32"
      ? path.join(this.rootDir, ".venv", "Scripts", "python.exe")
      : path.join(this.rootDir, ".venv", "bin", "python3");
  }

  get scriptPath() {
    return this.isPackaged
      ? path.join(this.rootDir, "dist", "controller", "controller.exe")
      : path.join(this.rootDir, "src-py", "controller.py");
  }

  get settingsPath() {
    return path.join(this.dataDir, "settings.json");
  }
}
