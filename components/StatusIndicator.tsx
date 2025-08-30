
import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
    },
    disconnected: {
      color: 'bg-gray-400',
      text: 'Disconnected',
    },
    error: {
      color: 'bg-red-500',
      text: 'Error',
    },
    connecting: {
      color: 'bg-yellow-400 animate-pulse',
      text: 'Connecting',
    },
  };

  const { color, text } = statusConfig[status];

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{text}</span>
    </div>
  );
};

export default StatusIndicator;