import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";
import { registerSettingsHandlers } from "./settings";
import {
  app,
  BaseWindow,
  dialog,
  ipcMain,
  MessageBoxOptions,
  shell,
} from "electron";
import {
  CHANNELS,
  FileSettings,
  AlgorithmSettings,
  ClusterNamePayload,
} from "../../lib/models";
import fs from "fs";
import { AppConfig } from "../../lib/config";
import { UUID } from "crypto";
import { WindowManager } from "../windows/window-manager";
import path from "path";
export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
  windowManager: WindowManager,
  config: AppConfig,
) {
  registerSettingsHandlers(settingsService);

  // Register additional IPC handlers here
  ipcMain.on(CHANNELS.FILE.SET_PATH, (_, filePath: string) => {
    pythonService.sendCommand({
      action: "set_file_path",
      data: { filePath },
    });
  });

  ipcMain.on(CHANNELS.FILE.PATH_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_file_path",
    });
  });

  ipcMain.handle(CHANNELS.FILE.EXAMPLE_FILE_PATH, async () => {
    return path.join(config.rootDir, "example_data", "example.csv");
  });

  ipcMain.on(CHANNELS.FILE.SET_SETTINGS, (_, settings: FileSettings) => {
    pythonService.sendCommand({
      action: "set_file_settings",
      data: settings,
    });
  });

  ipcMain.on(
    CHANNELS.ALGORITHM.SET_SETTINGS,
    (_, settings: AlgorithmSettings) => {
      pythonService.sendCommand({
        action: "set_algorithm_settings",
        data: settings,
      });
    },
  );

  ipcMain.on(CHANNELS.ALGORITHM.RUN_CLUSTERING, () => {
    pythonService.sendCommand({
      action: "run_clustering",
    });
  });

  ipcMain.handle(CHANNELS.ELECTRON.READ_FILE, async (_, path: string) => {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(path, "utf-8", (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(data);
      });
    });
  });

  ipcMain.handle(CHANNELS.ELECTRON.GET_LOGS_PATH, async () => {
    return config.dataDir + "/logs";
  });

  ipcMain.on(CHANNELS.ELECTRON.SHOW_ITEM_IN_FOLDER, (_, path: string) => {
    shell.showItemInFolder(path);
  });

  ipcMain.handle(CHANNELS.ELECTRON.GET_LOCALE, async () => {
    return app.getLocale();
  });

  ipcMain.on(CHANNELS.ELECTRON.OPEN_URL, (_, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.on(CHANNELS.ELECTRON.SET_TITLE_BAR_MASK, (_, mask: boolean) => {
    windowManager.setMainWindowTitleBarMask(mask);
  });

  ipcMain.on(CHANNELS.ELECTRON.OPEN_DOWNLOAD_MANAGER, () => {
    windowManager.createDownloadManagerWindow();
  });

  ipcMain.handle(
    CHANNELS.ELECTRON.SHOW_MESSAGE_BOX,
    (_, options: MessageBoxOptions, windowString: "main" | "download") => {
      let window: BaseWindow;
      if (windowString === "main") {
        window = windowManager.getMainWindow();
      } else if (windowString === "download") {
        window = windowManager.getDownloadWindow();
      }
      return dialog.showMessageBox(window, options);
    },
  );

  ipcMain.on(CHANNELS.DATABASE.ALL_RUNS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_runs",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.CURRENT_RUN_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_current_run",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_cluster_assignments",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_cluster_similarities",
    });
  });

  ipcMain.on(
    CHANNELS.DATABASE.UPDATE_CLUSTER_NAME,
    (_, payload: ClusterNamePayload) => {
      pythonService.sendCommand({
        action: "update_cluster_name",
        data: payload,
      });
    },
  );

  ipcMain.on(CHANNELS.FILE.RAW_RESPONSES_REQUEST, () => {
    pythonService.sendCommand({
      action: "fetch_raw_responses",
    });
  });

  ipcMain.on(CHANNELS.STATE.SET_RUN_ID, (_, runId: UUID) => {
    pythonService.sendCommand({
      action: "set_run_id",
      data: {
        runId,
      },
    });
  });

  ipcMain.on(CHANNELS.STATE.RESET_RUN_ID, () => {
    pythonService.sendCommand({
      action: "reset_run_id",
    });
  });

  ipcMain.on(
    CHANNELS.DATABASE.UPDATE_RUN_NAME,
    (_, runId: UUID, name: string) => {
      pythonService.sendCommand({
        action: "update_run_name",
        data: {
          runId,
          name,
        },
      });
    },
  );

  ipcMain.on(CHANNELS.DATABASE.DELETE_RUN, (_, runId: UUID) => {
    pythonService.sendCommand({
      action: "delete_run",
      data: {
        runId,
      },
    });
  });

  ipcMain.on(CHANNELS.DATABASE.CURRENT_OUTLIERS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_outliers",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.CURRENT_MERGERS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_mergers",
    });
  });

  ipcMain.on(CHANNELS.PLOTS.CLUSTER_POSITIONS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_cluster_positions",
    });
  });

  ipcMain.on(CHANNELS.PLOTS.SELECTION_STATS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_selection_statistics",
    });
  });

  ipcMain.on(CHANNELS.MODELS.MODEL_STATUS_REQUEST, (_, modelName: string) => {
    pythonService.sendCommand({
      action: "get_download_status",
      data: {
        modelName,
      },
    });
  });

  ipcMain.on(CHANNELS.MODELS.DOWNLOAD_MODEL, (_, modelName: string) => {
    pythonService.sendCommand({
      action: "download_model",
      data: {
        modelName,
      },
    });
  });

  ipcMain.on(CHANNELS.MODELS.CACHED_MODELS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_cached_models",
    });
  });

  ipcMain.on(CHANNELS.MODELS.AVAILABLE_MODELS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_available_models",
    });
  });
}
