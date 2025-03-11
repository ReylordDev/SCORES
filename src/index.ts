import { app, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig, consoleLog } from "./lib/config";
import {
  CHANNELS,
  ClusteringProgressMessage,
  ClusterSimilaritiesMessage,
  ClusterAssignmentsMessage,
  CurrentRunMessage,
  PYTHON_SERVICE_EVENTS,
  OutliersMessage,
  MergersMessage,
  SETTINGS_SERVICE_EVENTS,
  AppSettings,
  ClusterPositionsMessage,
  KSelectionStatistic,
  DownloadStatusMessage,
  RawResonsesMessage,
} from "./lib/models";
import { updateElectronApp } from "update-electron-app";

// Handle setup events
if (require("electron-squirrel-startup")) app.quit();

updateElectronApp();

// Initialize core services
const config = new AppConfig();
const windowManager = new WindowManager(config);
const settingsService = new SettingsService(config, windowManager);
const pythonService = new PythonService(config, settingsService);

app.whenReady().then(async () => {
  consoleLog("App ready");
  windowManager.createStartupWindow();

  await pythonService.initialize();

  pythonService.on(PYTHON_SERVICE_EVENTS.READY, () => {
    pythonService.checkDefaultModelStatus();
  });

  let initialized = false;
  let defaultDownloadComplete = false;
  pythonService.on(
    PYTHON_SERVICE_EVENTS.MODELS.DOWNLOAD_STATUS,
    (message: DownloadStatusMessage) => {
      if (!initialized) {
        if (message.status === "downloaded") {
          defaultDownloadComplete = true;
          windowManager.closeStartupWindow();
          windowManager.createMainWindow();
        } else {
          consoleLog("Default Model not downloaded:", message.status);
          windowManager.closeStartupWindow();
          windowManager.createDownloadManagerWindow();
          windowManager.sendDownloadWindowMessage(
            CHANNELS.MODELS.DEFAULT_MODEL_STATUS,
            message,
          );
        }
        initialized = true;
      } else {
        windowManager.sendDownloadWindowMessage(
          CHANNELS.MODELS.DOWNLOAD_STATUS,
          message,
        );
        if (
          message.model_name === settingsService.getDefaultModel() &&
          message.status === "downloaded" &&
          !defaultDownloadComplete
        ) {
          defaultDownloadComplete = true;
          windowManager.closeDownloadWindow();
          windowManager.createMainWindow();
        }
        consoleLog("Download status:", message);
      }
    },
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.FILE_PATH, (filePath: string) => {
    windowManager.sendMainWindowMessage(CHANNELS.FILE.PATH_RESPONSE, filePath);
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.ERROR, (error: string) => {
    consoleLog(error);
    new Notification({
      title: "Critical Error",
      body: error,
    }).show();
    app.quit();
  });

  pythonService.on(
    PYTHON_SERVICE_EVENTS.ClUSTERING_PROGRESS,
    (progress: ClusteringProgressMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.CLUSTERING_PROGRESS.UPDATE,
        progress,
      );
    },
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.DATABASE.ALL_RUNS, (data) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DATABASE.ALL_RUNS_RESPONSE,
      data,
    );
  });

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_RUN,
    (data: CurrentRunMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_RUN_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.FILE.RAW_RESPONSES,
    (data: RawResonsesMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.FILE.RAW_RESPONSES_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS,
    (data: ClusterAssignmentsMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_SIMILARITIES,
    (data: ClusterSimilaritiesMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_OUTLIERS,
    (data: OutliersMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_OUTLIERS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_MERGERS,
    (data: MergersMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_MERGERS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.PLOTS.CLUSTER_POSITIONS,
    (data: ClusterPositionsMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.PLOTS.CLUSTER_POSITIONS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.PLOTS.SELECTION_STATS,
    (data: KSelectionStatistic[]) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.PLOTS.SELECTION_STATS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.MODELS.CACHED_MODELS,
    (data: DownloadStatusMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.MODELS.CACHED_MODELS_RESPONSE,
        data,
      );
      windowManager.sendDownloadWindowMessage(
        CHANNELS.MODELS.CACHED_MODELS_RESPONSE,
        data,
      );
    },
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.MODELS.AVAILABLE_MODELS,
    (data: DownloadStatusMessage) => {
      windowManager.sendDownloadWindowMessage(
        CHANNELS.MODELS.AVAILABLE_MODELS_RESPONSE,
        data,
      );
    },
  );

  settingsService.on(
    SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED,
    (settings: AppSettings) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.SETTINGS.SETTINGS_CHANGED,
        settings,
      );
    },
  );

  registerIpcHandlers(settingsService, pythonService, windowManager, config);
});

// Quit app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  pythonService.shutdown();
  windowManager.cleanup();
});
