'use client';

import { useState } from 'react';
import { QueryResult } from '@/types/connection';
import { JsonDetailView } from './JsonDetailView';

interface ResultsViewProps {
  results: QueryResult | null;
}

type ViewMode = 'table' | 'json';

export function ResultsView({ results }: ResultsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedRow, setSelectedRow] = useState<any>(null);

  if (!results) return null;

  const processData = (data: any): any[] => {
    // Special handling for show dbs command
    if (data.databases && Array.isArray(data.databases)) {
      return [{
        Databases: data.databases.map(db => `${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`).join('\n'),
        'Total Size': `${(data.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`,
        Status: data.ok ? 'OK' : 'Error',
        ...data
      }];
    }
    
    // Convert single object to array
    if (!Array.isArray(data)) {
      return [data];
    }
    
    return data;
  };

  const renderTableCell = (value: any): React.ReactNode => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) {
      return (
        <div className="whitespace-pre-wrap max-h-[200px] overflow-y-auto">
          {value.map((item, i) => (
            typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
          )).join('\n')}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="whitespace-pre-wrap max-h-[200px] overflow-y-auto">
          {JSON.stringify(value, null, 2)}
        </div>
      );
    }
    return String(value);
  };

  const renderTableView = (rawData: any) => {
    const data = processData(rawData);

    if (data.length === 0) {
      return <div className="text-gray-500">No results found</div>;
    }

    // Filter out MongoDB internal fields and get columns
    const columns = Array.from(
      new Set(data.flatMap(item => Object.keys(item)))
    ).filter(col => !col.startsWith('$'));

    return (
      <div className="overflow-auto max-h-[400px]">
        <table className="min-w-full border-collapse">
          <thead className="bg-black/5 sticky top-0">
            <tr>
              {columns.map(column => (
                <th key={column} className="p-2 text-left border font-mono text-sm">
                  {column}
                </th>
              ))}
              <th className="w-20 text-center border sticky right-0 bg-black/5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-black/5">
                {columns.map(column => (
                  <td key={column} className="p-2 border font-mono text-sm align-top overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                      {renderTableCell(item[column])}
                    </div>
                  </td>
                ))}
                <td className="p-2 border text-center sticky right-0 bg-inherit shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => setSelectedRow(item)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm whitespace-nowrap"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJsonView = (data: any) => (
    <pre className="bg-black/5 p-4 rounded overflow-auto max-h-[400px] font-mono text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Results</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded ${
              viewMode === 'table' 
                ? 'bg-foreground text-background' 
                : 'bg-black/5'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 rounded ${
              viewMode === 'json' 
                ? 'bg-foreground text-background' 
                : 'bg-black/5'
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {results.success ? (
        viewMode === 'table' 
          ? renderTableView(results.data)
          : renderJsonView(results.data)
      ) : (
        <div className="text-red-500">
          {results.error || 'An error occurred'}
        </div>
      )}

      <JsonDetailView 
        data={selectedRow}
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}
