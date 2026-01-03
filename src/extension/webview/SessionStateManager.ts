/**
 * Session State Manager
 *
 * Manages session state including token usage, costs, processing status,
 * and tool use metrics. Extracted from PanelProvider for single responsibility.
 *
 * @module webview/SessionStateManager
 */

/**
 * Tool use metrics for tracking execution time and token usage per tool
 */
export interface ToolUseMetric {
    startTime: number;
    tokens?: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
    toolName?: string;
    rawInput?: Record<string, unknown>;
    fileContentBefore?: string;
    startLine?: number;
    startLines?: number[];
}

/**
 * Session state data structure
 */
export interface SessionState {
    totalCost: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    totalCacheReadTokens: number;
    totalCacheCreationTokens: number;
    requestCount: number;
    isProcessing: boolean;
    hasOpenOutput: boolean;
    draftMessage: string;
    selectedModel: string;
    subscriptionType: string | undefined;
    accountInfoFetchedThisSession: boolean;
}

/**
 * Token usage update structure
 */
export interface TokenUsageUpdate {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
}

/**
 * Manages session state for the panel provider
 */
export class SessionStateManager {
    private _totalCost: number = 0;
    private _totalTokensInput: number = 0;
    private _totalTokensOutput: number = 0;
    private _totalCacheReadTokens: number = 0;
    private _totalCacheCreationTokens: number = 0;
    private _requestCount: number = 0;
    private _isProcessing: boolean = false;
    private _hasOpenOutput: boolean = false;
    private _draftMessage: string = "";
    private _selectedModel: string = "default";
    private _subscriptionType: string | undefined;
    private _accountInfoFetchedThisSession: boolean = false;
    private _toolUseMetrics: Map<string, ToolUseMetric> = new Map();

    /**
     * Get complete session state
     */
    getState(): SessionState {
        return {
            totalCost: this._totalCost,
            totalTokensInput: this._totalTokensInput,
            totalTokensOutput: this._totalTokensOutput,
            totalCacheReadTokens: this._totalCacheReadTokens,
            totalCacheCreationTokens: this._totalCacheCreationTokens,
            requestCount: this._requestCount,
            isProcessing: this._isProcessing,
            hasOpenOutput: this._hasOpenOutput,
            draftMessage: this._draftMessage,
            selectedModel: this._selectedModel,
            subscriptionType: this._subscriptionType,
            accountInfoFetchedThisSession: this._accountInfoFetchedThisSession,
        };
    }

    /**
     * Update session state with partial updates
     */
    setState(updates: Partial<SessionState>): void {
        if (updates.totalCost !== undefined) this._totalCost = updates.totalCost;
        if (updates.totalTokensInput !== undefined)
            this._totalTokensInput = updates.totalTokensInput;
        if (updates.totalTokensOutput !== undefined)
            this._totalTokensOutput = updates.totalTokensOutput;
        if (updates.totalCacheReadTokens !== undefined)
            this._totalCacheReadTokens = updates.totalCacheReadTokens;
        if (updates.totalCacheCreationTokens !== undefined)
            this._totalCacheCreationTokens = updates.totalCacheCreationTokens;
        if (updates.requestCount !== undefined) this._requestCount = updates.requestCount;
        if (updates.isProcessing !== undefined) this._isProcessing = updates.isProcessing;
        if (updates.hasOpenOutput !== undefined) this._hasOpenOutput = updates.hasOpenOutput;
        if (updates.draftMessage !== undefined) this._draftMessage = updates.draftMessage;
        if (updates.selectedModel !== undefined) this._selectedModel = updates.selectedModel;
        if (updates.subscriptionType !== undefined)
            this._subscriptionType = updates.subscriptionType;
        if (updates.accountInfoFetchedThisSession !== undefined)
            this._accountInfoFetchedThisSession = updates.accountInfoFetchedThisSession;
    }

    // ==================== Individual State Accessors ====================

    get totalCost(): number {
        return this._totalCost;
    }
    set totalCost(value: number) {
        this._totalCost = value;
    }

    get totalTokensInput(): number {
        return this._totalTokensInput;
    }
    set totalTokensInput(value: number) {
        this._totalTokensInput = value;
    }

    get totalTokensOutput(): number {
        return this._totalTokensOutput;
    }
    set totalTokensOutput(value: number) {
        this._totalTokensOutput = value;
    }

    get totalCacheReadTokens(): number {
        return this._totalCacheReadTokens;
    }
    set totalCacheReadTokens(value: number) {
        this._totalCacheReadTokens = value;
    }

    get totalCacheCreationTokens(): number {
        return this._totalCacheCreationTokens;
    }
    set totalCacheCreationTokens(value: number) {
        this._totalCacheCreationTokens = value;
    }

    get requestCount(): number {
        return this._requestCount;
    }
    set requestCount(value: number) {
        this._requestCount = value;
    }

    get isProcessing(): boolean {
        return this._isProcessing;
    }
    set isProcessing(value: boolean) {
        this._isProcessing = value;
    }

    get hasOpenOutput(): boolean {
        return this._hasOpenOutput;
    }
    set hasOpenOutput(value: boolean) {
        this._hasOpenOutput = value;
    }

    get draftMessage(): string {
        return this._draftMessage;
    }
    set draftMessage(value: string) {
        this._draftMessage = value;
    }

    get selectedModel(): string {
        return this._selectedModel;
    }
    set selectedModel(value: string) {
        this._selectedModel = value;
    }

    get subscriptionType(): string | undefined {
        return this._subscriptionType;
    }
    set subscriptionType(value: string | undefined) {
        this._subscriptionType = value;
    }

    get accountInfoFetchedThisSession(): boolean {
        return this._accountInfoFetchedThisSession;
    }
    set accountInfoFetchedThisSession(value: boolean) {
        this._accountInfoFetchedThisSession = value;
    }

    // ==================== Token Management ====================

    /**
     * Add token usage to totals
     */
    addTokenUsage(usage: TokenUsageUpdate): void {
        this._totalTokensInput += usage.inputTokens;
        this._totalTokensOutput += usage.outputTokens;
        this._totalCacheReadTokens += usage.cacheReadTokens;
        this._totalCacheCreationTokens += usage.cacheCreationTokens;
    }

    /**
     * Reset token counts (e.g., after compaction)
     */
    resetTokenCounts(): void {
        this._totalTokensInput = 0;
        this._totalTokensOutput = 0;
        this._totalCacheReadTokens = 0;
        this._totalCacheCreationTokens = 0;
    }

    /**
     * Get current token totals
     */
    getTokenTotals(): TokenUsageUpdate {
        return {
            inputTokens: this._totalTokensInput,
            outputTokens: this._totalTokensOutput,
            cacheReadTokens: this._totalCacheReadTokens,
            cacheCreationTokens: this._totalCacheCreationTokens,
        };
    }

    // ==================== Cost Management ====================

    /**
     * Add cost to total
     */
    addCost(cost: number): void {
        this._totalCost += cost;
    }

    /**
     * Increment request count
     */
    incrementRequestCount(): void {
        this._requestCount++;
    }

    // ==================== Tool Use Metrics ====================

    /**
     * Set metrics for a tool use
     */
    setToolMetric(toolUseId: string, metric: ToolUseMetric): void {
        this._toolUseMetrics.set(toolUseId, metric);
    }

    /**
     * Get metrics for a tool use
     */
    getToolMetric(toolUseId: string): ToolUseMetric | undefined {
        return this._toolUseMetrics.get(toolUseId);
    }

    /**
     * Delete metrics for a tool use
     */
    deleteToolMetric(toolUseId: string): void {
        this._toolUseMetrics.delete(toolUseId);
    }

    /**
     * Clear all tool metrics
     */
    clearToolMetrics(): void {
        this._toolUseMetrics.clear();
    }

    // ==================== Session Reset ====================

    /**
     * Reset session to initial state
     */
    resetSession(): void {
        this._totalCost = 0;
        this._totalTokensInput = 0;
        this._totalTokensOutput = 0;
        this._totalCacheReadTokens = 0;
        this._totalCacheCreationTokens = 0;
        this._requestCount = 0;
        this._isProcessing = false;
        this._hasOpenOutput = false;
        this._toolUseMetrics.clear();
    }

    /**
     * Restore session state from saved conversation
     */
    restoreFromConversation(data: {
        totalCost: number;
        totalTokens: { input: number; output: number };
    }): void {
        this._totalCost = data.totalCost;
        this._totalTokensInput = data.totalTokens.input;
        this._totalTokensOutput = data.totalTokens.output;
        this._totalCacheReadTokens = 0;
        this._totalCacheCreationTokens = 0;
    }
}
