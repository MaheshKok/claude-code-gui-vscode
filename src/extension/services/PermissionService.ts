import * as vscode from "vscode";
import * as path from "path";

/**
 * Represents the permissions data structure
 */
export interface Permissions {
    alwaysAllow: Record<string, boolean | string[]>;
}

/**
 * Service for managing tool permissions
 * Handles loading, saving, and checking permissions for various tools
 */
export class PermissionService implements vscode.Disposable {
    private _permissionsPath: string | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._initializePermissions();
    }

    /**
     * Get all permissions
     */
    public async getPermissions(): Promise<Permissions> {
        try {
            if (!this._permissionsPath) {
                return { alwaysAllow: {} };
            }

            const permissionsUri = vscode.Uri.file(
                path.join(this._permissionsPath, "permissions.json"),
            );

            try {
                const content = await vscode.workspace.fs.readFile(permissionsUri);
                return JSON.parse(new TextDecoder().decode(content));
            } catch {
                return { alwaysAllow: {} };
            }
        } catch (error) {
            console.error("Error getting permissions:", error);
            return { alwaysAllow: {} };
        }
    }

    /**
     * Check if a tool is pre-approved
     */
    public async isToolPreApproved(
        toolName: string,
        input: Record<string, unknown>,
    ): Promise<boolean> {
        try {
            const permissions = await this.getPermissions();
            const toolPermission = permissions.alwaysAllow?.[toolName];

            if (toolPermission === true) {
                return true;
            }

            if (Array.isArray(toolPermission) && toolName === "Bash" && input.command) {
                const command = (input.command as string).trim();
                for (const pattern of toolPermission) {
                    if (this._matchesPattern(command, pattern)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error("Error checking pre-approved permissions:", error);
            return false;
        }
    }

    /**
     * Save a permission for a tool
     */
    public async savePermission(toolName: string, input: Record<string, unknown>): Promise<void> {
        try {
            if (!this._permissionsPath) {
                return;
            }

            const permissions = await this.getPermissions();

            if (toolName === "Bash" && input.command) {
                if (!permissions.alwaysAllow[toolName]) {
                    permissions.alwaysAllow[toolName] = [];
                }
                if (Array.isArray(permissions.alwaysAllow[toolName])) {
                    const pattern = this._getCommandPattern(input.command as string);
                    if (!permissions.alwaysAllow[toolName].includes(pattern)) {
                        (permissions.alwaysAllow[toolName] as string[]).push(pattern);
                    }
                }
            } else {
                permissions.alwaysAllow[toolName] = true;
            }

            await this._savePermissions(permissions);
            console.log(`Saved permission for ${toolName}`);
        } catch (error) {
            console.error("Error saving permission:", error);
        }
    }

    /**
     * Remove a permission
     */
    public async removePermission(toolName: string, command: string | null): Promise<void> {
        try {
            if (!this._permissionsPath) {
                return;
            }

            const permissions = await this.getPermissions();

            if (command === null) {
                delete permissions.alwaysAllow[toolName];
            } else {
                if (Array.isArray(permissions.alwaysAllow[toolName])) {
                    permissions.alwaysAllow[toolName] = (
                        permissions.alwaysAllow[toolName] as string[]
                    ).filter((cmd: string) => cmd !== command);
                    if ((permissions.alwaysAllow[toolName] as string[]).length === 0) {
                        delete permissions.alwaysAllow[toolName];
                    }
                }
            }

            await this._savePermissions(permissions);
            console.log(
                `Removed permission for ${toolName}${command ? ` command: ${command}` : ""}`,
            );
        } catch (error) {
            console.error("Error removing permission:", error);
        }
    }

    /**
     * Add a permission
     */
    public async addPermission(toolName: string, command: string | null): Promise<void> {
        try {
            if (!this._permissionsPath) {
                return;
            }

            const permissions = await this.getPermissions();

            if (command === null || command === "") {
                permissions.alwaysAllow[toolName] = true;
            } else {
                if (!permissions.alwaysAllow[toolName]) {
                    permissions.alwaysAllow[toolName] = [];
                }

                if (permissions.alwaysAllow[toolName] === true) {
                    permissions.alwaysAllow[toolName] = [];
                }

                if (Array.isArray(permissions.alwaysAllow[toolName])) {
                    let commandToAdd = command;
                    if (toolName === "Bash") {
                        commandToAdd = this._getCommandPattern(command);
                    }

                    if (!permissions.alwaysAllow[toolName].includes(commandToAdd)) {
                        (permissions.alwaysAllow[toolName] as string[]).push(commandToAdd);
                    }
                }
            }

            await this._savePermissions(permissions);
            console.log(
                `Added permission for ${toolName}${command ? ` command: ${command}` : " (all commands)"}`,
            );
        } catch (error) {
            console.error("Error adding permission:", error);
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Nothing to dispose
    }

    // ==================== Private Methods ====================

    private async _initializePermissions(): Promise<void> {
        try {
            const storagePath = this._context.storageUri?.fsPath;
            if (!storagePath) {
                return;
            }

            this._permissionsPath = path.join(storagePath, "permissions");

            // Create permissions directory if it doesn't exist
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(this._permissionsPath));
            } catch {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._permissionsPath));
                console.log(`Created permissions directory at: ${this._permissionsPath}`);
            }
        } catch (error) {
            console.error("Failed to initialize permissions directory:", error);
        }
    }

    private async _savePermissions(permissions: Permissions): Promise<void> {
        if (!this._permissionsPath) {
            return;
        }

        const permissionsUri = vscode.Uri.file(
            path.join(this._permissionsPath, "permissions.json"),
        );
        const content = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
        await vscode.workspace.fs.writeFile(permissionsUri, content);
    }

    private _matchesPattern(command: string, pattern: string): boolean {
        if (pattern === command) {
            return true;
        }

        // Handle wildcard patterns like "npm install *"
        if (pattern.endsWith(" *")) {
            const prefix = pattern.slice(0, -1);
            return command.startsWith(prefix);
        }

        return false;
    }

    private _getCommandPattern(command: string): string {
        const parts = command.trim().split(/\s+/);
        if (parts.length === 0) return command;

        const baseCmd = parts[0];
        const subCmd = parts.length > 1 ? parts[1] : "";

        const patterns: [string, string, string][] = [
            // Package managers
            ["npm", "install", "npm install *"],
            ["npm", "i", "npm i *"],
            ["npm", "add", "npm add *"],
            ["npm", "remove", "npm remove *"],
            ["npm", "uninstall", "npm uninstall *"],
            ["npm", "update", "npm update *"],
            ["npm", "run", "npm run *"],
            ["yarn", "add", "yarn add *"],
            ["yarn", "remove", "yarn remove *"],
            ["yarn", "install", "yarn install *"],
            ["pnpm", "install", "pnpm install *"],
            ["pnpm", "add", "pnpm add *"],
            ["pnpm", "remove", "pnpm remove *"],

            // Git commands
            ["git", "add", "git add *"],
            ["git", "commit", "git commit *"],
            ["git", "push", "git push *"],
            ["git", "pull", "git pull *"],
            ["git", "checkout", "git checkout *"],
            ["git", "branch", "git branch *"],
            ["git", "merge", "git merge *"],
            ["git", "clone", "git clone *"],
            ["git", "reset", "git reset *"],
            ["git", "rebase", "git rebase *"],
            ["git", "tag", "git tag *"],

            // Docker commands
            ["docker", "run", "docker run *"],
            ["docker", "build", "docker build *"],
            ["docker", "exec", "docker exec *"],
            ["docker", "logs", "docker logs *"],
            ["docker", "stop", "docker stop *"],
            ["docker", "start", "docker start *"],
            ["docker", "rm", "docker rm *"],
            ["docker", "rmi", "docker rmi *"],
            ["docker", "pull", "docker pull *"],
            ["docker", "push", "docker push *"],

            // Build tools
            ["make", "", "make *"],
            ["cargo", "build", "cargo build *"],
            ["cargo", "run", "cargo run *"],
            ["cargo", "test", "cargo test *"],
            ["cargo", "install", "cargo install *"],
            ["mvn", "compile", "mvn compile *"],
            ["mvn", "test", "mvn test *"],
            ["mvn", "package", "mvn package *"],
            ["gradle", "build", "gradle build *"],
            ["gradle", "test", "gradle test *"],

            // System commands
            ["curl", "", "curl *"],
            ["wget", "", "wget *"],
            ["ssh", "", "ssh *"],
            ["scp", "", "scp *"],
            ["rsync", "", "rsync *"],
            ["tar", "", "tar *"],
            ["zip", "", "zip *"],
            ["unzip", "", "unzip *"],

            // Development tools
            ["node", "", "node *"],
            ["python", "", "python *"],
            ["python3", "", "python3 *"],
            ["pip", "install", "pip install *"],
            ["pip3", "install", "pip3 install *"],
            ["composer", "install", "composer install *"],
            ["composer", "require", "composer require *"],
            ["bundle", "install", "bundle install *"],
            ["gem", "install", "gem install *"],
        ];

        for (const [cmd, sub, pattern] of patterns) {
            if (baseCmd === cmd && (sub === "" || subCmd === sub)) {
                return pattern;
            }
        }

        return command;
    }
}
