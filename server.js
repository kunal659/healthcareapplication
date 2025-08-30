// Filename: server.js
// This is a new file that acts as a secure backend bridge between the frontend and a live SQL Server database.

import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
const port = 3001; // The port our backend server will run on

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON bodies

// --- Helper function to build the SQL Server config ---
const buildDbConfig = (details) => {
  if (!details || !details.host || !details.user) {
      throw new Error("Incomplete connection details. Host and user are required.");
  }
  return {
    user: details.user,
    password: details.password,
    server: details.host,
    database: details.database,
    port: details.port || 1433,
    options: {
      encrypt: false, // Set to true for Azure SQL or if you have SSL configured on your server
      trustServerCertificate: true, // Recommended to set to false in production with a valid certificate
    },
  };
};

// --- API Endpoint to Test a Database Connection ---
app.post('/api/test-connection', async (req, res) => {
  const { connectionDetails } = req.body;
  try {
    const config = buildDbConfig(connectionDetails);
    
    // Connect to the server without specifying a database to list all available databases
    const tempConfig = { ...config, database: undefined };
    
    console.log(`[Test] Attempting connection to ${config.server}...`);
    await sql.connect(tempConfig);
    
    // Query to get all database names on the server
    const result = await sql.query`SELECT name FROM sys.databases`;
    await sql.close();
    
    const databases = result.recordset.map(row => row.name);
    console.log(`[Test] Connection successful. Found databases:`, databases);
    
    res.json({ message: 'Connection successful', databases });
  } catch (err) {
    console.error('[Test] SQL Server connection error:', err.message);
    res.status(500).json({ error: 'Failed to connect to the database.', details: err.message });
  }
});

// --- API Endpoint to Fetch Database Schema ---
app.post('/api/schema', async (req, res) => {
    const { connectionDetails } = req.body;
    try {
        const config = buildDbConfig(connectionDetails);
        console.log(`[Schema] Attempting connection to ${config.server}/${config.database}...`);
        await sql.connect(config);

        const query = `
            SELECT
                t.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE
            FROM
                INFORMATION_SCHEMA.TABLES t
            JOIN
                INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
            WHERE
                t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY
                t.TABLE_NAME, c.ORDINAL_POSITION;
        `;
        const result = await sql.query(query);
        await sql.close();

        // Group columns by table name
        const schemaMap = new Map();
        result.recordset.forEach(row => {
            if (!schemaMap.has(row.TABLE_NAME)) {
                schemaMap.set(row.TABLE_NAME, { tableName: row.TABLE_NAME, columns: [] });
            }
            schemaMap.get(row.TABLE_NAME).columns.push({ name: row.COLUMN_NAME, type: row.DATA_TYPE });
        });
        
        const schema = Array.from(schemaMap.values());
        console.log(`[Schema] Schema fetched successfully for ${config.database}.`);
        res.json({ schema });

    } catch (err) {
        console.error('[Schema] SQL Server schema fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch schema.', details: err.message });
    }
});


// --- API Endpoint to Execute a SQL Query ---
app.post('/api/query', async (req, res) => {
  const { connectionDetails, query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query.' });
  }

  try {
    const config = buildDbConfig(connectionDetails);

    console.log(`[Query] Attempting to connect to ${config.server}/${config.database}...`);
    await sql.connect(config);
    console.log('[Query] Connection successful!');

    // For safety in this demo, block potentially destructive operations on the server-side as well
    const lowerQuery = query.toLowerCase();
    if (!lowerQuery.trim().startsWith('select')) {
        await sql.close();
        throw new Error("For safety, this demo only allows SELECT queries.");
    }

    const result = await sql.query(query);
    console.log(`[Query] Executed successfully. Rows returned: ${result.recordset.length}`);
    await sql.close();
    
    if (result.recordset.length === 0) {
        return res.json({ headers: [], rows: [] });
    }

    // Format the results for the frontend table
    const headers = Object.keys(result.recordset[0]);
    const rows = result.recordset.map(record => Object.values(record));

    res.json({ headers, rows });

  } catch (err) {
    console.error('[Query] SQL Server connection or query error:', err.message);
    res.status(500).json({ error: 'Failed to connect or execute query.', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log('This server acts as a secure bridge for the frontend to connect to live SQL databases.');
});