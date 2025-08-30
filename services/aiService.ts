
import { GoogleGenAI } from "@google/genai";
import { getApiKeys, logUsage } from './apiKeyService';

// This is a placeholder as the app doesn't have a secure backend for secrets.
// In a real application, the API key should be handled on the server-side.
const getApiKeyFromLocalStorage = async (): Promise<string | null> => {
  const keys = await getApiKeys();
  const activeKey = keys.find(k => k.isActive);
  return activeKey ? activeKey.key : null;
};

/**
 * Generates a short, creative bio for a user based on their email.
 * This now uses the API key management system.
 * @param email The user's email address.
 * @returns A promise that resolves to a string containing the generated bio.
 */
export const generateText = async (email: string): Promise<string> => {
  const keys = await getApiKeys();
  const activeKey = keys.find(k => k.isActive);
  
  if (!activeKey) {
    throw new Error("No active API key found. Please add and activate an API key in the settings.");
  }
  
  const prompt = `Generate a short, creative, and slightly quirky user bio (2-3 sentences) for a new user. Their email is "${email}". Make it positive and welcoming. Don't mention their email in the bio.`;
  
  try {
     // This is a mock implementation. We are not actually calling the Gemini API.
     // We check if the key is a "mock failing key" to test our fallback logic.
     if (activeKey.key.includes('FAIL')) {
         throw new Error("Simulated API failure");
     }
    
    // To use the actual Gemini API, you would uncomment the following lines:
    /*
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set for Gemini Service");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const result = response.text.trim();
    */
    
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