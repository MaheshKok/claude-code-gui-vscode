import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Message } from "../App";
import { Message as MessageComponent } from "./Message";
import { TodoDisplay, ToolUseCard, ToolResultCard } from "../Tools";
import {
  extractTodosFromInput,
  formatDuration,
  getToolSummary,
} from "../../utils";
import { ToolName } from "../../../shared/constants";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronRight,
  Search,
  Bug,
  Type,
  RefreshCw,
  FileText,
  Edit3,
  Terminal,
  Globe,
  CheckSquare,
  Code,
  Zap,
  Files,
  ListChecks,
  BookOpen,
} from "lucide-react";

interface TimelineItemMessage {
  kind: "message";
  message: Message;
}

interface TimelineItemTool {
  kind: "tool";
  id: string;
  toolUse?: Message;
  toolResult?: Message;
  timestamp: Date;
}

interface TimelinePlanGroup {
  kind: "plan";
  id: string;
  assistant: Message;
  steps: TimelineItemTool[];
  timestamp: Date;
}

type TimelineItem = TimelineItemMessage | TimelineItemTool | TimelinePlanGroup;

interface JourneyTimelineProps {
  messages: Message[];
  isProcessing: boolean;
  showEmptyState?: boolean;
}

const statusLabels: Record<string, string> = {
  executing: "Running",
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  denied: "Denied",
};

const StatusIcon = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  switch (status) {
    case "executing":
      return (
        <PlayCircle className={`${className} text-blue-400 animate-pulse`} />
      );
    case "completed":
      return <CheckCircle2 className={`${className} text-green-400`} />;
    case "failed":
      return <XCircle className={`${className} text-red-400`} />;
    case "pending":
      return <Clock className={`${className} text-white/40`} />;
    default:
      return <AlertCircle className={`${className} text-yellow-400`} />;
  }
};

const statusClasses: Record<string, string> = {
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  executing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-white/5 text-white/40 border-white/5",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  denied: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case ToolName.Read:
      return <FileText className="w-4 h-4" />;
    case ToolName.Write:
    case ToolName.Edit:
      return <Edit3 className="w-4 h-4" />;
    case ToolName.MultiEdit:
      return <Files className="w-4 h-4" />;
    case ToolName.Bash:
      return <Terminal className="w-4 h-4" />;
    case ToolName.Glob:
    case ToolName.Grep:
      return <Search className="w-4 h-4" />;
    case ToolName.Task:
      return <ListChecks className="w-4 h-4" />;
    case ToolName.TodoRead:
    case ToolName.TodoWrite:
      return <CheckSquare className="w-4 h-4" />;
    case ToolName.WebFetch:
      return <Globe className="w-4 h-4" />;
    case ToolName.WebSearch:
      return <Search className="w-4 h-4" />;
    case ToolName.NotebookRead:
    case ToolName.NotebookEdit:
      return <BookOpen className="w-4 h-4" />;
    default:
      if (toolName.startsWith("mcp__")) {
        return <Zap className="w-4 h-4" />;
      }
      return <Code className="w-4 h-4" />;
  }
};

const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1).replace(/\.0$/, "")}K`;
};

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const formatUsageSummary = (usage?: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}): string | null => {
  if (!usage) {
    return null;
  }
  const totalTokens = usage.input_tokens + usage.output_tokens;
  const cacheCreated = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;

  if (totalTokens <= 0 && cacheCreated <= 0 && cacheRead <= 0) {
    return null;
  }

  const formatCount = (value: number) => value.toLocaleString();
  const parts = [`📊 Tokens: ${formatCount(totalTokens)}`];
  if (cacheCreated > 0) {
    parts.push(`${formatCount(cacheCreated)} cache created`);
  }
  if (cacheRead > 0) {
    parts.push(`${formatCount(cacheRead)} cache read`);
  }
  return parts.join(" • ");
};

const formatStepTotalsSummary = (totals: {
  tokens: number;
  cacheCreated: number;
  cacheRead: number;
}): string | null => {
  if (totals.tokens <= 0 && totals.cacheCreated <= 0 && totals.cacheRead <= 0) {
    return null;
  }
  const formatCount = (value: number) => value.toLocaleString();
  const parts = [`📊 Tokens: ${formatCount(totals.tokens)}`];
  if (totals.cacheCreated > 0) {
    parts.push(`${formatCount(totals.cacheCreated)} cache created`);
  }
  if (totals.cacheRead > 0) {
    parts.push(`${formatCount(totals.cacheRead)} cache read`);
  }
  return parts.join(" • ");
};

const getStepStatus = (step: TimelineItemTool): string => {
  if (step.toolUse?.status) {
    return step.toolUse.status;
  }
  if (step.toolResult?.isError) {
    return "failed";
  }
  if (step.toolResult) {
    return "completed";
  }
  return "pending";
};

const getGroupStatus = (group: TimelinePlanGroup): string => {
  if (group.assistant.isStreaming) {
    return "executing";
  }
  const hasRunning = group.steps.some((step) => {
    const status = getStepStatus(step);
    return status === "executing" || status === "pending";
  });
  if (hasRunning) {
    return "executing";
  }
  const hasFailure = group.steps.some(
    (step) => getStepStatus(step) === "failed",
  );
  if (hasFailure) {
    return "failed";
  }
  return group.steps.length > 0 ? "completed" : "pending";
};

const CollapsibleReasoning = ({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative">
      <p
        className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
      >
        {content}
      </p>
      {content.length > 150 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium"
        >
          {expanded ? "Show less" : "Show full reasoning"}
        </button>
      )}
    </div>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  messages,
  isProcessing,
  showEmptyState = true,
}) => {
  const [collapsedPlans, setCollapsedPlans] = useState<Record<string, boolean>>(
    {},
  );
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const items = useMemo<TimelineItem[]>(() => {
    const timeline: TimelineItem[] = [];
    const orphanToolIndex = new Map<string, number>();
    let currentPlan: TimelinePlanGroup | null = null;
    let currentPlanSteps = new Map<string, TimelineItemTool>();
    const flushPlan = () => {
      if (currentPlan) {
        timeline.push(currentPlan);
        currentPlan = null;
        currentPlanSteps = new Map();
      }
    };

    const addToolToPlan = (message: Message) => {
      if (!currentPlan) return false;
      const stepId = message.toolUseId || message.id;
      const existing = currentPlanSteps.get(stepId);

      if (message.messageType === "tool_use") {
        if (!existing) {
          const step: TimelineItemTool = {
            kind: "tool",
            id: stepId,
            toolUse: message,
            timestamp: message.timestamp,
          };
          currentPlanSteps.set(stepId, step);
          currentPlan.steps.push(step);
        } else {
          existing.toolUse = message;
        }
        return true;
      }

      if (message.hidden) return true;

      if (!existing) {
        const step: TimelineItemTool = {
          kind: "tool",
          id: stepId,
          toolResult: message,
          timestamp: message.timestamp,
        };
        currentPlanSteps.set(stepId, step);
        currentPlan.steps.push(step);
      } else {
        existing.toolResult = message;
      }
      return true;
    };

    const addOrphanTool = (message: Message) => {
      const stepId = message.toolUseId || message.id;
      const existingIndex = orphanToolIndex.get(stepId);

      if (message.messageType === "tool_use") {
        if (existingIndex === undefined) {
          const step: TimelineItemTool = {
            kind: "tool",
            id: stepId,
            toolUse: message,
            timestamp: message.timestamp,
          };
          orphanToolIndex.set(stepId, timeline.length);
          timeline.push(step);
        } else {
          const item = timeline[existingIndex];
          if (item && item.kind === "tool") item.toolUse = message;
        }
        return;
      }

      if (message.hidden) return;

      if (existingIndex === undefined) {
        const step: TimelineItemTool = {
          kind: "tool",
          id: stepId,
          toolResult: message,
          timestamp: message.timestamp,
        };
        orphanToolIndex.set(stepId, timeline.length);
        timeline.push(step);
      } else {
        const item = timeline[existingIndex];
        if (item && item.kind === "tool") item.toolResult = message;
      }
    };

    messages.forEach((message) => {
      if (message.role === "assistant") {
        flushPlan();
        currentPlan = {
          kind: "plan",
          id: message.id,
          assistant: message,
          steps: [],
          timestamp: message.timestamp,
        };
        return;
      }
      if (
        message.role === "tool" &&
        (message.messageType === "tool_use" ||
          message.messageType === "tool_result")
      ) {
        if (!addToolToPlan(message)) addOrphanTool(message);
        return;
      }
      flushPlan();
      timeline.push({ kind: "message", message });
    });
    flushPlan();
    return timeline;
  }, [messages]);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [items, isProcessing]);

  const togglePlan = useCallback((id: string, isOpen: boolean) => {
    setCollapsedPlans((prev) => ({ ...prev, [id]: isOpen }));
  }, []);

  const toggleStep = useCallback((id: string, isExecuting: boolean) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? !isExecuting),
    }));
  }, []);

  if (items.length === 0 && showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative z-10">
        <div className="mb-8 relative group cursor-default">
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
          <div className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
            <div className="text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
          How can I help?
        </h2>
        <p className="text-white/50 max-w-lg mb-10 text-lg leading-relaxed">
          I can help you analyze code, fix bugs, write tests, or implement new
          features. Just ask or use a template below.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
          <QuickAction
            label="Explain Code"
            icon={<Search className="w-4 h-4" />}
          />
          <QuickAction label="Fix Bugs" icon={<Bug className="w-4 h-4" />} />
          <QuickAction
            label="Write Tests"
            icon={<Type className="w-4 h-4" />}
          />
          <QuickAction
            label="Refactor"
            icon={<RefreshCw className="w-4 h-4" />}
          />
        </div>
      </div>
    );
  }

  // ToolStep component - proper React component that can use hooks
  const ToolStep = ({
    step,
    forceExpanded,
  }: {
    step: TimelineItemTool;
    forceExpanded?: boolean;
  }) => {
    const status = getStepStatus(step);
    const statusLabel = statusLabels[status] || status;
    const statusClass = statusClasses[status] || statusClasses.pending;
    const toolName =
      step.toolUse?.toolName || step.toolResult?.toolName || "Tool";
    const rawInput = step.toolUse?.rawInput || step.toolResult?.rawInput || {};
    const toolSummary = getToolSummary(toolName, rawInput, 35);
    const duration = step.toolUse?.duration ?? step.toolResult?.duration;
    const tokens = step.toolUse?.tokens ?? step.toolResult?.tokens;
    const cacheReadTokens =
      step.toolUse?.cacheReadTokens ?? step.toolResult?.cacheReadTokens;
    const cacheCreationTokens =
      step.toolUse?.cacheCreationTokens ?? step.toolResult?.cacheCreationTokens;
    const isCollapsed = forceExpanded
      ? false
      : (collapsedSteps[step.id] ?? (status === "executing" ? false : true));

    return (
      <div
        key={step.id}
        className="glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-lg"
      >
        {/* Flattened Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors group"
          onClick={() => toggleStep(step.id, status === "executing")}
        >
          <ChevronRight
            className={`w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0 group-hover:text-white/60 ${isCollapsed ? "" : "rotate-90"}`}
          />

          <div className="text-orange-400 opacity-80 flex-shrink-0 group-hover:opacity-100 transition-opacity">
            {getToolIcon(toolName)}
          </div>

          <span className="font-medium text-sm text-white/90">{toolName}</span>

          {toolSummary && (
            <span
              className="text-xs text-white/50 truncate max-w-[180px] font-mono opacity-60 group-hover:opacity-100 transition-opacity"
              title={toolSummary}
            >
              {toolSummary}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {duration !== undefined && (
              <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                <Clock className="w-3 h-3" />
                {formatDuration(duration, { abbreviated: true })}
              </span>
            )}
            {tokens !== undefined && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                <Zap className="w-3 h-3" />
                {formatTokens(tokens)}
              </span>
            )}
            {cacheCreationTokens !== undefined && cacheCreationTokens > 0 && (
              <span
                className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono"
                title="Cache created"
              >
                <span className="text-[10px] font-semibold text-white/60">
                  C
                </span>
                {formatTokens(cacheCreationTokens)}
              </span>
            )}
            {cacheReadTokens !== undefined && cacheReadTokens > 0 && (
              <span
                className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono"
                title="Cache read"
              >
                <span className="text-[10px] font-semibold text-white/60">
                  R
                </span>
                {formatTokens(cacheReadTokens)}
              </span>
            )}
            {status === "executing" ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 rounded-full">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                <span className="text-xs text-orange-400 font-medium">
                  Running
                </span>
              </div>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusClass}`}
              >
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        {/* Expanded Content - Using original ToolUseCard and ToolResultCard */}
        {!isCollapsed && (
          <div className="border-t border-white/5 bg-black/20 animate-slide-up p-3 space-y-3">
            {/* TodoWrite special handling */}
            {step.toolUse && toolName === "TodoWrite" ? (
              <TodoDisplay
                todos={extractTodosFromInput(step.toolUse.rawInput || {})}
                title="Todo Update"
                defaultCollapsed={false}
              />
            ) : (
              <>
                {/* Tool Use Card */}
                {step.toolUse && (
                  <ToolUseCard
                    toolName={toolName}
                    input={rawInput}
                    isExecuting={status === "executing"}
                    duration={step.toolUse.duration}
                    tokens={step.toolUse.tokens}
                    defaultCollapsed={false}
                    fileContentBefore={step.toolUse.fileContentBefore}
                    fileContentAfter={step.toolUse.fileContentAfter}
                    startLine={step.toolUse.startLine}
                    startLines={step.toolUse.startLines}
                  />
                )}

                {/* Tool Result Card */}
                {step.toolResult && step.toolResult.content && (
                  <ToolResultCard
                    content={step.toolResult.content}
                    isError={step.toolResult.isError}
                    toolName={toolName}
                    duration={step.toolResult.duration}
                    tokens={step.toolResult.tokens}
                    defaultCollapsed={false}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-4 max-w-4xl mx-auto pb-4">
      {items.map((item) => {
        if (item.kind === "message") {
          return (
            <MessageComponent key={item.message.id} message={item.message} />
          );
        }

        if (item.kind === "tool") {
          return <ToolStep key={item.id} step={item} />;
        }

        const groupStatus = getGroupStatus(item);
        const isActive = groupStatus === "executing";
        const isPlanOpen =
          collapsedPlans[item.id] === undefined
            ? isActive
            : !collapsedPlans[item.id];
        const completedCount = item.steps.filter(
          (step) => getStepStatus(step) === "completed",
        ).length;
        const stepTotals = item.steps.reduce(
          (acc, step) => {
            const stepTokens =
              step.toolUse?.tokens ?? step.toolResult?.tokens ?? 0;
            const stepCacheCreated =
              step.toolUse?.cacheCreationTokens ??
              step.toolResult?.cacheCreationTokens ??
              0;
            const stepCacheRead =
              step.toolUse?.cacheReadTokens ??
              step.toolResult?.cacheReadTokens ??
              0;
            return {
              tokens: acc.tokens + stepTokens,
              cacheCreated: acc.cacheCreated + stepCacheCreated,
              cacheRead: acc.cacheRead + stepCacheRead,
            };
          },
          { tokens: 0, cacheCreated: 0, cacheRead: 0 },
        );
        const stepTotalsSummary = formatStepTotalsSummary(stepTotals);
        const usageSummary =
          stepTotalsSummary ?? formatUsageSummary(item.assistant.usage);

        return (
          <div
            key={item.id}
            className="glass rounded-xl border border-white/10 overflow-hidden shadow-sm transition-all hover:border-white/20"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-500/5" : "hover:bg-white/5"}`}
              onClick={() => togglePlan(item.id, isPlanOpen)}
            >
              <ChevronRight
                className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isPlanOpen ? "rotate-90" : ""}`}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">
                  {item.assistant.content || "Claude plan"}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-white/40">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    {completedCount}/{item.steps.length}
                  </span>
                </div>
                <StatusIcon status={groupStatus} className="w-4 h-4" />
              </div>
            </div>

            {isPlanOpen && (
              <div className="bg-black/10 border-t border-white/5 p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {item.assistant.content && (
                  <div className="mb-4 pb-4 border-b border-white/5">
                    <CollapsibleReasoning content={item.assistant.content} />
                  </div>
                )}
                {item.steps.length > 0 ? (
                  item.steps.map((step) => (
                    <ToolStep key={step.id} step={step} />
                  ))
                ) : (
                  <div className="text-center py-4 text-white/30 text-sm italic">
                    Reasoning about the next step...
                  </div>
                )}
                {usageSummary && (
                  <div className="pt-2 mt-2 border-t border-white/5 text-[11px] text-white/50">
                    {usageSummary}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isProcessing && (
        <div className="glass rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
          </div>
          <span className="text-sm font-medium text-white/60">
            Claude is thinking...
          </span>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon }) => {
  return (
    <button className="flex items-center justify-center gap-3 px-4 py-5 rounded-xl glass hover:bg-white/10 transition-all duration-300 border border-white/10 group hover:shadow-lg hover:border-white/20 hover:-translate-y-1">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-transparent text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
        {icon}
      </div>
      <span className="font-medium text-white/80 group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
};

export default JourneyTimeline;
