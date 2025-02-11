// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { UUID } from "crypto";
import {
  CHANNEL_TYPES,
  CHANNELS,
  FileSettings,
  AlgorithmSettings,
  ClusteringProgressMessage,
  Run,
  ClusteringResult,
  CurrentRunMessage,
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
  getLocale() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOCALE);
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

contextBridge.exposeInMainWorld(CHANNEL_TYPES.DATABASE, {
  requestAllRuns: () => {
    ipcRenderer.send(CHANNELS.DATABASE.ALL_RUNS_REQUEST);
  },
  onReceiveAllRuns: (callback: (runs: Run[]) => void) => {
    ipcRenderer.on(CHANNELS.DATABASE.ALL_RUNS_RESPONSE, (_, runs: Run[]) => {
      callback(runs);
    });
  },
  requestCurrentRun: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_RUN_REQUEST);
  },
  onReceiveCurrentRun: (callback: (currentRun: CurrentRunMessage) => void) => {
    ipcRenderer.on(
      CHANNELS.DATABASE.CURRENT_RUN_RESPONSE,
      (_, currentRun: CurrentRunMessage) => {
        callback(currentRun);
      }
    );
  },
  updateRunName: (runId: UUID, name: string) => {
    ipcRenderer.send(CHANNELS.DATABASE.UPDATE_RUN_NAME, runId, name);
  },
});

contextBridge.exposeInMainWorld(CHANNEL_TYPES.STATE, {
  setRunId: (runId: UUID) => {
    ipcRenderer.send(CHANNELS.STATE.SET_RUN_ID, runId);
  },
});
