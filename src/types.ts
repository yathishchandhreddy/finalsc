export type PenguinState =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'error';

export type VoiceStatus =
  | 'off'
  | 'ready'
  | 'speaking'
  | 'paused'
  | 'stopped'
  | 'error';

export interface SourceDocument {
  documentName: string;
  relevanceScore?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: SourceDocument[];
  state?: PenguinState;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  chunkCount: number;
  summary?: string;
  rawTextPreview?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  token: string | null;
}
