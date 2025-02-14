import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import { CHANNELS } from "../../lib/models";

export function registerSettingsHandlers(settingsService: SettingsService) {
  ipcMain.handle(CHANNELS.SETTINGS.GET_ALL, () => {
    return settingsService.currentSettings;
  });

  ipcMain.on(CHANNELS.SETTINGS.SET_DARK_MODE, (_, darkMode: boolean) => {
    settingsService.setDarkMode(darkMode);
  });
}
