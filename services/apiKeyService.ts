
import { User, ApiKey, UsageLog } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';

const LOGS_STORAGE_KEY_PREFIX = 'user_usage_logs_';
const LOGGED_IN_USER_KEY = 'auth_session';

// Helper to get the current logged-in user's data
const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Helper to update the user's data in both session and the main user list
const updateUserData = (updatedUser: User) => {
    // Update session
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(updatedUser));
    
    // Update main user list
    const allUsers = JSON.parse(localStorage.getItem('auth_users') || '{}');
    if (allUsers[updatedUser.email]) {
        // Ensure we don't overwrite essential fields if they aren't on the partial update
        const currentUserState = allUsers[updatedUser.email];
        allUsers[updatedUser.email] = { ...currentUserState, ...updatedUser };
        localStorage.setItem('auth_users', JSON.stringify(allUsers));
    }
}


// --- API Key Management ---

export const getApiKeys = async (): Promise<ApiKey[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  const storedKeys = user.apiKeys || [];
  return storedKeys.map(key => ({ ...key, key: mockDecrypt(key.key) }));
};

export const addApiKey = async (name: string, key: string): Promise<ApiKey> => {
  const user = getCurrentUser();
  if (!user) throw new Error("No user logged in");
  
  const currentKeys = await getApiKeys();
  if (currentKeys.some(k => k.key === key)) {
      throw new Error("This API key has already been added.");
  }
  
  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name,
    key: mockEncrypt(key),
    maskedKey: `${key.substring(0, 5)}...${key.substring(key.length - 4)}`,
    isActive: currentKeys.length === 0, // Make first key active by default
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };

  const updatedKeys = [...currentKeys.map(k => ({...k, key: mockEncrypt(k.key)})), newKey];
  updateUserData({ ...user, apiKeys: updatedKeys });

  await logUsage(newKey.id, 'Add Key', 'Success');
  return { ...newKey, key }; // Return with decrypted key
};

export const deleteApiKey = async (keyId: string): Promise<void> => {
    const user = getCurrentUser();
    if (!user) return;
    
    let keys = await getApiKeys();
    const keyToDelete = keys.find(k => k.id === keyId);
    if (!keyToDelete) return;
    
    let updatedKeys = keys.filter(k => k.id !== keyId);
    
    // If the deleted key was active, make another key active
    if (keyToDelete.isActive && updatedKeys.length > 0) {
        updatedKeys[0].isActive = true;
    }
    
    updateUserData({ ...user, apiKeys: updatedKeys.map(k => ({...k, key: mockEncrypt(k.key)})) });
    await logUsage(keyId, 'Delete Key', 'Success');
};

export const setActiveApiKey = async (keyId: string): Promise<ApiKey[]> => {
    const user = getCurrentUser();
    if (!user) throw new Error("No user logged in");
    
    let keys = await getApiKeys();
    const updatedKeys = keys.map(k => ({ ...k, isActive: k.id === keyId }));
    
    updateUserData({ ...user, apiKeys: updatedKeys.map(k => ({...k, key: mockEncrypt(k.key)})) });
    await logUsage(keyId, 'Set Active', 'Success');
    return updatedKeys;
}

export const testApiKey = async (key: string): Promise<void> => {
  await new Promise(res => setTimeout(res, 700)); // Simulate network delay
  if (key.includes('FAIL')) {
      throw new Error("Simulated failure: Invalid API key.");
  }
  // In a real app, you'd make a lightweight call to the OpenAI API here
  return;
}

// --- Usage Logging ---

export const getUsageLogs = async (): Promise<UsageLog[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  const logsJson = localStorage.getItem(`${LOGS_STORAGE_KEY_PREFIX}${user.id}`);
  return logsJson ? JSON.parse(logsJson) : [];
};

export const logUsage = async (keyId: string, action: string, status: 'Success' | 'Failure'): Promise<void> => {
  const user = getCurrentUser();
  if (!user) return;

  const logs = await getUsageLogs();
  const newLog: UsageLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    keyId,
    action,
    status,
  };
  
  // Cap logs at 100 entries for performance
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(`${LOGS_STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(updatedLogs));
  
  // If it was a successful API call, also increment usage count
  if (action === 'generateText' && status === 'Success') {
      let keys = await getApiKeys();
      const keyIndex = keys.findIndex(k => k.id === keyId);
      if (keyIndex > -1) {
          keys[keyIndex].usageCount += 1;
          keys[keyIndex].lastUsed = new Date().toISOString();
          updateUserData({ ...user, apiKeys: keys.map(k => ({...k, key: mockEncrypt(k.key)})) });
      }
  }
};