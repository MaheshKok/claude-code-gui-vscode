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
const selectedModel = useSettingsStore(s => s.selectedModel);
const thinkingMode = useSettingsStore(s => s.thinkingMode);
const thinkingIntensity = useSettingsStore(s => s.thinkingIntensity);
const planMode = useSettingsStore(s => s.planMode);
const yoloMode = useSettingsStore(s => s.yoloMode);
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

**Purpose:** Renders individual message with role-specific styling.

```typescript
interface MessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'tool' | 'error';
    content: string;
    timestamp: Date;
    toolName?: string;
    isStreaming?: boolean;
  };
}
```

**Content Rendering:**
- Markdown code block detection (```)
- Inline code formatting
- Streaming indicator
- Role-based icons (User, Bot, Tool, Error)
- Timestamps

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

**Purpose:** Displays tool execution with input preview.

```typescript
interface ToolUseCardProps {
  toolName: string;
  input: { [key: string]: unknown };
  isExecuting?: boolean;
  onFilePathClick?: (filePath: string) => void;
}
```

**Features:**
- Tool icon based on name (Bash, Read, Write, Edit, etc.)
- Expandable sections for long input
- Clickable file paths
- Execution spinner

---

### ToolResultCard (`src/webview/components/Tools/ToolResultCard.tsx`)

**Purpose:** Displays tool execution results.

```typescript
interface ToolResultCardProps {
  content: string;
  isError?: boolean;
  toolName?: string;
  maxLines?: number;
  onCopy?: (content: string) => void;
}
```

**Features:**
- Success/error styling
- Copy button with feedback
- Line truncation with "Show more"
- Preserves whitespace

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
  width?: 'sm' | 'md' | 'lg' | 'xl';
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

**Purpose:** Sidebar overlay for conversation history.

```typescript
interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationLoad?: (id: string) => void;
}
```

**Features:**
- Fixed sidebar (320px width)
- Slide-in animation
- Search with debouncing
- Keyboard shortcut (Esc to close)

---

### ConversationItem

**Purpose:** Single conversation in history list.

```typescript
interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive?: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  cost?: number;
}
```

**Features:**
- Hover state with delete button
- Relative timestamp ("2 hours ago")
- Message count badge
- Cost badge
- Tag display (max 2 visible)

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
