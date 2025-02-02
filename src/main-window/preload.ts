// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { CHANNEL_TYPES, CHANNELS } from "../lib/models";
import { contextBridge, ipcRenderer, webUtils } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(CHANNEL_TYPES.FILE, {
  setPath: (path: string) => {
    ipcRenderer.send(CHANNELS.FILE.SET_PATH, path);
  },
});

contextBridge.exposeInMainWorld(CHANNEL_TYPES.ELECTRON, {
  showFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
});
