'use client';

import { MongoConnection } from '@/types/connection';

interface ConnectionSelectorProps {
  connections: MongoConnection[];
  selectedConnection?: MongoConnection;
  onSelect: (connection: MongoConnection) => void;
}

export function ConnectionSelector({ connections, selectedConnection, onSelect }: ConnectionSelectorProps) {
  const connectedConnections = connections.filter(conn => conn.status === 'connected');

  return (
    <div className="flex gap-2 items-center">
      <label className="text-sm">Connection:</label>
      <select 
        className="p-2 border rounded bg-background"
        value={selectedConnection?.id || ''}
        onChange={(e) => {
          const connection = connectedConnections.find(c => c.id === e.target.value);
          if (connection) onSelect(connection);
        }}
      >
        <option value="">Select connection</option>
        {connectedConnections.map(conn => (
          <option key={conn.id} value={conn.id}>
            {conn.name}
          </option>
        ))}
      </select>
    </div>
  );
}
