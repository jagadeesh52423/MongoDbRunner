export interface MongoConnection {
  id: string;
  name: string;
  host: string;
  port: string;
  database?: string;
  username?: string;
  password?: string;
  options: ConnectionOptions;
  uri?: string;
  status: 'disconnected' | 'connected' | 'error';
  error?: string;
}

export interface ConnectionOptions {
  authSource?: string;
  directConnection?: boolean;
  ssl?: boolean;
  tls?: boolean;
  tlsAllowInvalidCertificates?: boolean;
  retryWrites?: boolean;
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
