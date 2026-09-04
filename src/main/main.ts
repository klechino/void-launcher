import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { AuthManager } from './auth/AuthManager';
import { MinecraftLauncher } from './minecraft/MinecraftLauncher';
import { DiscordPresence } from './discord/DiscordPresence';
import { ModManager } from './mods/ModManager';
import { ResourcePackManager } from './resourcepacks/ResourcePackManager';
import { InstanceManager } from './instances/InstanceManager';

let mainWindow: BrowserWindow | null = null;
const authManager = new AuthManager();
const minecraftLauncher = new MinecraftLauncher();
const discordPresence = new DiscordPresence();
const modManager = new ModManager();
const resourcePackManager = new ResourcePackManager();
const instanceManager = new InstanceManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, '..', '..', 'public', 'void-icon.ico'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', '..', 'build', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  discordPresence.initialize();
  authManager.restoreAccount();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('auth:login', async () => {
  return await authManager.login();
});

ipcMain.handle('auth:logout', async () => {
  return await authManager.logout();
});

ipcMain.handle('auth:get-profile', async () => {
  return await authManager.getProfile();
});

ipcMain.handle('minecraft:launch', async (event, instanceId: string) => {
  try {
    const result = await minecraftLauncher.launch(instanceId);
    discordPresence.setPlaying(instanceId);
    return { success: true, pid: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('minecraft:stop', async () => {
  minecraftLauncher.stop();
  discordPresence.setIdle();
  return { success: true };
});

ipcMain.handle('minecraft:get-status', async () => {
  return minecraftLauncher.getStatus();
});

ipcMain.handle('mods:search', async (event, query: string, version: string, loader: string) => {
  return await modManager.search(query, version, loader);
});

ipcMain.handle('mods:install', async (event, modId: string, projectId: string, version: string, instanceId: string) => {
  return await modManager.install(modId, projectId, version, instanceId);
});

ipcMain.handle('mods:uninstall', async (event, modId: string, instanceId: string) => {
  return await modManager.uninstall(modId, instanceId);
});

ipcMain.handle('mods:get-installed', async (event, instanceId: string) => {
  return await modManager.getInstalled(instanceId);
});

ipcMain.handle('resourcepacks:get-all', async (event, instanceId: string) => {
  return await resourcePackManager.getAll(instanceId);
});

ipcMain.handle('resourcepacks:enable', async (event, packId: string, instanceId: string) => {
  return await resourcePackManager.enable(packId, instanceId);
});

ipcMain.handle('resourcepacks:disable', async (event, packId: string, instanceId: string) => {
  return await resourcePackManager.disable(packId, instanceId);
});

ipcMain.handle('instances:create', async (event, data: any) => {
  return await instanceManager.create(data);
});

ipcMain.handle('instances:get-all', async () => {
  return await instanceManager.getAll();
});

ipcMain.handle('instances:delete', async (event, instanceId: string) => {
  return await instanceManager.delete(instanceId);
});

ipcMain.on('discord:update', (event, data: any) => {
  discordPresence.update(data);
});
