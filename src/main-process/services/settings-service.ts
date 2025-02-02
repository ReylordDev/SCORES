import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { AppConfig } from "../utils/config";
import { AppSettings, SETTINGS_SERVICE_EVENTS } from "../../lib/models";

export const DEFAULT_SETTINGS: AppSettings = {};

export class SettingsService extends EventEmitter {
  private settings: AppSettings;
  private settingsPath: string;

  constructor(private config: AppConfig) {
    super();
    this.settingsPath = path.join(config.dataDir, "settings.json");
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        fs.writeFileSync(this.settingsPath, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(fs.readFileSync(this.settingsPath, "utf-8"));
    } catch (error) {
      console.error("Error loading settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  private persistSettings() {
    fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings));
    this.emit(SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED, this.settings);
  }

  get currentSettings(): AppSettings {
    return { ...this.settings };
  }
}
