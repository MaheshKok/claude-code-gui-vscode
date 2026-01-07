/**
 * @module hooks/useAppCallbacks
 */

import { useCallback } from "react";
import { MessageType, ThinkingIntensity } from "../../shared/constants";
import type { ChatMessage, PermissionDecision } from "../types";
import type { UseAppStateReturn } from "./useAppState";
import type { UseVSCodeReturn } from "./useVSCode";
import { useMCPStore, type MCPServerConfig } from "../stores/mcpStore";
import type { MCPServer } from "../components/Modals/MCPModal";

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
    handleMcpAction: () => void;
    handlePermissionResponse: (requestId: string, decision: PermissionDecision) => void;
    handleWSLConfigure: () => void;
    // MCP callbacks
    mcpServers: MCPServer[];
    handleMcpAddServer: (server: Omit<MCPServer, "id">) => void;
    handleMcpDeleteServer: (id: string) => void;
    handleMcpToggleServer: (id: string, enabled: boolean) => void;
    handleMcpLoadServers: () => void;
}

export function useAppCallbacks(deps: AppCallbackDeps): UseAppCallbacksReturn {
    const { state, vscode } = deps;
    const { postMessage } = vscode;

    const { chatActions, settings, settingsActions, uiActions, permission, local } = state;

    const handleSendMessage = useCallback(
        (content: string, attachments?: unknown[]) => {
            chatActions.clearTodos();
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
        const newPlanMode = !settings.planMode;
        settingsActions.togglePlanMode();
        postMessage({
            type: "saveSettings",
            settings: { planMode: newPlanMode } as Record<string, unknown>,
        });
    }, [settingsActions, settings.planMode, postMessage]);

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

    const handleMcpAction = useCallback(() => {
        // Load MCP servers when opening the modal
        postMessage({ type: "loadMCPServers" });
        uiActions.openModal("mcp");
    }, [uiActions, postMessage]);

    // MCP store state and actions
    const mcpStoreServers = useMCPStore((s) => s.servers);
    const addMcpServer = useMCPStore((s) => s.addServer);
    const deleteMcpServer = useMCPStore((s) => s.deleteServer);
    const toggleMcpServer = useMCPStore((s) => s.toggleServer);

    // Convert MCP store servers to the format expected by MCPModal
    const mcpServers: MCPServer[] = mcpStoreServers.map((s) => ({
        id: s.config.id,
        name: s.config.name,
        type: s.config.type ?? "stdio",
        enabled: s.config.enabled,
        command: s.config.command,
        args: s.config.args,
        env: s.config.env,
        url: s.config.url,
        headers: s.config.headers,
    }));

    const handleMcpLoadServers = useCallback(() => {
        postMessage({ type: "loadMCPServers" });
    }, [postMessage]);

    const handleMcpAddServer = useCallback(
        (server: Omit<MCPServer, "id">) => {
            // Use server name as ID for consistency with extension storage
            const id = server.name;
            const config: MCPServerConfig = {
                id,
                name: server.name,
                type: server.type,
                command: server.command,
                args: server.args,
                env: server.env,
                url: server.url,
                headers: server.headers,
                enabled: server.enabled,
            };
            addMcpServer(config);

            // Save to extension
            postMessage({
                type: "saveMCPServer",
                name: server.name,
                config: {
                    type: server.type,
                    command: server.command,
                    args: server.args,
                    env: server.env,
                    url: server.url,
                    headers: server.headers,
                },
            });

            uiActions.showSuccess("MCP Server Added", `Added server: ${server.name}`);
        },
        [addMcpServer, postMessage, uiActions],
    );

    const handleMcpDeleteServer = useCallback(
        (id: string) => {
            const server = mcpStoreServers.find((s) => s.config.id === id);
            if (server) {
                deleteMcpServer(id);
                postMessage({
                    type: "deleteMCPServer",
                    name: server.config.name,
                });
                uiActions.showSuccess(
                    "MCP Server Deleted",
                    `Removed server: ${server.config.name}`,
                );
            }
        },
        [deleteMcpServer, mcpStoreServers, postMessage, uiActions],
    );

    const handleMcpToggleServer = useCallback(
        (id: string, _enabled: boolean) => {
            toggleMcpServer(id);
            const server = mcpStoreServers.find((s) => s.config.id === id);
            if (server) {
                // The toggle already happened, so the new state is the opposite of what we received
                const newEnabled = !server.config.enabled;
                uiActions.showSuccess(
                    "MCP Server Updated",
                    `${server.config.name} is now ${newEnabled ? "enabled" : "disabled"}`,
                );
            }
        },
        [toggleMcpServer, mcpStoreServers, uiActions],
    );

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
        handleMcpAction,
        handlePermissionResponse,
        handleWSLConfigure,
        // MCP callbacks
        mcpServers,
        handleMcpAddServer,
        handleMcpDeleteServer,
        handleMcpToggleServer,
        handleMcpLoadServers,
    };
}
