export interface MongoConnection {
  id: string;
  name: string;
  description?: string;  // Add description field
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  uri: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  options: {
    authSource: string;
    directConnection: boolean;
    ssl: boolean;
    tls: boolean;
    tlsAllowInvalidCertificates: boolean;
    retryWrites: boolean;
  };
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
