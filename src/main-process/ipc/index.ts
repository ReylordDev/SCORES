import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";
import { registerURLHandlers } from "./url";
import { registerSettingsHandlers } from "./settings";
import { app, ipcMain, shell } from "electron";
import { CHANNELS, FileSettings, AlgorithmSettings } from "../../lib/models";
import fs from "fs";
import { AppConfig } from "../../lib/config";
import { UUID } from "crypto";

export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
  config: AppConfig
) {
  registerSettingsHandlers(settingsService);
  registerURLHandlers();

  // Register additional IPC handlers here
  ipcMain.on(CHANNELS.FILE.SET_PATH, (_, filePath: string) => {
    console.log(`Received file path: ${filePath}`);
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
    }
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

  ipcMain.on(CHANNELS.STATE.SET_RUN_ID, (_, runId: UUID) => {
    pythonService.sendCommand({
      action: "set_run_id",
      data: {
        runId,
      },
    });
  });
}
