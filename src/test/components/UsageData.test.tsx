import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageData } from "../../webview/components/UsageData";
import { useUsageStore } from "../../webview/stores/usageStore";
import type { UsageData as UsageDataType } from "../../shared/types/usage";

describe("UsageData", () => {
    beforeEach(() => {
        // Reset the store before each test
        useUsageStore.setState({
            data: null,
            isVisible: false,
        });
    });

    it("should show loading state when data is null", () => {
        useUsageStore.setState({ data: null });
        render(<UsageData />);
        expect(screen.getByText("Loading usage data...")).toBeInTheDocument();
    });

    describe("with valid data", () => {
        const mockData: UsageDataType = {
            currentSession: {
                usageCost: 0.5,
                costLimit: 1,
                resetsIn: "2 hr 30 min",
            },
            weekly: {
                costLikely: 0.25,
                costLimit: 1,
                resetsAt: "Thu 5:00 PM",
            },
        };

        beforeEach(() => {
            useUsageStore.setState({ data: mockData });
        });

        it("should render the title", () => {
            render(<UsageData />);
            expect(screen.getByText("Plan usage limits")).toBeInTheDocument();
        });

        it("should display current session usage", () => {
            render(<UsageData />);
            expect(screen.getByText("Current session")).toBeInTheDocument();
            expect(screen.getByText("50% used")).toBeInTheDocument();
        });

        it("should display session reset time", () => {
            render(<UsageData />);
            expect(screen.getByText("Resets in 2 hr 30 min")).toBeInTheDocument();
        });

        it("should display weekly limits section", () => {
            render(<UsageData />);
            expect(screen.getByText("Weekly limits")).toBeInTheDocument();
        });

        it("should display all models usage", () => {
            render(<UsageData />);
            expect(screen.getByText("All models")).toBeInTheDocument();
            expect(screen.getByText("25% used")).toBeInTheDocument();
        });

        it("should display weekly reset time", () => {
            render(<UsageData />);
            expect(screen.getByText("Resets Thu 5:00 PM")).toBeInTheDocument();
        });

        it("should display learn more link", () => {
            render(<UsageData />);
            expect(screen.getByText("Learn more about usage limits")).toBeInTheDocument();
        });
    });

    describe("with sonnet limits", () => {
        const mockDataWithSonnet: UsageDataType = {
            currentSession: {
                usageCost: 0.6,
                costLimit: 1,
                resetsIn: "1 hr 45 min",
            },
            weekly: {
                costLikely: 0.4,
                costLimit: 1,
                resetsAt: "Fri 9:00 AM",
            },
            sonnet: {
                usage: 0.3,
                limit: 1,
                resetsAt: "Fri 9:00 AM",
            },
        };

        beforeEach(() => {
            useUsageStore.setState({ data: mockDataWithSonnet });
        });

        it("should display sonnet usage when available", () => {
            render(<UsageData />);
            expect(screen.getByText("Sonnet only")).toBeInTheDocument();
            expect(screen.getByText("30% used")).toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("should handle 0% usage", () => {
            useUsageStore.setState({
                data: {
                    currentSession: {
                        usageCost: 0,
                        costLimit: 1,
                        resetsIn: "5 hr 0 min",
                    },
                    weekly: {
                        costLikely: 0,
                        costLimit: 1,
                        resetsAt: "Mon 12:00 AM",
                    },
                },
            });

            render(<UsageData />);
            // Both session and weekly will show 0% used
            const zeroUsageElements = screen.getAllByText("0% used");
            expect(zeroUsageElements.length).toBe(2);
        });

        it("should handle 100% usage", () => {
            useUsageStore.setState({
                data: {
                    currentSession: {
                        usageCost: 1,
                        costLimit: 1,
                        resetsIn: "0 min",
                    },
                    weekly: {
                        costLikely: 0.5,
                        costLimit: 1,
                        resetsAt: "Wed 3:00 PM",
                    },
                },
            });

            render(<UsageData />);
            // Session shows 100%, weekly shows 50%
            expect(screen.getByText("100% used")).toBeInTheDocument();
            expect(screen.getByText("50% used")).toBeInTheDocument();
        });

        it("should handle high percentage values", () => {
            useUsageStore.setState({
                data: {
                    currentSession: {
                        usageCost: 0.999,
                        costLimit: 1,
                        resetsIn: "5 min",
                    },
                    weekly: {
                        costLikely: 0.5,
                        costLimit: 1,
                        resetsAt: "Thu 2:00 PM",
                    },
                },
            });

            render(<UsageData />);
            // Math.round(99.9) = 100
            expect(screen.getByText("100% used")).toBeInTheDocument();
        });
    });

    describe("progress bar rendering", () => {
        it("should render progress bars with correct widths", () => {
            useUsageStore.setState({
                data: {
                    currentSession: {
                        usageCost: 0.5,
                        costLimit: 1,
                        resetsIn: "2 hr",
                    },
                    weekly: {
                        costLikely: 0.25,
                        costLimit: 1,
                        resetsAt: "Thu 5 PM",
                    },
                },
            });

            const { container } = render(<UsageData />);

            // Find progress bar elements (the filled portion)
            const progressBars = container.querySelectorAll(
                '[class*="rounded-full"][class*="h-full"]',
            );
            expect(progressBars.length).toBeGreaterThan(0);
        });
    });
});
