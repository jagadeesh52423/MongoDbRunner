'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { MongoConnection } from '@/types/connection';

interface ConnectionManagerProps {
  onSelect: (connection: MongoConnection) => void;
  connections: MongoConnection[];
  setConnections: (connections: MongoConnection[]) => void;
}

export function ConnectionManager({ onSelect, connections, setConnections }: ConnectionManagerProps) {
  const [newConnection, setNewConnection] = useState({
    name: '',
    host: 'localhost',
    port: '27017',
    database: '',
    username: '',
    password: '',
    uri: '',
    options: {
      authSource: 'admin',
      directConnection: false,
      ssl: false,
      tls: false,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
    },
    status: 'disconnected' as const,
  });
  const [nameError, setNameError] = useState<string>('');

  useEffect(() => {
    loadStoredConnections();
  }, []);

  const validateName = (name: string) => {
    if (!name) return 'Name is required';
    if (connections.some(conn => conn.name === name)) {
      return 'Connection with this name already exists';
    }
    return '';
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

  const deleteConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const loadStoredConnections = async () => {
    try {
      const response = await fetch('/api/stored-connections');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setConnections(result.data.map((conn: MongoConnection) => ({
          ...conn,
          status: 'disconnected'
        })));
      } else {
        console.error('Invalid response format:', result);
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
    const uri = connection.uri || generateUri(connection);
    const isValid = await testConnection(uri);
    
    const updatedConnection = {
      ...connection,
      status: isValid ? 'connected' : 'error',
      error: isValid ? undefined : 'Failed to connect'
    };

    setConnections(prev => prev.map(conn => 
      conn.id === connection.id ? updatedConnection : conn
    ));

    if (isValid) onSelect(updatedConnection);
  };

  const addConnection = async () => {
    const nameValidationError = validateName(newConnection.name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    const connection = {
      id: Date.now().toString(),
      ...newConnection,
      uri: newConnection.uri || generateUri(newConnection),
      status: 'disconnected',
      options: { ...newConnection.options }
    };

    await saveConnection(connection);
    setConnections(prev => [...prev, connection]);
    setNewConnection({ ...newConnection, name: '', uri: '' });
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold">Connections</h2>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="bg-foreground text-background px-3 py-1 rounded">
              New
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
              <Dialog.Title className="text-lg font-bold mb-4">Add Connection</Dialog.Title>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                addConnection();
              }}>
                {/* Common Fields */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block mb-1">Name</label>
                    <input
                      className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`}
                      value={newConnection.name}
                      onChange={(e) => {
                        setNameError('');
                        setNewConnection(prev => ({ ...prev, name: e.target.value }));
                      }}
                      required
                    />
                    {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                  </div>
                </div>

                {/* Connection Configuration */}
                <Tabs.Root defaultValue="standard" className="mt-4">
                  <Tabs.List className="flex border-b mb-4">
                    <Tabs.Trigger
                      value="standard"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-foreground"
                    >
                      Standard
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="uri"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-foreground"
                    >
                      URI
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="advanced"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-foreground"
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
                          value={newConnection.host}
                          onChange={(e) => setNewConnection(prev => ({
                            ...prev,
                            host: e.target.value,
                            uri: '' // Clear URI when using standard connection
                          }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Port</label>
                        <input
                          className="w-full p-2 border rounded"
                          value={newConnection.port}
                          onChange={(e) => setNewConnection(prev => ({
                            ...prev,
                            port: e.target.value,
                            uri: '' // Clear URI when using standard connection
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
                          value={newConnection.username}
                          onChange={(e) => setNewConnection(prev => ({
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
                          value={newConnection.password}
                          onChange={(e) => setNewConnection(prev => ({
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
                        value={newConnection.database}
                        onChange={(e) => setNewConnection(prev => ({
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
                        value={newConnection.uri}
                        onChange={(e) => setNewConnection(prev => ({
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
                        {Object.entries(newConnection.options).map(([key, value]) => (
                          <label key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setNewConnection(prev => ({
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

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full bg-foreground text-background p-2 rounded"
                  >
                    Add Connection
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      
      <div className="space-y-2">
        {connections.map(conn => (
          <ContextMenu.Root key={conn.id}>
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
            
            <ContextMenu.Portal>
              <ContextMenu.Content className="min-w-[160px] bg-background rounded-md shadow-lg border p-1">
                <ContextMenu.Item 
                  className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer"
                  onClick={() => connectToDatabase(conn)}
                >
                  Connect
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="px-2 py-1 rounded hover:bg-black/5 cursor-pointer text-red-500"
                  onClick={() => deleteConnection(conn.id)}
                >
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ))}
      </div>
    </div>
  );
}
