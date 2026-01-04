/**
 * @module hooks/useAppState
 */

import { useState } from "react";
import {
    useChatStore,
    useSettingsStore,
    useUIStore,
    usePermissionStore,
    useConversationStore,
    useMCPStore,
    selectActiveModal,
    selectIsConnected,
    selectFirstPending,
    selectWSL,
} from "../stores";
import type { ConversationListItem } from "../types/history";

export interface ChatStoreState {
    messages: ReturnType<typeof useChatStore.getState>["messages"];
    isProcessing: boolean;
    todos: ReturnType<typeof useChatStore.getState>["todos"];
    tokens: ReturnType<typeof useChatStore.getState>["tokens"];
    costs: ReturnType<typeof useChatStore.getState>["costs"];
    requestStartTime: number | null;
}

export interface ChatStoreActions {
    addMessage: ReturnType<typeof useChatStore.getState>["addMessage"];
    updateMessage: ReturnType<typeof useChatStore.getState>["updateMessage"];
    setProcessing: ReturnType<typeof useChatStore.getState>["setProcessing"];
    setSessionId: ReturnType<typeof useChatStore.getState>["setSessionId"];
    setTodos: ReturnType<typeof useChatStore.getState>["setTodos"];
    clearTodos: ReturnType<typeof useChatStore.getState>["clearTodos"];
    updateTokens: ReturnType<typeof useChatStore.getState>["updateTokens"];
    updateSessionCost: ReturnType<typeof useChatStore.getState>["updateSessionCost"];
    resetTokenTracking: ReturnType<typeof useChatStore.getState>["resetTokenTracking"];
    startRequestTiming: ReturnType<typeof useChatStore.getState>["startRequestTiming"];
    stopRequestTiming: ReturnType<typeof useChatStore.getState>["stopRequestTiming"];
    hydrateConversation: ReturnType<typeof useChatStore.getState>["hydrateConversation"];
    resetChat: ReturnType<typeof useChatStore.getState>["resetChat"];
}

export interface SettingsStoreState {
    selectedModel: ReturnType<typeof useSettingsStore.getState>["selectedModel"];
    thinkingMode: boolean;
    thinkingIntensity: ReturnType<typeof useSettingsStore.getState>["thinkingIntensity"];
    planMode: boolean;
    yoloMode: boolean;
    wsl: { enabled: boolean; distro: string };
}

export interface SettingsStoreActions {
    setSelectedModel: ReturnType<typeof useSettingsStore.getState>["setSelectedModel"];
    toggleThinkingMode: ReturnType<typeof useSettingsStore.getState>["toggleThinkingMode"];
    setThinkingIntensity: ReturnType<typeof useSettingsStore.getState>["setThinkingIntensity"];
    togglePlanMode: ReturnType<typeof useSettingsStore.getState>["togglePlanMode"];
    toggleYoloMode: ReturnType<typeof useSettingsStore.getState>["toggleYoloMode"];
    loadFromVSCode: ReturnType<typeof useSettingsStore.getState>["loadFromVSCode"];
}

export interface UIStoreState {
    activeModal: ReturnType<typeof selectActiveModal>;
    isConnected: boolean;
}

export interface UIStoreActions {
    openModal: ReturnType<typeof useUIStore.getState>["openModal"];
    closeModal: ReturnType<typeof useUIStore.getState>["closeModal"];
    setConnectionStatus: ReturnType<typeof useUIStore.getState>["setConnectionStatus"];
    showError: ReturnType<typeof useUIStore.getState>["showError"];
    showSuccess: ReturnType<typeof useUIStore.getState>["showSuccess"];
}

export interface PermissionStoreSlice {
    pendingPermission: ReturnType<typeof selectFirstPending>;
    addPending: ReturnType<typeof usePermissionStore.getState>["addPending"];
    resolvePending: ReturnType<typeof usePermissionStore.getState>["resolvePending"];
}

export interface LocalState {
    showWSLAlert: boolean;
    setShowWSLAlert: React.Dispatch<React.SetStateAction<boolean>>;
    streamingMessageId: string | null;
    setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
    isHistoryOpen: boolean;
    setIsHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    conversationList: ConversationListItem[];
    setConversationList: React.Dispatch<React.SetStateAction<ConversationListItem[]>>;
    isHistoryLoading: boolean;
    setIsHistoryLoading: React.Dispatch<React.SetStateAction<boolean>>;
    activeConversationId: string | null;
    setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
    subscriptionType: string | null;
    setSubscriptionType: React.Dispatch<React.SetStateAction<string | null>>;
    requestCount: number;
    setRequestCount: React.Dispatch<React.SetStateAction<number>>;
    lastDurationMs: number | null;
    setLastDurationMs: React.Dispatch<React.SetStateAction<number | null>>;
}

export interface UseAppStateReturn {
    chat: ChatStoreState;
    chatActions: ChatStoreActions;
    settings: SettingsStoreState;
    settingsActions: SettingsStoreActions;
    ui: UIStoreState;
    uiActions: UIStoreActions;
    permission: PermissionStoreSlice;
    local: LocalState;
}

export function useAppState(): UseAppStateReturn {
    const messages = useChatStore((s) => s.messages);
    const isProcessing = useChatStore((s) => s.isProcessing);
    const todos = useChatStore((s) => s.todos);
    const tokens = useChatStore((s) => s.tokens);
    const costs = useChatStore((s) => s.costs);
    const requestStartTime = useChatStore((s) => s.requestStartTime);

    const addMessage = useChatStore((s) => s.addMessage);
    const updateMessage = useChatStore((s) => s.updateMessage);
    const setProcessing = useChatStore((s) => s.setProcessing);
    const setSessionId = useChatStore((s) => s.setSessionId);
    const setTodos = useChatStore((s) => s.setTodos);
    const clearTodos = useChatStore((s) => s.clearTodos);
    const updateTokens = useChatStore((s) => s.updateTokens);
    const updateSessionCost = useChatStore((s) => s.updateSessionCost);
    const resetTokenTracking = useChatStore((s) => s.resetTokenTracking);
    const startRequestTiming = useChatStore((s) => s.startRequestTiming);
    const stopRequestTiming = useChatStore((s) => s.stopRequestTiming);
    const hydrateConversation = useChatStore((s) => s.hydrateConversation);
    const resetChat = useChatStore((s) => s.resetChat);

    const selectedModel = useSettingsStore((s) => s.selectedModel);
    const thinkingMode = useSettingsStore((s) => s.thinkingMode);
    const thinkingIntensity = useSettingsStore((s) => s.thinkingIntensity);
    const planMode = useSettingsStore((s) => s.planMode);
    const yoloMode = useSettingsStore((s) => s.yoloMode);
    const wsl = useSettingsStore(selectWSL);

    const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);
    const toggleThinkingMode = useSettingsStore((s) => s.toggleThinkingMode);
    const setThinkingIntensity = useSettingsStore((s) => s.setThinkingIntensity);
    const togglePlanMode = useSettingsStore((s) => s.togglePlanMode);
    const toggleYoloMode = useSettingsStore((s) => s.toggleYoloMode);
    const loadFromVSCode = useSettingsStore((s) => s.loadFromVSCode);

    const activeModal = useUIStore(selectActiveModal);
    const isConnected = useUIStore(selectIsConnected);

    const openModal = useUIStore((s) => s.openModal);
    const closeModal = useUIStore((s) => s.closeModal);
    const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
    const showError = useUIStore((s) => s.showError);
    const showSuccess = useUIStore((s) => s.showSuccess);

    const pendingPermission = usePermissionStore(selectFirstPending);
    const addPending = usePermissionStore((s) => s.addPending);
    const resolvePending = usePermissionStore((s) => s.resolvePending);

    useMCPStore((s) => s.setServerStatus);
    useConversationStore((s) => s.setCurrentConversation);

    const [showWSLAlert, setShowWSLAlert] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationList, setConversationList] = useState<ConversationListItem[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
    const [requestCount, setRequestCount] = useState(0);
    const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

    return {
        chat: {
            messages,
            isProcessing,
            todos,
            tokens,
            costs,
            requestStartTime,
        },
        chatActions: {
            addMessage,
            updateMessage,
            setProcessing,
            setSessionId,
            setTodos,
            clearTodos,
            updateTokens,
            updateSessionCost,
            resetTokenTracking,
            startRequestTiming,
            stopRequestTiming,
            hydrateConversation,
            resetChat,
        },
        settings: {
            selectedModel,
            thinkingMode,
            thinkingIntensity,
            planMode,
            yoloMode,
            wsl,
        },
        settingsActions: {
            setSelectedModel,
            toggleThinkingMode,
            setThinkingIntensity,
            togglePlanMode,
            toggleYoloMode,
            loadFromVSCode,
        },
        ui: {
            activeModal,
            isConnected,
        },
        uiActions: {
            openModal,
            closeModal,
            setConnectionStatus,
            showError,
            showSuccess,
        },
        permission: {
            pendingPermission,
            addPending,
            resolvePending,
        },
        local: {
            showWSLAlert,
            setShowWSLAlert,
            streamingMessageId,
            setStreamingMessageId,
            isHistoryOpen,
            setIsHistoryOpen,
            conversationList,
            setConversationList,
            isHistoryLoading,
            setIsHistoryLoading,
            activeConversationId,
            setActiveConversationId,
            subscriptionType,
            setSubscriptionType,
            requestCount,
            setRequestCount,
            lastDurationMs,
            setLastDurationMs,
        },
    };
}
