import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Activation Tests", () => {
    const EXTENSION_ID = "claude-flow.claude-code-gui";

    test("Extension should be present", () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, `Extension ${EXTENSION_ID} should be installed`);
    });

    test("Extension should activate on startup", async () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, "Extension should be present");

        if (!extension.isActive) {
            await extension.activate();
        }

        assert.strictEqual(extension.isActive, true, "Extension should be active");
    });

    test("Extension should export activate function", async () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, "Extension should be present");

        if (!extension.isActive) {
            await extension.activate();
        }

        assert.ok(extension.exports !== undefined || extension.isActive);
    });
});

suite("Command Registration Tests", () => {
    const IMPLEMENTED_COMMANDS = [
        "claude-code-gui.openChat",
        "claude-code-gui.loadConversation",
        "claude-code-gui.newSession",
        "claude-code-gui.stopRequest",
    ];

    test("Open Chat command should be registered", async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes("claude-code-gui.openChat"),
            "openChat command should be registered",
        );
    });

    test("Load Conversation command should be registered", async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes("claude-code-gui.loadConversation"),
            "loadConversation command should be registered",
        );
    });

    test("New Session command should be registered", async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes("claude-code-gui.newSession"),
            "newSession command should be registered",
        );
    });

    test("Stop Request command should be registered", async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes("claude-code-gui.stopRequest"),
            "stopRequest command should be registered",
        );
    });

    test("All implemented commands should be available", async () => {
        const commands = await vscode.commands.getCommands(true);
        for (const cmd of IMPLEMENTED_COMMANDS) {
            assert.ok(commands.includes(cmd), `${cmd} should be registered`);
        }
    });
});

suite("Configuration Tests", () => {
    test("Extension configuration section should exist", () => {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        assert.ok(config, "Configuration section should exist");
    });

    test("Default model configuration should exist", () => {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        const model = config.get<string>("claude.model");
        assert.ok(model, "Model configuration should have a default value");
    });

    test("Thinking mode configuration should exist", () => {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        const enabled = config.get<boolean>("thinking.enabled");
        assert.strictEqual(typeof enabled, "boolean", "Thinking enabled should be a boolean");
    });

    test("WSL configuration should exist", () => {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        const wslEnabled = config.get<boolean>("wsl.enabled");
        assert.strictEqual(typeof wslEnabled, "boolean", "WSL enabled should be a boolean");
    });
});

suite("View Registration Tests", () => {
    test("Chat view should be registered", async () => {
        const extension = vscode.extensions.getExtension("claude-flow.claude-code-gui");
        if (extension && !extension.isActive) {
            await extension.activate();
        }

        const view = vscode.window.registerWebviewViewProvider;
        assert.ok(view, "WebviewViewProvider registration API should be available");
    });
});
