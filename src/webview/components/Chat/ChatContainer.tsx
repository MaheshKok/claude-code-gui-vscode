import React from "react";
import { MessageInput } from "./MessageInput";
import type { Message } from "../App";
import { TodoDisplay } from "../Tools";
import { JourneyTimeline } from "./JourneyTimeline";
import type { TodoItem } from "../Tools";

/** Thinking intensity levels matching Claude Code CLI */
type ThinkingIntensity = "think" | "think-hard" | "think-harder" | "ultrathink";

interface ChatContainerProps {
	messages: Message[];
	isProcessing: boolean;
	todos: TodoItem[];
	currentModel: string;
	planMode: boolean;
	thinkingMode: boolean;
	thinkingIntensity: ThinkingIntensity;
	yoloMode: boolean;
	onSendMessage: (content: string) => void;
	onModelChange: (model: string) => void;
	onPlanModeToggle: () => void;
	onThinkingModeToggle: () => void;
	onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
	onYoloModeToggle: () => void;
	onFileSelect: () => void;
	onImageSelect: () => void;
	onSlashCommand: () => void;
	onMcpAction: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
	messages,
	isProcessing,
	todos,
	currentModel,
	planMode,
	thinkingMode,
	thinkingIntensity,
	yoloMode,
	onSendMessage,
	onModelChange,
	onPlanModeToggle,
	onThinkingModeToggle,
	onThinkingIntensityChange,
	onYoloModeToggle,
	onFileSelect,
	onImageSelect,
	onSlashCommand,
	onMcpAction,
}) => {
	const showEmptyState = messages.length === 0;

	return (
		<div className="flex flex-col flex-1 overflow-hidden relative">
			<div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
				<div className="flex-1 overflow-y-auto scroll-smooth">
					<JourneyTimeline
						messages={messages}
						isProcessing={isProcessing}
						showEmptyState={showEmptyState}
					/>
				</div>

				{/* Modernized Sidebar */}
				<aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/20 backdrop-blur-md overflow-y-auto">
					<div className="p-4 lg:p-6 mb-20 lg:mb-0">
						{todos.length > 0 ? (
							<TodoDisplay
								todos={todos}
								title="Tasks"
								defaultCollapsed={false}
							/>
						) : (
							<div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center">
								<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center text-white/20">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
										<path d="m9 12 2 2 4-4" />
									</svg>
								</div>
								<p className="text-sm text-white/40 font-medium">
									No active plan
								</p>
								<p className="text-xs text-white/30 mt-1">
									Tasks will appear here as Claude works.
								</p>
							</div>
						)}
					</div>
				</aside>
			</div>

			<div className="absolute bottom-0 left-0 right-0 z-40 p-4 lg:p-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
				<div className="pointer-events-auto max-w-4xl mx-auto">
					<MessageInput
						disabled={isProcessing}
						currentModel={currentModel}
						planMode={planMode}
						thinkingMode={thinkingMode}
						thinkingIntensity={thinkingIntensity}
						yoloMode={yoloMode}
						onSendMessage={onSendMessage}
						onModelChange={onModelChange}
						onPlanModeToggle={onPlanModeToggle}
						onThinkingModeToggle={onThinkingModeToggle}
						onThinkingIntensityChange={onThinkingIntensityChange}
						onYoloModeToggle={onYoloModeToggle}
						onFileSelect={onFileSelect}
						onImageSelect={onImageSelect}
						onSlashCommand={onSlashCommand}
						onMcpAction={onMcpAction}
					/>
				</div>
			</div>
		</div>
	);
};

export default ChatContainer;
