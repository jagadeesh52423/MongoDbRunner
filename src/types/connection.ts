export interface ConnectionOptions {
  authSource: string;
  directConnection: boolean;
  ssl: boolean;
  tls: boolean;
  tlsAllowInvalidCertificates: boolean;
  retryWrites: boolean;
}

export interface MongoConnection {
  id: string;
  name: string;
  description?: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  uri: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  options: {
    authSource?: string;
    directConnection?: boolean;
    ssl?: boolean;
    tls?: boolean;
    tlsAllowInvalidCertificates?: boolean;
    retryWrites?: boolean;
    [key: string]: any;
  };
}

export interface ConnectionResponse {
  success: boolean;
  error?: string;
}

export interface MongoCommand {
  command: string;
  database: string;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface StoredConnection {
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
      [key: string]: any;
    };
  };
}
