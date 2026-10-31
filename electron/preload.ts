import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, IpcApi } from "../src/shared/ipc";

const api: IpcApi = {
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),
  loginYouTube: () => ipcRenderer.invoke(IPC_CHANNELS.LOGIN_YOUTUBE),
  loginApple: () => ipcRenderer.invoke(IPC_CHANNELS.LOGIN_APPLE),
  logout: (service) => ipcRenderer.invoke(IPC_CHANNELS.LOGOUT, service),
  fetchPlaylists: () => ipcRenderer.invoke(IPC_CHANNELS.FETCH_PLAYLISTS),
  fetchTracks: (playlistId) => ipcRenderer.invoke(IPC_CHANNELS.FETCH_TRACKS, playlistId),
  matchTracks: (tracks) => ipcRenderer.invoke(IPC_CHANNELS.MATCH_TRACKS, tracks),
  searchAppleCatalog: (query) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_APPLE_CATALOG, query),
  executeTransfer: (playlistTitle, tracks, onProgressCallbackId) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_TRANSFER, playlistTitle, tracks, onProgressCallbackId),
  onTransferProgress: (callback) => {
    const handler = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.ON_TRANSFER_PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.ON_TRANSFER_PROGRESS, handler);
    };
  },
};

contextBridge.exposeInMainWorld("api", api);
