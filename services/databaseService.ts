
import { DatabaseConnection, TableSchema } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';
import { getDb, saveDatabase } from './sqliteService';
import { getCurrentUser } from './authService';
import initSqlJs, { Database } from 'sql.js';

const BACKEND_URL = 'http://localhost:3001'; // URL for the optional backend server

const fromDbToConnection = (dbObj: any): DatabaseConnection => {
    return {
        ...dbObj,
        password: dbObj.password ? mockDecrypt(dbObj.password) : undefined,
        schema: dbObj.schema ? JSON.parse(dbObj.schema) : []
    };
};

const getConnections = async (): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) return [];
    const db = await getDb();
    const res = db.exec("SELECT * FROM database_connections WHERE user_id = ?", [user.id]);
    if (res.length === 0) return [];

    const columns = res[0].columns;
    const values = res[0].values;

    return values.map(row => {
        const dbObj = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
        return fromDbToConnection(dbObj);
    });
};

const fetchSchemaFromBackend = async (connectionData: Partial<DatabaseConnection>): Promise<TableSchema[]> => {
    const response = await fetch(`${BACKEND_URL}/api/schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionDetails: connectionData })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to fetch schema from backend.');
    }
    const { schema } = await response.json();
    return schema;
};

export const addConnection = async (connectionData: Omit<DatabaseConnection, 'id' | 'status'>): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();

    let status: 'connected' | 'disconnected' = 'disconnected';
    let schema: TableSchema[] = [];
    try {
        await testConnection(connectionData);
        status = 'connected';
        if (connectionData.type !== 'SQLite') {
           // schema = await fetchSchemaFromBackend(connectionData);
        }
    } catch (e) {
        console.warn("Initial connection test failed, saving as disconnected.", e);
        status = 'disconnected';
    }

    db.run(
        `INSERT INTO database_connections (id, user_id, name, type, host, port, database, user, password, filePath, dbFileContent, status, schema)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            `db_${Date.now()}`, user.id, connectionData.name, connectionData.type,
            connectionData.host ?? null,
            connectionData.port ?? null,
            connectionData.database ?? null,
            connectionData.user ?? null,
            connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath ?? null,
            connectionData.dbFileContent ?? null,
            status,
            JSON.stringify(schema)
        ]
    );

    await saveDatabase();
    return getConnections();
};

export const updateConnection = async (connectionData: DatabaseConnection): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();
    
    let status: 'connected' | 'disconnected' | 'error' = connectionData.status as any;
    try {
        await testConnection(connectionData);
        status = 'connected';
    } catch (e) {
        console.warn("Connection test failed during update, saving as disconnected.", e);
        status = 'disconnected';
    }

    db.run(
        `UPDATE database_connections SET name = ?, type = ?, host = ?, port = ?, database = ?, user = ?, password = ?, filePath = ?, dbFileContent = ?, status = ?
         WHERE id = ? AND user_id = ?`,
        [
            connectionData.name, connectionData.type,
            connectionData.host ?? null,
            connectionData.port ?? null,
            connectionData.database ?? null,
            connectionData.user ?? null,
            connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath ?? null,
            connectionData.dbFileContent ?? null,
            status,
            connectionData.id, user.id
        ]
    );
    await saveDatabase();
    return getConnections();
};

export const deleteConnection = async (id: string): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();
    db.run("DELETE FROM database_connections WHERE id = ? AND user_id = ?", [id, user.id]);
    await saveDatabase();
    return getConnections();
};

export const testConnection = async (connectionData: Partial<DatabaseConnection>): Promise<string[]> => {
    if (connectionData.type === 'SQLite') {
        if (!connectionData.dbFileContent) throw new Error("No SQLite file provided.");
        // For SQLite, a successful test is just having the file content.
        return [connectionData.filePath || 'database.db'];
    }
    
    // For other DB types, we call the backend
    const response = await fetch(`${BACKEND_URL}/api/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionDetails: connectionData })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Backend connection test failed.');
    }

    const { databases } = await response.json();
    return databases;
};

export const checkConnectionsStatus = async (connections: DatabaseConnection[]): Promise<DatabaseConnection[]> => {
    // For this version, we'll keep the mock status check for simplicity
    // A real implementation would involve backend calls for each connection.
    const updatedConnections = connections.map(conn => ({ ...conn }));
    // Simple mock logic for UI feedback
    return updatedConnections; 
};

const base64ToUint8Array = (base64: string) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

export const executeQuery = async (sql: string, connection: DatabaseConnection): Promise<{ headers: string[], rows: any[][] }> => {
    if (connection.type === 'SQLite') {
        if (!connection.dbFileContent) throw new Error("No SQLite database file has been uploaded for this connection.");
        
        try {
            const wasmURL = 'https://aistudiocdn.com/sql.js@^1.10.3/dist/sql-wasm.wasm';
            const wasmBinary = await fetch(wasmURL).then(res => res.arrayBuffer());
            const SQL = await initSqlJs({ wasmBinary });
            
            const dbBytes = base64ToUint8Array(connection.dbFileContent);
            const db = new SQL.Database(dbBytes);
            const results = db.exec(sql);
            db.close();

            if (results.length === 0) {
                return { headers: [], rows: [] };
            }

            return {
                headers: results[0].columns,
                rows: results[0].values
            };
        } catch (e: any) {
            throw new Error(`SQLite Query Error: ${e.message}`);
        }
    }
    
    // For networked databases, call the backend
    const response = await fetch(`${BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            connectionDetails: connection,
            query: sql,
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to execute query on the backend.');
    }

    const data = await response.json();
    return data;
};
