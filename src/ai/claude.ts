import type { AiListingDraft } from '../lib/types';
import { LISTING_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from './prompts';

const MODEL = 'claude-haiku-4-5-20251001';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const COMMON_HEADERS = (apiKey: string) => ({
  'content-type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
});

function requireKey(): string {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-ant-...')) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY in .env.local');
  }
  return apiKey;
}

export async function analyzeWithClaude(imageDataUrl: string): Promise<AiListingDraft> {
  const apiKey = requireKey();
  const { mediaType, data } = parseDataUrl(imageDataUrl);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: COMMON_HEADERS(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: LISTING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: 'Draft the listing for this item.' }
          ]
        }
      ]
    })
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return parseJsonResponse(body?.content?.[0]?.text ?? '');
}

export async function chatWithClaude(history: ChatTurn[]): Promise<string> {
  const apiKey = requireKey();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: COMMON_HEADERS(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: CHAT_SYSTEM_PROMPT,
      messages: history.map((t) => ({ role: t.role, content: t.content }))
    })
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body?.content?.[0]?.text?.trim() ?? '';
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URL');
  return { mediaType: match[1], data: match[2] };
}

function parseJsonResponse(text: string): AiListingDraft {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < 0) {
    throw new Error('AI did not return JSON: ' + text.slice(0, 200));
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as AiListingDraft;
}
