
// MOCK ENCRYPTION - DO NOT USE IN PRODUCTION
// This is a simple XOR cipher for demonstration purposes.
// In a real app, encryption should be handled server-side with a robust algorithm.
const MOCK_SECRET = "a-very-secret-key-for-this-mock-app";

export const mockEncrypt = (text: string): string => {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ MOCK_SECRET.charCodeAt(i % MOCK_SECRET.length));
  }
  try {
    return btoa(result);
  } catch (e) {
    console.error("Failed to btoa encrypt string", e);
    return '';
  }
};

export const mockDecrypt = (text: string): string => {
  if (!text) return '';
  let result = '';
  try {
    const decoded = atob(text);
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ MOCK_SECRET.charCodeAt(i % MOCK_SECRET.length));
    }
    return result;
  } catch(e) {
    console.error("Failed to atob decrypt string", e);
    return '';
  }
};