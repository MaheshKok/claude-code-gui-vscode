import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Message } from "../App";
import { Message as MessageComponent } from "./Message";
import { ToolUseCard, ToolResultCard, TodoDisplay } from "../Tools";
import {
  extractTodosFromInput,
  formatDuration,
  formatTokenCount,
} from "../../utils";

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

const statusClasses: Record<string, string> = {
  running:
    "bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40",
  executing:
    "bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40",
  pending:
    "bg-[var(--vscode-editor-inactiveSelectionBackground)] text-[var(--vscode-descriptionForeground)] border-[var(--vscode-panel-border)]",
  completed:
    "bg-[var(--vscode-terminal-ansiGreen)]/15 text-[var(--vscode-terminal-ansiGreen)] border-[var(--vscode-terminal-ansiGreen)]/40",
  failed:
    "bg-[var(--vscode-errorForeground)]/15 text-[var(--vscode-errorForeground)] border-[var(--vscode-errorForeground)]/40",
  denied:
    "bg-[var(--vscode-terminal-ansiYellow)]/15 text-[var(--vscode-terminal-ansiYellow)] border-[var(--vscode-terminal-ansiYellow)]/40",
};

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
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
      if (!currentPlan) {
        return false;
      }

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

      if (message.hidden) {
        return true;
      }

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
          if (item && item.kind === "tool") {
            item.toolUse = message;
          }
        }
        return;
      }

      if (message.hidden) {
        return;
      }

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
        if (item && item.kind === "tool") {
          item.toolResult = message;
        }
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
        if (!addToolToPlan(message)) {
          addOrphanTool(message);
        }
        return;
      }

      flushPlan();
      timeline.push({ kind: "message", message });
    });

    flushPlan();
    return timeline;
  }, [messages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items, isProcessing]);

  const togglePlan = useCallback((id: string, isActive: boolean) => {
    setCollapsedPlans((prev) => {
      const currentCollapsed = isActive ? false : (prev[id] ?? true);
      return {
        ...prev,
        [id]: !currentCollapsed,
      };
    });
  }, []);

  const toggleStep = useCallback((id: string) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const stepNumbers = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    items.forEach((item) => {
      if (item.kind === "tool") {
        counter += 1;
        map.set(item.id, counter);
      } else if (item.kind === "plan") {
        item.steps.forEach((step) => {
          counter += 1;
          map.set(step.id, counter);
        });
      }
    });
    return map;
  }, [items]);

  if (items.length === 0 && showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="mb-4 text-6xl opacity-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-[var(--vscode-foreground)] mb-2">
          Start a conversation
        </h2>
        <p className="text-sm text-[var(--vscode-descriptionForeground)] max-w-md">
          Ask Claude anything about your code, get help with debugging, or
          request code generation. Use slash commands for quick actions.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <QuickAction label="Explain code" icon="?" />
          <QuickAction label="Fix bug" icon="!" />
          <QuickAction label="Write tests" icon="T" />
          <QuickAction label="Refactor" icon="R" />
        </div>
      </div>
    );
  }

  const renderToolStep = (
    step: TimelineItemTool,
    forceExpanded: boolean = false,
  ) => {
    const stepNumber = stepNumbers.get(step.id);
    const status = getStepStatus(step);
    const statusLabel = statusLabels[status] || status;
    const statusClass = statusClasses[status] || statusClasses.pending;
    const toolName =
      step.toolUse?.toolName || step.toolResult?.toolName || "Tool";
    const duration = step.toolUse?.duration ?? step.toolResult?.duration;
    const tokens = step.toolUse?.tokens ?? step.toolResult?.tokens;
    const isCollapsed = forceExpanded
      ? false
      : (collapsedSteps[step.id] ?? (status === "executing" ? false : true));

    return (
      <div
        key={step.id}
        className="rounded-md border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)]"
      >
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
          onClick={() => toggleStep(step.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-[var(--vscode-descriptionForeground)] transition-transform ${
              isCollapsed ? "" : "rotate-90"
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-[10px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
            Step {stepNumber ?? "--"}
          </span>
          <span className="font-medium text-sm text-[var(--vscode-foreground)]">
            {toolName}
          </span>
          <span className="text-xs text-[var(--vscode-descriptionForeground)]">
            {formatTimestamp(step.timestamp)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {duration !== undefined && (
              <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                {formatDuration(duration, { abbreviated: true })}
              </span>
            )}
            {tokens !== undefined && (
              <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                {formatTokenCount(tokens, { includeSuffix: false })}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {!isCollapsed && (
          <div className="px-3 pb-3 space-y-3 bg-[var(--vscode-editor-background)] border-t border-[var(--vscode-panel-border)]">
            {step.toolUse && step.toolUse.toolName === "TodoWrite" ? (
              <TodoDisplay
                todos={extractTodosFromInput(step.toolUse.rawInput || {})}
                title="Todo Update"
                defaultCollapsed={false}
              />
            ) : (
              step.toolUse && (
                <ToolUseCard
                  toolName={step.toolUse.toolName || "Tool"}
                  input={step.toolUse.rawInput || {}}
                  isExecuting={status === "executing"}
                  duration={step.toolUse.duration}
                  tokens={step.toolUse.tokens}
                  fileContentBefore={step.toolUse.fileContentBefore}
                  fileContentAfter={step.toolUse.fileContentAfter}
                  startLine={step.toolUse.startLine}
                  startLines={step.toolUse.startLines}
                  defaultCollapsed={true}
                />
              )
            )}

            {step.toolResult && (
              <ToolResultCard
                content={step.toolResult.content}
                isError={step.toolResult.isError}
                toolName={step.toolResult.toolName}
                duration={step.toolResult.duration}
                tokens={step.toolResult.tokens}
                defaultCollapsed={true}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {items.map((item) => {
        if (item.kind === "message") {
          return (
            <MessageComponent key={item.message.id} message={item.message} />
          );
        }

        if (item.kind === "tool") {
          return renderToolStep(item);
        }

        const groupStatus = getGroupStatus(item);
        const isActive = groupStatus === "executing";
        const isPlanOpen = isActive ? true : !(collapsedPlans[item.id] ?? true);
        const completedCount = item.steps.filter(
          (step) => getStepStatus(step) === "completed",
        ).length;
        const failedCount = item.steps.filter(
          (step) => getStepStatus(step) === "failed",
        ).length;

        return (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBarSectionHeader-background)]"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
              onClick={() => togglePlan(item.id, isActive)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-[var(--vscode-descriptionForeground)] transition-transform ${
                  isPlanOpen ? "rotate-90" : ""
                }`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="font-medium text-sm text-[var(--vscode-foreground)]">
                {item.assistant.content}
              </span>
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {formatTimestamp(item.timestamp)}
              </span>
              <div className="ml-auto flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
                <span>
                  {item.steps.length} step{item.steps.length === 1 ? "" : "s"}
                </span>
                {completedCount > 0 && <span>{completedCount} completed</span>}
                {failedCount > 0 && <span>{failedCount} failed</span>}
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] ${
                    statusClasses[groupStatus] || statusClasses.pending
                  }`}
                >
                  {statusLabels[groupStatus] || groupStatus}
                </span>
              </div>
            </div>

            {isPlanOpen && (
              <div className="border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] p-3 space-y-3">
                <div className="space-y-2">
                  {item.steps.length > 0 ? (
                    item.steps.map((step) => renderToolStep(step))
                  ) : (
                    <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                      No actions recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isProcessing && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-[var(--vscode-editor-inactiveSelectionBackground)]">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-sm text-[var(--vscode-descriptionForeground)]">
            Claude is thinking...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

interface QuickActionProps {
  label: string;
  icon: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon }) => {
  return (
    <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--vscode-input-border)] hover:bg-[var(--vscode-list-hoverBackground)] transition-colors">
      <span className="w-6 h-6 flex items-center justify-center rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] text-xs font-bold">
        {icon}
      </span>
      {label}
    </button>
  );
};

export default JourneyTimeline;
