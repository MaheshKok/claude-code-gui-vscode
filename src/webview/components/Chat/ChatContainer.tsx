import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '../App';

interface ChatContainerProps {
  messages: Message[];
  isProcessing: boolean;
  currentModel: string;
  planMode: boolean;
  thinkingMode: boolean;
  onSendMessage: (content: string) => void;
  onModelChange: (model: string) => void;
  onPlanModeToggle: () => void;
  onThinkingModeToggle: () => void;
  onFileSelect: () => void;
  onImageSelect: () => void;
  onSlashCommand: () => void;
  onMcpAction: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isProcessing,
  currentModel,
  planMode,
  thinkingMode,
  onSendMessage,
  onModelChange,
  onPlanModeToggle,
  onThinkingModeToggle,
  onFileSelect,
  onImageSelect,
  onSlashCommand,
  onMcpAction,
}) => {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MessageList messages={messages} isProcessing={isProcessing} />

      <MessageInput
        disabled={isProcessing}
        currentModel={currentModel}
        planMode={planMode}
        thinkingMode={thinkingMode}
        onSendMessage={onSendMessage}
        onModelChange={onModelChange}
        onPlanModeToggle={onPlanModeToggle}
        onThinkingModeToggle={onThinkingModeToggle}
        onFileSelect={onFileSelect}
        onImageSelect={onImageSelect}
        onSlashCommand={onSlashCommand}
        onMcpAction={onMcpAction}
      />
    </div>
  );
};

export default ChatContainer;
