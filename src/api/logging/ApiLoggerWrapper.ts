import type { Anthropic } from "@anthropic-ai/sdk"
import { ApiHandler } from "../index"
import { messageLogger } from "../../services/message-logging/MessageLogger"
import { ApiStream } from "../transform/stream"

interface LoggedMessage {
    timestamp: string;
    content: any;
}

export class ApiLoggerWrapper implements ApiHandler {
    private handler: ApiHandler;

    constructor(handler: ApiHandler) {
        this.handler = handler;
    }

    async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
        // Log outgoing message
        messageLogger.logMessage('outgoing', {
            systemPrompt,
            messages
        });

        const stream = this.handler.createMessage(systemPrompt, messages);

        // Process and log incoming stream
        for await (const chunk of stream) {
            switch (chunk.type) {
                case 'text':
                    messageLogger.logMessage('incoming', {
                        messageType: 'text',
                        content: chunk.text
                    });
                    break;
                case 'usage':
                    messageLogger.logMessage('incoming', {
                        messageType: 'usage',
                        inputTokens: chunk.inputTokens,
                        outputTokens: chunk.outputTokens,
                        cacheWriteTokens: chunk.cacheWriteTokens,
                        cacheReadTokens: chunk.cacheReadTokens
                    });
                    break;
            }
            yield chunk;
        }
    }

    getModel() {
        return this.handler.getModel();
    }
}
