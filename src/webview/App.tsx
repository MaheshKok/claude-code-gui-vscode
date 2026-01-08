import React, { useEffect } from "react";

import { Header } from "./components/Header";
import { ChatContainer } from "./components/Chat/ChatContainer";
import { StatusBar } from "./components/Status/StatusBar";
import { ConversationHistory } from "./components/History";
import { WSLAlert } from "./components/Common";
import {
    MCPModal,
    ModelSelectorModal,
    PermissionModal,
    InstallModal,
    UsageModal,
} from "./components/Modals";

import { useChatStore } from "./stores";
import { useMessages } from "./hooks/useMessages";
import { useVSCode } from "./hooks/useVSCode";
import { useAppState } from "./hooks/useAppState";
import { useAppCallbacks } from "./hooks/useAppCallbacks";
import { useMessageHandlers } from "./hooks/useMessageHandlers";

import type { TokenUsage } from "./types";

function mapMessageToProps(m: ReturnType<typeof useChatStore.getState>["messages"][0]) {
    return {
        id: m.id,
        role:
            m.type === "user"
                ? ("user" as const)
                : m.type === "assistant"
                  ? ("assistant" as const)
                  : m.type === "error"
                    ? ("error" as const)
                    : ("tool" as const),
        messageType: m.type === "tool_use" || m.type === "tool_result" ? m.type : undefined,
        content: "content" in m ? (m as { content: string }).content : "",
        timestamp: new Date(m.timestamp),
        toolName: "toolName" in m ? (m as { toolName?: string }).toolName : undefined,
        toolUseId: "toolUseId" in m ? (m as { toolUseId?: string }).toolUseId : undefined,
        rawInput:
            "rawInput" in m ? (m as { rawInput?: Record<string, unknown> }).rawInput : undefined,
        status: "status" in m ? (m as { status?: string }).status : undefined,
        isError: "isError" in m ? (m as { isError?: boolean }).isError : undefined,
        hidden: "hidden" in m ? (m as { hidden?: boolean }).hidden : undefined,
        fileContentBefore:
            "fileContentBefore" in m
                ? (m as { fileContentBefore?: string }).fileContentBefore
                : undefined,
        fileContentAfter:
            "fileContentAfter" in m
                ? (m as { fileContentAfter?: string }).fileContentAfter
                : undefined,
        startLine: "startLine" in m ? (m as { startLine?: number }).startLine : undefined,
        startLines: "startLines" in m ? (m as { startLines?: number[] }).startLines : undefined,
        isStreaming: m.isStreaming,
        duration: "duration" in m ? (m as { duration?: number }).duration : undefined,
        tokens: "tokens" in m ? (m as { tokens?: number }).tokens : undefined,
        cacheReadTokens:
            "cacheReadTokens" in m
                ? (m as { cacheReadTokens?: number }).cacheReadTokens
                : undefined,
        cacheCreationTokens:
            "cacheCreationTokens" in m
                ? (m as { cacheCreationTokens?: number }).cacheCreationTokens
                : undefined,
        usage: "usage" in m ? (m as { usage?: TokenUsage }).usage : undefined,
    };
}

export const App: React.FC = () => {
    const vscode = useVSCode();
    const { postMessage, isVSCode } = vscode;

    const state = useAppState();
    const { chat, settings, ui, permission, local } = state;
    const { isHistoryOpen, setIsHistoryLoading } = local;

    const callbacks = useAppCallbacks({ state, vscode });

    const { handlers } = useMessageHandlers({
        streamingMessageId: local.streamingMessageId,
        setStreamingMessageId: local.setStreamingMessageId,
        setSubscriptionType: local.setSubscriptionType,
        setRequestCount: local.setRequestCount,
        setLastDurationMs: local.setLastDurationMs,
        setConversationList: local.setConversationList,
        setIsHistoryLoading: local.setIsHistoryLoading,
        setActiveConversationId: local.setActiveConversationId,
        activeConversationId: local.activeConversationId,
    });

    useMessages({
        enabled: true,
        handlers,
        onUnhandledMessage: (msg) => {
            console.warn("Unhandled message:", msg);
        },
    });

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            const isWindows =
                navigator.userAgent.includes("Windows") ||
                navigator.platform?.toLowerCase().includes("win");

            if (isWindows && !settings.wsl.enabled) {
                local.setShowWSLAlert(true);
            }
        }
    }, [settings.wsl.enabled, local]);

    useEffect(() => {
        if (isVSCode) {
            postMessage({ type: "requestState" });
            postMessage({ type: "getSettings" });
        }
    }, [isVSCode, postMessage]);

    useEffect(() => {
        if (isVSCode && isHistoryOpen) {
            setIsHistoryLoading(true);
            postMessage({ type: "getConversationList" });
        }
    }, [isVSCode, isHistoryOpen, postMessage, setIsHistoryLoading]);

    const session = useChatStore.getState().currentSessionId
        ? {
              id: useChatStore.getState().currentSessionId || "",
              name: "Current Session",
              startedAt: new Date(),
              messageCount: chat.messages.length,
          }
        : null;

    const totalTokens =
        chat.tokens.cumulative.totalInputTokens + chat.tokens.cumulative.totalOutputTokens;

    return (
        <div className="flex flex-col h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e1e2e] via-[#09090b] to-[#000000] text-white font-sans selection:bg-orange-500/30">
            {local.showWSLAlert && (
                <WSLAlert
                    onDismiss={() => local.setShowWSLAlert(false)}
                    onConfigure={callbacks.handleWSLConfigure}
                />
            )}

            <Header
                session={session}
                onNewChat={callbacks.handleNewChat}
                onToggleHistory={callbacks.handleToggleHistory}
                isHistoryOpen={isHistoryOpen}
                onOpenUsage={() => state.uiActions.openModal("usage")}
            />

            <ConversationHistory
                isOpen={isHistoryOpen}
                onClose={callbacks.handleCloseHistory}
                onConversationLoad={callbacks.handleConversationLoad}
                onConversationDelete={callbacks.handleConversationDelete}
                conversations={local.conversationList}
                isLoading={local.isHistoryLoading}
                activeConversationId={local.activeConversationId}
            />

            <ChatContainer
                messages={chat.messages.map(mapMessageToProps)}
                isProcessing={chat.isProcessing}
                todos={chat.todos}
                currentModel={settings.selectedModel}
                planMode={settings.planMode}
                thinkingMode={settings.thinkingMode}
                thinkingIntensity={settings.thinkingIntensity}
                yoloMode={settings.yoloMode}
                sessionId={useChatStore.getState().currentSessionId}
                requestStartTime={chat.requestStartTime}
                totalTokens={totalTokens}
                sessionCostUsd={chat.costs.sessionCostUsd}
                lastDurationMs={local.lastDurationMs}
                onSendMessage={callbacks.handleSendMessage}
                onStop={callbacks.handleStopProcessing}
                onModelChange={callbacks.handleModelChange}
                onPlanModeToggle={callbacks.handlePlanModeToggle}
                onThinkingModeToggle={callbacks.handleThinkingModeToggle}
                onThinkingIntensityChange={callbacks.handleThinkingIntensityChange}
                onYoloModeToggle={callbacks.handleYoloModeToggle}
                onMcpAction={callbacks.handleMcpAction}
            />

            <StatusBar
                isProcessing={chat.isProcessing}
                totalTokens={totalTokens}
                requestCount={local.requestCount}
                sessionCostUsd={chat.costs.sessionCostUsd}
                lastDurationMs={local.lastDurationMs}
                requestStartTime={chat.requestStartTime}
                subscriptionType={local.subscriptionType}
            />

            {ui.activeModal === "mcp" && (
                <MCPModal
                    isOpen={true}
                    onClose={state.uiActions.closeModal}
                    servers={callbacks.mcpServers}
                    onAddServer={callbacks.handleMcpAddServer}
                    onDeleteServer={callbacks.handleMcpDeleteServer}
                    onToggleServer={callbacks.handleMcpToggleServer}
                />
            )}

            {ui.activeModal === "model" && (
                <ModelSelectorModal
                    isOpen={true}
                    onClose={state.uiActions.closeModal}
                    selectedModel={
                        settings.selectedModel === "claude-opus-4-5-20251101"
                            ? "opus"
                            : settings.selectedModel === "claude-haiku-4-5-20251001"
                              ? "haiku"
                              : "sonnet"
                    }
                    onSelectModel={(model) => {
                        const modelMap: Record<string, string> = {
                            opus: "claude-opus-4-5-20251101",
                            sonnet: "claude-sonnet-4-5-20250929",
                            haiku: "claude-haiku-4-5-20251001",
                        };
                        callbacks.handleModelChange(
                            modelMap[model] || "claude-sonnet-4-5-20250929",
                        );
                    }}
                    onConfigure={() => state.uiActions.openModal("settings")}
                />
            )}

            {ui.activeModal === "permission" && permission.pendingPermission && (
                <PermissionModal
                    isOpen={true}
                    onClose={state.uiActions.closeModal}
                    request={{
                        id: permission.pendingPermission.requestId,
                        toolName: permission.pendingPermission.toolName,
                        description: permission.pendingPermission.description,
                        input:
                            typeof permission.pendingPermission.input === "object" &&
                            permission.pendingPermission.input !== null
                                ? (permission.pendingPermission.input as Record<string, unknown>)
                                : {},
                    }}
                    onAllow={() =>
                        callbacks.handlePermissionResponse(
                            permission.pendingPermission!.requestId,
                            "allow",
                        )
                    }
                    onDeny={() =>
                        callbacks.handlePermissionResponse(
                            permission.pendingPermission!.requestId,
                            "deny",
                        )
                    }
                    onAlwaysAllow={() =>
                        callbacks.handlePermissionResponse(
                            permission.pendingPermission!.requestId,
                            "allow",
                        )
                    }
                />
            )}

            {ui.activeModal === "install" && (
                <InstallModal isOpen={true} onClose={state.uiActions.closeModal} />
            )}

            {ui.activeModal === "usage" && (
                <UsageModal isOpen={true} onClose={state.uiActions.closeModal} />
            )}
        </div>
    );
};

export default App;
