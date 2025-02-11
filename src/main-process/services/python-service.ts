import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, consoleLog } from "../../lib/config";
import {
  Command,
  Message,
  ProgressMessage,
  PYTHON_SERVICE_EVENTS,
  Error,
  ClusteringProgressMessage,
  Run,
  ClusteringResult,
  CurrentRunMessage,
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
      case "file_path":
        this.emit(PYTHON_SERVICE_EVENTS.FILE_PATH, message.data as string);
        break;
      case "error":
        consoleLog("Error:", message.data);
        this.emit(
          PYTHON_SERVICE_EVENTS.ERROR,
          (message.data as unknown as Error).error
        );
        break;
      case "runs":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.ALL_RUNS,
          message.data as Run[]
        );
        break;
      case "run":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_RUN,
          message.data as CurrentRunMessage
        );
        break;
      default:
        consoleLog("Unknown message type:", message.type);
    }
  }

  private handleProgress(progress: ProgressMessage) {
    consoleLog(`Progress: ${progress.step} - ${progress.status}`);
    switch (progress.step) {
      case "set_file_path":
      case "get_file_path":
      case "set_file_settings":
      case "set_algorithm_settings":
      case "run_clustering":
        break;
      case "start":
      case "process_input_file":
      case "load_model":
      case "embed_responses":
      case "detect_outliers":
      case "auto_cluster_count":
      case "cluster":
      case "merge":
      case "save":
        this.emit(
          PYTHON_SERVICE_EVENTS.ClUSTERING_PROGRESS,
          progress as ClusteringProgressMessage
        );
        break;
      case "init":
        if (progress.status === "complete") {
          this.emit(PYTHON_SERVICE_EVENTS.READY);
        }
        break;
      default:
        break;
    }
  }

  sendCommand(command: Command) {
    this.shell.send(command);
  }

  shutdown() {
    this.shell.kill();
  }
}
