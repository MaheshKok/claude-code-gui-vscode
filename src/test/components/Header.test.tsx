import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../../webview/components/Header/Header";

describe("Header", () => {
  const defaultProps = {
    session: null,
    onNewChat: vi.fn(),
    onOpenSettings: vi.fn(),
    onToggleHistory: vi.fn(),
    isHistoryOpen: false,
  };

  it("renders the header with app name", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
  });

  it("renders the New Chat button", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByTitle("New Chat")).toBeInTheDocument();
  });

  it("renders the Settings button", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
  });

  it("renders the History button with correct title when closed", () => {
    render(<Header {...defaultProps} isHistoryOpen={false} />);
    expect(screen.getByTitle("Chat History")).toBeInTheDocument();
  });

  it("renders the History button with correct title when open", () => {
    render(<Header {...defaultProps} isHistoryOpen={true} />);
    expect(screen.getByTitle("Close History")).toBeInTheDocument();
  });

  it("displays session name when session is provided", () => {
    render(
      <Header
        {...defaultProps}
        session={{ id: "test-id", name: "Test Session" }}
      />,
    );
    expect(screen.getByText("Test Session")).toBeInTheDocument();
  });

  it("calls onNewChat when New Chat button is clicked", () => {
    const onNewChat = vi.fn();
    render(<Header {...defaultProps} onNewChat={onNewChat} />);
    fireEvent.click(screen.getByTitle("New Chat"));
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenSettings when Settings button is clicked", () => {
    const onOpenSettings = vi.fn();
    render(<Header {...defaultProps} onOpenSettings={onOpenSettings} />);
    fireEvent.click(screen.getByTitle("Settings"));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleHistory when History button is clicked", () => {
    const onToggleHistory = vi.fn();
    render(<Header {...defaultProps} onToggleHistory={onToggleHistory} />);
    fireEvent.click(screen.getByTitle("Chat History"));
    expect(onToggleHistory).toHaveBeenCalledTimes(1);
  });
});
