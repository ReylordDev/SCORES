import { BrowserWindow, nativeTheme } from "electron";
import { AppConfig } from "../../lib/config";
import path from "path";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const STARTUP_WINDOW_WEBPACK_ENTRY: string;
declare const STARTUP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const DOWNLOAD_WINDOW_WEBPACK_ENTRY: string;
declare const DOWNLOAD_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager {
  private mainWindow: BrowserWindow;
  private startupWindow: BrowserWindow;
  private downloadManagerWindow: BrowserWindow;
  private darkMode = false;
  private titleBarMask = false;

  constructor(private config: AppConfig) {}

  private readonly lightModeHex = "#f8f4fd";
  private readonly darkModeHex = "#07020d";
  private readonly maskedLightModeHex = "#323133";
  private readonly maskedDarkModeHex = "#010003";
  private readonly titleBarHeight = 60;
  createMainWindow() {
    const mainWindow = new BrowserWindow({
      width: 1440,
      height: 1024,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: nativeTheme.shouldUseDarkColors
          ? this.darkModeHex
          : this.lightModeHex,
        symbolColor: nativeTheme.shouldUseDarkColors
          ? this.lightModeHex
          : this.darkModeHex,
        height: this.titleBarHeight,
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

  private styleMainWindowTitleBar() {
    if (this.titleBarMask) {
      this.mainWindow.setTitleBarOverlay({
        color: this.darkMode ? this.maskedDarkModeHex : this.maskedLightModeHex,
        symbolColor: this.darkMode
          ? this.maskedLightModeHex
          : this.maskedDarkModeHex,
      });
    } else {
      this.mainWindow.setTitleBarOverlay({
        color: this.darkMode ? this.darkModeHex : this.lightModeHex,
        symbolColor: this.darkMode ? this.lightModeHex : this.darkModeHex,
      });
    }
  }

  setMainWindowTitleBarTheme(darkMode: boolean) {
    this.darkMode = darkMode;
    this.styleMainWindowTitleBar();
  }

  setMainWindowTitleBarMask(mask: boolean) {
    this.titleBarMask = mask;
    this.styleMainWindowTitleBar();
  }

  createStartupWindow() {
    const startupWindow = new BrowserWindow({
      width: 400,
      height: 400,
      frame: false,
      resizable: false,
      icon: path.join(this.config.rootDir, "assets", "icons", "icon.png"),
      webPreferences: {
        preload: STARTUP_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });

    startupWindow.loadURL(STARTUP_WINDOW_WEBPACK_ENTRY);
    this.startupWindow = startupWindow;
  }

  toggleMainWindow() {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
    }
  }

  sendMainWindowMessage(channel: string, data?: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }
  getStartupWindow() {
    return this.startupWindow;
  }
  getDownloadWindow() {
    return this.downloadManagerWindow;
  }

  closeStartupWindow() {
    if (this.startupWindow) {
      this.startupWindow.close();
    }
  }

  closeDownloadWindow() {
    if (this.downloadManagerWindow) {
      this.downloadManagerWindow.close();
    }
  }

  createDownloadManagerWindow() {
    const downloadManagerWindow = new BrowserWindow({
      width: 1440,
      height: 1024,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: nativeTheme.shouldUseDarkColors
          ? this.darkModeHex
          : this.lightModeHex,
        symbolColor: nativeTheme.shouldUseDarkColors
          ? this.lightModeHex
          : this.darkModeHex,
        height: this.titleBarHeight,
      },
      title: "Download Manager",
      icon: path.join(this.config.rootDir, "assets", "icons", "icon.png"),
      useContentSize: true,
      webPreferences: {
        preload: DOWNLOAD_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });

    downloadManagerWindow.loadURL(DOWNLOAD_WINDOW_WEBPACK_ENTRY);
    this.downloadManagerWindow = downloadManagerWindow;
  }

  sendDownloadWindowMessage(channel: string, data?: unknown) {
    if (
      this.downloadManagerWindow &&
      !this.downloadManagerWindow.isDestroyed()
    ) {
      this.downloadManagerWindow.webContents.send(channel, data);
    }
  }

  cleanup() {
    if (this.mainWindow) {
      this.mainWindow.destroy();
    }
    if (this.startupWindow) {
      this.startupWindow.destroy();
    }
    if (this.downloadManagerWindow) {
      this.downloadManagerWindow.destroy();
    }
  }
}
