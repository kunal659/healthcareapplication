import { getActiveApiKey, logUsage } from './apiKeyService';
import { getRules } from './governanceService';
import { ChatMessage, TableSchema, DatabaseType } from "../types";

/**
 * Generates a short, creative bio for a user based on their email.
 * This now uses the API key management system.
 * @param email The user's email address.
 * @returns A promise that resolves to a string containing the generated bio.
 */
export const generateText = async (email: string): Promise<string> => {
  const activeKey = await getActiveApiKey();
  
  if (!activeKey) {
    throw new Error("No active API key found. Please add and activate an API key in the settings.");
  }
  
  const prompt = `Generate a short, creative, and slightly quirky user bio (2-3 sentences) for a new user. Their email is "${email}". Make it positive and welcoming. Don't mention their email in the bio.`;
  
  try {
     if (activeKey.key.includes('FAIL')) {
         throw new Error("Simulated API failure");
     }
    
    // Mock response for demonstration purposes
    await new Promise(res => setTimeout(res, 1000));
    const result = `A delightful bio generated for a user with the email domain ${email.split('@')[1]}. This user clearly has great taste!`;

    await logUsage(activeKey.id, 'generateText', 'Success');
    return result;

  } catch (error) {
    console.error("Error generating bio with AI:", error);
    await logUsage(activeKey.id, 'generateText', 'Failure');
    throw new Error("Could not generate AI bio. The active API key might be invalid or the service is unavailable.");
  }
};

/**
 * MOCK: Generates a SQL query from natural language.
 * This version is now schema-aware and dialect-aware.
 */
export const generateSqlFromNaturalLanguage = async (
  prompt: string,
  schema: TableSchema[],
  history: ChatMessage[],
  dbType: DatabaseType
): Promise<{ textResponse: string; sql: string; chartSuggestion?: { chartType: 'pie' | 'bar', labelsColumn: string, dataColumn: string } }> => {
  console.log(`Generating SQL for: "${prompt}" for DB type: ${dbType}`);
  console.log("Using Schema:", schema);

  const activeKey = await getActiveApiKey();
  if (!activeKey) {
    throw new Error("No active API key found. Please add one in settings.");
  }
  if (activeKey.key.includes('FAIL')) {
      throw new Error("Simulated API key failure.");
  }
  
  // --- Governance Check ---
  const rules = await getRules();
  const activeRules = rules.filter(r => r.isActive);
  const lowerPrompt = prompt.toLowerCase();
  
  // Define common words to ignore in rules to get to the core intent
  const STOP_WORDS = new Set(['a', 'an', 'the', 'on', 'in', 'for', 'with', 'of', 'to', 'block', 'query', 'queries', 'access', 'show', 'never', 'table', 'tables', 'column', 'columns', 'data']);

  for (const rule of activeRules) {
      // Tokenize the rule, filter out stop words to find the meaningful keywords
      const ruleKeywords = rule.rule.toLowerCase().match(/\b(\w+)\b/g) || [];
      const meaningfulKeywords = ruleKeywords.filter(kw => !STOP_WORDS.has(kw));

      // If all the meaningful keywords from the rule are present in the user's prompt, block the query.
      if (meaningfulKeywords.length > 0 && meaningfulKeywords.every(kw => lowerPrompt.includes(kw))) {
          throw new Error(`Query blocked by data governance rule: "${rule.rule}"`);
      }
  }


  await new Promise(res => setTimeout(res, 1500)); // Simulate AI thinking time
  
  let sql = "";
  let textResponse = "";
  let chartSuggestion = undefined;

  const tableNames = schema.map(t => t.tableName);
  const foundTable = tableNames.find(name => lowerPrompt.includes(name.toLowerCase().replace(/_/g, " ")));

  if (foundTable) {
      const tableSchema = schema.find(t => t.tableName === foundTable);
      const isBarChartRequest = lowerPrompt.includes('by ') || lowerPrompt.includes('per ');
      const isPieChartRequest = lowerPrompt.includes('breakdown') || lowerPrompt.includes('distribution');

      if (isBarChartRequest) {
          const match = lowerPrompt.match(/by (\w+)/);
          const groupByColumn = match?.[1] ? tableSchema?.columns.find(c => c.name.toLowerCase() === match[1])?.name : undefined;
          
          if (groupByColumn) {
              const dataColumn = `${groupByColumn}_count`;
              sql = `SELECT ${groupByColumn}, COUNT(*) AS ${dataColumn} FROM ${foundTable} GROUP BY ${groupByColumn} ORDER BY ${dataColumn} DESC;`;
              textResponse = `Here's the query for the number of records in ${foundTable} grouped by ${groupByColumn}. I've also generated a bar chart to visualize it.`;
              chartSuggestion = { chartType: 'bar', labelsColumn: groupByColumn, dataColumn: dataColumn };
          }
      } else if (isPieChartRequest) {
           const categoricalColumn = tableSchema?.columns.find(c => ['varchar', 'char', 'text', 'boolean'].includes(c.type.toLowerCase()) && c.name.toLowerCase() !== 'id' && !c.name.toLowerCase().includes('name'))?.name;
           if (categoricalColumn) {
              const dataColumn = `count`;
              sql = `SELECT ${categoricalColumn}, COUNT(*) as ${dataColumn} FROM ${foundTable} GROUP BY ${categoricalColumn};`;
              textResponse = `Here is a breakdown of ${foundTable} by ${categoricalColumn}. I've visualized it with a pie chart.`;
              chartSuggestion = { chartType: 'pie', labelsColumn: categoricalColumn, dataColumn: dataColumn };
           }
      }

      // Fallback to simple query if no chart is generated
      if (!sql) {
          const columns = tableSchema ? tableSchema.columns.map(c => c.name).slice(0, 5).join(', ') : '*';
          if (lowerPrompt.includes("how many") || lowerPrompt.includes("count")) {
              sql = `SELECT COUNT(*) AS total_count FROM ${foundTable};`;
              textResponse = `Here's the query to count the total number of records in the ${foundTable} table.`;
          } else {
              if (dbType === 'SQL Server') {
                  sql = `SELECT TOP 10 ${columns} FROM ${foundTable};`;
              } else {
                  sql = `SELECT ${columns} FROM ${foundTable} LIMIT 10;`;
              }
              textResponse = `Sure, here is a list of the first 10 records from the ${foundTable} table.`;
          }
      }
  } else {
      textResponse = "I'm sorry, I couldn't identify a specific table in your question. Please mention a table name like 'patients' or 'appointments' in your request.";
      sql = `-- No query generated. Please specify a table from the schema. Available tables: ${tableNames.join(', ')}`;
  }

  if (activeKey) {
    await logUsage(activeKey.id, 'generateSQL', 'Success');
  }

  return { textResponse, sql, chartSuggestion };
};