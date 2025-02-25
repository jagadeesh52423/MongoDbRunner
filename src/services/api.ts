import { MongoConnection, ConnectionResponse } from '@/types/connection';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

const API_BASE = '/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Request failed');
      }

      return { data: responseData };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private async fetchWithError<T>(
    url: string, 
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // Specific API methods
  async testConnection(connection: MongoConnection): Promise<ConnectionResponse> {
    try {
      const response = await fetch(`${API_BASE}/connections/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: connection.name,
          uri: connection.uri,
          config: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username,
            password: connection.password,
            options: connection.options
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test connection');
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  async addConnection(connection: MongoConnection): Promise<ConnectionResponse> {
    try {
      const uri = this.buildConnectionString(connection);
      const response = await this.fetchWithError('/api/stored-connections', {
        method: 'POST',
        body: JSON.stringify({
          name: connection.name,
          uri,
          config: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username,
            password: connection.password,
            options: connection.options
          }
        })
      });
      return response;
    } catch (error) {
      console.error('Add connection error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private buildConnectionString(connection: MongoConnection): string {
    const { username, password, host, port, database, options } = connection;
    const auth = username && password 
      ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` 
      : '';
    const db = database ? `/${database}` : '';
    const params = new URLSearchParams({
      retryWrites: 'true',
      w: 'majority',
      ...(options?.authSource ? { authSource: options.authSource } : {})
    });

    return `mongodb://${auth}${host}:${port}${db}?${params.toString()}`;
  }

  async listConnections(): Promise<MongoConnection[]> {
    return this.fetchWithError('/api/stored-connections');
  }

  async deleteConnection(name: string): Promise<ConnectionResponse> {
    return this.fetchWithError(`${this.baseUrl}/connections/${name}`, {
      method: 'DELETE'
    });
  }
}

export const apiService = new ApiService();
