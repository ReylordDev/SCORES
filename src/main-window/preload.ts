// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { UUID } from "crypto";
import {
  CHANNEL_TYPES,
  CHANNELS,
  ClusteringProgressMessage,
  Run,
  CurrentRunMessage,
  ClusterAssignmentsMessage,
  ClusterSimilaritiesMessage,
  ClusterNamePayload,
  OutliersMessage,
  MergersMessage,
  AppSettings,
  ClusterPositionsMessage,
  KSelectionStatistic,
  CachedModelsMessage,
  DownloadStatusMessage,
  AvailableModelsMessage,
  RawResonsesMessage,
} from "../lib/models";
import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  webUtils,
} from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(CHANNEL_TYPES.FILE, {
  setPath: (path) => {
    ipcRenderer.send(CHANNELS.FILE.SET_PATH, path);
  },
  requestPath: () => {
    ipcRenderer.send(CHANNELS.FILE.PATH_REQUEST);
  },
  onReceivePath: (callback) => {
    const listener = (_: IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on(CHANNELS.FILE.PATH_RESPONSE, listener);
    return () => ipcRenderer.off(CHANNELS.FILE.PATH_RESPONSE, listener);
  },
  setSettings: (settings) => {
    ipcRenderer.send(CHANNELS.FILE.SET_SETTINGS, settings);
  },
  getExampleFilePath: () => {
    return ipcRenderer.invoke(CHANNELS.FILE.EXAMPLE_FILE_PATH);
  },
  requestRawResponses: () => {
    ipcRenderer.send(CHANNELS.FILE.RAW_RESPONSES_REQUEST);
  },
  onReceiveRawResponses: (callback) => {
    const listener = (_: IpcRendererEvent, rawResponses: RawResonsesMessage) =>
      callback(rawResponses);
    ipcRenderer.on(CHANNELS.FILE.RAW_RESPONSES_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.FILE.RAW_RESPONSES_RESPONSE, listener);
  },
} satisfies Window["file"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ELECTRON, {
  showFilePath(file) {
    return webUtils.getPathForFile(file);
  },
  showItemInFolder(path) {
    ipcRenderer.send(CHANNELS.ELECTRON.SHOW_ITEM_IN_FOLDER, path);
  },
  readFile(path) {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.READ_FILE, path);
  },
  getLogsPath() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOGS_PATH);
  },
  getLocale() {
    return ipcRenderer.invoke(CHANNELS.ELECTRON.GET_LOCALE);
  },
  openUrl(url) {
    ipcRenderer.send(CHANNELS.ELECTRON.OPEN_URL, url);
  },
  setTitleBarMask(mask) {
    ipcRenderer.send(CHANNELS.ELECTRON.SET_TITLE_BAR_MASK, mask);
  },
  openDownloadManager() {
    ipcRenderer.send(CHANNELS.ELECTRON.OPEN_DOWNLOAD_MANAGER);
  },
  showMessageBox(options) {
    return ipcRenderer.invoke(
      CHANNELS.ELECTRON.SHOW_MESSAGE_BOX,
      options,
      "main",
    );
  },
} satisfies Window["electron"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ALGORITHM, {
  setSettings: (settings) => {
    ipcRenderer.send(CHANNELS.ALGORITHM.SET_SETTINGS, settings);
  },
  runClustering: () => {
    ipcRenderer.send(CHANNELS.ALGORITHM.RUN_CLUSTERING);
  },
} satisfies Window["algorithm"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.PROGRESS, {
  onClusteringUpdate: (callback) => {
    const listener = (
      _: IpcRendererEvent,
      progress: ClusteringProgressMessage,
    ) => callback(progress);
    ipcRenderer.on(CHANNELS.CLUSTERING_PROGRESS.UPDATE, listener);
    return () => ipcRenderer.off(CHANNELS.CLUSTERING_PROGRESS.UPDATE, listener);
  },
} satisfies Window["progress"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.DATABASE, {
  requestAllRuns: () => {
    ipcRenderer.send(CHANNELS.DATABASE.ALL_RUNS_REQUEST);
  },
  onReceiveAllRuns: (callback) => {
    const listener = (_: IpcRendererEvent, runs: Run[]) => callback(runs);
    ipcRenderer.on(CHANNELS.DATABASE.ALL_RUNS_RESPONSE, listener);
    return () => ipcRenderer.off(CHANNELS.DATABASE.ALL_RUNS_RESPONSE, listener);
  },
  requestCurrentRun: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_RUN_REQUEST);
  },
  onReceiveCurrentRun: (callback) => {
    const listener = (_: IpcRendererEvent, currentRun: CurrentRunMessage) =>
      callback(currentRun);
    ipcRenderer.on(CHANNELS.DATABASE.CURRENT_RUN_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.DATABASE.CURRENT_RUN_RESPONSE, listener);
  },
  updateRunName: (runId, name) => {
    ipcRenderer.send(CHANNELS.DATABASE.UPDATE_RUN_NAME, runId, name);
  },
  requestCurrentClusterAssignments: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_REQUEST);
  },
  onReceiveCurrentClusterAssignments: (callback) => {
    const listener = (
      _: IpcRendererEvent,
      clusterAssignments: ClusterAssignmentsMessage,
    ) => callback(clusterAssignments);
    ipcRenderer.on(
      CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_RESPONSE,
      listener,
    );
    return () =>
      ipcRenderer.off(
        CHANNELS.DATABASE.CURRENT_CLUSTER_ASSIGNMENTS_RESPONSE,
        listener,
      );
  },
  requestCurrentClusterSimilarities: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_REQUEST);
  },
  onReceiveCurrentClusterSimilarities: (callback) => {
    const listener = (
      _: IpcRendererEvent,
      clusterSimilarities: ClusterSimilaritiesMessage,
    ) => callback(clusterSimilarities);
    ipcRenderer.on(
      CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_RESPONSE,
      listener,
    );
    return () =>
      ipcRenderer.off(
        CHANNELS.DATABASE.CURRENT_CLUSTER_SIMILARITIES_RESPONSE,
        listener,
      );
  },
  updateClusterName: (payload: ClusterNamePayload) => {
    ipcRenderer.send(CHANNELS.DATABASE.UPDATE_CLUSTER_NAME, payload);
  },
  deleteRun: (runId: UUID) => {
    ipcRenderer.send(CHANNELS.DATABASE.DELETE_RUN, runId);
  },
  requestCurrentOutliers: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_OUTLIERS_REQUEST);
  },
  onReceiveCurrentOutliers: (callback) => {
    const listener = (_: IpcRendererEvent, outliers: OutliersMessage) =>
      callback(outliers);
    ipcRenderer.on(CHANNELS.DATABASE.CURRENT_OUTLIERS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.DATABASE.CURRENT_OUTLIERS_RESPONSE, listener);
  },
  requestCurrentMergers: () => {
    ipcRenderer.send(CHANNELS.DATABASE.CURRENT_MERGERS_REQUEST);
  },
  onReceiveCurrentMergers: (callback) => {
    const listener = (_: IpcRendererEvent, mergers: MergersMessage) =>
      callback(mergers);
    ipcRenderer.on(CHANNELS.DATABASE.CURRENT_MERGERS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.DATABASE.CURRENT_MERGERS_RESPONSE, listener);
  },
} satisfies Window["database"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.STATE, {
  setRunId: (runId) => {
    ipcRenderer.send(CHANNELS.STATE.SET_RUN_ID, runId);
  },
  resetRunId: () => {
    ipcRenderer.send(CHANNELS.STATE.RESET_RUN_ID);
  },
} satisfies Window["state"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.SETTINGS, {
  getAll: () => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET_ALL);
  },
  setDarkMode: (darkMode: boolean) => {
    ipcRenderer.send(CHANNELS.SETTINGS.SET_DARK_MODE, darkMode);
  },
  onSettingsChanged: (callback) => {
    const listener = (_: IpcRendererEvent, settings: AppSettings) =>
      callback(settings);
    ipcRenderer.on(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
    return () => ipcRenderer.off(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
  },
  setTutorialMode: (tutorialMode: boolean) => {
    ipcRenderer.send(CHANNELS.SETTINGS.SET_TUTORIAL_MODE, tutorialMode);
  },
} satisfies Window["settings"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.PLOTS, {
  getClusterPositions: () => {
    ipcRenderer.send(CHANNELS.PLOTS.CLUSTER_POSITIONS_REQUEST);
  },
  onReceiveClusterPositions: (callback) => {
    const listener = (
      _: IpcRendererEvent,
      clusterPositions: ClusterPositionsMessage,
    ) => callback(clusterPositions);
    ipcRenderer.on(CHANNELS.PLOTS.CLUSTER_POSITIONS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.PLOTS.CLUSTER_POSITIONS_RESPONSE, listener);
  },
  onReceiveSelectionStats: (callback) => {
    const listener = (_: IpcRendererEvent, stats: KSelectionStatistic[]) =>
      callback(stats);
    ipcRenderer.on(CHANNELS.PLOTS.SELECTION_STATS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.PLOTS.SELECTION_STATS_RESPONSE, listener);
  },
  requestSelectionStats: () => {
    ipcRenderer.send(CHANNELS.PLOTS.SELECTION_STATS_REQUEST);
  },
} satisfies Window["plots"]);

contextBridge.exposeInMainWorld(CHANNEL_TYPES.MODELS, {
  onDownloadStatus: (callback) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      status: DownloadStatusMessage,
    ) => callback(status);
    ipcRenderer.on(CHANNELS.MODELS.DOWNLOAD_STATUS, listener);
    return () => ipcRenderer.off(CHANNELS.MODELS.DOWNLOAD_STATUS, listener);
  },
  onDefaultModelStatus: (callback) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      status: DownloadStatusMessage,
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
      models: CachedModelsMessage,
    ) => callback(models);
    ipcRenderer.on(CHANNELS.MODELS.CACHED_MODELS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.MODELS.CACHED_MODELS_RESPONSE, listener);
  },
  onReceiveAvailableModels(callback) {
    const listener = (
      _: Electron.IpcRendererEvent,
      models: AvailableModelsMessage,
    ) => callback(models);
    ipcRenderer.on(CHANNELS.MODELS.AVAILABLE_MODELS_RESPONSE, listener);
    return () =>
      ipcRenderer.off(CHANNELS.MODELS.AVAILABLE_MODELS_RESPONSE, listener);
  },
  requestAvailableModels() {
    ipcRenderer.send(CHANNELS.MODELS.AVAILABLE_MODELS_REQUEST);
  },
} satisfies Window["models"]);
