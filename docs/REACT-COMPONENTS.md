# React Components Documentation

## Component Hierarchy

```
App (Root)
├── WSLAlert (conditional)
├── Header
│   └── Session info, settings, new chat buttons
├── ConversationHistory (sidebar overlay)
│   ├── ConversationSearch
│   └── ConversationItem[]
├── ChatContainer
│   ├── MessageList
│   │   └── Message[]
│   └── MessageInput
│       ├── Model Selector Dropdown
│       ├── Plan Mode Toggle
│       ├── Thinking Mode Dropdown
│       ├── YOLO Mode Toggle
│       ├── Action Buttons (MCP, /, @, image)
│       └── Textarea + Send Button
├── StatusBar
└── Modals (conditional)
    ├── SettingsModal
    ├── MCPModal
    ├── ModelSelectorModal
    ├── PermissionModal
    ├── InstallModal
    ├── SlashCommandsModal
    ├── FilePickerModal
    └── ThinkingIntensityModal
```

## Core Components

### App (`src/webview/App.tsx`)

**Purpose:** Root orchestrator with message routing and state management.

```typescript
// Key state managed
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [session, setSession] = useState<SessionInfo | null>(null);
const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);

// Settings from store
const selectedModel = useSettingsStore((s) => s.selectedModel);
const thinkingMode = useSettingsStore((s) => s.thinkingMode);
const thinkingIntensity = useSettingsStore((s) => s.thinkingIntensity);
const planMode = useSettingsStore((s) => s.planMode);
const yoloMode = useSettingsStore((s) => s.yoloMode);
```

**Message Handler Map:**

```typescript
const handlers = {
    sessionInfo: (msg) => setSession(msg),
    output: (msg) => appendToMessage(msg.text),
    thinking: (msg) => addThinkingMessage(msg.content),
    toolUse: (msg) => addToolUseMessage(msg),
    toolResult: (msg) => addToolResultMessage(msg),
    permissionRequest: (msg) => setPermissionRequest(msg),
    error: (msg) => addErrorMessage(msg),
    settingsUpdate: (msg) => updateSettings(msg),
    restoreState: (msg) => restoreState(msg),
};
```

---

### ChatContainer (`src/webview/components/Chat/ChatContainer.tsx`)

**Purpose:** Container for message list and input.

```typescript
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
```

---

### MessageList (`src/webview/components/Chat/MessageList.tsx`)

**Purpose:** Renders list of messages with auto-scroll.

```typescript
interface MessageListProps {
    messages: Message[];
    isProcessing: boolean;
}
```

**Features:**

- Auto-scroll to bottom on new messages (smooth)
- Empty state with quick action buttons
- Processing indicator with animated dots
- Groups related messages (tool use + result)

---

### Message (`src/webview/components/Chat/Message.tsx`)

**Purpose:** Renders individual message with role-specific styling and collapsible tool messages.

```typescript
interface MessageProps {
    message: {
        id: string;
        role: "user" | "assistant" | "tool" | "error";
        content: string;
        timestamp: Date;
        toolName?: string;
        isStreaming?: boolean;
        /** Duration in milliseconds (for tool messages) */
        duration?: number;
        /** Token count (for tool messages) */
        tokens?: number;
    };
}
```

**Content Rendering:**

- Markdown code block detection (``` with language tag)
- Inline code formatting with backticks
- Streaming indicator ("streaming..." pulse animation)
- Role-based icons (User, Bot, Tool, Error)
- Timestamps (12-hour format with AM/PM)

**Tool Message Features:**

- Collapsible layout with chevron toggle (default: collapsed)
- Clickable header for expand/collapse
- Duration badge (formatted as ms/s/m)
- Token count badge (formatted with K suffix)
- Monospace code block for content when expanded

**Role Styling:**

- User: Input background with border
- Assistant: Editor background
- Tool: Inactive selection background with border
- Error: Error background with error border

---

### MessageInput (`src/webview/components/Chat/MessageInput.tsx`)

**Purpose:** Rich input component with mode toggles.

```typescript
interface MessageInputProps {
    disabled: boolean;
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
```

**Toolbar Controls:**

- Model selector (Sonnet/Opus/Haiku)
- Plan mode toggle (clipboard icon)
- Thinking mode dropdown (brain icon with intensity levels)
- YOLO mode toggle (warning colors when active)
- MCP tools button
- Slash commands button (/)
- File reference button (@)
- Image attachment button

**Keyboard Shortcuts:**

- `Enter` - Send message
- `Shift+Enter` - New line
- `@` - Open file picker
- `/` - Open slash commands

---

### Header (`src/webview/components/Header/Header.tsx`)

**Purpose:** App header with session info and actions.

```typescript
interface HeaderProps {
    session: SessionInfo | null;
    onNewChat: () => void;
    onOpenSettings: () => void;
    onToggleHistory: () => void;
    isHistoryOpen?: boolean;
}
```

**Layout:**

- Left: Title + session indicator (green dot)
- Right: History | Settings | New Chat buttons

---

### StatusBar (`src/webview/components/Status/StatusBar.tsx`)

**Purpose:** Shows connection and processing status.

```typescript
interface StatusBarProps {
    isConnected: boolean;
    isProcessing: boolean;
    onStop: () => void;
}
```

**Layout:**

- Left: Connection status dot + text
- Center: Processing spinner (when processing)
- Right: Stop button (when processing) + keyboard hint

---

## Tool Components

### ToolUseCard (`src/webview/components/Tools/ToolUseCard.tsx`)

**Purpose:** Displays tool execution with input preview and collapsible content.

```typescript
interface ToolUseCardProps {
    toolName: string;
    input: { [key: string]: unknown };
    isExecuting?: boolean;
    onFilePathClick?: (filePath: string) => void;
    /** Duration in milliseconds */
    duration?: number;
    /** Token count for this tool use */
    tokens?: number;
    /** Whether to start collapsed (default: true) */
    defaultCollapsed?: boolean;
}
```

**Features:**

- Tool icon based on name (Read, Write, Edit, MultiEdit, Bash, Glob, Grep, TodoWrite, WebFetch, WebSearch, Task, LSP, NotebookEdit)
- Collapsible card with chevron toggle (default: collapsed)
- Clickable header for expand/collapse (hover state with background change)
- Duration badge (formatted as ms/s/m) with clock icon
- Token count badge (formatted with K suffix) with tag icon
- Expandable sections for long input values (> 200 characters)
- Clickable file paths with file icon (detects file_path, filePath, path, file keys)
- Execution spinner with "Executing..." text
- Raw JSON input view (expandable via "show more" button)

**Tool Icons Supported:**

- Read, Write, Edit, MultiEdit (file operations)
- Bash (terminal)
- Glob, Grep (search)
- TodoWrite (checklist)
- WebFetch, WebSearch (web operations)
- Task (clipboard)
- LSP (code layers)
- NotebookEdit (notebook)

---

### ToolResultCard (`src/webview/components/Tools/ToolResultCard.tsx`)

**Purpose:** Displays tool execution results with collapsible content.

```typescript
interface ToolResultCardProps {
    content: string;
    isError?: boolean;
    toolName?: string;
    maxLines?: number;
    onCopy?: (content: string) => void;
    /** Duration in milliseconds */
    duration?: number;
    /** Token count for this tool result */
    tokens?: number;
    /** Whether to start collapsed (default: true) */
    defaultCollapsed?: boolean;
}
```

**Features:**

- Collapsible card with chevron toggle (default: collapsed)
- Success/error styling with appropriate icons
- Duration badge (formatted as ms/s/m)
- Token count badge (formatted with K suffix)
- Copy button with "Copied" feedback (2s timeout)
- Line truncation with "Show N more lines" button
- Preserves whitespace in preformatted content

---

### DiffViewer (`src/webview/components/Tools/DiffViewer.tsx`)

**Purpose:** Shows file changes in diff format.

**Features:**

- Side-by-side view
- Unified diff view
- Syntax highlighting
- Line numbers

---

### TodoDisplay (`src/webview/components/Tools/TodoDisplay.tsx`)

**Purpose:** Renders todo items from TodoWrite tool.

**Features:**

- Status indicators (pending, in_progress, completed)
- Priority badges
- Collapsible sections

---

## Modal Components

### Modal (`src/webview/components/Modals/Modal.tsx`)

**Purpose:** Base modal component.

```typescript
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: "sm" | "md" | "lg" | "xl";
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
}
```

**Features:**

- Backdrop blur effect
- Fade-in/slide-up animations
- Escape key to close
- Focus management

---

### SettingsModal

**Sections:**

1. WSL Configuration
2. Permissions Management
3. YOLO Mode Toggle
4. Thinking Intensity Slider

---

### PermissionModal

**Purpose:** Tool permission approval dialog.

```typescript
interface PermissionModalProps {
    request: PermissionRequest | null;
    onAllow: (requestId: string) => void;
    onDeny: (requestId: string, reason?: string) => void;
    onAlwaysAllow: (requestId: string, pattern: string) => void;
}
```

**Sections:**

1. Warning banner with tool name
2. Input preview (JSON formatted)
3. Deny reason textarea (expandable)
4. Always-allow pattern input (expandable)
5. Action buttons: Allow | Deny | Always allow

---

### MCPModal

**Purpose:** MCP server configuration.

**Features:**

- Server list with status indicators
- Add/edit server form
- Test connection button
- Delete confirmation

---

### ModelSelectorModal

**Purpose:** Claude model selection.

**Available Models:**

- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Claude Opus 4.5 (claude-opus-4-5-20251101)
- Claude Haiku 4.5 (claude-haiku-4-5-20251001)

---

### SlashCommandsModal

**Purpose:** Shows available slash commands.

**Commands:**

- `/help` - Show help
- `/clear` - Clear conversation
- `/settings` - Open settings
- `/model` - Change model
- `/history` - Show history

---

### ThinkingIntensityModal

**Purpose:** Select thinking mode intensity.

**Levels:**

- Think (default)
- Think Hard
- Think Harder
- Ultrathink

---

## History Components

### ConversationHistory

**Purpose:** Sidebar overlay for conversation history with search and delete functionality.

```typescript
interface ConversationHistoryProps {
    /** Whether the panel is visible */
    isOpen: boolean;
    /** Callback to close the panel */
    onClose: () => void;
    /** Callback when a conversation is loaded */
    onConversationLoad?: (id: string) => void;
    /** Conversations to display */
    conversations: ConversationListItem[];
    /** Whether conversations are loading */
    isLoading?: boolean;
    /** Active conversation id */
    activeConversationId?: string | null;
    /** Callback to delete a conversation */
    onConversationDelete?: (id: string) => void;
}
```

**Features:**

- Fixed sidebar (320px width, max-w-full)
- Slide-in animation (`animate-slide-in-left`)
- Header with conversation count and close button
- Search input with filtering by title/preview
- Loading state with spinner
- Empty states (no results vs no conversations)
- Sorted by updatedAt descending
- Footer with filtered count
- Keyboard shortcut (Esc to close)
- ARIA labels for accessibility

---

### HistoryView

**Purpose:** Standalone full-page history view component.

```typescript
// Uses Lucide icons: Clock, MessageSquare, Trash2, Search, FolderOpen
interface ConversationSummary {
    filename: string;
    timestamp: Date;
    preview: string;
    messageCount: number;
}
```

**Features:**

- Header with conversation count
- Search input with filtering
- Conversation list with hover delete
- Confirmation dialog for deletion
- Loading spinner state
- Empty state with icon
- Date formatting (short month, day, year, time)

---

### ConversationItem

**Purpose:** Single conversation in history list with inline delete confirmation.

```typescript
interface ConversationItemProps {
    /** Conversation summary data */
    conversation: ConversationListItem;
    /** Whether this conversation is currently active */
    isActive?: boolean;
    /** Callback when conversation is clicked */
    onClick: (id: string) => void;
    /** Callback when delete is confirmed */
    onDelete: (id: string) => void;
    /** Optional cost information */
    cost?: number;
}
```

**Features:**

- Hover state with delete button (opacity transition)
- Inline delete confirmation (checkmark/X buttons)
- Relative timestamp formatting ("2 hours ago", "Yesterday", etc.)
- Message count badge
- Cost badge (green, shows "$X.XX" or "<$0.01")
- Tag display (max 2 visible with "+N" overflow)
- Keyboard accessible (Enter/Space to select)
- ARIA labels for accessibility

---

### ConversationSearch

**Purpose:** Search input for history.

```typescript
interface ConversationSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    debounceMs?: number;
    autoFocus?: boolean;
}
```

**Features:**

- Search icon
- Clear button
- Debounced callback (300ms default)
- Escape to clear
