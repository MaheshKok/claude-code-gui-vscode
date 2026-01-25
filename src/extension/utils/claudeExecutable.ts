import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

type ResolutionSource = "explicit" | "fallback";

export interface ClaudeExecutableResolution {
    executable: string;
    source: ResolutionSource;
    rawSetting?: string;
}

function pickFirstExecutable(candidates: string[]): string | undefined {
    for (const candidate of candidates) {
        try {
            fs.accessSync(candidate, fs.constants.X_OK);
            return candidate;
        } catch {
            // Ignore missing or non-executable paths
        }
    }
    return undefined;
}

export function resolveClaudeExecutable(
    config: vscode.WorkspaceConfiguration,
): ClaudeExecutableResolution {
    const inspect = config.inspect<string>("claude.executable");
    const explicitSetting =
        inspect?.workspaceFolderValue ?? inspect?.workspaceValue ?? inspect?.globalValue;
    const trimmed = typeof explicitSetting === "string" ? explicitSetting.trim() : "";

    if (trimmed) {
        return {
            executable: trimmed,
            source: "explicit",
            rawSetting: trimmed,
        };
    }

    const homeCandidate = path.join(os.homedir(), ".local", "bin", "claude");
    const platformCandidates =
        process.platform === "darwin"
            ? ["/opt/homebrew/bin/claude", "/usr/local/bin/claude"]
            : process.platform === "linux"
              ? ["/usr/local/bin/claude", "/usr/bin/claude"]
              : [];
    const resolved = pickFirstExecutable([homeCandidate, ...platformCandidates]);

    return {
        executable: resolved ?? "claude",
        source: "fallback",
        rawSetting: undefined,
    };
}
