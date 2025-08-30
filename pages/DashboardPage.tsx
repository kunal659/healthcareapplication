
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { getUsageLogs } from '../services/apiKeyService';
import { UsageLog, ApiKey } from '../types';

const COST_PER_CALL = 0.002; // Mock cost

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<UsageLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (user) {
        const userLogs = await getUsageLogs();
        setLogs(userLogs.reverse());
      }
    };
    fetchLogs();
  }, [user]);

  if (!user) {
    return null;
  }

  const apiKeys = user.apiKeys || [];
  const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);
  const estimatedCost = totalUsage * COST_PER_CALL;
  const budget = user.monthlyBudget || 0;
  const isOverBudget = budget > 0 && estimatedCost > budget;

  const getApiKeyName = (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    return key ? key.name : 'Unknown Key';
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">API Usage Dashboard</h1>
      
      {isOverBudget && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Budget Alert</p>
          <p>You have exceeded your monthly budget of ${budget.toFixed(2)}.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total API Calls</h3>
          <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">{totalUsage}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Estimated Cost</h3>
          <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">${estimatedCost.toFixed(4)}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Monthly Budget</h3>
          <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">${budget.toFixed(2)}</p>
        </Card>
      </div>

      <Card title="Usage by Key">
        <div className="space-y-4">
          {apiKeys.length > 0 ? apiKeys.map(key => (
            <div key={key.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">{key.name} ({key.maskedKey})</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{key.usageCount} calls</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${totalUsage > 0 ? (key.usageCount / totalUsage) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )) : <p className="text-gray-500 dark:text-gray-400">No API keys added yet.</p>}
        </div>
      </Card>
      
      <Card title="Audit Trail">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Key</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{getApiKeyName(log.keyId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       log.status === 'Success' 
                       ? 'bg-green-100 text-green-800'
                       : 'bg-red-100 text-red-800'
                     }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
               {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">No activity recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;