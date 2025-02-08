// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  CHANNEL_TYPES,
  CHANNELS,
  FileSettings,
  AlgorithmSettings,
  ClusteringProgressMessage,
} from "../lib/models";
import { contextBridge, ipcRenderer, webUtils } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(CHANNEL_TYPES.FILE, {
  setPath: (path: string) => {
    ipcRenderer.send(CHANNELS.FILE.SET_PATH, path);
  },
  requestPath: () => {
    ipcRenderer.send(CHANNELS.FILE.PATH_REQUEST);
  },
  onReceivePath: (callback: (path: string) => void) => {
    ipcRenderer.on(CHANNELS.FILE.PATH_RESPONSE, (_, path: string) => {
      callback(path);
    });
  },
  setSettings: (settings: FileSettings) => {
    ipcRenderer.send(CHANNELS.FILE.SET_SETTINGS, settings);
  },
});

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ELECTRON, {
  showFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
  showItemInFolder(path: string) {
    ipcRenderer.send(CHANNELS.ELECTRON.SHOW_ITEM_IN_FOLDER, path);
  },
  readFile(path: string): Promise<string> {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.READ_FILE, path);
  },
  getLogsPath() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOGS_PATH);
  },
});

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ALGORITHM, {
  setSettings: (settings: AlgorithmSettings) => {
    ipcRenderer.send(CHANNELS.ALGORITHM.SET_SETTINGS, settings);
  },
  runClustering: () => {
    ipcRenderer.send(CHANNELS.ALGORITHM.RUN_CLUSTERING);
  },
});

contextBridge.exposeInMainWorld(CHANNEL_TYPES.PROGRESS, {
  onClusteringUpdate: (
    callback: (progress: ClusteringProgressMessage) => void
  ) => {
    ipcRenderer.on(
      CHANNELS.CLUSTERING_PROGRESS.UPDATE,
      (_, progress: ClusteringProgressMessage) => {
        callback(progress);
      }
    );
  },
});
