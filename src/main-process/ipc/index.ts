import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";
import { registerURLHandlers } from "./url";
import { registerSettingsHandlers } from "./settings";
import { ipcMain } from "electron";
import { CHANNELS } from "../../lib/models";

export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService
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
}
