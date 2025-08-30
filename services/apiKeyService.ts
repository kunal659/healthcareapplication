import { ApiKey, UsageLog } from '../types';
import { mockEncrypt, mockDecrypt } from './encryption';
import { getDb, saveDatabase } from './sqliteService';
import { getCurrentUser } from './authService';

const fromDbToApiKey = (dbObj: any): ApiKey => {
    return {
        ...dbObj,
        isActive: !!dbObj.isActive,
        key: mockDecrypt(dbObj.key)
    };
};

// --- API Key Management ---

export const getApiKeys = async (): Promise<ApiKey[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = await getDb();
  const res = db.exec("SELECT * FROM api_keys WHERE user_id = ?", [user.id]);
  if (res.length === 0) return [];

  const columns = res[0].columns;
  const values = res[0].values;

  return values.map(row => {
      const dbObj = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
      return fromDbToApiKey(dbObj);
  });
};

export const getActiveApiKey = async (): Promise<ApiKey | null> => {
    const keys = await getApiKeys();
    return keys.find(k => k.isActive) || null;
}

export const addApiKey = async (name: string, key: string): Promise<ApiKey[]> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("No user logged in");

  const currentKeys = await getApiKeys();
  if (currentKeys.some(k => k.key === key)) {
      throw new Error("This API key has already been added.");
  }

  const db = await getDb();
  const newKeyId = `key_${Date.now()}`;
  const isActive = currentKeys.length === 0;

  db.run(
      "INSERT INTO api_keys (id, user_id, name, maskedKey, key, isActive, createdAt, usageCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
          newKeyId,
          user.id,
          name,
          `${key.substring(0, 5)}...${key.substring(key.length - 4)}`,
          mockEncrypt(key),
          isActive ? 1 : 0,
          new Date().toISOString(),
          0
      ]
  );
  
  await logUsage(newKeyId, 'Add Key', 'Success');
  await saveDatabase();

  return getApiKeys();
};

export const deleteApiKey = async (keyId: string): Promise<ApiKey[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not found");

    const keys = await getApiKeys();
    const keyToDelete = keys.find(k => k.id === keyId);
    if (!keyToDelete) return keys;

    const db = await getDb();
    db.run("DELETE FROM api_keys WHERE id = ? AND user_id = ?", [keyId, user.id]);

    // If the deleted key was active, make another key active
    if (keyToDelete.isActive && keys.length > 1) {
        const nextKey = keys.find(k => k.id !== keyId);
        if (nextKey) {
            db.run("UPDATE api_keys SET isActive = 1 WHERE id = ? AND user_id = ?", [nextKey.id, user.id]);
        }
    }
    
    await logUsage(keyId, 'Delete Key', 'Success');
    await saveDatabase();
    return getApiKeys();
};

export const setActiveApiKey = async (keyId: string): Promise<ApiKey[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No user logged in");
    const db = await getDb();

    // Set all keys to inactive
    db.run("UPDATE api_keys SET isActive = 0 WHERE user_id = ?", [user.id]);
    // Set the selected key to active
    db.run("UPDATE api_keys SET isActive = 1 WHERE id = ? AND user_id = ?", [keyId, user.id]);

    await logUsage(keyId, 'Set Active', 'Success');
    await saveDatabase();
    return getApiKeys();
}

export const testApiKey = async (key: string): Promise<void> => {
  await new Promise(res => setTimeout(res, 700)); // Simulate network delay
  if (key.includes('FAIL')) {
      throw new Error("Simulated failure: Invalid API key.");
  }
  return;
}

// --- Usage Logging ---

export const getUsageLogs = async (): Promise<UsageLog[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = await getDb();
  const res = db.exec("SELECT * FROM usage_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100", [user.id]);
  if (res.length === 0) return [];
  
  const columns = res[0].columns;
  const values = res[0].values;

  // FIX: Cast to 'unknown' first to handle the type conversion from an array of generic objects to UsageLog[].
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]]))) as unknown as UsageLog[];
};

export const logUsage = async (keyId: string, action: string, status: 'Success' | 'Failure'): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) return;
  const db = await getDb();

  db.run("INSERT INTO usage_logs (id, user_id, timestamp, keyId, action, status) VALUES (?, ?, ?, ?, ?, ?)", [
      `log_${Date.now()}`,
      user.id,
      new Date().toISOString(),
      keyId,
      action,
      status
  ]);

  if ((action === 'generateText' || action === 'generateSQL') && status === 'Success') {
      db.run(
          "UPDATE api_keys SET usageCount = usageCount + 1, lastUsed = ? WHERE id = ?",
          [new Date().toISOString(), keyId]
      );
  }
  await saveDatabase();
};
