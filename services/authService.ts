
import { User, ApiKey } from '../types';

interface MockUser extends User {
    passwordHash?: string; // Not really a hash in mock
    verificationToken?: string;
    resetToken?: string;
}

// In-memory/localStorage mock database
const USERS_KEY = 'auth_users';
const LOGGED_IN_USER_KEY = 'auth_session';

const getMockUsers = (): Record<string, MockUser> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

const saveMockUsers = (users: Record<string, MockUser>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Simulate async operations
const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to remove sensitive data before returning user object
const toPublicUser = (user: MockUser): User => {
    const { passwordHash, verificationToken, resetToken, ...publicUser } = user;
    return publicUser;
};


export const register = async (email: string, password: string): Promise<User> => {
  await simulateDelay(500);
  const users = getMockUsers();
  const lowerCaseEmail = email.toLowerCase();

  if (users[lowerCaseEmail]) {
    throw new Error('An account with this email already exists.');
  }

  const verificationToken = `verify-token-${Date.now()}-${Math.random()}`;

  const newUser: MockUser = {
    id: `user_${Date.now()}`,
    email: lowerCaseEmail,
    isVerified: false,
    // In a real app, you'd hash the password here.
    passwordHash: password, // Storing plain text for mock. DO NOT DO IN PROD.
    verificationToken: verificationToken,
    apiKeys: [], // Initialize with empty API keys
    monthlyBudget: 50, // Default budget
    databaseConnections: [], // Initialize with empty connections
  };

  users[newUser.email] = newUser;
  saveMockUsers(users);

  // Simulate sending verification email
  console.log(`Simulating verification email sent to ${email}. You can use this token in the URL: ${verificationToken}`);
  
  return toPublicUser(newUser);
};

export const login = async (email: string, password: string): Promise<User> => {
  await simulateDelay(500);
  const users = getMockUsers();
  const lowerCaseEmail = email.toLowerCase();
  const user = users[lowerCaseEmail];

  // Simulate password check (in real app, use bcrypt.compare)
  if (!user || user.passwordHash !== password) {
    throw new Error('Invalid email or password.');
  }
  
  // Ensure apiKeys array exists for older mock users
  if (!user.apiKeys) {
    user.apiKeys = [];
  }
  // Ensure databaseConnections array exists for older mock users
  if (!user.databaseConnections) {
    user.databaseConnections = [];
  }
  
  users[lowerCaseEmail] = user;
  saveMockUsers(users);


  const publicUser = toPublicUser(user);
  localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(publicUser));

  return publicUser;
};

export const logout = async (): Promise<void> => {
  await simulateDelay(200);
  localStorage.removeItem(LOGGED_IN_USER_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  await simulateDelay(100);
  const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
  if (userJson) {
    return JSON.parse(userJson) as User;
  }
  return null;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await simulateDelay(500);
  const users = getMockUsers();
  const lowerCaseEmail = email.toLowerCase();
  const user = users[lowerCaseEmail];

  if (user) {
    const resetToken = `reset-token-${Date.now()}-${Math.random()}`;
    user.resetToken = resetToken;
    users[lowerCaseEmail] = user;
    saveMockUsers(users);
    
    console.log(`Simulating password reset link sent to ${email}. You can use this token in the URL: ${resetToken}`);
  }
  // We don't throw an error for non-existent users for security reasons.
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await simulateDelay(500);
  if (!token) {
      throw new Error('Invalid or missing reset token.');
  }

  const users = getMockUsers();
  const userEmail = Object.keys(users).find(email => users[email].resetToken === token);

  if (!userEmail) {
    throw new Error('Invalid or expired password reset token.');
  }
  
  const user = users[userEmail];
  user.passwordHash = newPassword;
  delete user.resetToken; // Token is single-use
  users[userEmail] = user;
  saveMockUsers(users);

  console.log(`Password has been reset for ${userEmail}.`);
};

export const verifyEmail = async (token: string): Promise<void> => {
  await simulateDelay(700);
  if (!token) {
      throw new Error('Invalid or missing verification token.');
  }

  const users = getMockUsers();
  const userEmail = Object.keys(users).find(email => users[email].verificationToken === token);

  if (!userEmail) {
    throw new Error('Invalid or expired verification token.');
  }

  const user = users[userEmail];
  user.isVerified = true;
  delete user.verificationToken;
  users[userEmail] = user;
  saveMockUsers(users);

  // If this user is the logged in user, update session
  const loggedInUser = await getCurrentUser();
  if (loggedInUser && loggedInUser.email === user.email) {
      localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(toPublicUser(user)));
  }

  console.log(`User ${user.email} verified with token: ${token}`);
};