import { Sequelize, Options } from 'sequelize';
import { DatabaseConnection, TableSchema } from '../types';
import { Pool } from 'pg';
import * as mysql from 'mysql2/promise';
import * as sql from 'mssql';
import * as sqlite3 from 'sqlite3';

export class DatabaseConnector {
    private static instance: DatabaseConnector;
    private connections: Map<string, any> = new Map();

    private constructor() {}

    static getInstance(): DatabaseConnector {
        if (!DatabaseConnector.instance) {
            DatabaseConnector.instance = new DatabaseConnector();
        }
        return DatabaseConnector.instance;
    }

    async connect(connectionData: DatabaseConnection): Promise<void> {
        switch (connectionData.type) {
            case 'PostgreSQL':
                await this.connectPostgres(connectionData);
                break;
            case 'MySQL':
                await this.connectMysql(connectionData);
                break;
            case 'SQL Server':
                await this.connectMssql(connectionData);
                break;
            case 'SQLite':
                await this.connectSqlite(connectionData);
                break;
            default:
                throw new Error(`Unsupported database type: ${connectionData.type}`);
        }
    }

    private async connectPostgres(connectionData: DatabaseConnection): Promise<void> {
        const port = Number(connectionData.port || '5432');
        const pool = new Pool({
            user: connectionData.user,
            password: connectionData.password,
            host: connectionData.host || 'localhost',
            port: port,
            database: connectionData.database,
        });

        await pool.connect(); // Test connection
        this.connections.set(connectionData.id, pool);
    }

    private async connectMysql(connectionData: DatabaseConnection): Promise<void> {
        const connection = await mysql.createConnection({
            host: connectionData.host,
            user: connectionData.user,
            password: connectionData.password,
            database: connectionData.database,
            port: Number(connectionData.port || '3306'),
        });

        await connection.connect();
        this.connections.set(connectionData.id, connection);
    }

    private async connectMssql(connectionData: DatabaseConnection): Promise<void> {
        const config: sql.config = {
            user: connectionData.user,
            password: connectionData.password,
            server: connectionData.host || '',
            database: connectionData.database,
            port: Number(connectionData.port || '1433'),
            options: {
                encrypt: true,
                trustServerCertificate: true,
            },
        };

        const pool = await sql.connect(config);
        this.connections.set(connectionData.id, pool);
    }

    private async connectSqlite(connectionData: DatabaseConnection): Promise<void> {
        if (!connectionData.filePath) {
            throw new Error('File path is required for SQLite connections');
        }

        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(connectionData.filePath, (err) => {
                if (err) reject(err);
                else {
                    this.connections.set(connectionData.id, db);
                    resolve();
                }
            });
        });
    }

    async executeQuery(sql: string, connectionData: DatabaseConnection): Promise<{ headers: string[], rows: any[][] }> {
        const connection = this.connections.get(connectionData.id);
        if (!connection) {
            throw new Error('Connection not found. Please reconnect to the database.');
        }

        try {
            switch (connectionData.type) {
                case 'PostgreSQL':
                    return await this.executePostgresQuery(connection, sql);
                case 'MySQL':
                    return await this.executeMysqlQuery(connection, sql);
                case 'SQL Server':
                    return await this.executeMssqlQuery(connection, sql);
                case 'SQLite':
                    return await this.executeSqliteQuery(connection, sql);
                default:
                    throw new Error(`Unsupported database type: ${connectionData.type}`);
            }
        } catch (error: any) {
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    private async executePostgresQuery(pool: Pool, sql: string): Promise<{ headers: string[], rows: any[][] }> {
        const result = await pool.query(sql);
        const headers = result.fields.map(field => field.name);
        const rows = result.rows.map(row => headers.map(h => row[h]));
        return { headers, rows };
    }

    private async executeMysqlQuery(connection: mysql.Connection, sql: string): Promise<{ headers: string[], rows: any[][] }> {
        const [rows, fields] = await connection.execute(sql);
        const headers = fields.map(field => field.name);
        const resultRows = Array.isArray(rows) ? rows.map(row => headers.map(h => (row as any)[h])) : [];
        return { headers, rows: resultRows };
    }

    private async executeMssqlQuery(pool: sql.ConnectionPool, sql: string): Promise<{ headers: string[], rows: any[][] }> {
        const result = await pool.request().query(sql);
        const headers = Object.keys(result.recordset[0] || {});
        const rows = result.recordset.map(row => headers.map(h => row[h]));
        return { headers, rows };
    }

    private executeSqliteQuery(db: sqlite3.Database, sql: string): Promise<{ headers: string[], rows: any[][] }> {
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else {
                    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
                    const resultRows = rows.map(row => headers.map(h => row[h]));
                    resolve({ headers, rows: resultRows });
                }
            });
        });
    }

    async disconnect(connectionId: string): Promise<void> {
        const connection = this.connections.get(connectionId);
        if (connection) {
            switch (typeof connection) {
                case 'object':
                    if ('end' in connection) await connection.end();
                    else if ('close' in connection) await connection.close();
                    else if ('release' in connection) await connection.release();
                    break;
            }
            this.connections.delete(connectionId);
        }
    }

    async getSchema(connectionData: DatabaseConnection): Promise<TableSchema[]> {
        // Implementation will vary by database type
        // This is a basic example for PostgreSQL
        if (connectionData.type === 'PostgreSQL') {
            const connection = this.connections.get(connectionData.id);
            if (!connection) throw new Error('Connection not found');

            const schemaQuery = `
                SELECT 
                    table_name,
                    column_name,
                    data_type
                FROM 
                    information_schema.columns
                WHERE 
                    table_schema = 'public'
                ORDER BY 
                    table_name, ordinal_position;
            `;

            const result = await connection.query(schemaQuery);
            
            // Group by table
            const tableMap = new Map<string, TableSchema>();
            
            for (const row of result.rows) {
                if (!tableMap.has(row.table_name)) {
                    tableMap.set(row.table_name, {
                        tableName: row.table_name,
                        columns: []
                    });
                }
                
                tableMap.get(row.table_name)?.columns.push({
                    name: row.column_name,
                    type: row.data_type.toUpperCase()
                });
            }
            
            return Array.from(tableMap.values());
        }
        
        throw new Error('Schema retrieval not implemented for this database type');
    }
}

export const databaseConnector = DatabaseConnector.getInstance();
