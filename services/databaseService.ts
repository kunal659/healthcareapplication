import { User, DatabaseConnection, TableSchema } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';
import { getDb, saveDatabase } from './sqliteService';
import { getCurrentUser } from './authService';

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

    db.run(
        `INSERT INTO database_connections (id, user_id, name, type, host, port, database, user, password, filePath, status, schema)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            `db_${Date.now()}`, user.id, connectionData.name, connectionData.type,
            connectionData.host, connectionData.port, connectionData.database,
            connectionData.user, connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath, 'disconnected', JSON.stringify(mockSchema)
        ]
    );

    await saveDatabase();
    return getConnections();
};

export const updateConnection = async (connectionData: DatabaseConnection): Promise<DatabaseConnection[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();
    
    db.run(
        `UPDATE database_connections SET name = ?, type = ?, host = ?, port = ?, database = ?, user = ?, password = ?, filePath = ?
         WHERE id = ? AND user_id = ?`,
        [
            connectionData.name, connectionData.type, connectionData.host,
            connectionData.port, connectionData.database, connectionData.user,
            connectionData.password ? mockEncrypt(connectionData.password) : null,
            connectionData.filePath, connectionData.id, user.id
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

const mockPatientData = [
    { id: 1, first_name: 'John', last_name: 'Doe', date_of_birth: '1985-05-15', gender: 'Male' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', date_of_birth: '1992-08-22', gender: 'Female' },
    { id: 3, first_name: 'Peter', last_name: 'Jones', date_of_birth: '1978-11-30', gender: 'Male' },
    { id: 4, first_name: 'Mary', last_name: 'Williams', date_of_birth: '2001-02-10', gender: 'Female' },
];

const mockAppointmentData = [
    { id: 101, patient_id: 1, appointment_date: '2024-08-15 10:00:00', reason: 'Annual Checkup' },
    { id: 102, patient_id: 2, appointment_date: '2024-08-15 11:30:00', reason: 'Flu Shot' },
    { id: 103, patient_id: 3, appointment_date: '2024-08-16 09:00:00', reason: 'Follow-up' },
];

export const executeQuery = async (sql: string): Promise<{ headers: string[], rows: any[][] }> => {
    await new Promise(res => setTimeout(res, 800)); // Simulate query execution time
    
    if (sql.toLowerCase().includes('delete') || sql.toLowerCase().includes('update') || sql.toLowerCase().includes('insert')) {
        throw new Error("For safety, only SELECT queries can be executed in this demo.");
    }

    if (sql.toLowerCase().includes('patients')) {
        if (sql.toLowerCase().includes('count')) {
            return { headers: ['total_patients'], rows: [[mockPatientData.length]] };
        }
        const headers = Object.keys(mockPatientData[0]);
        const rows = mockPatientData.map(p => Object.values(p));
        return { headers, rows };
    }
    
    if (sql.toLowerCase().includes('appointments')) {
         const headers = Object.keys(mockAppointmentData[0]);
        const rows = mockAppointmentData.map(p => Object.values(p));
        return { headers, rows };
    }

    throw new Error("Query execution failed. The mock database only contains 'patients' and 'appointments' tables.");
};