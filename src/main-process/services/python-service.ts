import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, consoleLog } from "../utils/config";
import {
  Command,
  Message,
  ProgressMessage,
  PYTHON_SERVICE_EVENTS,
  Error,
} from "../../lib/models";
import path from "path";
import { SettingsService } from "./settings-service";

export class PythonService extends EventEmitter {
  private shell: PythonShell;

  constructor(
    private config: AppConfig,
    private settingsService: SettingsService
  ) {
    super();
  }

  async initialize() {
    this.shell = new PythonShell(this.config.scriptPath, {
      pythonPath: this.config.pythonPath,
      cwd: this.config.isPackaged
        ? path.join(process.resourcesPath, "src-py")
        : this.config.rootDir,
      mode: "json",
      env: {
        ...process.env,
        PRODUCTION: String(!this.config.isDev),
        USER_DATA_PATH: this.config.dataDir,
        LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
      },
    });

    this.shell.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case "progress":
        this.handleProgress(message.data as ProgressMessage);
        break;
      case "error":
        consoleLog("Error:", message.data);
        this.emit(
          PYTHON_SERVICE_EVENTS.ERROR,
          (message.data as unknown as Error).error
        );
        break;
      default:
        consoleLog("Unknown message type:", message.type);
    }
  }

  private handleProgress(progress: ProgressMessage) {
    consoleLog(`Progress: ${progress.step} - ${progress.status}`);
  }

  sendCommand(command: Command) {
    this.shell.send(command);
  }

  shutdown() {
    this.shell.kill();
  }
}
