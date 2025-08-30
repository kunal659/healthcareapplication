
import { User, DatabaseConnection, TableSchema } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';
import { getDb, saveDatabase } from './sqliteService';
import { getCurrentUser } from './authService';
import { databaseConnector } from './realDatabaseService';

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

const mockSchema: TableSchema[] = [
    {
        tableName: 'patients',
        columns: [
            { name: 'id', type: 'INTEGER' },
            { name: 'first_name', type: 'VARCHAR(50)' },
            { name: 'last_name', type: 'VARCHAR(50)' },
            { name: 'date_of_birth', type: 'DATE' },
            { name: 'gender', type: 'VARCHAR(10)' },
        ],
    },
    {
        tableName: 'appointments',
        columns: [
            { name: 'id', type: 'INTEGER' },
            { name: 'patient_id', type: 'INTEGER' },
            { name: 'appointment_date', type: 'TIMESTAMP' },
            { name: 'reason', type: 'TEXT' },
        ],
    },
];

export const addConnection = async (connectionData: Omit<DatabaseConnection, 'id' | 'status'>): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();

    let status: 'connected' | 'disconnected' = 'disconnected';
    try {
        await testConnection(connectionData);
        status = 'connected';
    } catch (e) {
        console.warn("Initial connection test failed, saving as disconnected.", e);
        // If the test fails, we still save it but as disconnected.
        status = 'disconnected';
    }

    db.run(
        `INSERT INTO database_connections (id, user_id, name, type, host, port, database, user, password, filePath, status, schema)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            `db_${Date.now()}`, user.id, connectionData.name, connectionData.type,
            connectionData.host ?? null,
            connectionData.port ?? null,
            connectionData.database ?? null,
            connectionData.user ?? null,
            connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath ?? null,
            status, // Use the dynamically determined status
            JSON.stringify(mockSchema)
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
        `UPDATE database_connections SET name = ?, type = ?, host = ?, port = ?, database = ?, user = ?, password = ?, filePath = ?, status = ?
         WHERE id = ? AND user_id = ?`,
        [
            connectionData.name, connectionData.type,
            connectionData.host ?? null,
            connectionData.port ?? null,
            connectionData.database ?? null,
            connectionData.user ?? null,
            connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath ?? null,
            status, // Also update the status field
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
    try {
        await databaseConnector.connect(connectionData as DatabaseConnection);
        await databaseConnector.disconnect(connectionData.id as string);
        return [connectionData.database || ''];
    } catch (error: any) {
        throw new Error(`Connection test failed: ${error.message}`);
    }
};

// Mock function to simulate checking connection statuses
export const checkConnectionsStatus = async (connections: DatabaseConnection[]): Promise<DatabaseConnection[]> => {
    await new Promise(res => setTimeout(res, 500));
    const user = await getCurrentUser();
    if (!user) return connections;
    const db = await getDb();

    const updatedConnections = connections.map(conn => {
        let newStatus = conn.status;
        if (conn.status === 'connecting') {
            newStatus = Math.random() > 0.3 ? 'connected' : 'error';
        } else if (conn.status === 'connected' && Math.random() > 0.95) {
             newStatus = 'disconnected';
        } else if (conn.status === 'disconnected' && Math.random() > 0.8) {
            newStatus = 'connecting';
        }
        
        if (newStatus !== conn.status) {
            db.run("UPDATE database_connections SET status = ? WHERE id = ?", [newStatus, conn.id]);
        }
        return { ...conn, status: newStatus };
    });

    if (updatedConnections.some((c, i) => c.status !== connections[i].status)) {
        await saveDatabase();
    }
    return updatedConnections;
};

const mockPatientDataOMOP1 = [
    { id: 1, first_name: 'John', last_name: 'Doe', date_of_birth: '1985-05-15', gender: 'Male' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', date_of_birth: '1992-08-22', gender: 'Female' },
    { id: 3, first_name: 'Peter', last_name: 'Jones', date_of_birth: '1978-11-30', gender: 'Male' },
    { id: 4, first_name: 'Mary', last_name: 'Williams', date_of_birth: '2001-02-10', gender: 'Female' },
];

const mockPatientDataOMOP2 = [
    { id: 10, first_name: 'Alice', last_name: 'Johnson', date_of_birth: '1990-01-01', gender: 'Female' },
    { id: 11, first_name: 'Bob', last_name: 'Miller', date_of_birth: '1988-03-12', gender: 'Male' },
];

const mockAppointmentData = [
    { id: 101, patient_id: 1, appointment_date: '2024-08-15 10:00:00', reason: 'Annual Checkup' },
    { id: 102, patient_id: 2, appointment_date: '2024-08-15 11:30:00', reason: 'Flu Shot' },
    { id: 103, patient_id: 3, appointment_date: '2024-08-16 09:00:00', reason: 'Follow-up' },
];

export const executeQuery = async (sql: string, connection: DatabaseConnection): Promise<{ headers: string[], rows: any[][] }> => {
    // For safety, only allow SELECT queries
    if (sql.toLowerCase().includes('delete') || sql.toLowerCase().includes('update') || sql.toLowerCase().includes('insert')) {
        throw new Error("For safety, only SELECT queries can be executed.");
    }

    try {
        await databaseConnector.connect(connection);
        const result = await databaseConnector.executeQuery(sql, connection);
        await databaseConnector.disconnect(connection.id);
        return result;
    } catch (error: any) {
        throw new Error(`Query execution failed: ${error.message}`);
    }
};
