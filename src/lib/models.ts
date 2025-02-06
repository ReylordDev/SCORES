// Python Models
// These have to match the models in models.py

type Action =
  | "set_file_path"
  | "get_file_path"
  | "set_file_settings"
  | "set_algorithm_settings";

export interface Command {
  action: Action;
  data?: object;
}

export interface ProgressMessage {
  step: Action | "init";
  status: "start" | "complete" | "error";
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

export interface AlgorithmSettings {
  clusterCount: number | "auto";
  maxClusters: number | undefined;
}

// Frontend-only models
export interface AppSettings {}

declare global {
  interface Window {
    electron: {
      showFilePath: (file: File) => string;
      readFile: (path: string) => Promise<string>;
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
    };
  }
}

export const CHANNEL_TYPES = {
  ELECTRON: "electron",
  SETTINGS: "settings",
  URL: "url",
  FILE: "file",
  ALGORITHM: "algorithm",
};
export const CHANNELS = {
  ELECTRON: {
    READ_FILE: "electron:read-file",
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
  },
};

export const PYTHON_SERVICE_EVENTS = {
  ERROR: "error",
  FILE_PATH: "file-path",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
};
