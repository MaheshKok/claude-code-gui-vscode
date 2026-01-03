/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: Using 'any' for conversation message data where types are dynamic

import * as vscode from "vscode";
import * as path from "path";

/**
 * Represents a single message in a conversation
 */
export interface ConversationMessage {
    type: string;
    data?: any;
    timestamp?: string;
    [key: string]: unknown;
}

/**
 * Represents a complete conversation
 */
export interface Conversation {
    sessionId: string;
    startTime: string | undefined;
    endTime: string;
    messageCount: number;
    totalCost: number;
    totalTokens: {
        input: number;
        output: number;
    };
    messages: ConversationMessage[];
    filename: string;
}

/**
 * Represents an entry in the conversation index
 */
export interface ConversationIndexEntry {
    filename: string;
    sessionId: string;
    startTime: string;
    endTime: string;
    messageCount: number;
    totalCost: number;
    firstUserMessage: string;
    lastUserMessage: string;
}

/**
 * Options for saving a conversation
 */
export interface SaveConversationOptions {
    sessionId: string;
    totalCost: number;
    totalTokens: {
        input: number;
        output: number;
    };
}

/**
 * Service for managing conversation persistence
 * Handles saving, loading, and indexing conversations
 */
export class ConversationService implements vscode.Disposable {
    private _conversationsPath: string | undefined;
    private _conversationIndex: ConversationIndexEntry[] = [];
    private _currentConversation: ConversationMessage[] = [];
    private _conversationStartTime: string | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._initializeConversations();
        this._conversationIndex = this._context.workspaceState.get("claude.conversationIndex", []);
    }

    /**
     * Get the conversation index
     */
    public getConversationIndex(): ConversationIndexEntry[] {
        return this._conversationIndex;
    }

    /**
     * Get the latest conversation from the index
     */
    public getLatestConversation(): ConversationIndexEntry | undefined {
        if (this._conversationIndex.length === 0) {
            return undefined;
        }
        return this._conversationIndex[this._conversationIndex.length - 1];
    }

    /**
     * Load a specific conversation by filename
     */
    public loadConversation(filename: string): Conversation | undefined {
        if (!this._conversationsPath) {
            return undefined;
        }

        try {
            const filePath = path.join(this._conversationsPath, filename);
            const fileUri = vscode.Uri.file(filePath);

            // Read synchronously using fs
            const fs = require("fs");
            if (!fs.existsSync(filePath)) {
                console.log("Conversation file not found:", filePath);
                return undefined;
            }

            const content = fs.readFileSync(filePath, "utf8");
            const conversation: Conversation = JSON.parse(content);

            // Update current conversation
            this._currentConversation = conversation.messages;
            this._conversationStartTime = conversation.startTime;

            return conversation;
        } catch (error) {
            console.error("Error loading conversation:", error);
            return undefined;
        }
    }

    /**
     * Add a message to the current conversation
     */
    public addMessage(message: ConversationMessage): void {
        const timestamp = new Date().toISOString();
        this._currentConversation.push({
            ...message,
            timestamp,
        });

        if (!this._conversationStartTime) {
            this._conversationStartTime = timestamp;
        }
    }

    /**
     * Clear the current conversation
     */
    public clearCurrentConversation(): void {
        this._currentConversation = [];
        this._conversationStartTime = undefined;
    }

    /**
     * Get the current conversation messages
     */
    public getCurrentConversation(): ConversationMessage[] {
        return this._currentConversation;
    }

    /**
     * Save the current conversation to disk
     */
    public async saveCurrentConversation(options: SaveConversationOptions): Promise<void> {
        if (!this._conversationsPath || this._currentConversation.length === 0) {
            return;
        }

        try {
            const endTime = new Date().toISOString();
            const filename = `conversation-${endTime.replace(/[:.]/g, "-")}.json`;

            const conversation: Conversation = {
                sessionId: options.sessionId,
                startTime: this._conversationStartTime,
                endTime,
                messageCount: this._currentConversation.length,
                totalCost: options.totalCost,
                totalTokens: options.totalTokens,
                messages: this._currentConversation,
                filename,
            };

            // Write conversation file
            const filePath = path.join(this._conversationsPath, filename);
            const fileUri = vscode.Uri.file(filePath);
            const content = new TextEncoder().encode(JSON.stringify(conversation, null, 2));
            await vscode.workspace.fs.writeFile(fileUri, content);

            // Update index
            const firstUserMessage = this._findFirstUserMessage();
            const lastUserMessage = this._findLastUserMessage();

            const indexEntry: ConversationIndexEntry = {
                filename,
                sessionId: options.sessionId,
                startTime: this._conversationStartTime || endTime,
                endTime,
                messageCount: this._currentConversation.length,
                totalCost: options.totalCost,
                firstUserMessage,
                lastUserMessage,
            };

            // Check if we already have this session in the index and update it
            const existingIndex = this._conversationIndex.findIndex(
                (entry) => entry.sessionId === options.sessionId,
            );

            if (existingIndex >= 0) {
                this._conversationIndex[existingIndex] = indexEntry;
            } else {
                this._conversationIndex.push(indexEntry);
            }

            // Save index to workspace state
            await this._context.workspaceState.update(
                "claude.conversationIndex",
                this._conversationIndex,
            );

            console.log("Saved conversation:", filename);
        } catch (error) {
            console.error("Error saving conversation:", error);
        }
    }

    /**
     * Delete a conversation by filename
     */
    public async deleteConversation(filename: string): Promise<boolean> {
        if (!this._conversationsPath) {
            return false;
        }

        try {
            const filePath = path.join(this._conversationsPath, filename);
            const fileUri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.delete(fileUri);

            // Remove from index
            this._conversationIndex = this._conversationIndex.filter(
                (entry) => entry.filename !== filename,
            );
            await this._context.workspaceState.update(
                "claude.conversationIndex",
                this._conversationIndex,
            );

            return true;
        } catch (error) {
            console.error("Error deleting conversation:", error);
            return false;
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Nothing to dispose
    }

    // ==================== Private Methods ====================

    private async _initializeConversations(): Promise<void> {
        try {
            const storagePath = this._context.storageUri?.fsPath;
            if (!storagePath) {
                return;
            }

            this._conversationsPath = path.join(storagePath, "conversations");

            // Create conversations directory if it doesn't exist
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(this._conversationsPath));
            } catch {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._conversationsPath));
                console.log(`Created conversations directory at: ${this._conversationsPath}`);
            }
        } catch (error) {
            console.error("Failed to initialize conversations directory:", error);
        }
    }

    private _findFirstUserMessage(): string {
        for (const msg of this._currentConversation) {
            if (msg.type === "userInput" && msg.data) {
                const text = typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data);
                return text.substring(0, 100) + (text.length > 100 ? "..." : "");
            }
        }
        return "";
    }

    private _findLastUserMessage(): string {
        for (let i = this._currentConversation.length - 1; i >= 0; i--) {
            const msg = this._currentConversation[i];
            if (msg.type === "userInput" && msg.data) {
                const text = typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data);
                return text.substring(0, 100) + (text.length > 100 ? "..." : "");
            }
        }
        return "";
    }
}
