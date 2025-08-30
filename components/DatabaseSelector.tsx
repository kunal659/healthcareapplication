
import React from 'react';
import { DatabaseConnection } from '../types';

interface DatabaseSelectorProps {
  connections: DatabaseConnection[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({ connections, selectedId, onSelect }) => {
  const connectedDbs = connections.filter(c => c.status === 'connected');

  return (
    <div className="flex items-center space-x-2">
        <label htmlFor="db-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Database:
        </label>
        <select
            id="db-selector"
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-primary-500"
        >
            <option value="" disabled>Select a connection...</option>
            {connectedDbs.map(conn => (
                <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                </option>
            ))}
        </select>
    </div>
  );
};

export default DatabaseSelector;