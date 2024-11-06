const vscode = require('vscode');
const delay = require('delay');

import { ClineProvider } from "./core/webview/ClineProvider"
import { createClineAPI } from "./exports"
import "./utils/path" // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import { messageLogger } from "./services/message-logging/MessageLogger"

let outputChannel;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context) {
    outputChannel = vscode.window.createOutputChannel("Cline")
    context.subscriptions.push(outputChannel)

    outputChannel.appendLine("Cline extension activated")

    const sidebarProvider = new ClineProvider(context, outputChannel)

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, sidebarProvider, {
            webviewOptions: { retainContextWhenHidden: true },
        })
    )

    // Register command to open message logs
    context.subscriptions.push(
        vscode.commands.registerCommand("cline.openMessageLogs", () => {
            const logDir = messageLogger.getLogDirectory();
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(logDir), true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cline.plusButtonClicked", async () => {
            outputChannel.appendLine("Plus button Clicked")
            await sidebarProvider.clearTask()
            await sidebarProvider.postStateToWebview()
            await sidebarProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
        })
    )

    const openClineInNewTab = async () => {
        outputChannel.appendLine("Opening Cline in new tab")
        const tabProvider = new ClineProvider(context, outputChannel)
        const lastCol = Math.max(...vscode.window.visibleTextEditors.map(editor => editor.viewColumn || 0))

        // Check if there are any visible text editors, otherwise open a new group to the right
        const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
        if (!hasVisibleEditors) {
            await vscode.commands.executeCommand("workbench.action.newGroupRight")
        }
        const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

        const panel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "Cline", targetCol, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri],
        })

        panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_light.png"),
            dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
        }
        tabProvider.resolveWebviewView(panel)

        // Lock the editor group so clicking on files doesn't open them over the panel
        await delay(100)
        await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
    }

    context.subscriptions.push(vscode.commands.registerCommand("cline.popoutButtonClicked", openClineInNewTab))
    context.subscriptions.push(vscode.commands.registerCommand("cline.openInNewTab", openClineInNewTab))

    context.subscriptions.push(
        vscode.commands.registerCommand("cline.settingsButtonClicked", () => {
            sidebarProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand("cline.historyButtonClicked", () => {
            sidebarProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
        })
    )

    const diffContentProvider = new class {
        provideTextDocumentContent(uri) {
            return Buffer.from(uri.query, "base64").toString("utf-8")
        }
    }
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider)
    )

    // URI Handler
    const handleUri = async (uri) => {
        const path = uri.path
        const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
        const visibleProvider = ClineProvider.getVisibleInstance()
        if (!visibleProvider) {
            return
        }
        switch (path) {
            case "/openrouter": {
                const code = query.get("code")
                if (code) {
                    await visibleProvider.handleOpenRouterCallback(code)
                }
                break
            }
            default:
                break
        }
    }
    context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

    return createClineAPI(outputChannel, sidebarProvider)
}

// This method is called when your extension is deactivated
export function deactivate() {
    outputChannel.appendLine("Cline extension deactivated")
}
