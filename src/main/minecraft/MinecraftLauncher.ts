import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';

export class MinecraftLauncher {
  private process: ChildProcess | null = null;
  private startTime: number = 0;
  private currentInstanceId: string | null = null;
  private instancesPath: string;

  constructor() {
    this.instancesPath = path.join(app.getPath('userData'), 'instances');
    if (!fs.existsSync(this.instancesPath)) {
      fs.mkdirSync(this.instancesPath, { recursive: true });
    }
  }

  async launch(instanceId: string): Promise<number> {
    if (this.process) {
      throw new Error('Minecraft is already running');
    }

    const instancePath = path.join(this.instancesPath, instanceId);
    if (!fs.existsSync(instancePath)) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // Read instance config
    const configPath = path.join(instancePath, 'instance.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Get Java executable
    const javaPath = await this.findJava();
    if (!javaPath) {
      throw new Error('Java not found. Please install Java 17 or higher');
    }

    // Build launch arguments
    const args = this.buildLaunchArgs(config, instancePath, javaPath);

    this.process = spawn(javaPath, args, {
      cwd: instancePath,
      detached: true,
    });

    this.startTime = Date.now();
    this.currentInstanceId = instanceId;

    this.process.on('exit', () => {
      this.process = null;
      this.currentInstanceId = null;
      this.startTime = 0;
    });

    return this.process.pid || 0;
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.currentInstanceId = null;
    }
  }

  getStatus(): { running: boolean; instanceId: string | null; uptime: number } {
    return {
      running: this.process !== null,
      instanceId: this.currentInstanceId,
      uptime: this.process ? Date.now() - this.startTime : 0,
    };
  }

  private async findJava(): Promise<string | null> {
    const possiblePaths = [
      'java',
      'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
      'C:\\Program Files (x86)\\Java\\jre\\bin\\java.exe',
      process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
    ].filter(Boolean);

    for (const javaPath of possiblePaths) {
      if (javaPath && fs.existsSync(javaPath)) {
        return javaPath;
      }
    }

    return null;
  }

  private buildLaunchArgs(
    config: any,
    instancePath: string,
    javaPath: string
  ): string[] {
    const gameDir = instancePath;
    const versionManifest = config.version;
    const loader = config.loader;
    const ram = config.ram || 4;

    const args: string[] = [
      `-Xmx${ram}G`,
      `-Xms${Math.floor(ram / 2)}G`,
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=200',
      '-XX:InitiatingHeapOccupancyPercent=35',
      '-XX:+PerfDisableSharedMem',
      '-XX:G1NewCollectionThreadsActive=8',
    ];

    if (loader === 'fabric') {
      args.push(
        '-cp',
        this.buildClasspath(instancePath, loader),
        'net.fabricmc.loader.launch.knot.KnotClient'
      );
    } else if (loader === 'forge') {
      args.push(
        '-cp',
        this.buildClasspath(instancePath, loader),
        'net.minecraftforge.fml.loading.FMLTweaker'
      );
    } else {
      // Vanilla
      args.push(
        '-cp',
        this.buildClasspath(instancePath, loader),
        'net.minecraft.client.main.Main'
      );
    }

    args.push(
      '--gameDir',
      gameDir,
      '--assetsDir',
      path.join(app.getPath('userData'), 'assets'),
      '--assetIndex',
      '${version}',
      '--username',
      config.username || 'Player',
      '--uuid',
      config.uuid || '00000000-0000-0000-0000-000000000000',
      '--accessToken',
      config.accessToken || '0',
      '--userType',
      'msa'
    );

    return args;
  }

  private buildClasspath(instancePath: string, loader: string): string {
    const libsPath = path.join(instancePath, 'libraries');
    let classpath = '';

    if (fs.existsSync(libsPath)) {
      const libs = this.getAllJars(libsPath);
      classpath = libs.join(path.delimiter);
    }

    const versionsPath = path.join(instancePath, 'versions');
    if (fs.existsSync(versionsPath)) {
      const versionJars = this.getAllJars(versionsPath);
      classpath += path.delimiter + versionJars.join(path.delimiter);
    }

    return classpath;
  }

  private getAllJars(dir: string): string[] {
    const jars: string[] = [];

    const walkDir = (currentPath: string) => {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (file.endsWith('.jar')) {
          jars.push(fullPath);
        }
      }
    };

    walkDir(dir);
    return jars;
  }
}
