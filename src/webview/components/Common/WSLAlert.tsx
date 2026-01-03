import React, { memo } from "react";
import { X } from "lucide-react";

interface WSLAlertProps {
    onDismiss: () => void;
    onConfigure: () => void;
}

/**
 * Alert banner shown to Windows users when WSL is not configured.
 * Prompts users to configure WSL for better compatibility.
 */
export const WSLAlert: React.FC<WSLAlertProps> = memo(({ onDismiss, onConfigure }) => (
    <div
        className="flex items-center justify-between px-4 py-2 text-sm"
        style={{
            backgroundColor: "var(--vscode-inputValidation-warningBackground)",
            borderBottom: "1px solid var(--vscode-inputValidation-warningBorder)",
        }}
        role="alert"
    >
        <span>
            Running on Windows without WSL configured. Some features may not work correctly.
        </span>
        <div className="flex gap-2">
            <button onClick={onConfigure} className="btn btn-secondary text-xs" type="button">
                Configure WSL
            </button>
            <button onClick={onDismiss} className="btn-icon" aria-label="Dismiss" type="button">
                <X className="w-4 h-4" />
            </button>
        </div>
    </div>
));

WSLAlert.displayName = "WSLAlert";

export default WSLAlert;
