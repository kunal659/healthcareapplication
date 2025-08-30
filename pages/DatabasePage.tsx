
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as dbService from '../services/databaseService';
import { DatabaseConnection } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DatabaseConnectionForm from '../components/DatabaseConnectionForm';
import StatusIndicator from '../components/StatusIndicator';

const DatabasePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.databaseConnections) {
      setConnections(user.databaseConnections);
    }
  }, [user]);

  // Effect for periodically checking connection statuses
  useEffect(() => {
    const checkStatuses = async () => {
      if (connections.length > 0) {
        const updatedConnections = await dbService.checkConnectionsStatus(connections);
        setConnections(updatedConnections);
        if (user) {
          updateUser({ ...user, databaseConnections: updatedConnections });
        }
      }
    };

    const intervalId = setInterval(checkStatuses, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections.length]); // Rerun only when the number of connections changes


  const handleOpenModal = (connection: DatabaseConnection | null = null) => {
    setEditingConnection(connection);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConnection(null);
  };

  const handleSaveConnection = async (data: DatabaseConnection) => {
    setIsSaving(true);
    try {
      let updatedConnections;
      if (editingConnection) {
        // Update existing connection
        updatedConnections = await dbService.updateConnection({ ...editingConnection, ...data });
      } else {
        // Add new connection
        updatedConnections = await dbService.addConnection(data);
      }
      setConnections(updatedConnections);
      if (user) {
        updateUser({ ...user, databaseConnections: updatedConnections });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save connection:", error);
      alert("Error: Could not save the connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        const updatedConnections = await dbService.deleteConnection(id);
        setConnections(updatedConnections);
        if (user) {
          updateUser({ ...user, databaseConnections: updatedConnections });
        }
      } catch (error) {
        console.error("Failed to delete connection:", error);
        alert("Error: Could not delete the connection.");
      }
    }
  };
  
  const getDbIcon = (type: string) => {
      // Simple emoji icons for demonstration
      switch(type) {
          case 'PostgreSQL': return '🐘';
          case 'MySQL': return '🐬';
          case 'SQL Server': return '🗄️';
          case 'SQLite': return '📄';
          default: return '💾';
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Database Connections</h1>
        <Button onClick={() => handleOpenModal()}>Add Connection</Button>
      </div>

      <Card>
        {connections.length > 0 ? (
          <div className="space-y-4">
            {connections.map(conn => (
              <div key={conn.id} className="p-4 border rounded-lg dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <span className="text-3xl">{getDbIcon(conn.type)}</span>
                   <div>
                     <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{conn.name}</p>
                     <p className="text-sm text-gray-500">{conn.type} &bull; {conn.host || conn.filePath}</p>
                   </div>
                </div>
                <div className="flex items-center space-x-4">
                  <StatusIndicator status={conn.status} />
                  <Button onClick={() => handleOpenModal(conn)} variant="secondary" size="sm">Edit</Button>
                  <Button onClick={() => handleDeleteConnection(conn.id)} variant="danger" size="sm">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No database connections found.</p>
            <p className="mt-2 text-sm text-gray-400">Click "Add Connection" to get started.</p>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingConnection ? 'Edit Connection' : 'Add New Connection'}>
        <DatabaseConnectionForm 
            onSubmit={handleSaveConnection}
            onCancel={handleCloseModal}
            defaultValues={editingConnection || {}}
            isSaving={isSaving}
        />
      </Modal>
    </div>
  );
};

export default DatabasePage;
