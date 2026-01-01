import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../../webview/components/Header/Header";

describe("Header", () => {
  it("renders the progress summary ribbon", () => {
    render(
      <Header
        session={null}
        onNewChat={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleHistory={vi.fn()}
        isHistoryOpen={false}
        summary={{
          totalTokens: 1234,
          sessionCostUsd: 0.12,
          subscriptionType: null,
          todoStats: {
            total: 4,
            completed: 2,
            inProgress: 1,
            pending: 1,
          },
        }}
      />,
    );

    // The header displays tokens count
    expect(screen.getByText(/tokens/i)).toBeInTheDocument();
    // The header shows todo stats in format "X/Y tasks"
    expect(screen.getByText(/2\/4 tasks/)).toBeInTheDocument();
  });
});
