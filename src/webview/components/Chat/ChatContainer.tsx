import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '../App';

/** Thinking intensity levels matching Claude Code CLI */
type ThinkingIntensity = 'think' | 'think-hard' | 'think-harder' | 'ultrathink';

interface ChatContainerProps {
  messages: Message[];
  isProcessing: boolean;
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
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MessageList messages={messages} isProcessing={isProcessing} />

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
