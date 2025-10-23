/**
 * LLM response from inference
 */
export type LLMResponse = {
  text: string;
  tokensGenerated: number;
};

/**
 * LLM generation options
 */
export type GenerationOptions = {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
};

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: Required<Omit<GenerationOptions, 'stopSequences'>> = {
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.9,
};
