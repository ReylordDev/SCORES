import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { EOL as endOfLine } from "os";
import { AppConfig, consoleError, consoleLog } from "../../lib/config";
import {
  Command,
  Message,
  ProgressMessage,
  PYTHON_SERVICE_EVENTS,
  Error,
  ClusteringProgressMessage,
  ClusterAssignmentsMessage,
  ClusterSimilaritiesMessage,
  Run,
  CurrentRunMessage,
  OutliersMessage,
  MergersMessage,
} from "../../lib/models";
import { SettingsService } from "./settings-service";
import { spawn, ChildProcess } from "child_process";

export class PythonService extends EventEmitter {
  private shell: PythonShell;
  private childProcess: ChildProcess;

  constructor(
    private config: AppConfig,
    private settingsService: SettingsService
  ) {
    super();
  }

  async initialize() {
    if (this.config.isPackaged) {
      // TODO: Implement bundled mode
      this.childProcess = spawn(this.config.scriptPath, [], {
        cwd: this.config.dataDir,
        serialization: "json",
        env: {
          ...process.env,
          PRODUCTION: String(!this.config.isDev),
          USER_DATA_PATH: this.config.dataDir,
          LOG_LEVEL: "INFO",
        },
      });

      this.childProcess.stdout.on("data", (data: Buffer) => {
        consoleLog("Child process stdout:", data.toString());
        try {
          if (data.toString()) {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          }
        } catch (error) {
          consoleError("Error parsing stdout message:", error);
        }
      });
      this.childProcess.stderr.on("data", (data: Buffer) => {
        consoleError("Child process stderr:", data.toString());
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          consoleError("Error parsing stderr message:", error);
        }
      });
      this.childProcess.on("error", (error) => {
        consoleError("Child process error:", error);
        this.emit(PYTHON_SERVICE_EVENTS.ERROR, "Child process error");
      });
      this.childProcess.on("close", () => {
        consoleLog("Child process closed");
        this.emit(PYTHON_SERVICE_EVENTS.ERROR, "Child process closed");
      });
    } else {
      this.shell = new PythonShell(this.config.scriptPath, {
        pythonPath: this.config.pythonPath,
        cwd: this.config.dataDir,
        mode: "json",
        env: {
          ...process.env,
          PRODUCTION: String(!this.config.isDev),
          USER_DATA_PATH: this.config.dataDir,
          LOG_LEVEL: "DEBUG",
        },
      });
      this.shell.on("message", this.handleMessage.bind(this));
    }

    consoleLog("Python service initialized");
  }

  private handleMessage(message: Message) {
    consoleLog("Received message:", message);
    switch (message.type) {
      case "progress":
        this.handleProgress(message.data as ProgressMessage);
        break;
      case "file_path":
        this.emit(PYTHON_SERVICE_EVENTS.FILE_PATH, message.data as string);
        break;
      case "error":
        consoleLog("Error:", message.data);
        this.emit(PYTHON_SERVICE_EVENTS.ERROR, (message.data as Error).error);
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
      case "cluster_assignments":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS,
          message.data as ClusterAssignmentsMessage
        );
        break;
      case "cluster_similarities":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_SIMILARITIES,
          message.data as ClusterSimilaritiesMessage
        );
        break;
      case "outliers":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_OUTLIERS,
          message.data as OutliersMessage
        );
        break;
      case "mergers":
        this.emit(
          PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_MERGERS,
          message.data as MergersMessage
        );
        break;
      default:
        consoleLog("Unknown message type:", message.type);
        this.emit(PYTHON_SERVICE_EVENTS.ERROR, "Unknown message type");
    }
  }

  private handleProgress(progress: ProgressMessage) {
    consoleLog(`Progress: ${progress.step} - ${progress.status}`);
    switch (progress.step) {
      // Actions
      case "set_file_path":
      case "get_file_path":
      case "set_file_settings":
      case "set_algorithm_settings":
      case "run_clustering":
        break;

      // Clustering steps
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

      // Application Progress steps
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
    consoleLog("Sending command:", command);
    if (this.config.isPackaged) {
      this.childProcess.stdin.write(JSON.stringify(command) + endOfLine);
    } else {
      this.shell.send(command);
    }
  }

  shutdown() {
    if (this.config.isPackaged) {
      this.childProcess.kill();
    } else {
      this.shell.kill();
    }
  }
}
