import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useUIStore } from "../../webview/stores/uiStore";

describe("uiStore", () => {
    beforeEach(() => {
        // Reset the store before each test
        useUIStore.setState({
            activeModal: null,
            modalProps: {},
            sidebarOpen: true,
            sidebarWidth: 280,
            connectionStatus: "disconnected",
            connectionError: null,
            draftMessage: "",
            notifications: [],
            maxVisibleNotifications: 5,
            inputFocused: false,
            isFullscreen: false,
            breakpoint: "lg",
        });
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("initial state", () => {
        it("should have correct default values", () => {
            const state = useUIStore.getState();
            expect(state.activeModal).toBeNull();
            expect(state.sidebarOpen).toBe(true);
            expect(state.sidebarWidth).toBe(280);
            expect(state.connectionStatus).toBe("disconnected");
            expect(state.draftMessage).toBe("");
            expect(state.notifications).toEqual([]);
        });
    });

    describe("modal actions", () => {
        it("should open a modal", () => {
            useUIStore.getState().openModal("settings");
            expect(useUIStore.getState().activeModal).toBe("settings");
        });

        it("should open a modal with props", () => {
            useUIStore.getState().openModal("confirm", { message: "Are you sure?" });
            const state = useUIStore.getState();
            expect(state.activeModal).toBe("confirm");
            expect(state.modalProps).toEqual({ message: "Are you sure?" });
        });

        it("should close a modal", () => {
            useUIStore.getState().openModal("settings");
            useUIStore.getState().closeModal();
            const state = useUIStore.getState();
            expect(state.activeModal).toBeNull();
            expect(state.modalProps).toEqual({});
        });
    });

    describe("sidebar actions", () => {
        it("should toggle sidebar", () => {
            expect(useUIStore.getState().sidebarOpen).toBe(true);
            useUIStore.getState().toggleSidebar();
            expect(useUIStore.getState().sidebarOpen).toBe(false);
            useUIStore.getState().toggleSidebar();
            expect(useUIStore.getState().sidebarOpen).toBe(true);
        });

        it("should set sidebar open state", () => {
            useUIStore.getState().setSidebarOpen(false);
            expect(useUIStore.getState().sidebarOpen).toBe(false);
            useUIStore.getState().setSidebarOpen(true);
            expect(useUIStore.getState().sidebarOpen).toBe(true);
        });

        it("should set sidebar width with min constraint", () => {
            useUIStore.getState().setSidebarWidth(100);
            expect(useUIStore.getState().sidebarWidth).toBe(200); // min is 200
        });

        it("should set sidebar width with max constraint", () => {
            useUIStore.getState().setSidebarWidth(600);
            expect(useUIStore.getState().sidebarWidth).toBe(500); // max is 500
        });

        it("should set sidebar width within valid range", () => {
            useUIStore.getState().setSidebarWidth(350);
            expect(useUIStore.getState().sidebarWidth).toBe(350);
        });
    });

    describe("connection status", () => {
        it("should set connection status", () => {
            useUIStore.getState().setConnectionStatus("connected");
            expect(useUIStore.getState().connectionStatus).toBe("connected");
        });

        it("should set connection status with error", () => {
            useUIStore.getState().setConnectionStatus("error", "Connection failed");
            const state = useUIStore.getState();
            expect(state.connectionStatus).toBe("error");
            expect(state.connectionError).toBe("Connection failed");
        });

        it("should clear error when status changes without error", () => {
            useUIStore.getState().setConnectionStatus("error", "Some error");
            useUIStore.getState().setConnectionStatus("connecting");
            expect(useUIStore.getState().connectionError).toBeNull();
        });
    });

    describe("draft message", () => {
        it("should set draft message", () => {
            useUIStore.getState().setDraftMessage("Hello world");
            expect(useUIStore.getState().draftMessage).toBe("Hello world");
        });

        it("should clear draft message", () => {
            useUIStore.getState().setDraftMessage("Hello world");
            useUIStore.getState().clearDraftMessage();
            expect(useUIStore.getState().draftMessage).toBe("");
        });
    });

    describe("notifications", () => {
        it("should add a notification", () => {
            const id = useUIStore.getState().addNotification({
                type: "info",
                title: "Test",
                message: "Test message",
                timeout: 0,
            });
            expect(id).toBeDefined();
            const notifications = useUIStore.getState().notifications;
            expect(notifications.length).toBe(1);
            expect(notifications[0].title).toBe("Test");
        });

        it("should remove a notification", () => {
            const id = useUIStore.getState().addNotification({
                type: "info",
                title: "Test",
                timeout: 0,
            });
            useUIStore.getState().removeNotification(id);
            expect(useUIStore.getState().notifications.length).toBe(0);
        });

        it("should clear all notifications", () => {
            useUIStore.getState().addNotification({ type: "info", title: "Test 1", timeout: 0 });
            useUIStore.getState().addNotification({ type: "info", title: "Test 2", timeout: 0 });
            useUIStore.getState().clearNotifications();
            expect(useUIStore.getState().notifications.length).toBe(0);
        });

        it("should limit notifications to max visible", () => {
            for (let i = 0; i < 7; i++) {
                useUIStore.getState().addNotification({
                    type: "info",
                    title: `Test ${i}`,
                    timeout: 0,
                });
            }
            expect(useUIStore.getState().notifications.length).toBe(5);
        });

        it("should auto-dismiss notification after timeout", () => {
            vi.useFakeTimers();
            useUIStore.getState().addNotification({
                type: "info",
                title: "Auto dismiss",
                timeout: 1000,
            });
            expect(useUIStore.getState().notifications.length).toBe(1);
            vi.advanceTimersByTime(1100);
            expect(useUIStore.getState().notifications.length).toBe(0);
            vi.useRealTimers();
        });
    });

    describe("helper notification methods", () => {
        it("should show info notification", () => {
            useUIStore.getState().showInfo("Info", "Info message");
            const notification = useUIStore.getState().notifications[0];
            expect(notification.type).toBe("info");
            expect(notification.title).toBe("Info");
        });

        it("should show success notification", () => {
            useUIStore.getState().showSuccess("Success", "Success message");
            const notification = useUIStore.getState().notifications[0];
            expect(notification.type).toBe("success");
        });

        it("should show warning notification", () => {
            useUIStore.getState().showWarning("Warning", "Warning message");
            const notification = useUIStore.getState().notifications[0];
            expect(notification.type).toBe("warning");
        });

        it("should show error notification", () => {
            useUIStore.getState().showError("Error", "Error message");
            const notification = useUIStore.getState().notifications[0];
            expect(notification.type).toBe("error");
        });
    });

    describe("other UI state", () => {
        it("should set input focused state", () => {
            useUIStore.getState().setInputFocused(true);
            expect(useUIStore.getState().inputFocused).toBe(true);
            useUIStore.getState().setInputFocused(false);
            expect(useUIStore.getState().inputFocused).toBe(false);
        });

        it("should toggle fullscreen", () => {
            expect(useUIStore.getState().isFullscreen).toBe(false);
            useUIStore.getState().toggleFullscreen();
            expect(useUIStore.getState().isFullscreen).toBe(true);
            useUIStore.getState().toggleFullscreen();
            expect(useUIStore.getState().isFullscreen).toBe(false);
        });

        it("should set breakpoint", () => {
            useUIStore.getState().setBreakpoint("sm");
            expect(useUIStore.getState().breakpoint).toBe("sm");
            useUIStore.getState().setBreakpoint("xl");
            expect(useUIStore.getState().breakpoint).toBe("xl");
        });
    });
});
