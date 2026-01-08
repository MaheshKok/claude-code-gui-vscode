import React from "react";
import { MessageInput } from "./MessageInput";
import type { Message } from "../App";
import { TodoDisplay } from "../Tools";
import { JourneyTimeline } from "./JourneyTimeline";
import type { TodoItem } from "../Tools";
import { ThinkingIntensity } from "../../../shared/constants";
import { formatDuration, formatTokenCount } from "../../utils";
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
    onStop: () => void;
    onModelChange: (model: string) => void;
    onPlanModeToggle: () => void;
    onThinkingModeToggle: () => void;
    onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
    onYoloModeToggle: () => void;
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
    onStop,
    onModelChange,
    onPlanModeToggle,
    onThinkingModeToggle,
    onThinkingIntensityChange,
    onYoloModeToggle,
    onMcpAction,
    sessionId,
    requestStartTime,
    totalTokens = 0,
    sessionCostUsd = 0,
    lastDurationMs,
}) => {
    const showEmptyState = messages.length === 0;

    // Storage key for persisting duration
    const DURATION_STORAGE_KEY = sessionId
        ? `claude-code-gui-duration-${sessionId}`
        : "claude-code-gui-duration-global";

    // Track the request start time when it begins processing
    const [savedStartTime, setSavedStartTime] = React.useState<number | null>(null);

    // Initialize local duration from localStorage
    const [localDurationMs, setLocalDurationMs] = React.useState<number | null>(null);

    // Track elapsed time while processing
    const [elapsedMs, setElapsedMs] = React.useState(0);

    // Reload duration when session changes or when sessionId becomes available
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(DURATION_STORAGE_KEY);
            // Reset to the saved value (or null if no saved value)
            setLocalDurationMs(saved ? parseInt(saved, 10) : null);
        } catch {
            setLocalDurationMs(null);
        }
    }, [DURATION_STORAGE_KEY]);

    // Track elapsed time while processing
    React.useEffect(() => {
        if (!isProcessing || !requestStartTime) {
            setElapsedMs(0);
            return;
        }

        const tick = () => {
            setElapsedMs(Date.now() - requestStartTime);
        };

        tick();
        const interval = setInterval(tick, 200);
        return () => clearInterval(interval);
    }, [isProcessing, requestStartTime]);

    // When processing starts, save the start time
    React.useEffect(() => {
        if (isProcessing && requestStartTime) {
            setSavedStartTime(requestStartTime);
            setLocalDurationMs(null);
        } else if (!isProcessing && savedStartTime) {
            // When processing ends, calculate the duration
            const duration = Date.now() - savedStartTime;
            setLocalDurationMs(duration);
            // Persist to localStorage
            try {
                localStorage.setItem(DURATION_STORAGE_KEY, duration.toString());
            } catch {
                // Ignore localStorage errors
            }
        }
    }, [isProcessing, requestStartTime, savedStartTime, DURATION_STORAGE_KEY]);

    // Use lastDurationMs from Claude if available, otherwise use our calculated/stored duration
    const displayDurationMs = lastDurationMs || localDurationMs;

    // Show stats when not processing and we have data
    const showStats =
        !isProcessing &&
        messages.length > 0 &&
        (displayDurationMs || totalTokens > 0 || sessionCostUsd > 0);

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto scroll-smooth pb-[180px]">
                <JourneyTimeline
                    messages={messages}
                    isProcessing={isProcessing}
                    showEmptyState={showEmptyState}
                    onAction={onSendMessage}
                />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-40 px-4 lg:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pointer-events-none">
                <div className="pointer-events-auto max-w-4xl mx-auto flex flex-col gap-2">
                    {todos.length > 0 && (
                        <div className="mb-1 glass rounded-2xl shadow-2xl !border-orange-500/60 overflow-visible transition-all duration-300 focus-within:!border-orange-500 focus-within:shadow-[0_0_20px_rgba(237,110,29,0.25)]">
                            <TodoDisplay todos={todos} title="Tasks" defaultCollapsed={true} />
                        </div>
                    )}

                    {/* Processing indicator - below Tasks for consistency */}
                    {isProcessing && (
                        <div className="glass rounded-xl p-3 flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-sm font-medium text-white/60">
                                    Claude is thinking...
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/50">
                                {elapsedMs > 0 && (
                                    <div className="flex items-center gap-1" title="Elapsed Time">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatDuration(elapsedMs, { abbreviated: true })}
                                        </span>
                                    </div>
                                )}
                                {totalTokens > 0 && (
                                    <div className="flex items-center gap-1" title="Tokens">
                                        <Zap className="w-3 h-3" />
                                        <span>
                                            {formatTokenCount(totalTokens, {
                                                includeSuffix: true,
                                                abbreviated: true,
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stats below Tasks - positioned at bottom right (shown when not processing) */}
                    {showStats && (
                        <div className="flex justify-end mb-1">
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                {displayDurationMs && displayDurationMs > 0 && (
                                    <div className="flex items-center gap-1" title="Total Duration">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatDuration(displayDurationMs, {
                                                abbreviated: true,
                                            })}
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
                                        <span>{sessionCostUsd.toFixed(2)}</span>
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
                        onStop={onStop}
                        onModelChange={onModelChange}
                        onPlanModeToggle={onPlanModeToggle}
                        onThinkingModeToggle={onThinkingModeToggle}
                        onThinkingIntensityChange={onThinkingIntensityChange}
                        onYoloModeToggle={onYoloModeToggle}
                        onMcpAction={onMcpAction}
                        sessionId={sessionId}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;
