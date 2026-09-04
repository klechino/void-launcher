import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class ModManager {
  private modrinthApi = 'https://api.modrinth.com/v2';
  private instancesPath: string;
  private installedModsFile = 'installed-mods.json';

  constructor() {
    this.instancesPath = path.join(app.getPath('userData'), 'instances');
  }

  async search(
    query: string,
    version: string,
    loader: string
  ): Promise<any[]> {
    try {
      const response = await axios.get(`${this.modrinthApi}/search`, {
        params: {
          query,
          facets: `[["versions:${version}"], ["categories:${loader}"]]`,
          limit: 20,
        },
      });

      return response.data.hits.map((hit: any) => ({
        id: hit.project_id,
        name: hit.title,
        author: hit.author,
        description: hit.description,
        icon: hit.icon_url,
        downloads: hit.downloads,
        followers: hit.follows,
        versions: hit.versions,
      }));
    } catch (error) {
      console.error('Modrinth search error:', error);
      return [];
    }
  }

  async install(
    modId: string,
    projectId: string,
    version: string,
    instanceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const instancePath = path.join(this.instancesPath, instanceId);
      const modsPath = path.join(instancePath, 'mods');

      if (!fs.existsSync(modsPath)) {
        fs.mkdirSync(modsPath, { recursive: true });
      }

      // Check if already installed
      const metaFile = path.join(modsPath, 'mods-meta.json');
      let modsMeta: any = {};
      if (fs.existsSync(metaFile)) {
        modsMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      }

      if (modsMeta[modId]) {
        return { success: false, error: 'Mod already installed' };
      }

      // Get download link
      const versionResponse = await axios.get(
        `${this.modrinthApi}/project/${projectId}/version?game_versions=${version}`
      );

      if (!versionResponse.data.length) {
        return { success: false, error: 'No version available for this Minecraft version' };
      }

      const versionData = versionResponse.data[0];
      const file = versionData.files[0];
      const downloadUrl = file.url;
      const fileName = file.filename;

      // Download mod
      const modPath = path.join(modsPath, fileName);
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
      });

      fs.writeFileSync(modPath, response.data);

      // Update metadata
      modsMeta[modId] = {
        name: versionData.name,
        file: fileName,
        version: versionData.version_number,
        projectId,
      };

      fs.writeFileSync(metaFile, JSON.stringify(modsMeta, null, 2));

      return { success: true };
    } catch (error) {
      console.error('Mod install error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async uninstall(modId: string, instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const instancePath = path.join(this.instancesPath, instanceId);
      const modsPath = path.join(instancePath, 'mods');
      const metaFile = path.join(modsPath, 'mods-meta.json');

      if (!fs.existsSync(metaFile)) {
        return { success: false, error: 'No mods installed' };
      }

      const modsMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));

      if (!modsMeta[modId]) {
        return { success: false, error: 'Mod not found' };
      }

      const modFile = path.join(modsPath, modsMeta[modId].file);
      if (fs.existsSync(modFile)) {
        fs.unlinkSync(modFile);
      }

      delete modsMeta[modId];
      fs.writeFileSync(metaFile, JSON.stringify(modsMeta, null, 2));

      return { success: true };
    } catch (error) {
      console.error('Mod uninstall error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getInstalled(instanceId: string): Promise<any[]> {
    try {
      const instancePath = path.join(this.instancesPath, instanceId);
      const metaFile = path.join(instancePath, 'mods', 'mods-meta.json');

      if (!fs.existsSync(metaFile)) {
        return [];
      }

      const modsMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      return Object.values(modsMeta);
    } catch (error) {
      console.error('Get installed mods error:', error);
      return [];
    }
  }
}
