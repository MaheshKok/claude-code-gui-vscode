import React from "react";
import { MessageInput } from "./MessageInput";
import type { Message } from "../App";
import { TodoDisplay } from "../Tools";
import { JourneyTimeline } from "./JourneyTimeline";
import type { TodoItem } from "../Tools";

/** Thinking intensity levels matching Claude Code CLI */
type ThinkingIntensity = "think" | "think-hard" | "think-harder" | "ultrathink";

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
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto scroll-smooth pb-[180px]">
        <JourneyTimeline
          messages={messages}
          isProcessing={isProcessing}
          showEmptyState={showEmptyState}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-40 p-4 lg:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pointer-events-none">
        <div className="pointer-events-auto max-w-4xl mx-auto flex flex-col gap-2">
          {todos.length > 0 && (
            <div className="mb-2">
              <TodoDisplay
                todos={todos}
                title="Tasks"
                defaultCollapsed={true}
              />
            </div>
          )}
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
      </div>
    </div>
  );
};

export default ChatContainer;
