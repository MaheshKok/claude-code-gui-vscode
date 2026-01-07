import React from "react";
import { MessageInput } from "./MessageInput";
import type { Message } from "../App";
import { TodoDisplay } from "../Tools";
import { JourneyTimeline } from "./JourneyTimeline";
import type { TodoItem } from "../Tools";
import { ThinkingIntensity } from "../../../shared/constants";
import { formatDuration, formatTokenCount, formatCost } from "../../utils";
import { Clock, Zap, DollarSign } from "lucide-react";

interface ChatContainerProps {
    messages: Message[];
    isProcessing: boolean;
    todos: TodoItem[];
    currentModel: string;
    planMode: boolean;
    thinkingMode: boolean;
    thinkingIntensity: ThinkingIntensity;
    yoloMode: boolean;
    sessionId?: string | null;
    // Processing stats
    requestStartTime?: number | null;
    totalTokens?: number;
    sessionCostUsd?: number;
    lastDurationMs?: number | null;
    onSendMessage: (content: string) => void;
    onModelChange: (model: string) => void;
    onPlanModeToggle: () => void;
    onThinkingModeToggle: () => void;
    onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
    onYoloModeToggle: () => void;
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
    onSlashCommand,
    onMcpAction,
    sessionId,
    requestStartTime,
    totalTokens = 0,
    sessionCostUsd = 0,
    lastDurationMs,
}) => {
    const showEmptyState = messages.length === 0;

    // Show stats when not processing and we have data
    const showStats =
        !isProcessing &&
        messages.length > 0 &&
        (lastDurationMs || totalTokens > 0 || sessionCostUsd > 0);

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto scroll-smooth pb-[180px]">
                <JourneyTimeline
                    messages={messages}
                    isProcessing={isProcessing}
                    showEmptyState={showEmptyState}
                    onAction={onSendMessage}
                    requestStartTime={requestStartTime}
                    totalTokens={totalTokens}
                />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-40 px-4 lg:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pointer-events-none">
                <div className="pointer-events-auto max-w-4xl mx-auto flex flex-col gap-2">
                    {todos.length > 0 && (
                        <div className="mb-1 glass rounded-2xl shadow-2xl !border-orange-500/60 overflow-visible transition-all duration-300 focus-within:!border-orange-500 focus-within:shadow-[0_0_20px_rgba(237,110,29,0.25)]">
                            <TodoDisplay todos={todos} title="Tasks" defaultCollapsed={true} />
                        </div>
                    )}

                    {/* Stats below Tasks - positioned at bottom right */}
                    {showStats && (
                        <div className="flex justify-end mb-1">
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                {lastDurationMs && lastDurationMs > 0 && (
                                    <div className="flex items-center gap-1" title="Total Duration">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatDuration(lastDurationMs, { abbreviated: true })}
                                        </span>
                                    </div>
                                )}
                                {totalTokens > 0 && (
                                    <div className="flex items-center gap-1" title="Total Tokens">
                                        <Zap className="w-3 h-3" />
                                        <span>
                                            {formatTokenCount(totalTokens, {
                                                includeSuffix: true,
                                                abbreviated: true,
                                            })}
                                        </span>
                                    </div>
                                )}
                                {sessionCostUsd > 0 && (
                                    <div className="flex items-center gap-1" title="Session Cost">
                                        <DollarSign className="w-3 h-3" />
                                        <span>
                                            {formatCost(sessionCostUsd, { showFreeForZero: false })}
                                        </span>
                                    </div>
                                )}
                            </div>
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
                        onSlashCommand={onSlashCommand}
                        onMcpAction={onMcpAction}
                        sessionId={sessionId}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;
