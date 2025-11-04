import { LlamaChatSession, getLlama } from 'node-llama-cpp';
import type { GenerationOptions, LLMResponse } from './llm-common.js';
import { DEFAULT_GENERATION_OPTIONS } from './llm-common.js';

let llamaInstance: Awaited<ReturnType<typeof getLlama>> | null = null;
let currentSession: LlamaChatSession | null = null;
let currentModelPath: string | null = null;

/**
 * Initialize the LLM with a specific model
 */
export async function initializeLLM(modelPath: string): Promise<void> {
  // If already initialized with the same model, reuse it
  if (llamaInstance && currentModelPath === modelPath && currentSession) {
    return;
  }

  // Clean up existing session
  if (currentSession) {
    currentSession = null;
  }

  // Get or create llama instance
  if (!llamaInstance) {
    llamaInstance = await getLlama();
  }

  // Load the model
  const model = await llamaInstance.loadModel({
    modelPath,
  });

  // Create context
  const context = await model.createContext();

  // Create chat session
  currentSession = new LlamaChatSession({
    contextSequence: context.getSequence(),
  });

  currentModelPath = modelPath;
}

/**
 * Generate a response from the LLM
 */
export async function generate(
  prompt: string,
  options: GenerationOptions = {}
): Promise<LLMResponse> {
  if (!currentSession) {
    throw new Error('LLM not initialized. Call initializeLLM first.');
  }

  const mergedOptions = {
    ...DEFAULT_GENERATION_OPTIONS,
    ...options,
  };

  let generatedText = '';
  let tokenCount = 0;

  await currentSession.prompt(prompt, {
    temperature: mergedOptions.temperature,
    maxTokens: mergedOptions.maxTokens,
    topP: mergedOptions.topP,
    onTextChunk(chunk) {
      generatedText += chunk;
      tokenCount++;
    },
  });

  return {
    text: generatedText.trim(),
    tokensGenerated: tokenCount,
  };
}

/**
 * Generate a response with a fresh context (no chat history)
 * Useful when you don't want previous prompts to influence the output
 */
export async function generateFresh(
  prompt: string,
  options: GenerationOptions = {}
): Promise<LLMResponse> {
  if (!llamaInstance || !currentModelPath) {
    throw new Error('LLM not initialized. Call initializeLLM first.');
  }

  const mergedOptions = {
    ...DEFAULT_GENERATION_OPTIONS,
    ...options,
  };

  // Load the model
  const model = await llamaInstance.loadModel({
    modelPath: currentModelPath,
  });

  // Create a fresh context
  const context = await model.createContext();

  // Create a one-time session
  const freshSession = new LlamaChatSession({
    contextSequence: context.getSequence(),
  });

  let generatedText = '';
  let tokenCount = 0;

  await freshSession.prompt(prompt, {
    temperature: mergedOptions.temperature,
    maxTokens: mergedOptions.maxTokens,
    topP: mergedOptions.topP,
    onTextChunk(chunk) {
      generatedText += chunk;
      tokenCount++;
    },
  });

  return {
    text: generatedText.trim(),
    tokensGenerated: tokenCount,
  };
}

/**
 * Dispose of the current LLM session
 */
export async function disposeLLM(): Promise<void> {
  currentSession = null;
  currentModelPath = null;
  // Note: We keep the llama instance for potential reuse
}
