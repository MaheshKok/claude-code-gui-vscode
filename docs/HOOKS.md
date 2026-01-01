# Custom Hooks Documentation

## Overview

Claude Code GUI includes 10 custom React hooks for common functionality.

## Hook Summary

| Hook             | Purpose                   | Key Features                      |
| ---------------- | ------------------------- | --------------------------------- |
| `useVSCode`      | VS Code API wrapper       | postMessage, state persistence    |
| `useMessages`    | Extension message routing | Handler registration, type safety |
| `useTheme`       | Theme detection           | CSS variables, dark mode          |
| `usePermissions` | Permission workflows      | Request handling, decisions       |
| `useClipboard`   | Copy/paste operations     | Image support, fallbacks          |
| `useKeyboard`    | Keyboard shortcuts        | Modifiers, chat shortcuts         |
| `useAutoScroll`  | Smart auto-scroll         | User intent detection             |
| `useAutoResize`  | Textarea auto-height      | Min/max constraints               |
| `useFilePicker`  | File selection UI         | Search, keyboard nav              |

**Note:** The `useKeyboard` hook also exports `useChatKeyboard` as a specialized variant for chat input handling.

---

## Hook Files

```
src/webview/hooks/
├── index.ts           # Re-exports all hooks
├── useVSCode.ts       # VS Code API wrapper
├── useMessages.ts     # Message routing
├── useTheme.ts        # Theme detection
├── usePermissions.ts  # Permission workflows
├── useClipboard.ts    # Clipboard operations
├── useKeyboard.ts     # Keyboard shortcuts
├── useAutoScroll.ts   # Auto-scroll behavior
├── useAutoResize.ts   # Textarea auto-height
└── useFilePicker.ts   # File selection UI
```

---

## useVSCode

**File:** `src/webview/hooks/useVSCode.ts`

**Purpose:** Type-safe VS Code webview API wrapper with state persistence.

### Return Type

```typescript
interface UseVSCodeReturn {
  isVSCode: boolean;
  api: VSCodeApi | null;
  postMessage(message: WebviewToExtensionMessage): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
  updateState<T>(updates: Partial<T>): void;
}
```

### Usage

```typescript
function MyComponent() {
  const { isVSCode, postMessage, getState, setState } = useVSCode();

  // Send message to extension
  const handleSend = () => {
    postMessage({
      type: 'sendMessage',
      message: 'Hello',
    });
  };

  // Persist state
  useEffect(() => {
    const saved = getState<{ count: number }>();
    if (saved?.count) setCount(saved.count);
  }, []);

  return <button onClick={handleSend}>Send</button>;
}
```

---

## useMessages

**File:** `src/webview/hooks/useMessages.ts`

**Purpose:** Message routing between extension and webview.

### Options

```typescript
interface UseMessagesOptions {
  enabled?: boolean;
  handlers?: ExtensionMessageHandlerMap;
  onMessage?: (msg: ExtensionToWebviewMessage) => void;
  onUnhandledMessage?: (msg: ExtensionToWebviewMessage) => void;
}
```

### Return Type

```typescript
interface UseMessagesReturn {
  addHandler<T>(type: string, handler: (msg: T) => void): () => void;
  removeHandler(type: string): void;
  clearHandlers(): void;
}
```

### Usage

```typescript
function ChatContainer() {
  const [messages, setMessages] = useState([]);

  useMessages({
    handlers: {
      output: (msg) => {
        setMessages(prev => [...prev, { type: 'assistant', content: msg.text }]);
      },
      toolUse: (msg) => console.log('Tool:', msg.toolName),
      error: (msg) => showNotification('error', msg.message),
    },
  });

  return <MessageList messages={messages} />;
}
```

### Streaming Helper

```typescript
const { handler, getText, reset } = createStreamingHandler(
  (chunk, accumulated) => updateUI(accumulated),
  (finalText) => onComplete(finalText),
);
```

---

## useTheme

**File:** `src/webview/hooks/useTheme.ts`

**Purpose:** VS Code theme detection with CSS variable extraction.

### Return Type

```typescript
interface UseThemeReturn {
  theme: "light" | "dark";
  themeKind: ThemeKind;
  isDark: boolean;
  isHighContrast: boolean;
  colors: ThemeColors;
  getCssVariable(name: string, fallback?: string): string;
  themeClass(lightClass: string, darkClass: string): string;
  toggleTheme(): void; // For testing
}
```

### CSS Variables Tracked

```typescript
colors = {
  background: "--vscode-editor-background",
  foreground: "--vscode-editor-foreground",
  accent: "--vscode-focusBorder",
  border: "--vscode-widget-border",
  inputBackground: "--vscode-input-background",
  buttonBackground: "--vscode-button-background",
  error: "--vscode-errorForeground",
  warning: "--vscode-editorWarning-foreground",
  success: "--vscode-terminal-ansiGreen",
};
```

### Usage

```typescript
function ThemedComponent() {
  const { isDark, colors, getCssVariable } = useTheme();

  return (
    <div style={{
      backgroundColor: colors.background,
      color: colors.foreground,
    }}>
      {isDark ? <DarkIcon /> : <LightIcon />}
    </div>
  );
}
```

---

## usePermissions

**File:** `src/webview/hooks/usePermissions.ts`

**Purpose:** Permission request management workflow.

### Return Type

```typescript
interface UsePermissionsReturn {
  currentRequest: PermissionRequest | null;
  pendingRequests: PermissionRequest[];
  respondToPermission(requestId: string, decision: PermissionDecision): void;
  approveCurrentRequest(): void;
  denyCurrentRequest(): void;
  approveWithSuggestion(suggestion: PermissionSuggestion): void;
  isToolAllowed(toolName: string): boolean;
  isToolAutoApproved(toolName: string): boolean;
  isToolDenied(toolName: string): boolean;
  getPermissionHistory(): PermissionRequest[];
  clearPermissionHistory(): void;
  hasPendingPermissions: boolean;
  pendingCount: number;
}
```

### Usage

```typescript
function PermissionDialog() {
  const {
    currentRequest,
    approveCurrentRequest,
    denyCurrentRequest,
    hasPendingPermissions,
  } = usePermissions();

  if (!hasPendingPermissions || !currentRequest) return null;

  return (
    <dialog>
      <h3>{currentRequest.toolName}</h3>
      <p>{currentRequest.description}</p>
      <button onClick={approveCurrentRequest}>Allow</button>
      <button onClick={denyCurrentRequest}>Deny</button>
    </dialog>
  );
}
```

---

## useClipboard

**File:** `src/webview/hooks/useClipboard.ts`

**Purpose:** Multi-method clipboard operations.

### Return Type

```typescript
interface UseClipboardReturn {
  copyText(text: string): Promise<boolean>;
  copyCode(code: string, language?: string): Promise<boolean>;
  isCopying: boolean;
  hasCopied: boolean;
  handlePaste(event: ClipboardEvent): Promise<PasteEventData | null>;
  readClipboard(): Promise<ClipboardContent | null>;
  hasClipboardType(type: string): Promise<boolean>;
}
```

### Copy Methods Priority

1. VS Code Extension API (if available)
2. Browser Clipboard API
3. Fallback: `document.execCommand('copy')`

### Usage

```typescript
function CodeBlock({ code, language }) {
  const { copyCode, isCopying, hasCopied } = useClipboard({
    onCopySuccess: () => showNotification('Copied!'),
  });

  return (
    <div>
      <pre>{code}</pre>
      <button onClick={() => copyCode(code, language)} disabled={isCopying}>
        {hasCopied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
```

---

## useKeyboard

**File:** `src/webview/hooks/useKeyboard.ts`

**Purpose:** Declarative keyboard shortcut management.

### Types

```typescript
interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  description?: string;
  enabled?: boolean;
}

interface UseKeyboardReturn {
  addShortcut(shortcut: KeyboardShortcut): () => void;
  removeShortcut(key: string, modifiers?: KeyModifiers): void;
  enableShortcut(key: string, modifiers?: KeyModifiers): void;
  disableShortcut(key: string, modifiers?: KeyModifiers): void;
  getShortcuts(): KeyboardShortcut[];
}
```

### Chat-Specific Hook

```typescript
function useChatKeyboard(options: UseChatKeyboardOptions) {
  // Supports:
  // - Enter: send message
  // - Shift+Enter / Ctrl+Enter: new line
  // - Escape: clear input
  // - @: trigger file picker
  // - /: trigger slash commands
  // - Arrow keys: navigate history
}
```

### Usage

```typescript
function MessageInput() {
  const handleKeyDown = useChatKeyboard({
    onSend: () => sendMessage(value),
    onNewLine: () => insertNewLine(),
    onEscape: () => clearInput(),
    onFilePicker: () => openFilePicker(),
    isInputEmpty: value.trim() === '',
  });

  return <textarea onKeyDown={handleKeyDown} />;
}
```

---

## useAutoScroll

**File:** `src/webview/hooks/useAutoScroll.ts`

**Purpose:** Smart auto-scroll that respects user intent.

### Return Type

```typescript
interface UseAutoScrollReturn<T extends HTMLElement> {
  containerRef: RefObject<T>;
  isNearBottom: boolean;
  isAutoScrollEnabled: boolean;
  scrollToBottom(options?: ScrollOptions): void;
  enableAutoScroll(): void;
  disableAutoScroll(): void;
  toggleAutoScroll(): void;
  checkIsAtBottom(): boolean;
}
```

### Behavior

- Auto-scrolls when new content AND user near bottom
- Disables when user scrolls away
- Re-enables when user scrolls back to bottom

### Usage

```typescript
function ChatContainer({ messages }) {
  const { containerRef, isNearBottom, scrollToBottom } = useAutoScroll<HTMLDivElement>({
    threshold: 100,  // 100px from bottom = "near"
    behavior: 'smooth',
    dependencies: [messages],
  });

  return (
    <div ref={containerRef}>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      {!isNearBottom && (
        <button onClick={() => scrollToBottom()}>⬇ New messages</button>
      )}
    </div>
  );
}
```

---

## useAutoResize

**File:** `src/webview/hooks/useAutoResize.ts`

**Purpose:** Textarea auto-height with constraints.

### Return Type

```typescript
interface UseAutoResizeReturn {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  setValue(value: string): void;
  handleChange(event: ChangeEvent<HTMLTextAreaElement>): void;
  reset(): void;
  resize(): void;
  height: number;
  isAtMaxHeight: boolean;
}
```

### Options

```typescript
interface UseAutoResizeOptions {
  maxHeight?: number; // Default: 300
  minRows?: number; // Default: 1
  initialValue?: string;
  onChange?: (value: string) => void;
}
```

### Usage

```typescript
function MessageInput({ onSend }) {
  const { textareaRef, value, handleChange, reset, height, isAtMaxHeight } = useAutoResize({
    maxHeight: 300,
    minRows: 1,
  });

  const handleSubmit = () => {
    if (value.trim()) {
      onSend(value);
      reset();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      style={{ height: `${height}px`, overflow: isAtMaxHeight ? 'auto' : 'hidden' }}
    />
  );
}
```

---

## useFilePicker

**File:** `src/webview/hooks/useFilePicker.ts`

**Purpose:** File browser with search and keyboard navigation.

### Return Type

```typescript
interface UseFilePickerReturn {
  isOpen: boolean;
  files: FilePickerItem[];
  categories: FilePickerCategory[];
  selectedFiles: FilePickerItem[];
  highlightedIndex: number;
  searchQuery: string;
  filteredFiles: FilePickerItem[];
  isLoading: boolean;

  open(): void;
  close(): void;
  toggle(): void;
  setSearchQuery(query: string): void;
  selectFile(file: FilePickerItem): void;
  deselectFile(file: FilePickerItem): void;
  toggleFileSelection(file: FilePickerItem): void;
  clearSelection(): void;
  highlightPrevious(): void;
  highlightNext(): void;
  selectHighlighted(): void;
  confirmSelection(): void;
  requestFiles(): void;
}
```

### Options

```typescript
interface UseFilePickerOptions {
  maxSelection?: number;
  allowedExtensions?: string[];
  excludePatterns?: string[]; // Default: ['node_modules', '.git', 'dist', 'build']
  onSelect?: (files: FilePickerItem[]) => void;
}
```

### Usage

```typescript
function MessageInput() {
  const {
    isOpen,
    toggle,
    filteredFiles,
    searchQuery,
    setSearchQuery,
    highlightedIndex,
    selectHighlighted,
    highlightPrevious,
    highlightNext,
    confirmSelection,
  } = useFilePicker({
    maxSelection: 5,
    allowedExtensions: ['ts', 'tsx', 'js'],
    onSelect: (files) => attachFiles(files),
  });

  return (
    <div>
      <textarea onKeyDown={(e) => e.key === '@' && toggle()} />
      {isOpen && (
        <div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') highlightPrevious();
              if (e.key === 'ArrowDown') highlightNext();
              if (e.key === 'Enter') selectHighlighted();
            }}
          />
          <ul>
            {filteredFiles.map((file, i) => (
              <li key={file.id} className={i === highlightedIndex ? 'active' : ''}>
                {file.name}
              </li>
            ))}
          </ul>
          <button onClick={confirmSelection}>Attach</button>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Memoize Handlers

```typescript
const handleSend = useCallback(() => {
  postMessage({ type: "sendMessage", message: value });
}, [postMessage, value]);
```

### 2. Use Selectors for Performance

```typescript
// Good - only re-renders when messages change
const messages = useChatStore((state) => state.messages);

// Avoid - re-renders on any store change
const { messages, isProcessing, tokens } = useChatStore();
```

### 3. Cleanup Subscriptions

```typescript
useEffect(() => {
  const unsubscribe = addHandler("output", handleOutput);
  return unsubscribe;
}, []);
```

### 4. Use Refs for Stable Callbacks

```typescript
// Hook implementation pattern
const handlerRef = useRef(handler);
handlerRef.current = handler; // Always up-to-date

useEffect(() => {
  const listener = (e) => handlerRef.current(e);
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}, []); // No deps = no re-subscription
```
