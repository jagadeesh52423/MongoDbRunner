import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface ConnectionConfig {
  name: string;
  uri: string;
  config: {
    host: string;
    port: number;
    database?: string;
    username?: string;
    password?: string;
    options?: {
      authSource?: string;
    };
  };
  createdAt: string;
}

export class ConnectionStore {
  private static readonly BASE_DIR = path.join(os.homedir(), '.db_connections');

  static async init(): Promise<void> {
    try {
      await fs.access(this.BASE_DIR);
    } catch {
      await fs.mkdir(this.BASE_DIR, { recursive: true });
    }
  }

  static async saveConnection(name: string, uri: string, config: ConnectionConfig['config']): Promise<void> {
    await this.init();
    const connection: ConnectionConfig = {
      name,
      uri,
      config,
      createdAt: new Date().toISOString()
    };
    
    const filePath = path.join(this.BASE_DIR, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(connection, null, 2));
  }

  static async getConnection(name: string): Promise<ConnectionConfig | null> {
    try {
      const filePath = path.join(this.BASE_DIR, `${name}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  static async listConnections(): Promise<ConnectionConfig[]> {
    await this.init();
    const files = await fs.readdir(this.BASE_DIR);
    const configs: ConnectionConfig[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(this.BASE_DIR, file), 'utf-8');
        configs.push(JSON.parse(content));
      }
    }
    
    return configs;
  }

  static async deleteConnection(name: string): Promise<boolean> {
    try {
      const filePath = path.join(this.BASE_DIR, `${name}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
