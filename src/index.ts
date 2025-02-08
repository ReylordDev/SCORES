import { app, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig, consoleLog } from "./lib/config";
import {
  CHANNELS,
  ClusteringProgressMessage,
  PYTHON_SERVICE_EVENTS,
} from "./lib/models";

// Handle setup events
if (require("electron-squirrel-startup")) app.quit();

// Initialize core services
const config = new AppConfig();
const settingsService = new SettingsService(config);
const pythonService = new PythonService(config, settingsService);
const windowManager = new WindowManager(config);

app.whenReady().then(async () => {
  await pythonService.initialize();
  windowManager.createMainWindow();

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

  registerIpcHandlers(settingsService, pythonService, config);
});

// Quit app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  pythonService.shutdown();
  windowManager.cleanup();
});
