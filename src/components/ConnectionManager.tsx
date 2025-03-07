'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { MongoConnection } from '@/types/connection';
import { connectionService } from '@/services/connectionService';

interface FormData extends Omit<MongoConnection, 'id'> {
  id?: string;  // Make id optional for form data
}

// Add utility function to convert FormData to MongoConnection
const createConnection = (form: FormData): MongoConnection => {
  const uniqueId = form.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${form.name.replace(/\s+/g, '-').toLowerCase()}`;
  
  return {
    ...form,
    id: uniqueId
  };
};

const defaultConnection: FormData = {
  name: '',
  description: '',
  host: '',
  port: '',
  database: '',
  username: '',
  password: '',
  uri: '',
  status: 'disconnected',
  options: {
    authSource: 'admin',
    directConnection: false,
    ssl: false,
    tls: false,
    tlsAllowInvalidCertificates: false,
    retryWrites: true
  }
};

interface ConnectionManagerProps {
  onSelect: (connection: MongoConnection | null) => void;  // Updated to allow null
  connections: MongoConnection[];
  setConnections: React.Dispatch<React.SetStateAction<MongoConnection[]>>;  // Updated type
}

export function ConnectionManager({ onSelect, connections, setConnections }: ConnectionManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultConnection);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    loadStoredConnections();
  }, []);

  const validateName = (name: string, currentId?: string) => {
    if (!name) return 'Name is required';
    const exists = connections.some(conn => 
      conn.name === name && conn.id !== currentId
    );
    return exists ? 'Connection with this name already exists' : '';
  };

  const generateUri = (connection: MongoConnection) => {
    const { username, password, host, port, database, options } = connection;
    let uri = 'mongodb://';
    
    if (username && password) {
      uri += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    
    uri += `${host}:${port}`;
    if (database) uri += `/${database}`;

    const params = new URLSearchParams();
    if (options.authSource) params.append('authSource', options.authSource);
    if (options.directConnection) params.append('directConnection', 'true');
    if (options.ssl) params.append('ssl', 'true');
    if (options.tls) params.append('tls', 'true');
    if (options.tlsAllowInvalidCertificates) params.append('tlsAllowInvalidCertificates', 'true');
    
    const queryString = params.toString();
    if (queryString) uri += `?${queryString}`;
    
    return uri;
  };

  const testConnection = async (uri: string) => {
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
      const data = await response.json();
      return data.success;
    } catch {
      return false;
    }
  };

  const deleteConnection = async (connection: MongoConnection) => {
    try {
      // First disconnect if connected
      if (connection.status === 'connected') {
        await disconnectDatabase(connection);
      }
      
      // Make API call to delete from storage
      const response = await fetch(`/api/stored-connections/delete?name=${encodeURIComponent(connection.name)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to delete connection:', data.error || response.statusText);
        return;
      }
      
      // Remove from state only after successful deletion
      setConnections(connections.filter(conn => conn.id !== connection.id));
      console.log(`Connection ${connection.name} deleted successfully`);
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const loadStoredConnections = async () => {
    try {
      const response = await fetch('/api/stored-connections');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        const mappedConnections: MongoConnection[] = data.map(conn => ({
          id: conn.id || Date.now().toString(),
          name: conn.name || '',
          description: conn.description || '',
          host: conn.config?.host || 'localhost',
          port: (conn.config?.port || '27017').toString(),
          database: conn.config?.database || '',
          username: conn.config?.username || '',
          password: conn.config?.password || '',
          uri: conn.uri || '',
          status: 'disconnected' as const,
          options: conn.config?.options || defaultConnection.options
        }));
        setConnections(mappedConnections);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const saveConnection = async (connection: MongoConnection) => {
    try {
      const response = await fetch('/api/stored-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save connection');
      }
    } catch (error) {
      console.error('Failed to save connection:', error);
      throw error;
    }
  };

  const connectToDatabase = async (connection: MongoConnection) => {
    try {
      setConnections(prev => prev.map(conn => 
        conn.id === connection.id 
          ? { ...conn, status: 'connecting' } 
          : conn
      ));

      const isConnected = await connectionService.connect(connection);
      
      const updatedConnection: MongoConnection = {
        ...connection,
        status: isConnected ? 'connected' : 'error',
        error: isConnected ? undefined : 'Failed to connect'
      };

      setConnections(prev => prev.map(conn => 
        conn.id === connection.id ? updatedConnection : conn
      ));

      if (isConnected) {
        onSelect(updatedConnection);
      } else {
        console.error('Failed to connect to database');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnections(prev => prev.map(conn => 
        conn.id === connection.id 
          ? { ...conn, status: 'error', error: (error as Error).message } 
          : conn
      ));
    }
  };

  const disconnectDatabase = async (connection: MongoConnection) => {
    try {
      await connectionService.disconnect(connection.id);
      
      setConnections(prev => prev.map(conn => 
        conn.id === connection.id 
          ? { ...conn, status: 'disconnected' } 
          : conn
      ));

      onSelect(null);  // Updated to pass null
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const addConnection = async () => {
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }
  
    // Create a new connection with a unique ID
    const connection = createConnection({
      ...formData,
      uri: formData.uri || (formData.host && formData.port ? generateUri(formData as MongoConnection) : ''),
      status: 'disconnected',
      options: { ...formData.options }
    });
    
    // Ensure the ID is unique among existing connections
    const isIdDuplicate = connections.some(conn => conn.id === connection.id);
    if (isIdDuplicate) {
      // Generate a new ID if there's a duplicate
      connection.id = `${connection.id}-${Math.random().toString(36).substring(2, 9)}`;
    }
  
    await saveConnection(connection);
    
    // Add the new connection to the state
    setConnections((prev: MongoConnection[]) => [...prev, connection]);
    setFormData(defaultConnection);
    setDialogOpen(false);
  };

  const updateConnection = async () => {
    if (!formData.id) {
      console.error('Cannot update connection without id');
      return;
    }
  
    const nameValidationError = validateName(formData.name, formData.id);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }
  
    try {
      // Keep the existing ID when updating
      const connection = createConnection({
        ...formData,
        id: formData.id // Ensure we keep the same ID
      });
  
      const response = await fetch('/api/stored-connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to update connection: ${data.error || response.statusText || 'Unknown error'}`);
      }
  
      // Update the connection in state
      setConnections(prev => prev.map(conn => 
        conn.id === connection.id ? connection : conn
      ));
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  };

  const openDialog = (connection?: MongoConnection) => {
    if (connection) {
      setFormData(connection);  // Now includes id
      setIsUpdate(true);
    } else {
      setFormData(defaultConnection);
      setIsUpdate(false);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUpdate) {
      await updateConnection();
    } else {
      await addConnection();
    }
  };

  const renderConnectionContextMenu = (conn: MongoConnection) => (
    <ContextMenu.Portal>
      <ContextMenu.Content className="min-w-[160px] bg-background rounded-md shadow-lg border p-1">
        {conn.status === 'connected' ? (
          <ContextMenu.Item 
            className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer"
            onClick={() => disconnectDatabase(conn)}
          >
            Disconnect
          </ContextMenu.Item>
        ) : (
          <ContextMenu.Item 
            className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer"
            onClick={() => connectToDatabase(conn)}
          >
            Connect
          </ContextMenu.Item>
        )}
        <ContextMenu.Item 
          className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer"
          onClick={() => openDialog(conn)}
        >
          Edit
        </ContextMenu.Item>
        <ContextMenu.Item 
          className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer text-red-500"
          onClick={() => deleteConnection(conn)}
        >
          Delete
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold">Connections</h2>
        <button
          onClick={() => openDialog()}
          className="bg-foreground text-background px-3 py-1 rounded"
        >
          New
        </button>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto"
            aria-describedby="connection-description"
          >
          <Dialog.Title className="text-lg font-bold mb-2">
            {isUpdate ? 'Update Connection' : 'New Connection'}
          </Dialog.Title>
          
          <Dialog.Description 
            id="connection-description"
            className="text-sm text-gray-500 mb-4"
          >
            {isUpdate 
              ? 'Modify your MongoDB connection settings below.' 
              : 'Configure your MongoDB connection settings below.'}
          </Dialog.Description>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block mb-1">Name</label>
                  <input
                    className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`}
                    value={formData.name}
                    onChange={(e) => {
                      setNameError('');
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                    }}
                    required
                  />
                  {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="block mb-1">Description</label>
                  <textarea
                    id="connection-description"
                    className="w-full p-2 border rounded resize-y min-h-[60px]"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter a description for this connection"
                  />
                </div>
              </div>

              <Tabs.Root defaultValue="standard">
                <Tabs.List className="flex gap-4 border-b mb-4">
                  <Tabs.Trigger 
                    value="standard"
                    className="px-4 py-2 border-b-2 -mb-[2px] border-transparent data-[state=active]:border-foreground"
                  >
                    Standard
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="uri"
                    className="px-4 py-2 border-b-2 -mb-[2px] border-transparent data-[state=active]:border-foreground"
                  >
                    URI
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="advanced"
                    className="px-4 py-2 border-b-2 -mb-[2px] border-transparent data-[state=active]:border-foreground"
                  >
                    Advanced
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="standard" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">Host</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.host}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          host: e.target.value,
                          uri: ''
                        }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Port</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          port: e.target.value,
                          uri: ''
                        }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">Username</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          username: e.target.value,
                          uri: ''
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full p-2 border rounded"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          password: e.target.value,
                          uri: ''
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Database</label>
                    <input
                      className="w-full p-2 border rounded"
                      value={formData.database}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        database: e.target.value,
                        uri: ''
                      }))}
                    />
                  </div>
                </Tabs.Content>

                <Tabs.Content value="uri" className="space-y-4">
                  <div>
                    <label className="block mb-1">Connection URI</label>
                    <input
                      className="w-full p-2 border rounded"
                      value={formData.uri}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        uri: e.target.value,
                        // Clear standard fields when using URI
                        host: '',
                        port: '',
                        username: '',
                        password: '',
                        database: ''
                      }))}
                      placeholder="mongodb://username:password@host:port/database"
                    />
                  </div>
                </Tabs.Content>

                <Tabs.Content value="advanced" className="space-y-4">
                  <div className="space-y-2">
                    <label className="block mb-1">Options</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(formData.options).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              options: {
                                ...prev.options,
                                [key]: e.target.checked
                              }
                            }))}
                          />
                          {key}
                        </label>
                      ))}
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 rounded bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-foreground text-background"
                >
                  {isUpdate ? 'Update' : 'Add'}
                </button>
              </div>
            </form>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100"
                aria-label="Close"
              >
                ×
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="space-y-2">
        {connections.map((conn, index) => (
          <ContextMenu.Root key={`conn-${conn.id}-${index}`}>
            <ContextMenu.Trigger>
              <div className="p-2 border rounded hover:bg-black/5 flex items-center">
                <span className="flex-1">{conn.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                  conn.status === 'connected' ? 'bg-green-500' : 
                  conn.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                } text-white`}>
                  {conn.status}
                </span>
              </div>
            </ContextMenu.Trigger>
          
            {renderConnectionContextMenu(conn)}
          </ContextMenu.Root>
        ))}
      </div>
    </div>
  );
}
