// Using require instead of import to avoid TypeScript module resolution issues
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

export interface MessageLogEntry {
    timestamp: string;
    direction: 'outgoing' | 'incoming';
    content: any;
}

export class MessageLogger {
    private logDir: string;
    private enabled: boolean;

    constructor() {
        // Initialize log directory in the workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        this.logDir = path.join(workspaceRoot, 'message_history');
        this.enabled = vscode.workspace.getConfiguration('cline').get('messageLogging.enabled', true);
        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private getLogFilePath(): string {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${date}.log`);
    }

    private formatLogEntry(entry: MessageLogEntry): string {
        return JSON.stringify({
            timestamp: entry.timestamp,
            direction: entry.direction,
            content: entry.content
        }, null, 2);
    }

    public logMessage(direction: 'outgoing' | 'incoming', content: any): void {
        if (!this.enabled) return;

        const entry: MessageLogEntry = {
            timestamp: new Date().toISOString(),
            direction,
            content
        };

        const logFile = this.getLogFilePath();
        const logEntry = this.formatLogEntry(entry);

        fs.appendFileSync(logFile, logEntry + '\n---\n');
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        // Update VS Code configuration
        vscode.workspace.getConfiguration('cline').update('messageLogging.enabled', enabled, true);
    }

    public getLogDirectory(): string {
        return this.logDir;
    }
}

// Singleton instance
export const messageLogger = new MessageLogger();
