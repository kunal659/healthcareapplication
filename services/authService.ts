import { User } from '../types';
import { getDb, saveDatabase } from './sqliteService';

const LOGGED_IN_USER_KEY = 'auth_session';

// FIX: Safely handle apiKeys/databaseConnections that may already be arrays, not JSON strings.
const toPublicUser = (user: any): User => {
    const { passwordHash, verificationToken, resetToken, ...publicUser } = user;
    return {
        ...publicUser,
        isVerified: !!publicUser.isVerified,
        apiKeys: publicUser.apiKeys ? (typeof publicUser.apiKeys === 'string' ? JSON.parse(publicUser.apiKeys) : publicUser.apiKeys) : [],
        databaseConnections: publicUser.databaseConnections ? (typeof publicUser.databaseConnections === 'string' ? JSON.parse(publicUser.databaseConnections) : publicUser.databaseConnections) : [],
    };
};

export const register = async (email: string, password: string): Promise<User> => {
  const db = await getDb();
  const lowerCaseEmail = email.toLowerCase();

  const existing = db.exec("SELECT email FROM users WHERE email = ?", [lowerCaseEmail]);
  if (existing.length > 0) {
    throw new Error('An account with this email already exists.');
  }
  
  const verificationToken = `verify-token-${Date.now()}-${Math.random()}`;
  const userId = `user_${Date.now()}`;
  
  db.run("INSERT INTO users (id, email, passwordHash, isVerified, monthlyBudget, verificationToken) VALUES (?, ?, ?, ?, ?, ?)", [
      userId,
      lowerCaseEmail,
      password, // In a real app, hash the password here
      0, // false
      50,
      verificationToken
  ]);

  await saveDatabase();
  console.log(`Simulating verification email sent to ${email}. Token: ${verificationToken}`);

  const userRes = db.exec("SELECT * FROM users WHERE id = ?", [userId]);
  if (userRes.length === 0) throw new Error("Failed to create user.");
  
  const columns = userRes[0].columns;
  const values = userRes[0].values[0];
  const userObj = Object.fromEntries(columns.map((col, i) => [col, values[i]]));
  
  return toPublicUser(userObj);
};

export const login = async (email: string, password: string): Promise<User> => {
  const user = await getUserByEmail(email);
  if (!user) {
      throw new Error('Invalid email or password.');
  }

  const db = await getDb();
  const userRes = db.exec("SELECT passwordHash FROM users WHERE email = ?", [email.toLowerCase()]);
  const storedPassword = userRes[0].values[0][0];

  if (storedPassword !== password) { // In real app, use bcrypt.compare
      throw new Error('Invalid email or password.');
  }

  localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(LOGGED_IN_USER_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
  if (userJson) {
    return JSON.parse(userJson) as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const db = await getDb();
    const userQuery = db.exec("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);

    if (userQuery.length === 0 || !userQuery[0].values.length) {
        return null;
    }

    const columns = userQuery[0].columns;
    const values = userQuery[0].values[0];
    // FIX: Explicitly type userObj as 'any' to allow adding properties with different types (array of objects)
    // than what's inferred from the initial object creation (SqlValue). This resolves assignment errors on subsequent lines.
    const userObj: any = Object.fromEntries(columns.map((col, i) => [col, values[i]]));
    
    // Fetch associated data
    const apiKeysQuery = db.exec("SELECT * FROM api_keys WHERE user_id = ?", [userObj.id]);
    const dbConnectionsQuery = db.exec("SELECT * FROM database_connections WHERE user_id = ?", [userObj.id]);
    
    userObj.apiKeys = apiKeysQuery.length > 0 ? apiKeysQuery[0].values.map(row => Object.fromEntries(apiKeysQuery[0].columns.map((col, i) => [col, row[i]]))) : [];
    userObj.databaseConnections = dbConnectionsQuery.length > 0 ? dbConnectionsQuery[0].values.map(row => Object.fromEntries(dbConnectionsQuery[0].columns.map((col, i) => [col, row[i]]))) : [];

    return toPublicUser(userObj);
};


export const forgotPassword = async (email: string): Promise<void> => {
    const db = await getDb();
    const lowerCaseEmail = email.toLowerCase();
    const userRes = db.exec("SELECT id FROM users WHERE email = ?", [lowerCaseEmail]);

    if (userRes.length > 0) {
        const resetToken = `reset-token-${Date.now()}-${Math.random()}`;
        db.run("UPDATE users SET resetToken = ? WHERE email = ?", [resetToken, lowerCaseEmail]);
        await saveDatabase();
        console.log(`Simulating password reset link sent to ${email}. Token: ${resetToken}`);
    }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const db = await getDb();
    const userRes = db.exec("SELECT email FROM users WHERE resetToken = ?", [token]);
    if (userRes.length === 0) {
        throw new Error('Invalid or expired password reset token.');
    }
    const email = userRes[0].values[0][0];
    db.run("UPDATE users SET passwordHash = ?, resetToken = NULL WHERE email = ?", [newPassword, email]);
    await saveDatabase();
};

export const verifyEmail = async (token: string): Promise<void> => {
    const db = await getDb();
    const userRes = db.exec("SELECT email FROM users WHERE verificationToken = ?", [token]);
    if (userRes.length === 0) {
        throw new Error('Invalid or expired verification token.');
    }
    const email = userRes[0].values[0][0];
    db.run("UPDATE users SET isVerified = 1, verificationToken = NULL WHERE email = ?", [email]);
    await saveDatabase();
};

export const updateUserInDb = async (user: User): Promise<void> => {
    const db = await getDb();
    db.run("UPDATE users SET bio = ?, monthlyBudget = ? WHERE id = ?", [
        user.bio,
        user.monthlyBudget,
        user.id
    ]);
    await saveDatabase();
};
