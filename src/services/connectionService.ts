import { MongoConnection } from '@/types/connection';

class ConnectionService {
  // Store connection IDs for active connections
  private activeConnectionIds: Map<string, string> = new Map(); // Map<connectionId, connectionId from server>

  async connect(connection: MongoConnection): Promise<boolean> {
    try {
      const response = await fetch('/api/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uri: connection.uri || this.buildConnectionString(connection)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection failed:', errorText);
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Connection failed:', data.error);
        return false;
      }
      
      // Store the connection ID
      if (data.connectionId) {
        this.activeConnectionIds.set(connection.id, data.connectionId);
      }

      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  private buildConnectionString(connection: MongoConnection): string {
    let uri = 'mongodb://';
    
    if (connection.username && connection.password) {
      uri += `${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password)}@`;
    }
    
    uri += `${connection.host}:${connection.port}`;
    if (connection.database) uri += `/${connection.database}`;

    const params = new URLSearchParams();
    Object.entries(connection.options).forEach(([key, value]) => {
      if (value === true) {
        params.append(key, 'true');
      }
    });

    const queryString = params.toString();
    if (queryString) uri += `?${queryString}`;
    
    return uri;
  }

  async disconnect(connectionId: string): Promise<boolean> {
    try {
      const serverConnectionId = this.activeConnectionIds.get(connectionId);
      
      if (!serverConnectionId) {
        console.warn(`No server connection ID found for connection ${connectionId}`);
        return true; // Consider it disconnected if we have no record of it
      }
      
      const response = await fetch('/api/connection', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId: serverConnectionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Disconnect failed:', errorText);
        return false;
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.activeConnectionIds.delete(connectionId);
      }
      
      return data.success === true;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  }

  async disconnectAll(): Promise<boolean> {
    try {
      const response = await fetch('/api/connection/disconnect-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Disconnect all failed:', errorText);
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        // Clear our local tracking of connections
        this.activeConnectionIds.clear();
      }
      
      return data.success === true;
    } catch (error) {
      console.error('Disconnect all error:', error);
      return false;
    }
  }
}

export const connectionService = new ConnectionService();