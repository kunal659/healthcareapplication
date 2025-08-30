
export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  key: string; // This would be encrypted in a real app
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  isVerified: boolean;
  bio?: string;
  apiKeys?: ApiKey[];
  monthlyBudget?: number;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  keyId: string;
  action: string;
  status: 'Success' | 'Failure';
}
