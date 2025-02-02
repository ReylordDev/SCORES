import { SettingsService } from "../services/settings-service";
import { registerURLHandlers } from "./url";
import { registerSettingsHandlers } from "./settings";

export function registerIpcHandlers(settingsService: SettingsService) {
  registerSettingsHandlers(settingsService);
  registerURLHandlers();
}
