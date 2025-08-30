import { DatabaseConnection, TableSchema } from '../types';

export class DatabaseConnector {
    private static instance: DatabaseConnector;
    private connections: Map<string, boolean> = new Map();

    private constructor() {}

    static getInstance(): DatabaseConnector {
        if (!DatabaseConnector.instance) {
            DatabaseConnector.instance = new DatabaseConnector();
        }
        return DatabaseConnector.instance;
    }

    private mockData = {
        patients: [
            { id: 1, name: 'John Doe', age: 45, condition: 'Hypertension' },
            { id: 2, name: 'Jane Smith', age: 32, condition: 'Diabetes' },
            { id: 3, name: 'Bob Wilson', age: 58, condition: 'Arthritis' }
        ],
        appointments: [
            { id: 1, patient_id: 1, date: '2025-09-01', type: 'Check-up' },
            { id: 2, patient_id: 2, date: '2025-09-02', type: 'Follow-up' },
            { id: 3, patient_id: 3, date: '2025-09-03', type: 'Consultation' }
        ]
    };

    async connect(connectionData: DatabaseConnection): Promise<void> {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (connectionData.password?.toLowerCase().includes('error')) {
            throw new Error('Invalid credentials');
        }
        
        this.connections.set(connectionData.id, true);
    }

    async executeQuery(sql: string, connectionData: DatabaseConnection): Promise<{ headers: string[], rows: any[][] }> {
        // Simulate query delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!this.connections.get(connectionData.id)) {
            throw new Error('Not connected to database');
        }

        // Simple mock query parser
        const tableName = sql.toLowerCase().includes('patients') ? 'patients' : 'appointments';
        const data = this.mockData[tableName];
        
        if (data.length === 0) {
            return { headers: [], rows: [] };
        }

        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(h => item[h]));

        return { headers, rows };
    }

    async disconnect(connectionId: string): Promise<void> {
        this.connections.delete(connectionId);
    }

    async getSchema(connectionData: DatabaseConnection): Promise<TableSchema[]> {
        return [
            {
                tableName: 'patients',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'age', type: 'INTEGER' },
                    { name: 'condition', type: 'VARCHAR' }
                ]
            },
            {
                tableName: 'appointments',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'patient_id', type: 'INTEGER' },
                    { name: 'date', type: 'DATE' },
                    { name: 'type', type: 'VARCHAR' }
                ]
            }
        ];
    }
}

// Create a singleton instance
export const databaseConnector = DatabaseConnector.getInstance();
