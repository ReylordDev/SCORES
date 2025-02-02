import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import { CHANNELS } from "../../lib/models";

export function registerSettingsHandlers(settingsService: SettingsService) {
  ipcMain.handle(CHANNELS.SETTINGS.GET, () => {
    return settingsService.currentSettings;
  });
}
