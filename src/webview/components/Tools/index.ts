// Tool Visualization Components
// Export barrel for easy imports

import { withErrorBoundary } from "../Common";
import { ToolUseCard as ToolUseCardBase } from "./ToolUseCard";
import { ToolResultCard as ToolResultCardBase } from "./ToolResultCard";

// Wrap tool components with error boundaries
export const ToolUseCard = withErrorBoundary(ToolUseCardBase, "ToolUseCard");
export const ToolResultCard = withErrorBoundary(ToolResultCardBase, "ToolResultCard");

export type { ToolUseCardProps, ToolInput } from "./ToolUseCard";
export type { ToolResultCardProps } from "./ToolResultCard";

export { DiffViewer } from "./DiffViewer";
export type { DiffViewerProps, DiffLine } from "./DiffViewer";

export { TodoDisplay } from "./TodoDisplay";
export type { TodoDisplayProps, TodoItem, TodoStatus } from "./TodoDisplay";
