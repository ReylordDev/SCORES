// Python Models
// These have to match the models in models.py

type Action = "set_file_path";

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
  type: "progress" | "error";
  data: ProgressMessage | Error;
}

// Frontend-only models
export interface AppSettings {}

declare global {
  interface Window {
    electron: {
      showFilePath: (file: File) => string;
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
    };
  }
}

export const CHANNEL_TYPES = {
  ELECTRON: "electron",
  SETTINGS: "settings",
  URL: "url",
  FILE: "file",
};
export const CHANNELS = {
  SETTINGS: {
    GET: "settings:get-all",
  },
  URL: {
    OPEN: "url:open",
  },
  FILE: {
    SET_PATH: "file:set-path",
  },
};

export const PYTHON_SERVICE_EVENTS = {
  ERROR: "error",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
};
