import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '../App';
import { Message as MessageComponent } from './Message';
import { ToolUseCard, ToolResultCard, TodoDisplay } from '../Tools';
import { extractTodosFromInput, formatDuration, formatTokenCount } from '../../utils';

interface TimelineItemMessage {
  kind: 'message';
  message: Message;
}

interface TimelineItemTool {
  kind: 'tool';
  id: string;
  toolUse?: Message;
  toolResult?: Message;
  timestamp: Date;
}

type TimelineItem = TimelineItemMessage | TimelineItemTool;

interface JourneyTimelineProps {
  messages: Message[];
  isProcessing: boolean;
  showEmptyState?: boolean;
}

const statusLabels: Record<string, string> = {
  executing: 'Running',
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  denied: 'Denied',
};

const statusClasses: Record<string, string> = {
  running: 'bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40',
  executing: 'bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40',
  pending: 'bg-[var(--vscode-editor-inactiveSelectionBackground)] text-[var(--vscode-descriptionForeground)] border-[var(--vscode-panel-border)]',
  completed: 'bg-[var(--vscode-terminal-ansiGreen)]/15 text-[var(--vscode-terminal-ansiGreen)] border-[var(--vscode-terminal-ansiGreen)]/40',
  failed: 'bg-[var(--vscode-errorForeground)]/15 text-[var(--vscode-errorForeground)] border-[var(--vscode-errorForeground)]/40',
  denied: 'bg-[var(--vscode-terminal-ansiYellow)]/15 text-[var(--vscode-terminal-ansiYellow)] border-[var(--vscode-terminal-ansiYellow)]/40',
};

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const getStepStatus = (step: TimelineItemTool): string => {
  if (step.toolUse?.status) {
    return step.toolUse.status;
  }
  if (step.toolResult?.isError) {
    return 'failed';
  }
  if (step.toolResult) {
    return 'completed';
  }
  return 'pending';
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  messages,
  isProcessing,
  showEmptyState = true,
}) => {
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const items = useMemo<TimelineItem[]>(() => {
    const timeline: TimelineItem[] = [];
    const stepIndex = new Map<string, number>();

    messages.forEach((message) => {
      if (message.role === 'tool'
        && (message.messageType === 'tool_use' || message.messageType === 'tool_result')) {
        const stepId = message.toolUseId || message.id;
        const existingIndex = stepIndex.get(stepId);

        if (message.messageType === 'tool_use') {
          const step: TimelineItemTool = {
            kind: 'tool',
            id: stepId,
            toolUse: message,
            timestamp: message.timestamp,
          };
          stepIndex.set(stepId, timeline.length);
          timeline.push(step);
          return;
        }

        if (message.hidden) {
          return;
        }

        if (existingIndex === undefined) {
          const step: TimelineItemTool = {
            kind: 'tool',
            id: stepId,
            toolResult: message,
            timestamp: message.timestamp,
          };
          stepIndex.set(stepId, timeline.length);
          timeline.push(step);
        } else {
          const step = timeline[existingIndex];
          if (step && step.kind === 'tool') {
            step.toolResult = message;
          }
        }
        return;
      }

      timeline.push({ kind: 'message', message });
    });

    return timeline;
  }, [messages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items, isProcessing]);

  const toggleStep = useCallback((id: string) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

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
          Ask Claude anything about your code, get help with debugging,
          or request code generation. Use slash commands for quick actions.
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

  let stepCounter = 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {items.map((item) => {
        if (item.kind === 'message') {
          return <MessageComponent key={item.message.id} message={item.message} />;
        }

        stepCounter += 1;
        const status = getStepStatus(item);
        const statusLabel = statusLabels[status] || status;
        const statusClass = statusClasses[status] || statusClasses.pending;
        const toolName = item.toolUse?.toolName || item.toolResult?.toolName || 'Tool';
        const duration = item.toolUse?.duration ?? item.toolResult?.duration;
        const tokens = item.toolUse?.tokens ?? item.toolResult?.tokens;
        const isCollapsed = collapsedSteps[item.id] ?? true;

        return (
          <div key={item.id} className="rounded-md border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)]">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
              onClick={() => toggleStep(item.id)}
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
                className={`text-[var(--vscode-descriptionForeground)] transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-[10px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
                Step {stepCounter}
              </span>
              <span className="font-medium text-sm text-[var(--vscode-foreground)]">
                {toolName}
              </span>
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {formatTimestamp(item.timestamp)}
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
                <span className={`px-2 py-0.5 rounded-full border text-[10px] ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="px-3 pb-3 space-y-3 bg-[var(--vscode-editor-background)] border-t border-[var(--vscode-panel-border)]">
                {item.toolUse && item.toolUse.toolName === 'TodoWrite'
                  ? (
                    <TodoDisplay
                      todos={extractTodosFromInput(item.toolUse.rawInput || {})}
                      title="Todo Update"
                      defaultCollapsed={false}
                    />
                  )
                  : item.toolUse && (
                    <ToolUseCard
                      toolName={item.toolUse.toolName || 'Tool'}
                      input={item.toolUse.rawInput || {}}
                      isExecuting={status === 'executing'}
                      duration={item.toolUse.duration}
                      tokens={item.toolUse.tokens}
                      fileContentBefore={item.toolUse.fileContentBefore}
                      fileContentAfter={item.toolUse.fileContentAfter}
                      startLine={item.toolUse.startLine}
                      startLines={item.toolUse.startLines}
                      defaultCollapsed={true}
                    />
                  )}

                {item.toolResult && (
                  <ToolResultCard
                    content={item.toolResult.content}
                    isError={item.toolResult.isError}
                    toolName={item.toolResult.toolName}
                    duration={item.toolResult.duration}
                    tokens={item.toolResult.tokens}
                    defaultCollapsed={true}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {isProcessing && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-[var(--vscode-editor-inactiveSelectionBackground)]">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
