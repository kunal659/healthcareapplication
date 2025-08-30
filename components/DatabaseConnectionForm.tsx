
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DatabaseConnection, DatabaseType } from '../types';
import Input from './Input';
import Button from './Button';
import { testConnection } from '../services/databaseService';

interface DatabaseConnectionFormProps {
  onSubmit: SubmitHandler<DatabaseConnection>;
  onCancel: () => void;
  defaultValues?: Partial<DatabaseConnection>;
  isSaving: boolean;
}

const dbTypes: DatabaseType[] = ['PostgreSQL', 'MySQL', 'SQL Server', 'SQLite'];

const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({ onSubmit, onCancel, defaultValues, isSaving }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, clearErrors } = useForm<DatabaseConnection>({
    defaultValues: { type: 'PostgreSQL', ...defaultValues },
  });
  
  const selectedType = watch('type');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [availableDatabases, setAvailableDatabases] = useState<string[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(defaultValues?.filePath || null);

  useEffect(() => {
    // When defaultValues change (i.e., when editing a different item), reset the form
    const newDefaults = { type: 'PostgreSQL', ...defaultValues };
    Object.entries(newDefaults).forEach(([key, value]) => {
        setValue(key as keyof DatabaseConnection, value);
    });
    setAvailableDatabases(null);
    setTestResult(null);
    setFileName(defaultValues?.filePath || null);
    clearErrors();
  }, [defaultValues, setValue, clearErrors]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFileName(file.name);
          setValue('filePath', file.name);
          const reader = new FileReader();
          reader.onload = (event) => {
              const base64String = btoa(event.target?.result as string);
              setValue('dbFileContent', base64String);
          };
          reader.readAsBinaryString(file);
      }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setAvailableDatabases(null);
    try {
      const formData = watch();
      const dbList = await testConnection(formData);
      setAvailableDatabases(dbList);
      setTestResult({ status: 'success', message: 'Connection successful! Please select a database.' });
    } catch (error: any) {
      setTestResult({ status: 'error', message: error.message || 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        <Input
          id="name"
          label="Connection Name"
          {...register('name', { required: 'Connection name is required' })}
          error={errors.name?.message}
        />

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Database Type</label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-primary-500"
          >
            {dbTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {selectedType === 'SQLite' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Database File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".db,.sqlite,.sqlite3" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    {fileName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{fileName}</p>}
                </div>
            </div>
             <input type="hidden" {...register('dbFileContent', { required: 'A database file is required for SQLite connections' })} />
             {errors.dbFileContent && <p className="mt-1 text-sm text-red-500">{errors.dbFileContent.message}</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="host"
                  label="Host"
                  {...register('host', { required: 'Host is required' })}
                  error={errors.host?.message}
                />
                <Input
                  id="port"
                  label="Port"
                  type="number"
                  {...register('port', { required: 'Port is required', valueAsNumber: true })}
                  error={errors.port?.message}
                />
            </div>
            {availableDatabases ? (
                <div>
                    <label htmlFor="database-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Database Name</label>
                    <select
                        id="database-select"
                        {...register('database', { required: 'Database name is required' })}
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-primary-500"
                    >
                        <option value="">Select a database...</option>
                        {availableDatabases.map(dbName => <option key={dbName} value={dbName}>{dbName}</option>)}
                    </select>
                    {errors.database && <p className="mt-1 text-sm text-red-500">{errors.database.message}</p>}
                </div>
            ) : (
                <Input
                  id="database"
                  label="Database Name"
                  {...register('database')}
                  error={errors.database?.message}
                  placeholder="e.g., OMOP1 (will be verified on test)"
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="user"
                  label="Username"
                  {...register('user', { required: 'Username is required' })}
                  error={errors.user?.message}
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                />
            </div>
          </>
        )}
        
        {testResult && (
            <div className={`p-3 rounded-md text-sm ${testResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResult.message}
            </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-600">
          <Button type="button" variant="secondary" onClick={handleTestConnection} isLoading={isTesting}>Test Connection</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" isLoading={isSaving}>Save Connection</Button>
        </div>
      </div>
    </form>
  );
};

export default DatabaseConnectionForm;