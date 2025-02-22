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
} from "./lib/models";

// Handle setup events
if (require("electron-squirrel-startup")) app.quit();

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
    windowManager.closeStartupWindow();
    windowManager.createMainWindow();
  });

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
        progress
      );
    }
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.DATABASE.ALL_RUNS, (data) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DATABASE.ALL_RUNS_RESPONSE,
      data
    );
  });

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_RUN,
    (data: CurrentRunMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_RUN_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS,
    (data: ClusterAssignmentsMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_CLUSTER_SIMILARITIES,
    (data: ClusterSimilaritiesMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_OUTLIERS,
    (data: OutliersMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_OUTLIERS_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.DATABASE.CURRENT_MERGERS,
    (data: MergersMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.DATABASE.CURRENT_MERGERS_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.PLOTS.CLUSTER_POSITIONS,
    (data: ClusterPositionsMessage) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.PLOTS.CLUSTER_POSITIONS_RESPONSE,
        data
      );
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.PLOTS.SELECTION_STATS,
    (data: KSelectionStatistic[]) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.PLOTS.SELECTION_STATS_RESPONSE,
        data
      );
    }
  );

  settingsService.on(
    SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED,
    (settings: AppSettings) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.SETTINGS.SETTINGS_CHANGED,
        settings
      );
    }
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
