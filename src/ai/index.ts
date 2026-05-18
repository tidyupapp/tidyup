import type { AiListingDraft, Provider } from '../lib/types';
import { analyzeWithClaude, chatWithClaude, type ChatTurn } from './claude';
import { analyzeWithGemini, chatWithGemini } from './gemini';

export type { ChatTurn };

export async function analyzeItem(imageDataUrl: string, provider: Provider): Promise<AiListingDraft> {
  if (provider === 'gemini') return analyzeWithGemini(imageDataUrl);
  return analyzeWithClaude(imageDataUrl);
}

export async function chat(history: ChatTurn[], provider: Provider): Promise<string> {
  if (provider === 'gemini') return chatWithGemini(history);
  return chatWithClaude(history);
}
