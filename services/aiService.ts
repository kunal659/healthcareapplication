import { getActiveApiKey, logUsage } from './apiKeyService';
import { ChatMessage, TableSchema, DatabaseType, ChatMessageContent } from "../types";

const BACKEND_URL = 'http://localhost:3001';

/**
 * MOCK: Generates a short, creative bio for a user based on their email.
 * This can remain a mock as it's a minor feature.
 * @param email The user's email address.
 * @returns A promise that resolves to a string containing the generated bio.
 */
export const generateText = async (email: string): Promise<string> => {
  const activeKey = await getActiveApiKey();
  
  if (!activeKey) {
    throw new Error("No active OpenAI API key found. Please add and activate an API key in the settings.");
  }
  
  // This can remain a mocked feature for demonstration
  await new Promise(res => setTimeout(res, 1000));
  const result = `A delightful bio generated for a user with the email domain ${email.split('@')[1]}. This user clearly has great taste!`;
  await logUsage(activeKey.id, 'generateText', 'Success');
  return result;
};

/**
 * REAL IMPLEMENTATION: Generates a SQL query by calling the backend which uses LangChain and OpenAI.
 */
export const generateSqlFromNaturalLanguage = async (
  prompt: string,
  schema: TableSchema[],
  history: ChatMessage[],
  dbType: DatabaseType
): Promise<ChatMessageContent> => {
  const activeKey = await getActiveApiKey();
  if (!activeKey) {
    throw new Error("No active OpenAI API key found. Please add one in settings to use the SQL Chat.");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        schema,
        history,
        dbType,
        apiKey: activeKey.key // Send the real, unencrypted key to the backend
      })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    await logUsage(activeKey.id, 'generateSQL', 'Success');
    
    // The backend now returns the full ChatMessageContent object
    return data;

  } catch (error: any) {
    if (activeKey) {
      await logUsage(activeKey.id, 'generateSQL', 'Failure');
    }
    console.error("Error generating SQL with AI:", error);
    throw new Error(`AI query failed: ${error.message}`);
  }
};