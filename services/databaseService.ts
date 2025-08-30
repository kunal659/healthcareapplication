
import { User, DatabaseConnection } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';

const LOGGED_IN_USER_KEY = 'auth_session';

// Helper to get the current logged-in user's data
const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Helper to update the user's data in both session and the main user list
const updateUserData = (updatedUser: User) => {
    // Update session
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(updatedUser));
    
    // Update main user list
    const allUsers = JSON.parse(localStorage.getItem('auth_users') || '{}');
    if (allUsers[updatedUser.email]) {
        const currentUserState = allUsers[updatedUser.email];
        allUsers[updatedUser.email] = { ...currentUserState, ...updatedUser };
        localStorage.setItem('auth_users', JSON.stringify(allUsers));
    }
}

const getConnections = (): DatabaseConnection[] => {
    const user = getCurrentUser();
    if (!user || !user.databaseConnections) return [];
    return user.databaseConnections.map(c => ({
        ...c,
        password: c.password ? mockDecrypt(c.password) : undefined
    }));
};

const saveConnections = (connections: DatabaseConnection[]): void => {
    const user = getCurrentUser();
    if (!user) return;
    const encryptedConnections = connections.map(c => ({
        ...c,
        password: c.password ? mockEncrypt(c.password) : undefined
    }));
    updateUserData({ ...user, databaseConnections: encryptedConnections });
}

export const addConnection = async (connectionData: Omit<DatabaseConnection, 'id' | 'status'>): Promise<DatabaseConnection[]> => {
    await new Promise(res => setTimeout(res, 300));
    const connections = getConnections();
    const newConnection: DatabaseConnection = {
        ...connectionData,
        id: `db_${Date.now()}`,
        status: 'disconnected',
    };
    const updatedConnections = [...connections, newConnection];
    saveConnections(updatedConnections);
    return updatedConnections;
};

export const updateConnection = async (connectionData: DatabaseConnection): Promise<DatabaseConnection[]> => {
    await new Promise(res => setTimeout(res, 300));
    let connections = getConnections();
    const index = connections.findIndex(c => c.id === connectionData.id);
    if (index === -1) throw new Error("Connection not found");
    
    // Preserve status unless it's a new connection being edited
    connections[index] = { ...connectionData, status: connections[index].status };
    saveConnections(connections);
    return connections;
};

export const deleteConnection = async (id: string): Promise<DatabaseConnection[]> => {
    await new Promise(res => setTimeout(res, 300));
    let connections = getConnections();
    const updatedConnections = connections.filter(c => c.id !== id);
    saveConnections(updatedConnections);
    return updatedConnections;
};

export const testConnection = async (connectionData: Partial<DatabaseConnection>): Promise<void> => {
    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
    
    if (connectionData.password?.toLowerCase().includes('fail')) {
        throw new Error("Invalid credentials provided.");
    }
    if (connectionData.host?.toLowerCase().includes('invalid')) {
        throw new Error("Hostname could not be resolved.");
    }
    
    return;
};

// Mock function to simulate checking connection statuses
export const checkConnectionsStatus = async (connections: DatabaseConnection[]): Promise<DatabaseConnection[]> => {
    await new Promise(res => setTimeout(res, 500));
    return connections.map(conn => {
        // Randomly change status for demonstration purposes
        if (conn.status === 'connecting') {
            return { ...conn, status: Math.random() > 0.3 ? 'connected' : 'error' };
        }
        // Small chance for a connected DB to disconnect
        if (conn.status === 'connected' && Math.random() > 0.95) {
             return { ...conn, status: 'disconnected' };
        }
        // Small chance for a disconnected DB to reconnect
        if (conn.status === 'disconnected' && Math.random() > 0.8) {
            return { ...conn, status: 'connecting' };
        }
        return conn;
    });
};