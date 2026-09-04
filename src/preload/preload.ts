import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Auth APIs
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getProfile: () => ipcRenderer.invoke('auth:get-profile'),
  },

  // Minecraft APIs
  minecraft: {
    launch: (instanceId: string) => ipcRenderer.invoke('minecraft:launch', instanceId),
    stop: () => ipcRenderer.invoke('minecraft:stop'),
    getStatus: () => ipcRenderer.invoke('minecraft:get-status'),
  },

  // Mods APIs
  mods: {
    search: (query: string, version: string, loader: string) =>
      ipcRenderer.invoke('mods:search', query, version, loader),
    install: (modId: string, projectId: string, version: string, instanceId: string) =>
      ipcRenderer.invoke('mods:install', modId, projectId, version, instanceId),
    uninstall: (modId: string, instanceId: string) =>
      ipcRenderer.invoke('mods:uninstall', modId, instanceId),
    getInstalled: (instanceId: string) =>
      ipcRenderer.invoke('mods:get-installed', instanceId),
  },

  // Resource Packs APIs
  resourcePacks: {
    getAll: (instanceId: string) => ipcRenderer.invoke('resourcepacks:get-all', instanceId),
    enable: (packId: string, instanceId: string) =>
      ipcRenderer.invoke('resourcepacks:enable', packId, instanceId),
    disable: (packId: string, instanceId: string) =>
      ipcRenderer.invoke('resourcepacks:disable', packId, instanceId),
  },

  // Instances APIs
  instances: {
    create: (data: any) => ipcRenderer.invoke('instances:create', data),
    getAll: () => ipcRenderer.invoke('instances:get-all'),
    delete: (instanceId: string) => ipcRenderer.invoke('instances:delete', instanceId),
  },
});
