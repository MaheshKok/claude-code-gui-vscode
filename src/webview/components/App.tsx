/**
 * App Component (Legacy Export)
 *
 * This file re-exports the main App component from the webview root
 * for backward compatibility with existing imports.
 *
 * @module components/App
 * @deprecated Import directly from '../App' instead
 */

// Re-export the main App component
export { App, default } from '../App';

// ============================================================================
// Legacy Type Exports (for backward compatibility)
// ============================================================================

/**
 * Message interface for chat messages
 * @deprecated Use ChatMessage from '../types' instead
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'error';
  messageType?: 'tool_use' | 'tool_result';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolUseId?: string;
  rawInput?: Record<string, unknown>;
  status?: string;
  isError?: boolean;
  hidden?: boolean;
  fileContentBefore?: string;
  fileContentAfter?: string;
  startLine?: number;
  startLines?: number[];
  isStreaming?: boolean;
  /** Duration in milliseconds (for tool messages) */
  duration?: number;
  /** Token count (for tool messages) */
  tokens?: number;
}

/**
 * Session info interface
 * @deprecated Use SessionState from '../types' instead
 */
export interface SessionInfo {
  id: string;
  name: string;
  startedAt: Date;
  messageCount: number;
}

/**
 * App state interface
 * @deprecated Use individual stores instead
 */
export interface AppState {
  messages: Message[];
  isConnected: boolean;
  isProcessing: boolean;
  currentModel: string;
  planMode: boolean;
  thinkingMode: boolean;
  session: SessionInfo | null;
}
