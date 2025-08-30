
import { getActiveApiKey, logUsage } from './apiKeyService';
import { getRules } from './governanceService';
import { ChatMessage, TableSchema } from "../types";

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
 * In a real app, this would make a call to a powerful LLM like Gemini.
 */
export const generateSqlFromNaturalLanguage = async (
  prompt: string,
  schema: TableSchema[],
  history: ChatMessage[]
): Promise<{ textResponse: string; sql: string }> => {
  console.log("Generating SQL for:", prompt);
  console.log("Schema:", schema);
  console.log("History:", history);

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

  for (const rule of activeRules) {
      // This is a very simplistic mock check. A real implementation would involve more sophisticated NLP.
      const ruleKeywords = rule.rule.toLowerCase().match(/\b(\w+)\b/g) || [];
      const promptViolates = ruleKeywords.every(kw => lowerPrompt.includes(kw));

      if (promptViolates) {
          throw new Error(`Query blocked by data governance rule: "${rule.rule}"`);
      }
  }

  // Mocking the AI's logic with simple keyword matching
  await new Promise(res => setTimeout(res, 1500)); // Simulate AI thinking time
  
  let sql = "";
  let textResponse = "";

  if (lowerPrompt.includes("patient") || lowerPrompt.includes("patients")) {
    if (lowerPrompt.includes("how many") || lowerPrompt.includes("count")) {
      sql = "SELECT COUNT(*) AS total_patients FROM patients;";
      textResponse = "Here's the query to count the total number of patients.";
    } else if (lowerPrompt.includes("list") || lowerPrompt.includes("show me") || lowerPrompt.includes("who are")) {
      sql = "SELECT id, first_name, last_name, date_of_birth, gender FROM patients LIMIT 10;";
      textResponse = "Here is a list of the first 10 patients in the database.";
    } else if (lowerPrompt.match(/id (\d+)/)) {
        const match = lowerPrompt.match(/id (\d+)/);
        const id = match ? match[1] : '1';
        sql = `SELECT * FROM patients WHERE id = ${id};`;
        textResponse = `Sure, here is the information for patient ID ${id}.`;
    } else {
        sql = "SELECT id, first_name, last_name FROM patients LIMIT 5;";
        textResponse = "I'm not sure I fully understand, but here's a query for the first 5 patients.";
    }
  } else if (lowerPrompt.includes("appointment") || lowerPrompt.includes("appointments")) {
     if (lowerPrompt.includes("upcoming") || lowerPrompt.includes("next")) {
        sql = "SELECT a.id, p.first_name, p.last_name, a.appointment_date, a.reason FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.appointment_date >= CURRENT_DATE ORDER BY a.appointment_date ASC LIMIT 5;";
        textResponse = "Here are the next 5 upcoming appointments.";
     } else {
        sql = "SELECT id, patient_id, appointment_date, reason FROM appointments ORDER BY appointment_date DESC LIMIT 5;";
        textResponse = "Here are the 5 most recent appointments.";
     }
  } else {
    textResponse = "I'm sorry, I can only answer questions about 'patients' and 'appointments'. Could you please rephrase your question?";
    sql = "-- No query generated. Please ask about patients or appointments.";
  }

  if (activeKey) {
    await logUsage(activeKey.id, 'generateSQL', 'Success');
  }

  return { textResponse, sql };
};