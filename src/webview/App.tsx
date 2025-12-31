/**
 * Root App Component
 *
 * Main application component that orchestrates all stores, handles
 * message routing from the extension, and renders the UI.
 *
 * @module webview/App
 */

import React, { useEffect, useCallback, useMemo } from 'react';

// Components
import { Header } from './components/Header';
import { ChatContainer } from './components/Chat/ChatContainer';
import { StatusBar } from './components/Status/StatusBar';
import { ConversationHistory } from './components/History';
import {
  SettingsModal,
  MCPModal,
  ModelSelectorModal,
  PermissionModal,
  InstallModal,
  SlashCommandsModal,
} from './components/Modals';

// Stores
import {
  useChatStore,
  useSettingsStore,
  useUIStore,
  usePermissionStore,
  useConversationStore,
  useMCPStore,
  selectActiveModal,
  selectIsConnected,
  selectFirstPending,
  selectWSL,
} from './stores';

// Hooks
import { useMessages } from './hooks/useMessages';
import { useVSCode } from './hooks/useVSCode';

// Types
import type { ChatMessage, PermissionRequest, PermissionDecision } from './types';

// ============================================================================
// WSL Alert Component
// ============================================================================

interface WSLAlertProps {
  onDismiss: () => void;
  onConfigure: () => void;
}

const WSLAlert: React.FC<WSLAlertProps> = ({ onDismiss, onConfigure }) => (
  <div
    className="flex items-center justify-between px-4 py-2 text-sm"
    style={{
      backgroundColor: 'var(--vscode-inputValidation-warningBackground)',
      borderBottom: '1px solid var(--vscode-inputValidation-warningBorder)',
    }}
  >
    <span>
      Running on Windows without WSL configured. Some features may not work correctly.
    </span>
    <div className="flex gap-2">
      <button
        onClick={onConfigure}
        className="btn btn-secondary text-xs"
      >
        Configure WSL
      </button>
      <button
        onClick={onDismiss}
        className="btn-icon"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);

// ============================================================================
// App Component
// ============================================================================

export const App: React.FC = () => {
  const { postMessage, isVSCode } = useVSCode();

  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------

  // Chat store
  const messages = useChatStore((s) => s.messages);
  const isProcessing = useChatStore((s) => s.isProcessing);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setProcessing = useChatStore((s) => s.setProcessing);
  const setSessionId = useChatStore((s) => s.setSessionId);
  const updateTokens = useChatStore((s) => s.updateTokens);
  const resetChat = useChatStore((s) => s.resetChat);

  // Settings store
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const thinkingMode = useSettingsStore((s) => s.thinkingMode);
  const planMode = useSettingsStore((s) => s.planMode);
  const wsl = useSettingsStore(selectWSL);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);
  const toggleThinkingMode = useSettingsStore((s) => s.toggleThinkingMode);
  const togglePlanMode = useSettingsStore((s) => s.togglePlanMode);
  const loadFromVSCode = useSettingsStore((s) => s.loadFromVSCode);

  // UI store
  const activeModal = useUIStore(selectActiveModal);
  const isConnected = useUIStore(selectIsConnected);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const showError = useUIStore((s) => s.showError);
  const showSuccess = useUIStore((s) => s.showSuccess);

  // Permission store
  const pendingPermission = usePermissionStore(selectFirstPending);
  const addPending = usePermissionStore((s) => s.addPending);
  const resolvePending = usePermissionStore((s) => s.resolvePending);

  // MCP store (unused but available)
  const _mcpStore = useMCPStore((s) => s.setServerStatus);

  // Conversation store (unused but available)
  useConversationStore((s) => s.setCurrentConversation);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------

  const [showWSLAlert, setShowWSLAlert] = React.useState(false);
  const [streamingMessageId, setStreamingMessageId] = React.useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  // -------------------------------------------------------------------------
  // Message Handlers
  // -------------------------------------------------------------------------

  const messageHandlers = useMemo(() => ({
    sessionInfo: (msg: { sessionId: string; tools: unknown[]; mcpServers: unknown[] }) => {
      setSessionId(msg.sessionId);
      setConnectionStatus('connected');
    },

    accountInfo: (_msg: { account: unknown }) => {
      // Account info received - could update user state if needed
    },

    output: (msg: { text: string; isFinal?: boolean }) => {
      if (streamingMessageId) {
        // Update existing streaming message
        const currentMsg = useChatStore.getState().messages.find(
          (m) => m.id === streamingMessageId
        );
        // Get content from message - all message types have content property
        const currentContent = currentMsg && 'content' in currentMsg ? (currentMsg as { content: string }).content : '';
        useChatStore.getState().updateMessage(streamingMessageId, {
          content: currentContent + msg.text,
        });

        if (msg.isFinal) {
          useChatStore.getState().updateMessage(streamingMessageId, {
            isStreaming: false,
          });
          setStreamingMessageId(null);
        }
      } else {
        // Create new assistant message
        const newId = `msg-${Date.now()}`;
        const newMessage = {
          id: newId,
          type: 'assistant' as const,
          content: msg.text,
          timestamp: Date.now(),
          isStreaming: !msg.isFinal,
        };
        addMessage(newMessage as ChatMessage);
        if (!msg.isFinal) {
          setStreamingMessageId(newId);
        }
      }
    },

    thinking: (msg: { thinking: string }) => {
      const thinkingMessage = {
        id: `thinking-${Date.now()}`,
        type: 'thinking' as const,
        content: msg.thinking,
        timestamp: Date.now(),
      };
      addMessage(thinkingMessage as ChatMessage);
    },

    toolUse: (msg: {
      toolUseId: string;
      toolName: string;
      rawInput: unknown;
      toolInfo: string;
    }) => {
      const toolMessage = {
        id: msg.toolUseId,
        type: 'tool_use' as const,
        toolUseId: msg.toolUseId,
        timestamp: Date.now(),
        toolName: msg.toolName,
        rawInput: msg.rawInput as Record<string, unknown>,
        toolInfo: msg.toolInfo,
        status: 'executing' as const,
      };
      addMessage(toolMessage as ChatMessage);
    },

    toolResult: (msg: {
      toolUseId: string;
      content: string;
      isError: boolean;
      hidden: boolean;
    }) => {
      // Update tool use message with result
      updateMessage(msg.toolUseId, {
        status: msg.isError ? 'failed' : 'completed',
      } as Partial<ChatMessage>);

      // Add result message if not hidden
      if (!msg.hidden) {
        const resultMessage = {
          id: `result-${msg.toolUseId}`,
          type: 'tool_result' as const,
          content: msg.content,
          timestamp: Date.now(),
          toolUseId: msg.toolUseId,
          isError: msg.isError,
          hidden: false,
        };
        addMessage(resultMessage as ChatMessage);
      }
    },

    updateTokens: (msg: {
      current: { input_tokens: number; output_tokens: number };
      total: unknown;
    }) => {
      updateTokens(msg.current);
    },

    updateTotals: (_msg: { totalCostUsd: number; durationMs: number; numTurns: number }) => {
      // Update cost tracking if needed
    },

    permissionRequest: (msg: {
      requestId: string;
      toolUseId: string;
      toolName: string;
      input: unknown;
      description: string;
      suggestions: unknown[];
    }) => {
      const request: PermissionRequest = {
        requestId: msg.requestId,
        toolUseId: msg.toolUseId,
        toolName: msg.toolName,
        input: msg.input as Record<string, unknown>,
        description: msg.description,
        suggestions: msg.suggestions as PermissionRequest['suggestions'],
        status: 'pending',
        timestamp: Date.now(),
      };
      addPending(request);
      openModal('permission', { request });
    },

    setProcessing: (msg: { isProcessing: boolean }) => {
      setProcessing(msg.isProcessing);
      if (!msg.isProcessing) {
        setStreamingMessageId(null);
      }
    },

    loading: (msg: { message?: string }) => {
      // Could show loading indicator
      console.log('Loading:', msg.message);
    },

    clearLoading: () => {
      // Hide loading indicator
    },

    error: (msg: { message: string; code?: string; recoverable?: boolean }) => {
      showError('Error', msg.message);

      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'error' as const,
        content: msg.message,
        timestamp: Date.now(),
        code: msg.code,
        recoverable: msg.recoverable,
      };
      addMessage(errorMessage as ChatMessage);
      setProcessing(false);
    },

    showInstallModal: (_msg: { instructions?: string }) => {
      openModal('install');
    },

    showLoginModal: (_msg: { loginUrl?: string }) => {
      openModal('login');
    },

    settingsUpdate: (msg: { settings: Record<string, unknown> }) => {
      loadFromVSCode(msg.settings);
    },

    themeUpdate: (_msg: { theme: 'light' | 'dark' }) => {
      // Theme is handled by VSCode CSS variables
    },

    restoreState: (_msg: { state: unknown }) => {
      // Restore saved webview state if needed
    },

    compacting: (_msg: { isCompacting: boolean }) => {
      // Handle compaction state
    },

    compactBoundary: (_msg: { trigger: string; preTokens: number }) => {
      // Handle compact boundary event
    },
  }), [
    addMessage,
    updateMessage,
    setSessionId,
    setConnectionStatus,
    setProcessing,
    updateTokens,
    addPending,
    openModal,
    showError,
    loadFromVSCode,
    streamingMessageId,
  ]);

  // Set up message listener
  useMessages({
    enabled: true,
    handlers: messageHandlers,
    onUnhandledMessage: (msg) => {
      console.warn('Unhandled message:', msg);
    },
  });

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Check for WSL on Windows
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isWindows = navigator.userAgent.includes('Windows') ||
        navigator.platform?.toLowerCase().includes('win');

      if (isWindows && !wsl.enabled) {
        setShowWSLAlert(true);
      }
    }
  }, [wsl.enabled]);

  // Request initial state from extension
  useEffect(() => {
    if (isVSCode) {
      postMessage({ type: 'requestState' });
      postMessage({ type: 'getSettings' });
    }
  }, [isVSCode, postMessage]);

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  const handleSendMessage = useCallback((content: string, attachments?: unknown[]) => {
    // Add user message to chat
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content,
      timestamp: Date.now(),
      attachments: attachments as Array<{ type: 'file' | 'image'; name: string; path?: string }>,
    };
    addMessage(userMessage as ChatMessage);
    setProcessing(true);

    // Send to extension
    postMessage({
      type: 'sendMessage',
      message: content,
      planMode,
      thinkingMode,
      attachments: attachments as Array<{ type: 'file' | 'image'; path: string; name: string }> | undefined,
    });
  }, [addMessage, setProcessing, postMessage, planMode, thinkingMode]);

  const handleStopProcessing = useCallback(() => {
    postMessage({ type: 'stopGeneration' });
    setProcessing(false);
    setStreamingMessageId(null);
  }, [postMessage, setProcessing]);

  const handleNewChat = useCallback(() => {
    resetChat();
    postMessage({ type: 'clearConversation' });
    showSuccess('New Chat', 'Started a new conversation');
  }, [resetChat, postMessage, showSuccess]);

  const handleOpenSettings = useCallback(() => {
    openModal('settings');
  }, [openModal]);

  const handleToggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const handleConversationLoad = useCallback((id: string) => {
    // Notify extension that a conversation was loaded
    postMessage({ type: 'saveState', state: { conversationId: id } });
    showSuccess('Conversation Loaded', 'Previous conversation restored');
  }, [postMessage, showSuccess]);

  const handleModelChange = useCallback((model: string) => {
    const typedModel = model as Parameters<typeof setSelectedModel>[0];
    setSelectedModel(typedModel);
    // Send model change - use claude.defaultModel to match SettingsState structure
    postMessage({
      type: 'saveSettings',
      settings: {
        claude: { defaultModel: typedModel },
      } as Partial<import('./types/state').SettingsState>,
    });
  }, [setSelectedModel, postMessage]);

  const handlePlanModeToggle = useCallback(() => {
    togglePlanMode();
  }, [togglePlanMode]);

  const handleThinkingModeToggle = useCallback(() => {
    toggleThinkingMode();
  }, [toggleThinkingMode]);

  const handleFileSelect = useCallback(() => {
    openModal('model'); // Placeholder - would open file picker
  }, [openModal]);

  const handleImageSelect = useCallback(() => {
    postMessage({ type: 'openFile', filePath: '', preview: true });
  }, [postMessage]);

  const handleSlashCommand = useCallback(() => {
    openModal('keyboard-shortcuts');
  }, [openModal]);

  const handleMcpAction = useCallback(() => {
    openModal('mcp');
  }, [openModal]);

  const handlePermissionResponse = useCallback((
    requestId: string,
    decision: PermissionDecision
  ) => {
    resolvePending(requestId, decision);
    postMessage({
      type: 'permissionResponse',
      requestId,
      decision,
    });
    closeModal();
  }, [resolvePending, postMessage, closeModal]);

  const handleWSLConfigure = useCallback(() => {
    openModal('settings');
    setShowWSLAlert(false);
  }, [openModal]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Build session info from current state
  const session = useChatStore.getState().currentSessionId ? {
    id: useChatStore.getState().currentSessionId || '',
    name: 'Current Session',
    startedAt: new Date(),
    messageCount: messages.length,
  } : null;

  return (
    <div className="flex flex-col h-screen bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
      {/* WSL Alert for Windows users */}
      {showWSLAlert && (
        <WSLAlert
          onDismiss={() => setShowWSLAlert(false)}
          onConfigure={handleWSLConfigure}
        />
      )}

      {/* Header */}
      <Header
        session={session}
        onNewChat={handleNewChat}
        onOpenSettings={handleOpenSettings}
        onToggleHistory={handleToggleHistory}
        isHistoryOpen={isHistoryOpen}
      />

      {/* Conversation History Panel */}
      <ConversationHistory
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        onConversationLoad={handleConversationLoad}
      />

      {/* Chat Container */}
      <ChatContainer
        messages={messages.map(m => ({
          id: m.id,
          role: m.type === 'user' ? 'user' : m.type === 'assistant' ? 'assistant' : m.type === 'error' ? 'error' : 'tool',
          content: 'content' in m ? (m as { content: string }).content : '',
          timestamp: new Date(m.timestamp),
          toolName: 'toolName' in m ? (m as { toolName?: string }).toolName : undefined,
          isStreaming: m.isStreaming,
        }))}
        isProcessing={isProcessing}
        currentModel={selectedModel}
        planMode={planMode}
        thinkingMode={thinkingMode}
        onSendMessage={handleSendMessage}
        onModelChange={handleModelChange}
        onPlanModeToggle={handlePlanModeToggle}
        onThinkingModeToggle={handleThinkingModeToggle}
        onFileSelect={handleFileSelect}
        onImageSelect={handleImageSelect}
        onSlashCommand={handleSlashCommand}
        onMcpAction={handleMcpAction}
      />

      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        isProcessing={isProcessing}
        onStop={handleStopProcessing}
      />

      {/* Modals */}
      {activeModal === 'settings' && (
        <SettingsModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {activeModal === 'mcp' && (
        <MCPModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {activeModal === 'model' && (
        <ModelSelectorModal
          isOpen={true}
          onClose={closeModal}
          selectedModel={selectedModel === 'claude-opus-4-5-20251101' ? 'opus' : selectedModel === 'claude-haiku-4-5-20251001' ? 'haiku' : 'sonnet'}
          onSelectModel={(model) => {
            const modelMap: Record<string, string> = {
              'opus': 'claude-opus-4-5-20251101',
              'sonnet': 'claude-sonnet-4-5-20250929',
              'haiku': 'claude-haiku-4-5-20251001',
            };
            handleModelChange(modelMap[model] || 'claude-sonnet-4-5-20250929');
          }}
          onConfigure={() => openModal('settings')}
        />
      )}

      {activeModal === 'permission' && pendingPermission && (
        <PermissionModal
          isOpen={true}
          onClose={closeModal}
          request={{
            id: pendingPermission.requestId,
            toolName: pendingPermission.toolName,
            description: pendingPermission.description,
            input: typeof pendingPermission.input === 'object' && pendingPermission.input !== null
              ? pendingPermission.input as Record<string, unknown>
              : {},
          }}
          onAllow={() => handlePermissionResponse(pendingPermission.requestId, 'allow')}
          onDeny={() => handlePermissionResponse(pendingPermission.requestId, 'deny')}
          onAlwaysAllow={() => handlePermissionResponse(pendingPermission.requestId, 'allow')}
        />
      )}

      {activeModal === 'install' && (
        <InstallModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {activeModal === 'keyboard-shortcuts' && (
        <SlashCommandsModal
          isOpen={true}
          onClose={closeModal}
          customCommands={[]}
          onExecuteCommand={(cmd) => {
            closeModal();
            if (cmd.prompt) {
              handleSendMessage(cmd.prompt);
            } else {
              handleSendMessage(cmd.name);
            }
          }}
          onAddCustomCommand={() => {}}
          onDeleteCustomCommand={() => {}}
          onQuickCommand={(cmd: string) => {
            closeModal();
            handleSendMessage(cmd);
          }}
        />
      )}
    </div>
  );
};

export default App;
