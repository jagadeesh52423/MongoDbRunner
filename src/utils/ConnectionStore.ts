import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface ConnectionConfig {
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
  options?: {
    authSource?: string;
    [key: string]: any;
  };
}

export interface StoredConnection {
  name: string;
  uri: string;
  config: ConnectionConfig;
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

  static async saveConnection(
    name: string,
    uri: string,
    config: ConnectionConfig
  ): Promise<void> {
    await this.init();
    const connection: StoredConnection = {
      name,
      uri,
      config,
      createdAt: new Date().toISOString()
    };
    
    const filePath = path.join(this.BASE_DIR, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(connection, null, 2));
    console.log(`Connection saved to: ${filePath}`);
  }

  static async getConnection(name: string): Promise<StoredConnection | null> {
    try {
      const filePath = path.join(this.BASE_DIR, `${name}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading connection ${name}:`, error);
      return null;
    }
  }

  static async listConnections(): Promise<StoredConnection[]> {
    await this.init();
    try {
      const files = await fs.readdir(this.BASE_DIR);
      const configs: StoredConnection[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.BASE_DIR, file), 'utf-8');
            configs.push(JSON.parse(content));
          } catch (error) {
            console.error(`Error reading connection file ${file}:`, error);
          }
        }
      }
      
      return configs;
    } catch (error) {
      console.error('Error listing connections:', error);
      return [];
    }
  }

  static async deleteConnection(name: string): Promise<boolean> {
    try {
      await this.init();
      const filePath = path.join(this.BASE_DIR, `${name}.json`);
      
      // Check if file exists before attempting to delete
      try {
        await fs.access(filePath);
      } catch {
        console.log(`File not found: ${filePath}`);
        return false;
      }
      
      await fs.unlink(filePath);
      console.log(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting connection ${name}:`, error);
      return false;
    }
  }
}