import { BrowserWindow, nativeTheme } from "electron";
import { AppConfig } from "../../lib/config";
import path from "path";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager {
  private mainWindow: BrowserWindow;

  constructor(private config: AppConfig) {}

  createMainWindow() {
    const mainWindow = new BrowserWindow({
      width: 1440,
      height: 1024,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: nativeTheme.shouldUseDarkColors
          ? "rgba(0,0,0,0)"
          : "rgba(255,255,255,0)",
        symbolColor: nativeTheme.shouldUseDarkColors ? "#eddcf9" : "#160622",
        height: 60,
      },
      icon: path.join(this.config.rootDir, "assets", "icons", "icon.png"),
      useContentSize: true,
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    this.mainWindow = mainWindow;
  }

  toggleMainWindow() {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
    }
  }

  sendMainWindowMessage(channel: string, data?: unknown) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  cleanup() {
    if (this.mainWindow) {
      this.mainWindow.destroy();
    }
  }
}
