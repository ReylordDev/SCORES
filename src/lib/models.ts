// Python Models
// These have to match the models in models.py

import { UUID } from "crypto";
import { MessageBoxOptions, MessageBoxReturnValue } from "electron";

type Action =
  | "set_file_path"
  | "get_file_path"
  | "set_file_settings"
  | "set_algorithm_settings"
  | "run_clustering"
  | "get_runs"
  | "get_current_run"
  | "set_run_id"
  | "reset_run_id"
  | "update_run_name"
  | "get_cluster_assignments"
  | "get_cluster_similarities"
  | "update_cluster_name"
  | "delete_run"
  | "get_outliers"
  | "get_mergers"
  | "get_cluster_positions"
  | "get_selection_statistics"
  | "get_download_status"
  | "download_model"
  | "get_cached_models"
  | "get_available_models"
  | "fetch_raw_responses";

export interface ClusterNamePayload {
  clusterId: UUID;
  name: string;
}

export interface Command {
  action: Action;
  data?:
    | { filePath: string }
    | FileSettings
    | AlgorithmSettings
    | null
    | { runId: UUID }
    | { runId: UUID; name: string }
    | ClusterNamePayload
    | { modelName: string };
}

export type ClusteringStep =
  | "start"
  | "process_input_file"
  | "load_model"
  | "embed_responses"
  | "detect_outliers"
  | "find_optimal_k"
  | "cluster"
  | "merge"
  | "save";

export interface ProgressMessage {
  step: ClusteringStep | Action | "init";
  status: "todo" | "start" | "complete" | "error";
  timestamp: number;
}

export interface ClusteringProgressMessage {
  step: ClusteringStep;
  status: "todo" | "start" | "complete" | "error";
  timestamp: number;
}

export interface CurrentRunMessage {
  run: Run;
  timesteps: Timesteps;
}

export interface _ClusterAssignmentDetail {
  id: UUID;
  index: number;
  name: string;
  is_merger_result: boolean;
  responses: Response[];
  count: number;
}

export interface ClusterAssignmentsMessage {
  clusters: _ClusterAssignmentDetail[];
}

export interface _ClusterSimilarityDetail {
  id: UUID;
  index: number;
  name: string;
  is_merger_result: boolean;
  responses: Response[];
  similarity_pairs: Record<UUID, number>;
  count: number;
}

export interface ClusterSimilaritiesMessage {
  clusters: _ClusterSimilarityDetail[];
}

export interface _OutlierDetail {
  id: UUID;
  response: Response;
  similarity: number;
}

export interface OutliersMessage {
  outliers: _OutlierDetail[];
  threshold: number;
}

export interface _ClusterMergerDetail {
  id: UUID;
  index: number;
  name: string;
  responses: Response[];
  count: number;
}

export interface _MergerDetail {
  id: UUID;
  name: string;
  clusters: _ClusterMergerDetail[];
  similarity_pairs: SimilarityPair[];
}

export interface MergersMessage {
  mergers: _MergerDetail[];
  threshold: number;
}

export interface ResponsePositionDetail {
  id: UUID;
  text: string;
  is_outlier: boolean;
  count: number;
  pos_2d: { x: number; y: number };
  pos_3d: { x: number; y: number; z: number };
}

export interface ClusterPositionDetail {
  id: UUID;
  name: string;
  index: number;
  count: number;
  pos_2d: { x: number; y: number };
  pos_3d: { x: number; y: number; z: number };
  responses: ResponsePositionDetail[];
  color: string; // HSL color
}

export interface ClusterPositionsMessage {
  clusters: ClusterPositionDetail[];
}

export interface Error {
  error: string;
}

export type DownloadStatusType =
  | "not_downloaded"
  | "partially_downloaded"
  | "downloading"
  | "downloaded";

export interface DownloadStatusMessage {
  model_name: string;
  status: DownloadStatusType;
}

export interface EmbeddingModel {
  id: string;
  author?: string;
  created_at?: number;
  downloads?: number;
  likes?: number;
  trending_score?: number;
  tags?: string[];
  status: DownloadStatusType;
}

export interface CachedModel extends EmbeddingModel {
  path: string;
  size_on_disk: number;
  last_accessed: number;
}

export interface CachedModelsMessage {
  models: CachedModel[];
}

export interface AvailableModelsMessage {
  models: EmbeddingModel[];
}

export interface RawResonsesMessage {
  responses: string[];
}

export interface Message {
  type:
    | "progress"
    | "error"
    | "file_path"
    | "runs"
    | "run"
    | "cluster_assignments"
    | "cluster_similarities"
    | "outliers"
    | "mergers"
    | "cluster_positions"
    | "selection_statistics"
    | "download_status"
    | "cached_models"
    | "available_models"
    | "raw_responses";
  data:
    | ProgressMessage
    | Error
    | string
    | null
    | Run[]
    | ClusterAssignmentsMessage
    | ClusterSimilaritiesMessage
    | CurrentRunMessage
    | OutliersMessage
    | MergersMessage
    | ClusterPositionsMessage
    | KSelectionStatistic[]
    | DownloadStatusMessage
    | CachedModelsMessage
    | AvailableModelsMessage
    | RawResonsesMessage;
}

export interface FileSettings {
  delimiter: string;
  has_header: boolean;
  selected_columns: number[];
}

interface AutomaticClusterCount {
  cluster_count_method: "auto";
  max_clusters: number;
  min_clusters: number;
}

interface ManualClusterCount {
  cluster_count_method: "manual";
  cluster_count: number;
}

export type ClusterCount = AutomaticClusterCount | ManualClusterCount;

export interface OutlierDetectionSettings {
  nearest_neighbors: number;
  z_score_threshold: number;
}

export interface AgglomerativeClusteringSettings {
  similarity_threshold: number;
  iterative: boolean;
}

export interface AdvancedSettings {
  embedding_model?: string;
  kmeans_method: "spherical_kmeans" | "kmeans";
}

export interface AlgorithmSettings {
  method: ClusterCount;
  excluded_words: string[];
  outlier_detection?: OutlierDetectionSettings;
  agglomerative_clustering?: AgglomerativeClusteringSettings;
  advanced_settings: AdvancedSettings;
  random_state: number;
}

export interface ManifoldPosition2d {
  id: UUID;
  x: number;
  y: number;
  response: Response | null;
  cluster: Cluster | null;
}

export interface ManifoldPosition3d {
  id: UUID;
  x: number;
  y: number;
  z: number;
  response: Response | null;
  cluster: Cluster | null;
}

export interface Response {
  id: UUID;
  text: string;
  embedding: number[] | null;
  is_outlier: boolean;
  similarity: number | null;
  count: number;
  manifold_position2d: ManifoldPosition2d | null;
  manifold_position3d: ManifoldPosition3d | null;
  cluster_id: UUID | null;
  cluster: Cluster | null;
  outlier_statistic: OutlierStatistic | null;
}

export interface Cluster {
  id: UUID;
  index: number;
  name: string;
  center: number[];
  responses: Response[];
  count: number;
  is_merger_result: boolean;
  manifold_position2d: ManifoldPosition2d | null;
  manifold_position3d: ManifoldPosition3d | null;

  result_id: UUID;
  result: ClusteringResult;

  merger_id: UUID;
  merger: Merger;

  similarity_pair_id: UUID;
  similarity_pair: SimilarityPair;
}

interface OutlierStatistic {
  id: UUID;
  similarity: number;

  response_id: UUID;
  response: Response;

  outlier_statistics_id: UUID;
  outlier_statistics: OutlierStatistics;
}

interface OutlierStatistics {
  id: UUID;
  threshold: number;
  outliers: OutlierStatistic[];

  clustering_result_id: UUID;
  clustering_result: ClusteringResult;
}

export interface SimilarityPair {
  id: UUID;
  similarity: number;

  cluster_1_id: UUID;
  cluster_2_id: UUID;

  cluster_1: Cluster;
  cluster_2: Cluster;

  merger_id: UUID;
  merger: Merger;

  result_id: UUID;
  result: ClusteringResult;
}

interface Merger {
  id: UUID;
  name: string;
  clusters: Cluster[];
  similarity_pairs: SimilarityPair[];

  merging_statistics_id: UUID;
  merging_statistics: MergingStatistics;
}

interface MergingStatistics {
  id: UUID;
  threshold: number;
  mergers: Merger[];

  clustering_result_id: UUID;
  clustering_result: ClusteringResult;
}

export interface Timesteps {
  id: UUID;
  total_duration: number;
  steps: Record<ClusteringStep, number>;
}

export interface KSelectionStatistic {
  id: UUID;
  k: number;
  silhouette: number | null;
  davies_bouldin: number | null;
  calinski_harabasz: number | null;
  combined: number | null;

  clustering_result_id: UUID;
  clustering_result: ClusteringResult;
}

export interface ClusteringResult {
  id: UUID;
  clusters: Cluster[];
  outlier_statistics: OutlierStatistics;
  merger_statistics: MergingStatistics;
  inter_cluster_similarities: SimilarityPair[];
  timesteps: Timesteps;
  k_selection_statistics: KSelectionStatistic[] | null;
  run_id: UUID;
  run: Run;
  all_responses: Response[];
}

export interface Run {
  id: UUID;
  name: string;
  file_path: string;
  output_file_path: string;
  assignments_file_path: string;
  created_at: number;
  file_settings: string; // FileSettings;
  algorithm_settings: string; //AlgorithmSettings;
}

// Frontend-only models

export const progressionMessages: Record<ClusteringStep, string> = {
  start: "Starting clustering process",
  process_input_file: "Reading input file",
  load_model: "Loading language model",
  embed_responses: "Embedding responses",
  detect_outliers: "Detecting outliers",
  find_optimal_k: "Finding optimal cluster count",
  cluster: "Clustering",
  merge: "Merging clusters",
  save: "Saving results",
};

export interface AppSettings {
  darkMode: boolean;
  tutorialMode: boolean;
  defaultModel: string;
}

declare global {
  interface Window {
    electron: {
      showFilePath: (file: File) => string;
      showItemInFolder: (path: string) => void;
      readFile: (path: string) => Promise<string>;
      getLogsPath: () => Promise<string>;
      getLocale: () => Promise<string>;
      openUrl: (url: string) => void;
      setTitleBarMask: (mask: boolean) => void;
      openDownloadManager: () => void;
      showMessageBox: (
        options: MessageBoxOptions,
      ) => Promise<MessageBoxReturnValue>;
    };
    settings: {
      getAll: () => Promise<AppSettings>;
      setDarkMode: (darkMode: boolean) => void;
      setTutorialMode: (tutorialMode: boolean) => void;
      onSettingsChanged: (
        callback: (settings: AppSettings) => void,
      ) => () => void;
    };
    file: {
      setPath: (path: string) => void;
      requestPath: () => void;
      onReceivePath: (callback: (path: string) => void) => () => void;
      setSettings: (settings: FileSettings) => void;
      getExampleFilePath: () => Promise<string>;
      requestRawResponses: () => void;
      onReceiveRawResponses: (
        callback: (responses: RawResonsesMessage) => void,
      ) => () => void;
    };
    algorithm: {
      setSettings: (settings: AlgorithmSettings) => void;
      runClustering: () => void;
    };
    progress: {
      onClusteringUpdate: (
        callback: (progress: ClusteringProgressMessage) => void,
      ) => () => void;
    };
    database: {
      requestAllRuns: () => void;
      onReceiveAllRuns: (callback: (runs: Run[]) => void) => () => void;
      requestCurrentRun: () => void;
      onReceiveCurrentRun: (
        callback: (currentRun: CurrentRunMessage) => void,
      ) => () => void;
      updateRunName: (runId: UUID, name: string) => void;
      requestCurrentClusterAssignments: () => void;
      onReceiveCurrentClusterAssignments: (
        callback: (clusterAssignemnts: ClusterAssignmentsMessage) => void,
      ) => () => void;
      requestCurrentClusterSimilarities: () => void;
      onReceiveCurrentClusterSimilarities: (
        callback: (clusterSimilarities: ClusterSimilaritiesMessage) => void,
      ) => () => void;
      updateClusterName: (payload: ClusterNamePayload) => void;
      deleteRun: (runId: UUID) => void;
      requestCurrentOutliers: () => void;
      onReceiveCurrentOutliers: (
        callback: (outliers: OutliersMessage) => void,
      ) => () => void;
      requestCurrentMergers: () => void;
      onReceiveCurrentMergers: (
        callback: (mergers: MergersMessage) => void,
      ) => () => void;
    };
    state: {
      setRunId: (runId: UUID) => void;
      resetRunId: () => void;
    };
    plots: {
      getClusterPositions: () => void;
      onReceiveClusterPositions: (
        callback: (clusterPositions: ClusterPositionsMessage) => void,
      ) => () => void;
      requestSelectionStats: () => void;
      onReceiveSelectionStats: (
        callback: (selectionStats: KSelectionStatistic[]) => void,
      ) => () => void;
    };
    models: {
      onDownloadStatus: (
        callback: (status: DownloadStatusMessage) => void,
      ) => () => void;
      onDefaultModelStatus: (
        callback: (status: DownloadStatusMessage) => void,
      ) => () => void;
      requestModelStatus: (modelName: string) => void;
      downloadModel(modelName: string): void;
      requestCachedModels: () => void;
      onReceiveCachedModels: (
        callback: (models: CachedModelsMessage) => void,
      ) => () => void;
      requestAvailableModels: () => void;
      onReceiveAvailableModels: (
        callback: (models: AvailableModelsMessage) => void,
      ) => () => void;
    };
  }
}

export const CHANNEL_TYPES = {
  ELECTRON: "electron",
  SETTINGS: "settings",
  FILE: "file",
  ALGORITHM: "algorithm",
  PROGRESS: "progress",
  DATABASE: "database",
  STATE: "state",
  PLOTS: "plots",
  MODELS: "models",
};
export const CHANNELS = {
  ELECTRON: {
    READ_FILE: "electron:read-file",
    GET_LOGS_PATH: "electron:get-logs-path",
    SHOW_ITEM_IN_FOLDER: "electron:show-item-in-folder",
    GET_LOCALE: "electron:get-locale",
    OPEN_URL: "electron:open-url",
    SET_TITLE_BAR_MASK: "electron:set-title-bar-mask",
    OPEN_DOWNLOAD_MANAGER: "electron:open-download-manager",
    SHOW_MESSAGE_BOX: "electron:show-message-box",
  },
  SETTINGS: {
    GET_ALL: "settings:get-all",
    SET_DARK_MODE: "settings:set-dark-mode",
    SET_TUTORIAL_MODE: "settings:set-tutorial-mode",
    SETTINGS_CHANGED: "settings:settings-changed",
  },
  FILE: {
    SET_PATH: "file:set-path",
    PATH_REQUEST: "file:get-path",
    PATH_RESPONSE: "file:path",
    SET_SETTINGS: "file:set-settings",
    EXAMPLE_FILE_PATH: "file:example-file-path",
    RAW_RESPONSES_REQUEST: "file:raw-responses-request",
    RAW_RESPONSES_RESPONSE: "file:raw-responses-response",
  },
  ALGORITHM: {
    SET_SETTINGS: "algorithm:set-settings",
    RUN_CLUSTERING: "algorithm:run-clustering",
  },
  CLUSTERING_PROGRESS: {
    UPDATE: "cluster-progress:update",
  },
  DATABASE: {
    ALL_RUNS_REQUEST: "database:all-runs-request",
    ALL_RUNS_RESPONSE: "database:all-runs-response",
    CURRENT_RUN_REQUEST: "database:current-run-request",
    CURRENT_RUN_RESPONSE: "database:current-run-response",
    UPDATE_RUN_NAME: "database:update-run-name",
    CURRENT_CLUSTER_ASSIGNMENTS_REQUEST: "database:current-clusters-request",
    CURRENT_CLUSTER_ASSIGNMENTS_RESPONSE: "database:current-clusters-response",
    CURRENT_CLUSTER_SIMILARITIES_REQUEST:
      "database:current-cluster-similarities-request",
    CURRENT_CLUSTER_SIMILARITIES_RESPONSE:
      "database:current-cluster-similarities-response",
    UPDATE_CLUSTER_NAME: "database:update-cluster-name",
    DELETE_RUN: "database:delete-run",
    CURRENT_OUTLIERS_REQUEST: "database:current-outliers-request",
    CURRENT_OUTLIERS_RESPONSE: "database:current-outliers-response",
    CURRENT_MERGERS_REQUEST: "database:current-mergers-request",
    CURRENT_MERGERS_RESPONSE: "database:current-mergers-response",
  },
  STATE: {
    SET_RUN_ID: "state:set-run-id",
    RESET_RUN_ID: "state:reset-run-id",
  },
  PLOTS: {
    CLUSTER_POSITIONS_REQUEST: "plots:get-cluster-positions",
    CLUSTER_POSITIONS_RESPONSE: "plots:receive-cluster-positions",
    SELECTION_STATS_REQUEST: "plots:get-selection-stats",
    SELECTION_STATS_RESPONSE: "plots:receive-selection-stats",
  },
  MODELS: {
    DOWNLOAD_STATUS: "model:download-status",
    MODEL_STATUS_REQUEST: "model:model-status-request",
    DEFAULT_MODEL_STATUS: "model:default-model-status",
    DOWNLOAD_MODEL: "model:download-model",
    CACHED_MODELS_REQUEST: "model:cached-models-request",
    CACHED_MODELS_RESPONSE: "model:cached-models-response",
    AVAILABLE_MODELS_REQUEST: "model:available-models-request",
    AVAILABLE_MODELS_RESPONSE: "model:available-models-response",
  },
};

export const PYTHON_SERVICE_EVENTS = {
  ERROR: "error",
  FILE_PATH: "file-path",
  ClUSTERING_PROGRESS: "cluster-progress",
  FILE: {
    RAW_RESPONSES: "file-raw-responses",
  },
  DATABASE: {
    ALL_RUNS: "database-all-runs",
    CURRENT_RUN: "database-current-run",
    CURRENT_CLUSTER_ASSIGNMENTS: "database-current-clusters",
    CURRENT_CLUSTER_SIMILARITIES: "database-current-cluster-similarities",
    CURRENT_OUTLIERS: "database-current-outliers",
    CURRENT_MERGERS: "database-current-mergers",
  },
  READY: "ready",
  PLOTS: {
    CLUSTER_POSITIONS: "plots-cluster-positions",
    SELECTION_STATS: "plots-selection-stats",
  },
  MODELS: {
    DOWNLOAD_STATUS: "model:download-status",
    CACHED_MODELS: "model:cached-models",
    AVAILABLE_MODELS: "model:available-models",
  },
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
};
