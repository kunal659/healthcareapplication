
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import * as apiKeyService from '../services/apiKeyService';
import { ApiKey } from '../types';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { register: budgetRegister, handleSubmit: handleBudgetSubmit, setValue: setBudgetValue } = useForm();
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({});

  useEffect(() => {
    if (user) {
      setKeys(user.apiKeys || []);
      setBudgetValue('budget', user.monthlyBudget || 0);
    }
  }, [user, setBudgetValue]);

  const onAddKeySubmit = async (data: any) => {
    setIsLoading(true);
    setServerError('');
    try {
      const newKey = await apiKeyService.addApiKey(data.keyName, data.apiKey);
      const updatedKeys = [...keys, newKey];
      setKeys(updatedKeys);
      updateUser({ apiKeys: updatedKeys });
      reset();
    } catch (error: any) {
      setServerError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onBudgetSubmit = async (data: any) => {
      if (user) {
          const newBudget = parseFloat(data.budget);
          updateUser({ monthlyBudget: newBudget });
          alert("Budget updated successfully!");
      }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (window.confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
      await apiKeyService.deleteApiKey(keyId);
      const updatedKeys = keys.filter(k => k.id !== keyId);
      setKeys(updatedKeys);
      updateUser({ apiKeys: updatedKeys });
    }
  };

  const handleSetActiveKey = async (keyId: string) => {
    const updatedKeys = await apiKeyService.setActiveApiKey(keyId);
    setKeys(updatedKeys);
    updateUser({ apiKeys: updatedKeys });
  };
  
  const handleTestKey = async (keyId: string) => {
    const keyToTest = keys.find(k => k.id === keyId);
    if (!keyToTest) return;

    try {
      await apiKeyService.testApiKey(keyToTest.key);
      setTestResults(prev => ({ ...prev, [keyId]: { status: 'success', message: 'Connection successful!' } }));
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [keyId]: { status: 'error', message: error.message } }));
    }
    setTimeout(() => setTestResults(prev => ({...prev, [keyId]: undefined!})), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
      
      <Card title="Manage API Keys">
        <div className="space-y-4">
          {keys.length > 0 ? (
            keys.map(key => (
              <div key={key.id} className="p-4 border rounded-lg dark:border-gray-700 flex flex-wrap items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{key.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{key.maskedKey}</p>
                   {testResults[key.id] && (
                    <p className={`mt-1 text-sm ${testResults[key.id].status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults[key.id].message}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <Button onClick={() => handleTestKey(key.id)} variant="secondary" size="sm">Test</Button>
                  <Button onClick={() => handleSetActiveKey(key.id)} disabled={key.isActive} size="sm">
                    {key.isActive ? 'Active' : 'Set Active'}
                  </Button>
                  <Button onClick={() => handleDeleteKey(key.id)} variant="danger" size="sm">Delete</Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No API keys have been added yet.</p>
          )}
        </div>
      </Card>
      
      <Card title="Add New API Key">
        <form onSubmit={handleSubmit(onAddKeySubmit)} noValidate className="space-y-4">
          {serverError && <p className="text-red-500">{serverError}</p>}
          <Input
            id="keyName"
            label="Key Name / Alias"
            type="text"
            {...register("keyName", { required: "Key name is required" })}
            error={errors.keyName?.message as string}
            placeholder="e.g., My Personal Key"
          />
          <Input
            id="apiKey"
            label="OpenAI API Key"
            type="password"
            {...register("apiKey", { 
              required: "API Key is required",
              
            })}
            error={errors.apiKey?.message as string}
            placeholder="sk-..."
          />
          <Button type="submit" isLoading={isLoading}>Add Key</Button>
        </form>
      </Card>
      
       <Card title="Cost Management">
        <form onSubmit={handleBudgetSubmit(onBudgetSubmit)} className="space-y-4">
          <Input
            id="budget"
            label="Monthly Budget ($)"
            type="number"
            step="0.01"
            {...budgetRegister("budget", { 
                valueAsNumber: true, 
                min: { value: 0, message: "Budget must be a positive number." }
            })}
            error={errors.budget?.message as string}
          />
          <Button type="submit">Set Budget</Button>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;