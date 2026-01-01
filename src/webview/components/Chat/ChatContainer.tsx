import React from 'react';
import { MessageInput } from './MessageInput';
import type { Message } from '../App';
import { TodoDisplay } from '../Tools';
import { JourneyTimeline } from './JourneyTimeline';
import type { TodoItem } from '../Tools';

/** Thinking intensity levels matching Claude Code CLI */
type ThinkingIntensity = 'think' | 'think-hard' | 'think-harder' | 'ultrathink';

interface ChatContainerProps {
  messages: Message[];
  isProcessing: boolean;
  todos: TodoItem[];
  currentModel: string;
  planMode: boolean;
  thinkingMode: boolean;
  thinkingIntensity: ThinkingIntensity;
  yoloMode: boolean;
  onSendMessage: (content: string) => void;
  onModelChange: (model: string) => void;
  onPlanModeToggle: () => void;
  onThinkingModeToggle: () => void;
  onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
  onYoloModeToggle: () => void;
  onFileSelect: () => void;
  onImageSelect: () => void;
  onSlashCommand: () => void;
  onMcpAction: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isProcessing,
  todos,
  currentModel,
  planMode,
  thinkingMode,
  thinkingIntensity,
  yoloMode,
  onSendMessage,
  onModelChange,
  onPlanModeToggle,
  onThinkingModeToggle,
  onThinkingIntensityChange,
  onYoloModeToggle,
  onFileSelect,
  onImageSelect,
  onSlashCommand,
  onMcpAction,
}) => {
  const showEmptyState = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto">
          <JourneyTimeline
            messages={messages}
            isProcessing={isProcessing}
            showEmptyState={showEmptyState}
          />
        </div>
        <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] overflow-y-auto">
          <div className="p-4">
            {todos.length > 0 ? (
              <TodoDisplay todos={todos} title="Todo Plan" defaultCollapsed={false} />
            ) : (
              <div className="rounded-md border border-[var(--vscode-panel-border)] p-4 text-sm text-[var(--vscode-descriptionForeground)]">
                No planned tasks yet.
              </div>
            )}
          </div>
        </aside>
      </div>

      <MessageInput
        disabled={isProcessing}
        currentModel={currentModel}
        planMode={planMode}
        thinkingMode={thinkingMode}
        thinkingIntensity={thinkingIntensity}
        yoloMode={yoloMode}
        onSendMessage={onSendMessage}
        onModelChange={onModelChange}
        onPlanModeToggle={onPlanModeToggle}
        onThinkingModeToggle={onThinkingModeToggle}
        onThinkingIntensityChange={onThinkingIntensityChange}
        onYoloModeToggle={onYoloModeToggle}
        onFileSelect={onFileSelect}
        onImageSelect={onImageSelect}
        onSlashCommand={onSlashCommand}
        onMcpAction={onMcpAction}
      />
    </div>
  );
};

export default ChatContainer;
