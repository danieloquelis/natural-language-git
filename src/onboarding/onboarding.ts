import { initializeConfig, readConfig, updateConfig } from '../config/index.js';
import { initializeLLM } from '../llm/index.js';
import {
  downloadModel,
  getAvailableModels,
  getModelPath,
  isModelDownloaded,
} from '../models/index.js';
import {
  createSpinner,
  displayError,
  displayHeader,
  displaySuccess,
  displayWelcome,
  selectFromList,
} from '../ui/index.js';
import type { OnboardingState } from './onboarding-common.js';
import { isOnboardingComplete } from './onboarding-common.js';

/**
 * Check onboarding state
 */
export async function checkOnboardingState(): Promise<OnboardingState> {
  const config = await readConfig();

  const modelDownloaded =
    config.selectedModel !== null &&
    isModelDownloaded(config.selectedModel, getModelFileForId(config.selectedModel));

  return {
    completed: config.selectedModel !== null,
    modelDownloaded,
    modelSelected: config.selectedModel,
  };
}

/**
 * Helper to get model filename from ID
 */
function getModelFileForId(modelId: string): string {
  // This is a bit hacky, but we need to map ID to dest_file
  // In practice, we'd load the models config, but for simplicity:
  if (modelId.includes('llama')) {
    return 'meta-llama-3-8b-instruct-q5_k_m.gguf';
  }
  if (modelId.includes('mistral')) {
    return 'mistral-7b-instruct-v0.2.Q2_K.gguf';
  }
  return '';
}

/**
 * Run the onboarding flow
 */
export async function runOnboarding(): Promise<boolean> {
  // Initialize config
  await initializeConfig();

  // Display welcome
  displayWelcome();

  console.log('Version 0.1.0');
  console.log('Copyright (c) 2025 Daniel Oquelis\n');

  displayHeader('Welcome to NLGit! 🚀');

  console.log("Let's get you set up. First, you need to select a language model.\n");

  // Get available models
  const models = await getAvailableModels();

  // Let user select a model
  const choices = models.map((model) => ({
    value: model.id,
    name: model.display_name,
    description: model.description,
  }));

  const selectedModelId = await selectFromList('Select a model:', choices);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  if (!selectedModel) {
    displayError('Invalid model selection');
    return false;
  }

  // Check if model is already downloaded
  if (isModelDownloaded(selectedModel.id, selectedModel.dest_file)) {
    displaySuccess(`Model "${selectedModel.display_name}" is already downloaded!`);
  } else {
    // Download the model
    console.log(`\nDownloading ${selectedModel.display_name}...`);
    console.log('This may take a while depending on your internet connection.\n');

    const spinner = createSpinner('Downloading model...');
    spinner.start();

    try {
      await downloadModel(selectedModel.url, selectedModel.dest_file, (progress) => {
        const percent = progress.percentage.toFixed(1);
        const downloaded = (progress.downloaded / 1024 / 1024).toFixed(1);
        const total = (progress.total / 1024 / 1024).toFixed(1);
        spinner.text = `Downloading: ${percent}% (${downloaded}MB / ${total}MB)`;
      });

      spinner.succeed('Model downloaded successfully!');
    } catch (error) {
      spinner.fail('Failed to download model');
      displayError(error instanceof Error ? error.message : 'Unknown error downloading model');
      return false;
    }
  }

  // Save selected model to config
  await updateConfig({
    selectedModel: selectedModel.id,
    lastUsed: new Date().toISOString(),
  });

  // Initialize the LLM
  displayHeader('Initializing model...');
  const spinner = createSpinner('Loading model into memory...');
  spinner.start();

  try {
    const modelPath = getModelPath(selectedModel.dest_file);
    await initializeLLM(modelPath);
    spinner.succeed('Model loaded successfully!');
  } catch (error) {
    spinner.fail('Failed to initialize model');
    displayError(error instanceof Error ? error.message : 'Unknown error initializing model');
    return false;
  }

  displaySuccess('\nOnboarding complete! You can now use NLGit.\n');

  return true;
}

/**
 * Ensure onboarding is complete before running the app
 */
export async function ensureOnboarding(): Promise<boolean> {
  await initializeConfig();

  const state = await checkOnboardingState();

  if (isOnboardingComplete(state)) {
    // Just initialize the LLM with the selected model
    const config = await readConfig();
    if (config.selectedModel) {
      const modelFile = getModelFileForId(config.selectedModel);
      const modelPath = getModelPath(modelFile);

      const spinner = createSpinner('Loading model...');
      spinner.start();

      try {
        await initializeLLM(modelPath);
        spinner.succeed('Model ready!');
        return true;
      } catch (error) {
        spinner.fail('Failed to load model');
        displayError('Please run onboarding again');
        return false;
      }
    }
  }

  // Run onboarding if not complete
  return runOnboarding();
}
