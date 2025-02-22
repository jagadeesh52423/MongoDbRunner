'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MongoConnection, QueryResult } from '@/types/connection';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface QueryEditorProps {
  selectedConnection: MongoConnection | null;
  onQueryResult: (result: QueryResult) => void;
}

export function QueryEditor({ selectedConnection, onQueryResult }: QueryEditorProps) {
  const [query, setQuery] = useState('');
  
  const examples = [
    'show collections',
    'show dbs',
    'use myDatabase',
    'db.collection("users").find({})',
    'db.collection("users").insertOne({ name: "test" })'
  ];

  const executeQuery = async () => {
    if (!selectedConnection) {
      onQueryResult({ success: false, error: 'No connection selected' });
      return;
    }

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ 
          query,
          connectionUri: selectedConnection.uri 
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      onQueryResult(data);
    } catch (error) {
      onQueryResult({ 
        success: false, 
        error: 'Failed to execute query' 
      });
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-2">
        <h3 className="font-bold mb-1">Query Editor</h3>
        <div className="text-sm text-gray-500">
          Examples: {examples.map((ex, i) => (
            <button 
              key={i}
              className="text-blue-500 hover:underline mx-1"
              onClick={() => setQuery(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <MonacoEditor
          height="200px"
          language="javascript"
          theme="vs-dark"
          value={query}
          onChange={(value) => setQuery(value || '')}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <button
        onClick={executeQuery}
        disabled={!selectedConnection}
        className="bg-foreground text-background px-4 py-2 rounded disabled:opacity-50"
      >
        Execute
      </button>
    </div>
  );
}
