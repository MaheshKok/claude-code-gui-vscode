import React from 'react';
import type { Message as MessageType } from '../App';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isTool = message.role === 'tool';

  const getRoleLabel = () => {
    switch (message.role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Claude';
      case 'tool':
        return message.toolName || 'Tool';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getRoleIcon = () => {
    switch (message.role) {
      case 'user':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'assistant':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        );
      case 'tool':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'rounded-lg p-4';

    if (isUser) {
      return `${baseClasses} bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)]`;
    }
    if (isError) {
      return `${baseClasses} bg-[var(--vscode-inputValidation-errorBackground)] border border-[var(--vscode-inputValidation-errorBorder)]`;
    }
    if (isTool) {
      return `${baseClasses} bg-[var(--vscode-editor-inactiveSelectionBackground)] border border-[var(--vscode-panel-border)]`;
    }
    return `${baseClasses} bg-[var(--vscode-editor-background)]`;
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className={getContainerClasses()}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center justify-center w-6 h-6 rounded-full ${
          isError
            ? 'bg-[var(--vscode-errorForeground)] text-white'
            : isUser
              ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]'
              : 'bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]'
        }`}>
          {getRoleIcon()}
        </span>
        <span className="font-medium text-sm text-[var(--vscode-foreground)]">
          {getRoleLabel()}
        </span>
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          {formatTimestamp(message.timestamp)}
        </span>
        {message.isStreaming && (
          <span className="text-xs text-[var(--vscode-descriptionForeground)] animate-pulse">
            streaming...
          </span>
        )}
      </div>

      <div className="pl-8 text-sm text-[var(--vscode-foreground)] whitespace-pre-wrap break-words">
        {isTool ? (
          <div className="font-mono text-xs bg-[var(--vscode-textCodeBlock-background)] p-2 rounded overflow-x-auto">
            {message.content}
          </div>
        ) : (
          <MessageContent content={message.content} />
        )}
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3);
          const firstNewline = codeContent.indexOf('\n');
          const language = firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : '';
          const code = firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent;

          return (
            <div key={index} className="my-2">
              {language && (
                <div className="text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-textCodeBlock-background)] px-3 py-1 rounded-t border-b border-[var(--vscode-panel-border)]">
                  {language}
                </div>
              )}
              <pre className={`font-mono text-xs bg-[var(--vscode-textCodeBlock-background)] p-3 overflow-x-auto ${language ? 'rounded-b' : 'rounded'}`}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Handle inline code
        return (
          <span key={index}>
            {part.split(/(`[^`]+`)/g).map((segment, i) => {
              if (segment.startsWith('`') && segment.endsWith('`')) {
                return (
                  <code
                    key={i}
                    className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)] font-mono text-xs"
                  >
                    {segment.slice(1, -1)}
                  </code>
                );
              }
              return segment;
            })}
          </span>
        );
      })}
    </>
  );
};

export default Message;
