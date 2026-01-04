/**
 * @module hooks/useAppCallbacks
 */

import { useCallback } from "react";
import { MessageType, ThinkingIntensity } from "../../shared/constants";
import type { ChatMessage, PermissionDecision } from "../types";
import type { UseAppStateReturn } from "./useAppState";
import type { UseVSCodeReturn } from "./useVSCode";

export interface AppCallbackDeps {
    state: UseAppStateReturn;
    vscode: UseVSCodeReturn;
}

export interface UseAppCallbacksReturn {
    handleSendMessage: (content: string, attachments?: unknown[]) => void;
    handleStopProcessing: () => void;
    handleNewChat: () => void;
    handleToggleHistory: () => void;
    handleCloseHistory: () => void;
    handleConversationLoad: (id: string) => void;
    handleConversationDelete: (id: string) => void;
    handleModelChange: (model: string) => void;
    handlePlanModeToggle: () => void;
    handleThinkingModeToggle: () => void;
    handleThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
    handleYoloModeToggle: () => void;
    handleSlashCommand: () => void;
    handleMcpAction: () => void;
    handlePermissionResponse: (requestId: string, decision: PermissionDecision) => void;
    handleWSLConfigure: () => void;
}

export function useAppCallbacks(deps: AppCallbackDeps): UseAppCallbacksReturn {
    const { state, vscode } = deps;
    const { postMessage } = vscode;

    const { chatActions, settings, settingsActions, uiActions, permission, local } = state;

    const handleSendMessage = useCallback(
        (content: string, attachments?: unknown[]) => {
            const userMessage = {
                id: `user-${Date.now()}`,
                type: MessageType.User,
                content,
                timestamp: Date.now(),
                attachments: attachments as Array<{
                    type: "file" | "image";
                    name: string;
                    path?: string;
                }>,
            };
            chatActions.addMessage(userMessage as ChatMessage);
            chatActions.setProcessing(true);
            chatActions.startRequestTiming();

            postMessage({
                type: "sendMessage",
                message: content,
                planMode: settings.planMode,
                thinkingMode: settings.thinkingMode,
                attachments: attachments as
                    | Array<{ type: "file" | "image"; path: string; name: string }>
                    | undefined,
            });
        },
        [chatActions, postMessage, settings.planMode, settings.thinkingMode],
    );

    const handleStopProcessing = useCallback(() => {
        postMessage({ type: "stopGeneration" });
        chatActions.setProcessing(false);
        local.setStreamingMessageId(null);
        chatActions.stopRequestTiming();
    }, [postMessage, chatActions, local]);

    const handleNewChat = useCallback(() => {
        chatActions.resetChat();
        local.setActiveConversationId(null);
        local.setRequestCount(0);
        local.setLastDurationMs(null);
        chatActions.clearTodos();
        postMessage({ type: "clearConversation" });
        uiActions.showSuccess("New Chat", "Started a new conversation");
    }, [chatActions, local, postMessage, uiActions]);

    const handleToggleHistory = useCallback(() => {
        local.setIsHistoryOpen((prev) => !prev);
    }, [local]);

    const handleCloseHistory = useCallback(() => {
        local.setIsHistoryOpen(false);
    }, [local]);

    const handleConversationLoad = useCallback(
        (id: string) => {
            postMessage({ type: "loadConversation", filename: id });
            local.setActiveConversationId(id);
            uiActions.showSuccess("Conversation Loaded", "Previous conversation restored");
        },
        [postMessage, local, uiActions],
    );

    const handleConversationDelete = useCallback(
        (id: string) => {
            postMessage({ type: "deleteConversation", filename: id });
        },
        [postMessage],
    );

    const handleModelChange = useCallback(
        (model: string) => {
            const typedModel = model as Parameters<typeof settingsActions.setSelectedModel>[0];
            settingsActions.setSelectedModel(typedModel);
            postMessage({
                type: "saveSettings",
                settings: {
                    selectedModel: typedModel,
                } as Record<string, unknown>,
            });
        },
        [settingsActions, postMessage],
    );

    const handlePlanModeToggle = useCallback(() => {
        settingsActions.togglePlanMode();
    }, [settingsActions]);

    const handleThinkingModeToggle = useCallback(() => {
        settingsActions.toggleThinkingMode();
    }, [settingsActions]);

    const handleThinkingIntensityChange = useCallback(
        (intensity: ThinkingIntensity) => {
            settingsActions.setThinkingIntensity(intensity);
        },
        [settingsActions],
    );

    const handleYoloModeToggle = useCallback(() => {
        const newYoloMode = !settings.yoloMode;
        settingsActions.toggleYoloMode();
        postMessage({
            type: "saveSettings",
            settings: { yoloMode: newYoloMode } as Record<string, unknown>,
        });
    }, [settingsActions, settings.yoloMode, postMessage]);

    const handleSlashCommand = useCallback(() => {
        uiActions.openModal("keyboard-shortcuts");
    }, [uiActions]);

    const handleMcpAction = useCallback(() => {
        uiActions.openModal("mcp");
    }, [uiActions]);

    const handlePermissionResponse = useCallback(
        (requestId: string, decision: PermissionDecision) => {
            permission.resolvePending(requestId, decision);
            postMessage({
                type: "permissionResponse",
                requestId,
                decision,
            });
            uiActions.closeModal();
        },
        [permission, postMessage, uiActions],
    );

    const handleWSLConfigure = useCallback(() => {
        uiActions.openModal("settings");
        local.setShowWSLAlert(false);
    }, [uiActions, local]);

    return {
        handleSendMessage,
        handleStopProcessing,
        handleNewChat,
        handleToggleHistory,
        handleCloseHistory,
        handleConversationLoad,
        handleConversationDelete,
        handleModelChange,
        handlePlanModeToggle,
        handleThinkingModeToggle,
        handleThinkingIntensityChange,
        handleYoloModeToggle,
        handleSlashCommand,
        handleMcpAction,
        handlePermissionResponse,
        handleWSLConfigure,
    };
}
