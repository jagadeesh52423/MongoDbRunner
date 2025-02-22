'use client';

import { useState } from 'react';
import { QueryResult } from '@/types/connection';

interface ResultsViewProps {
  results: QueryResult | null;
}

type ViewMode = 'table' | 'json';

export function ResultsView({ results }: ResultsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  if (!results) return null;

  const renderTableView = (data: any) => {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      return <div className="text-gray-500">No results found</div>;
    }

    const columns = Array.from(
      new Set(data.flatMap(item => Object.keys(item)))
    );

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
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-black/5">
                {columns.map(column => (
                  <td key={column} className="p-2 border font-mono text-sm truncate max-w-[300px]">
                    {renderTableCell(item[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableCell = (value: any): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
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
    </div>
  );
}
