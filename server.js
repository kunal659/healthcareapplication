// Filename: server.js
// This is a new file that acts as a secure backend bridge between the frontend and a live SQL Server database.

import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

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


// --- API Endpoint to Generate SQL with LangChain and OpenAI ---
app.post('/api/generate-sql', async (req, res) => {
    const { prompt, schema, history, dbType, apiKey } = req.body;
    
    if (!prompt || !schema || !dbType || !apiKey) {
        return res.status(400).json({ error: 'Missing required parameters for AI generation.' });
    }

    try {
        console.log('[AI] Initializing OpenAI model...');
        const model = new ChatOpenAI({
            apiKey: apiKey,
            modelName: "gpt-4", // Or "gpt-3.5-turbo"
            temperature: 0,
        });

        const parser = new JsonOutputParser();
        const formatInstructions = parser.getFormatInstructions();

        const schemaString = schema.map(t => 
            `Table "${t.tableName}" has columns: ${t.columns.map(c => `${c.name} (${c.type})`).join(', ')}.`
        ).join('\n');
        
        const historyString = history
            .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content.text || ''} ${msg.content.sql || ''}`)
            .join('\n');

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", `You are an expert SQL assistant for a {dbType} database. Your goal is to generate a syntactically correct SQL query based on the user's question and the provided database schema.

            Guidelines:
            1.  **Safety First:** ONLY generate SELECT queries. NEVER generate queries that modify the database (INSERT, UPDATE, DELETE, DROP, etc.).
            2.  **Schema Awareness:** Use the following schema to construct the query:
                {schema}
            3.  **Clarity:** Provide a brief, one-sentence natural language response explaining the query you've generated.
            4.  **Visualization:** If the user's question implies a breakdown, distribution, or grouping (e.g., "by category," "per user"), suggest a chart.
                - Use 'pie' for simple distributions of a categorical column.
                - Use 'bar' for counts of items in different categories.
                - The labelsColumn must be a categorical column from the query, and the dataColumn must be a numerical column.
            5.  **History:** Use the chat history for context if the user asks a follow-up question.
                {history}
            6.  **Output Format:** You MUST respond with a JSON object that follows these instructions: {format_instructions}
            7.  **IMPORTANT:** Do NOT include any text or markdown before or after the JSON. Only output the JSON object.
            8.  If you cannot answer, return an empty JSON object: {}. Never apologize or explain, only output the JSON object.
            9.  Always output the SQL query first in the JSON object, before any explanation or chart suggestion.
            `],
            ["human", "{prompt}"]
        ]);
        
        const chain = promptTemplate.pipe(model).pipe(parser);
        
        console.log('[AI] Invoking LangChain...');
        let result;
        try {
            result = await chain.invoke({
                dbType,
                schema: schemaString,
                history: historyString,
                prompt,
                format_instructions: formatInstructions,
            });
        } catch (jsonErr) {
            // If the parser fails, return a clear error
            console.error('[AI] JSON parsing error:', jsonErr.message);
            return res.status(500).json({ error: 'AI response was not valid JSON.', details: jsonErr.message });
        }

        console.log('[AI] Generation successful.');
        console.log('[AI] Generated result:', result); // Log the AI's response (including SQL)
        res.json(result);

    } catch (err) {
        console.error('[AI] LangChain/OpenAI error:', err.message);
        res.status(500).json({ error: 'Failed to generate SQL query with AI.', details: err.message });
    }
});


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log('This server acts as a secure bridge for the frontend to connect to live SQL databases.');
});