import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { initializeDatabase } from '../services/sqliteService';
import Spinner from '../components/Spinner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    async function initDb() {
      try {
        await initializeDatabase();
        setIsDbInitialized(true);
      } catch (e) {
        console.error("Failed to initialize database", e);
      }
    }
    initDb();
  }, []);

  const checkUserSession = useCallback(async () => {
    if (!isDbInitialized) return;
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const fullUser = await authService.getUserByEmail(currentUser.email);
        setUser(fullUser);
      }
    } catch (error) {
      console.error('No active session found', error);
      // Clear session if user lookup fails
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [isDbInitialized]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
  };

  const register = async (email: string, password: string) => {
    await authService.register(email, password);
  };
  
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      // Also update our session storage
      localStorage.setItem('auth_session', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  if (!isDbInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: isLoading || !isDbInitialized, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};