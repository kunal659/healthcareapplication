
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

export type DatabaseType = 'PostgreSQL' | 'MySQL' | 'SQL Server' | 'SQLite';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface TableSchema {
  tableName: string;
  columns: {
    name: string;
    type: string;
  }[];
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string; // Encrypted
  filePath?: string; // For SQLite path (legacy/display)
  dbFileContent?: string; // For uploaded SQLite file content (base64)
  status: ConnectionStatus;
  schema?: TableSchema[];
}

export interface GovernanceRule {
  id: string;
  rule: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  isVerified: boolean;
  bio?: string;
  apiKeys?: ApiKey[];
  monthlyBudget?: number;
  databaseConnections?: DatabaseConnection[];
  governanceRules?: GovernanceRule[];
}

export interface UsageLog {
  id: string;
  timestamp: string;
  keyId: string;
  action: string;
  status: 'Success' | 'Failure';
}

export type ChatMessageSender = 'user' | 'ai';

export interface ChatMessageContent {
    text?: string;
    sql?: string;
    results?: { headers: string[]; rows: any[][] };
    error?: string;
}

export interface ChatMessage {
    id: string;
    sender: ChatMessageSender;
    content: ChatMessageContent;
    timestamp: string;
}