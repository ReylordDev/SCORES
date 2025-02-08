// Python Models
// These have to match the models in models.py

type Action =
  | "set_file_path"
  | "get_file_path"
  | "set_file_settings"
  | "set_algorithm_settings"
  | "run_clustering";

export interface Command {
  action: Action;
  data?: object;
}

export type ClusteringStep =
  | "start"
  | "process_input_file"
  | "load_model"
  | "embed_responses"
  | "detect_outliers"
  | "auto_cluster_count"
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

export interface Error {
  error: string;
}

export interface Message {
  type: "progress" | "error" | "file_path";
  data: ProgressMessage | Error | string | null;
}

export interface FileSettings {
  delimiter: string;
  hasHeader: boolean;
  selectedColumns: number[];
}

export interface AutomaticClusterCount {
  cluster_count_method: "auto";
  max_clusters: number;
}

interface ManualClusterCount {
  cluster_count_method: "manual";
  cluster_count: number;
}

export type ClusterCount = AutomaticClusterCount | ManualClusterCount;

export interface AlgorithmSettings {
  method: ClusterCount;
}

// Frontend-only models
export interface AppSettings {
  darkMode: boolean;
}

declare global {
  interface Window {
    electron: {
      showFilePath: (file: File) => string;
      showItemInFolder: (path: string) => void;
      readFile: (path: string) => Promise<string>;
      getLogsPath: () => Promise<string>;
    };
    settings: {
      getAll: () => Promise<AppSettings>;
    };
    url: {
      open: (url: string) => void;
    };
    file: {
      // Consider making this a promise-returning function
      setPath: (path: string) => void;
      requestPath: () => void;
      onReceivePath: (callback: (path: string) => void) => void;
      setSettings: (settings: FileSettings) => void;
    };
    algorithm: {
      setSettings: (settings: AlgorithmSettings) => void;
      runClustering: () => void;
    };
    progress: {
      onUpdate: (callback: (progress: ProgressMessage) => void) => void;
      onClusteringUpdate: (
        callback: (progress: ClusteringProgressMessage) => void
      ) => void;
    };
  }
}

export const CHANNEL_TYPES = {
  ELECTRON: "electron",
  SETTINGS: "settings",
  URL: "url",
  FILE: "file",
  ALGORITHM: "algorithm",
  PROGRESS: "progress",
};
export const CHANNELS = {
  ELECTRON: {
    READ_FILE: "electron:read-file",
    GET_LOGS_PATH: "electron:get-logs-path",
    SHOW_ITEM_IN_FOLDER: "electron:show-item-in-folder",
  },
  SETTINGS: {
    GET: "settings:get-all",
  },
  URL: {
    OPEN: "url:open",
  },
  FILE: {
    SET_PATH: "file:set-path",
    PATH_REQUEST: "file:get-path",
    PATH_RESPONSE: "file:path",
    SET_SETTINGS: "file:set-settings",
  },
  ALGORITHM: {
    SET_SETTINGS: "algorithm:set-settings",
    RUN_CLUSTERING: "algorithm:run-clustering",
  },
  CLUSTERING_PROGRESS: {
    UPDATE: "cluster-progress:update",
  },
};

export const PYTHON_SERVICE_EVENTS = {
  ERROR: "error",
  FILE_PATH: "file-path",
  ClUSTERING_PROGRESS: "cluster-progress",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
};
