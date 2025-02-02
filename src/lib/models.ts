// Python Models
// These have to match the models in models.py

type Action = "quit";

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
    controller: {};
    settings: {
      getAll: () => Promise<AppSettings>;
    };
    url: {
      open: (url: string) => void;
    };
  }
}

export const CHANNELS = {
  CONTROLLER: {},
  SETTINGS: {
    GET: "settings:get-all",
  },
  URL: {
    OPEN: "url:open",
  },
};

export const PYTHON_SERVICE_EVENTS = {
  ERROR: "error",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
};
