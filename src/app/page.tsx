'use client';

import { useState, useEffect } from 'react';
import { ConnectionManager } from '@/components/ConnectionManager';
import { QueryEditor } from '@/components/QueryEditor';
import { ResultsView } from '@/components/ResultsView';
import { MongoConnection, QueryResult } from '@/types/connection';
import { ConnectionSelector } from '@/components/ConnectionSelector';
import { connectionService } from '@/services/connectionService';

export default function Home() {
  const [connections, setConnections] = useState<MongoConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<MongoConnection | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasConnectedConnections = connections.some(conn => conn.status === 'connected');
      
      if (hasConnectedConnections) {
        e.preventDefault();
        e.returnValue = '';
        
        // Note: Modern browsers don't show custom messages anymore
        return 'You have active database connections. Are you sure you want to leave?';
      }
    };

    const cleanup = async () => {
      await connectionService.disconnectAll();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [connections]);

  return (
    <main className="min-h-screen p-4">
      <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">MongoDB Runner</h1>
          <ConnectionSelector 
            connections={connections}
            selectedConnection={selectedConnection}
            onSelect={setSelectedConnection}
          />
        </div>
        
        <div className="grid grid-cols-[300px_1fr] gap-4">
          <ConnectionManager 
            onSelect={setSelectedConnection}
            connections={connections}
            setConnections={setConnections}
          />
          <div className="flex flex-col gap-4">
            <QueryEditor 
              selectedConnection={selectedConnection}
              onQueryResult={setQueryResults}
            />
            <ResultsView results={queryResults} />
          </div>
        </div>
      </div>
    </main>
  );
}
