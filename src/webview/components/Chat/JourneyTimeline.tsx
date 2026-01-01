import React, {
	useMemo,
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";
import type { Message } from "../App";
import { Message as MessageComponent } from "./Message";
import { ToolUseCard, ToolResultCard, TodoDisplay } from "../Tools";
import {
	extractTodosFromInput,
	formatDuration,
	formatTokenCount,
} from "../../utils";
import {
	Clock,
	CheckCircle2,
	XCircle,
	AlertCircle,
	PlayCircle,
	ChevronRight,
	Search,
	Bug,
	Type,
	RefreshCw,
} from "lucide-react";

interface TimelineItemMessage {
	kind: "message";
	message: Message;
}

interface TimelineItemTool {
	kind: "tool";
	id: string;
	toolUse?: Message;
	toolResult?: Message;
	timestamp: Date;
}

interface TimelinePlanGroup {
	kind: "plan";
	id: string;
	assistant: Message;
	steps: TimelineItemTool[];
	timestamp: Date;
}

type TimelineItem = TimelineItemMessage | TimelineItemTool | TimelinePlanGroup;

interface JourneyTimelineProps {
	messages: Message[];
	isProcessing: boolean;
	showEmptyState?: boolean;
}

const statusLabels: Record<string, string> = {
	executing: "Running",
	pending: "Pending",
	completed: "Completed",
	failed: "Failed",
	denied: "Denied",
};

const StatusIcon = ({
	status,
	className,
}: {
	status: string;
	className?: string;
}) => {
	switch (status) {
		case "executing":
			return (
				<PlayCircle className={`${className} text-blue-400 animate-pulse`} />
			);
		case "completed":
			return <CheckCircle2 className={`${className} text-green-400`} />;
		case "failed":
			return <XCircle className={`${className} text-red-400`} />;
		case "pending":
			return <Clock className={`${className} text-white/40`} />;
		default:
			return <AlertCircle className={`${className} text-yellow-400`} />;
	}
};

const statusClasses: Record<string, string> = {
	running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	executing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	pending: "bg-white/5 text-white/40 border-white/5",
	completed: "bg-green-500/10 text-green-400 border-green-500/20",
	failed: "bg-red-500/10 text-red-400 border-red-500/20",
	denied: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const formatTimestamp = (date: Date): string => {
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
};

const getStepStatus = (step: TimelineItemTool): string => {
	if (step.toolUse?.status) {
		return step.toolUse.status;
	}
	if (step.toolResult?.isError) {
		return "failed";
	}
	if (step.toolResult) {
		return "completed";
	}
	return "pending";
};

const getGroupStatus = (group: TimelinePlanGroup): string => {
	if (group.assistant.isStreaming) {
		return "executing";
	}
	const hasRunning = group.steps.some((step) => {
		const status = getStepStatus(step);
		return status === "executing" || status === "pending";
	});
	if (hasRunning) {
		return "executing";
	}
	const hasFailure = group.steps.some(
		(step) => getStepStatus(step) === "failed"
	);
	if (hasFailure) {
		return "failed";
	}
	return group.steps.length > 0 ? "completed" : "pending";
};

const CollapsibleReasoning = ({ content }: { content: string }) => {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="relative">
			<p
				className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
			>
				{content}
			</p>
			{content.length > 150 && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						setExpanded(!expanded);
					}}
					className="text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium"
				>
					{expanded ? "Show less" : "Show full reasoning"}
				</button>
			)}
		</div>
	);
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
	messages,
	isProcessing,
	showEmptyState = true,
}) => {
	const [collapsedPlans, setCollapsedPlans] = useState<Record<string, boolean>>(
		{}
	);
	const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>(
		{}
	);
	const bottomRef = useRef<HTMLDivElement>(null);

	const items = useMemo<TimelineItem[]>(() => {
		const timeline: TimelineItem[] = [];
		const orphanToolIndex = new Map<string, number>();
		let currentPlan: TimelinePlanGroup | null = null;
		let currentPlanSteps = new Map<string, TimelineItemTool>();
		const flushPlan = () => {
			if (currentPlan) {
				timeline.push(currentPlan);
				currentPlan = null;
				currentPlanSteps = new Map();
			}
		};

		const addToolToPlan = (message: Message) => {
			if (!currentPlan) return false;
			const stepId = message.toolUseId || message.id;
			const existing = currentPlanSteps.get(stepId);

			if (message.messageType === "tool_use") {
				if (!existing) {
					const step: TimelineItemTool = {
						kind: "tool",
						id: stepId,
						toolUse: message,
						timestamp: message.timestamp,
					};
					currentPlanSteps.set(stepId, step);
					currentPlan.steps.push(step);
				} else {
					existing.toolUse = message;
				}
				return true;
			}

			if (message.hidden) return true;

			if (!existing) {
				const step: TimelineItemTool = {
					kind: "tool",
					id: stepId,
					toolResult: message,
					timestamp: message.timestamp,
				};
				currentPlanSteps.set(stepId, step);
				currentPlan.steps.push(step);
			} else {
				existing.toolResult = message;
			}
			return true;
		};

		const addOrphanTool = (message: Message) => {
			const stepId = message.toolUseId || message.id;
			const existingIndex = orphanToolIndex.get(stepId);

			if (message.messageType === "tool_use") {
				if (existingIndex === undefined) {
					const step: TimelineItemTool = {
						kind: "tool",
						id: stepId,
						toolUse: message,
						timestamp: message.timestamp,
					};
					orphanToolIndex.set(stepId, timeline.length);
					timeline.push(step);
				} else {
					const item = timeline[existingIndex];
					if (item && item.kind === "tool") item.toolUse = message;
				}
				return;
			}

			if (message.hidden) return;

			if (existingIndex === undefined) {
				const step: TimelineItemTool = {
					kind: "tool",
					id: stepId,
					toolResult: message,
					timestamp: message.timestamp,
				};
				orphanToolIndex.set(stepId, timeline.length);
				timeline.push(step);
			} else {
				const item = timeline[existingIndex];
				if (item && item.kind === "tool") item.toolResult = message;
			}
		};

		messages.forEach((message) => {
			if (message.role === "assistant") {
				flushPlan();
				currentPlan = {
					kind: "plan",
					id: message.id,
					assistant: message,
					steps: [],
					timestamp: message.timestamp,
				};
				return;
			}
			if (
				message.role === "tool" &&
				(message.messageType === "tool_use" ||
					message.messageType === "tool_result")
			) {
				if (!addToolToPlan(message)) addOrphanTool(message);
				return;
			}
			flushPlan();
			timeline.push({ kind: "message", message });
		});
		flushPlan();
		return timeline;
	}, [messages]);

	useEffect(() => {
		if (bottomRef.current)
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
	}, [items, isProcessing]);

	const togglePlan = useCallback((id: string, isOpen: boolean) => {
		setCollapsedPlans((prev) => ({ ...prev, [id]: isOpen }));
	}, []);

	const toggleStep = useCallback((id: string, isExecuting: boolean) => {
		setCollapsedSteps((prev) => ({
			...prev,
			[id]: !(prev[id] ?? !isExecuting),
		}));
	}, []);

	const stepNumbers = useMemo(() => {
		const map = new Map<string, number>();
		let counter = 0;
		items.forEach((item) => {
			if (item.kind === "tool") {
				counter++;
				map.set(item.id, counter);
			} else if (item.kind === "plan") {
				item.steps.forEach((step) => {
					counter++;
					map.set(step.id, counter);
				});
			}
		});
		return map;
	}, [items]);

	if (items.length === 0 && showEmptyState) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative z-10">
				<div className="mb-8 relative">
					<div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
					<div className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl">
						<div className="text-orange-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="48"
								height="48"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
								<path d="M12 6v6l4 2" />
							</svg>
						</div>
					</div>
				</div>
				<h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
					How can I help?
				</h2>
				<p className="text-white/50 max-w-lg mb-10 text-lg leading-relaxed">
					I can help you analyze code, fix bugs, write tests, or implement new
					features. Just ask or use a template below.
				</p>
				<div className="grid grid-cols-2 gap-3 max-w-lg w-full">
					<QuickAction
						label="Explain Code"
						icon={<Search className="w-4 h-4" />}
					/>
					<QuickAction label="Fix Bugs" icon={<Bug className="w-4 h-4" />} />
					<QuickAction
						label="Write Tests"
						icon={<Type className="w-4 h-4" />}
					/>
					<QuickAction
						label="Refactor"
						icon={<RefreshCw className="w-4 h-4" />}
					/>
				</div>
			</div>
		);
	}

	const renderToolStep = (
		step: TimelineItemTool,
		forceExpanded: boolean = false
	) => {
		const stepNumber = stepNumbers.get(step.id);
		const status = getStepStatus(step);
		const statusLabel = statusLabels[status] || status;
		const statusClass = statusClasses[status] || statusClasses.pending;
		const toolName =
			step.toolUse?.toolName || step.toolResult?.toolName || "Tool";
		const duration = step.toolUse?.duration ?? step.toolResult?.duration;
		const tokens = step.toolUse?.tokens ?? step.toolResult?.tokens;
		const isCollapsed = forceExpanded
			? false
			: (collapsedSteps[step.id] ?? (status === "executing" ? false : true));

		return (
			<div
				key={step.id}
				className="glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/10"
			>
				<div
					className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
					onClick={() => toggleStep(step.id, status === "executing")}
				>
					<ChevronRight
						className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
					/>

					<span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/5">
						{stepNumber ? `Step ${stepNumber}` : "Step"}
					</span>

					<span className="font-medium text-sm text-white/90">{toolName}</span>

					<div className="ml-auto flex items-center gap-3">
						<span className="text-xs text-white/30 hidden sm:inline-block">
							{formatTimestamp(step.timestamp)}
						</span>

						<div className="flex items-center gap-2">
							{duration !== undefined && (
								<span className="text-xs text-white/40">
									{formatDuration(duration, { abbreviated: true })}
								</span>
							)}
							<span
								className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusClass}`}
							>
								{statusLabel}
							</span>
						</div>
					</div>
				</div>

				{!isCollapsed && (
					<div className="px-4 pb-4 space-y-4 bg-black/20 border-t border-white/5 pt-4 animate-slide-up">
						{step.toolUse && step.toolUse.toolName === "TodoWrite" ? (
							<TodoDisplay
								todos={extractTodosFromInput(step.toolUse.rawInput || {})}
								title="Todo Update"
								defaultCollapsed={false}
							/>
						) : (
							step.toolUse && (
								<ToolUseCard
									toolName={step.toolUse.toolName || "Tool"}
									input={step.toolUse.rawInput || {}}
									isExecuting={status === "executing"}
									duration={step.toolUse.duration}
									tokens={step.toolUse.tokens}
									fileContentBefore={step.toolUse.fileContentBefore}
									fileContentAfter={step.toolUse.fileContentAfter}
									startLine={step.toolUse.startLine}
									startLines={step.toolUse.startLines}
									defaultCollapsed={true}
								/>
							)
						)}

						{step.toolResult && (
							<ToolResultCard
								content={step.toolResult.content}
								isError={step.toolResult.isError}
								toolName={step.toolResult.toolName}
								duration={step.toolResult.duration}
								tokens={step.toolResult.tokens}
								defaultCollapsed={true}
							/>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="px-4 py-6 space-y-4 max-w-4xl mx-auto pb-64">
			{items.map((item) => {
				if (item.kind === "message") {
					return (
						<MessageComponent key={item.message.id} message={item.message} />
					);
				}

				if (item.kind === "tool") {
					return renderToolStep(item);
				}

				const groupStatus = getGroupStatus(item);
				const isActive = groupStatus === "executing";
				const isPlanOpen =
					collapsedPlans[item.id] === undefined
						? isActive
						: !collapsedPlans[item.id];
				const completedCount = item.steps.filter(
					(step) => getStepStatus(step) === "completed"
				).length;

				return (
					<div
						key={item.id}
						className="glass rounded-xl border border-white/10 overflow-hidden shadow-sm"
					>
						<div
							className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-500/5" : "hover:bg-white/5"}`}
							onClick={() => togglePlan(item.id, isPlanOpen)}
						>
							<ChevronRight
								className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isPlanOpen ? "rotate-90" : ""}`}
							/>

							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-white/90 truncate">
									{item.assistant.content || "Claude plan"}
								</p>
							</div>

							<div className="flex items-center gap-3 text-xs">
								<div className="flex items-center gap-1 text-white/40">
									<CheckCircle2 className="w-3 h-3" />
									<span>
										{completedCount}/{item.steps.length}
									</span>
								</div>
								<StatusIcon status={groupStatus} className="w-4 h-4" />
							</div>
						</div>

						{isPlanOpen && (
							<div className="bg-black/10 border-t border-white/5 p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
								{item.assistant.content && (
									<div className="mb-4 pb-4 border-b border-white/5">
										<CollapsibleReasoning content={item.assistant.content} />
									</div>
								)}
								{item.steps.length > 0 ? (
									item.steps.map((step) => renderToolStep(step))
								) : (
									<div className="text-center py-4 text-white/30 text-sm italic">
										Reasoning about the next step...
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}

			{isProcessing && (
				<div className="glass rounded-xl p-4 flex items-center gap-4 animate-pulse">
					<div className="flex gap-1.5">
						<div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
						<div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
						<div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
					</div>
					<span className="text-sm font-medium text-white/60">
						Claude is thinking...
					</span>
				</div>
			)}

			<div ref={bottomRef} className="h-4" />
		</div>
	);
};

interface QuickActionProps {
	label: string;
	icon: React.ReactNode;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon }) => {
	return (
		<button className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl glass hover:bg-white/10 transition-all duration-200 border border-white/10 group">
			<div className="p-2 rounded-lg bg-white/5 text-orange-500 group-hover:scale-110 transition-transform duration-200">
				{icon}
			</div>
			<span className="font-medium text-white/80 group-hover:text-white">
				{label}
			</span>
		</button>
	);
};

export default JourneyTimeline;
