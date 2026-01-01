import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '../App';
import { TodoDisplay } from '../Tools';
import { ActivityTimeline } from '../Activity';
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
  const activityMessages = messages.filter(
    (message) => message.role === 'tool'
      && (message.messageType === 'tool_use' || message.messageType === 'tool_result')
  );
  const visibleMessages = messages.filter(
    (message) => !(message.role === 'tool'
      && (message.messageType === 'tool_use' || message.messageType === 'tool_result'))
  );
  const showEmptyState = visibleMessages.length === 0 && activityMessages.length === 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {todos.length > 0 && (
        <div className="px-4 pt-4">
          <TodoDisplay todos={todos} title="Todo Progress" />
        </div>
      )}
      <ActivityTimeline messages={activityMessages} defaultCollapsed={true} />

      <MessageList
        messages={visibleMessages}
        isProcessing={isProcessing}
        showEmptyState={showEmptyState}
      />

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
