import {
  AppSettings,
  AvailableModelsMessage,
  CachedModelsMessage,
  CHANNEL_TYPES,
  CHANNELS,
  DownloadStatusMessage,
} from "../lib/models";
import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld(CHANNEL_TYPES.SETTINGS, {
  getAll: () => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET_ALL);
  },
  onSettingsChanged: (callback) => {
    const listener = (_: Electron.IpcRendererEvent, settings: AppSettings) =>
      callback(settings);
    ipcRenderer.on(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
    return () => ipcRenderer.off(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
  },
  setDarkMode: (darkMode) => {
    ipcRenderer.invoke(CHANNELS.SETTINGS.SET_DARK_MODE, darkMode);
  },
  setTutorialMode: (tutorialMode) => {
    ipcRenderer.invoke(CHANNELS.SETTINGS.SET_TUTORIAL_MODE, tutorialMode);
  },
} satisfies Window["settings"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.MODELS, {
  onDownloadStatus: (callback) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      status: DownloadStatusMessage
    ) => callback(status);
    ipcRenderer.on(CHANNELS.MODELS.DOWNLOAD_STATUS, listener);
    return () => ipcRenderer.off(CHANNELS.MODELS.DOWNLOAD_STATUS, listener);
  },
  onDefaultModelStatus: (callback) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      status: DownloadStatusMessage
    ) => callback(status);
    ipcRenderer.on(CHANNELS.MODELS.DEFAULT_MODEL_STATUS, listener);
    return () =>
      ipcRenderer.off(CHANNELS.MODELS.DEFAULT_MODEL_STATUS, listener);
  },
  requestModelStatus: (modelName) => {
    ipcRenderer.send(CHANNELS.MODELS.MODEL_STATUS_REQUEST, modelName);
  },
  downloadModel(modelName) {
    ipcRenderer.send(CHANNELS.MODELS.DOWNLOAD_MODEL, modelName);
  },
  requestCachedModels: () => {
    ipcRenderer.send(CHANNELS.MODELS.CACHED_MODELS_REQUEST);
  },
  onReceiveCachedModels: (callback) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      models: CachedModelsMessage
    ) => callback(models);
    ipcRenderer.on(CHANNELS.MODELS.CACHED_MODELS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.MODELS.CACHED_MODELS_RESPONSE, listener);
  },
  onReceiveAvailableModels(callback) {
    const listener = (
      _: Electron.IpcRendererEvent,
      models: AvailableModelsMessage
    ) => callback(models);
    ipcRenderer.on(CHANNELS.MODELS.AVAILABLE_MODELS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.MODELS.AVAILABLE_MODELS_RESPONSE, listener);
  },
  requestAvailableModels() {
    ipcRenderer.send(CHANNELS.MODELS.AVAILABLE_MODELS_REQUEST);
  },
} satisfies Window["models"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ELECTRON, {
  openUrl: (url) => {
    ipcRenderer.send(CHANNELS.ELECTRON.OPEN_URL, url);
  },
  readFile(path) {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.READ_FILE, path);
  },
  getLocale() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOCALE);
  },
  getLogsPath() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOGS_PATH);
  },
  setTitleBarMask(mask) {
    ipcRenderer.send(CHANNELS.ELECTRON.SET_TITLE_BAR_MASK, mask);
  },
  showFilePath(file) {
    return webUtils.getPathForFile(file);
  },
  showItemInFolder(path) {
    ipcRenderer.send(CHANNELS.ELECTRON.SHOW_ITEM_IN_FOLDER, path);
  },
  openDownloadManager() {
    ipcRenderer.send(CHANNELS.ELECTRON.OPEN_DOWNLOAD_MANAGER);
  },
  showMessageBox(options) {
    return ipcRenderer.invoke(
      CHANNELS.ELECTRON.SHOW_MESSAGE_BOX,
      options,
      "download"
    );
  },
} satisfies Window["electron"]);
