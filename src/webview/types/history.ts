/**
 * Conversation history types for UI components.
 */

export interface ConversationListItem {
    id: string;
    title: string;
    preview: string;
    updatedAt: number;
    messageCount: number;
    sessionId?: string;
    totalCost?: number;
    tags?: string[];
}
