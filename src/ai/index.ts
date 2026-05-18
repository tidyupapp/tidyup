import type { AiListingDraft, Provider } from '../lib/types';
import { aiAnalyze, aiChat, type ChatTurn } from '../lib/api';

export type { ChatTurn };

export async function analyzeItem(imageDataUrl: string, provider: Provider): Promise<AiListingDraft> {
  const draft = await aiAnalyze(imageDataUrl, provider);
  return draft as AiListingDraft;
}

export async function chat(history: ChatTurn[], provider: Provider): Promise<string> {
  return aiChat(history, provider);
}
