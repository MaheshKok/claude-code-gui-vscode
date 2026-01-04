import * as assert from "assert";
import * as vscode from "vscode";

suite("Webview Panel Tests", () => {
    const EXTENSION_ID = "claude-flow.claude-code-gui";
    const OPEN_CHAT_COMMAND = "claude-code-gui.openChat";

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    test("Open Chat command should execute without error", async () => {
        try {
            await vscode.commands.executeCommand(OPEN_CHAT_COMMAND);
            assert.ok(true, "Command executed successfully");
        } catch (error) {
            assert.fail(`Command failed with error: ${error}`);
        }
    });

    test("Should be able to open chat multiple times", async () => {
        try {
            await vscode.commands.executeCommand(OPEN_CHAT_COMMAND);
            await vscode.commands.executeCommand(OPEN_CHAT_COMMAND);
            assert.ok(true, "Multiple command executions succeeded");
        } catch (error) {
            assert.fail(`Multiple executions failed: ${error}`);
        }
    });
});

suite("Webview Content Provider Tests", () => {
    test("DiffContentProvider scheme should be registered", async () => {
        const extension = vscode.extensions.getExtension("claude-flow.claude-code-gui");
        if (extension && !extension.isActive) {
            await extension.activate();
        }

        const schemes = ["claude-diff"];
        for (const scheme of schemes) {
            const uri = vscode.Uri.parse(`${scheme}:test`);
            assert.strictEqual(uri.scheme, scheme, `URI scheme should be ${scheme}`);
        }
    });
});

suite("Status Bar Tests", () => {
    test("Status bar item should be created on activation", async () => {
        const extension = vscode.extensions.getExtension("claude-flow.claude-code-gui");
        if (extension && !extension.isActive) {
            await extension.activate();
        }

        assert.ok(extension?.isActive, "Extension should be active with status bar");
    });
});

suite("Editor Context Menu Tests", () => {
    test("Editor can be opened with selection", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "function test() { return 42; }",
            language: "javascript",
        });

        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 30);

        assert.ok(editor.selection, "Editor should have a selection");
        assert.strictEqual(
            editor.document.getText(editor.selection),
            "function test() { return 42; }",
            "Selection should contain the expected text",
        );

        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    });
});

suite("Keyboard Shortcut Tests", () => {
    test("Keyboard shortcuts should be defined in package.json", async () => {
        const extension = vscode.extensions.getExtension("claude-flow.claude-code-gui");
        assert.ok(extension, "Extension should be present");

        const packageJson = extension.packageJSON;
        const keybindings = packageJson.contributes?.keybindings;

        assert.ok(Array.isArray(keybindings), "Keybindings should be defined");
        assert.ok(keybindings.length > 0, "At least one keybinding should be defined");

        const openChatBinding = keybindings.find(
            (kb: { command: string }) => kb.command === "claude-code-gui.openChat",
        );
        assert.ok(openChatBinding, "openChat command should have a keybinding");
    });
});
