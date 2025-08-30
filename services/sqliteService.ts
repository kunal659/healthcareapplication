import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
const DB_STORAGE_KEY = 'sqlite_db';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

const createDatabase = (SQL: any) => {
    const newDb = new SQL.Database();
    
    // Define schema
    const schema = `
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            passwordHash TEXT,
            isVerified INTEGER,
            bio TEXT,
            monthlyBudget REAL,
            verificationToken TEXT,
            resetToken TEXT
        );

        CREATE TABLE api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT,
            maskedKey TEXT,
            key TEXT,
            isActive INTEGER,
            createdAt TEXT,
            lastUsed TEXT,
            usageCount INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE usage_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            timestamp TEXT,
            keyId TEXT,
            action TEXT,
            status TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE database_connections (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT,
            type TEXT,
            host TEXT,
            port INTEGER,
            database TEXT,
            user TEXT,
            password TEXT,
            filePath TEXT,
            status TEXT,
            schema TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `;
    
    newDb.run(schema);
    console.log("New SQLite database created with schema.");
    return newDb;
};

export const initializeDatabase = async (): Promise<Database> => {
    if (db) return db;

    try {
        // Manually fetch the wasm binary to bypass the library's file loading
        // logic that fails in this environment by trying to call `fs.readFileSync`.
        const wasmURL = 'https://aistudiocdn.com/sql.js@^1.10.3/dist/sql-wasm.wasm';
        const wasmBinary = await fetch(wasmURL).then(res => {
            if (!res.ok) {
                throw new Error(`Failed to fetch wasm: ${res.status} ${res.statusText}`);
            }
            return res.arrayBuffer();
        });

        const SQL = await initSqlJs({ wasmBinary });

        const savedDbBase64 = localStorage.getItem(DB_STORAGE_KEY);

        if (savedDbBase64) {
            console.log("Loading database from localStorage...");
            const savedDbArray = base64ToArrayBuffer(savedDbBase64);
            db = new SQL.Database(new Uint8Array(savedDbArray));
        } else {
            console.log("No saved database found, creating a new one.");
            db = createDatabase(SQL);
            await saveDatabase();
        }

        return db;
    } catch (e) {
        console.error("Failed to initialize sql.js", e);
        throw e;
    }
};

export const getDb = async (): Promise<Database> => {
    if (db) return db;
    return await initializeDatabase();
};

export const saveDatabase = async () => {
    if (!db) {
        console.warn("Database not initialized, cannot save.");
        return;
    }
    try {
        const data = db.export();
        const base64 = arrayBufferToBase64(data.buffer);
        localStorage.setItem(DB_STORAGE_KEY, base64);
        console.log("Database saved to localStorage.");
    } catch (e) {
        console.error("Failed to save database:", e);
    }
};