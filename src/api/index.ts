import Anthropic from '@anthropic-ai/sdk';
import { ApiConfiguration, ModelInfo } from "../shared/api"
import { AnthropicHandler } from "./providers/anthropic"
import { AwsBedrockHandler } from "./providers/bedrock"
import { OpenRouterHandler } from "./providers/openrouter"
import { VertexHandler } from "./providers/vertex"
import { OpenAiHandler } from "./providers/openai"
import { OllamaHandler } from "./providers/ollama"
import { GeminiHandler } from "./providers/gemini"
import { OpenAiNativeHandler } from "./providers/openai-native"
import { ApiStream } from "./transform/stream"
import { ApiLoggerWrapper } from "./logging/ApiLoggerWrapper"

export interface ApiHandler {
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream
    getModel(): { id: string; info: ModelInfo }
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
    const { apiProvider, ...options } = configuration
    let handler: ApiHandler;
    
    switch (apiProvider) {
        case "anthropic":
            handler = new AnthropicHandler(options)
            break
        case "openrouter":
            handler = new OpenRouterHandler(options)
            break
        case "bedrock":
            handler = new AwsBedrockHandler(options)
            break
        case "vertex":
            handler = new VertexHandler(options)
            break
        case "openai":
            handler = new OpenAiHandler(options)
            break
        case "ollama":
            handler = new OllamaHandler(options)
            break
        case "gemini":
            handler = new GeminiHandler(options)
            break
        case "openai-native":
            handler = new OpenAiNativeHandler(options)
            break
        default:
            handler = new AnthropicHandler(options)
    }

    // Wrap the handler with logging functionality
    return new ApiLoggerWrapper(handler)
}
