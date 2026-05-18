import type { Env } from './env';
import { HttpError } from './auth';
import { LISTING_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from './prompts';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const GEMINI_MODEL = 'gemini-2.5-flash';

export type Provider = 'claude' | 'gemini';
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new HttpError(400, 'Invalid image data URL');
  return { mediaType: match[1], data: match[2] };
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < 0) {
    throw new HttpError(502, 'AI did not return JSON: ' + text.slice(0, 200));
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

export async function analyzeImage(env: Env, provider: Provider, imageDataUrl: string): Promise<unknown> {
  if (provider === 'claude') return analyzeWithClaude(env, imageDataUrl);
  return analyzeWithGemini(env, imageDataUrl);
}

export async function chatReply(env: Env, provider: Provider, history: ChatTurn[]): Promise<string> {
  if (provider === 'claude') return chatWithClaude(env, history);
  return chatWithGemini(env, history);
}

async function analyzeWithGemini(env: Env, imageDataUrl: string): Promise<unknown> {
  if (!env.GEMINI_API_KEY) throw new HttpError(500, 'GEMINI_API_KEY not configured');
  const { mediaType, data } = parseDataUrl(imageDataUrl);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: LISTING_SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mediaType, data } },
            { text: 'Draft the listing for this item.' }
          ]
        }
      ],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
    })
  });
  if (!res.ok) throw new HttpError(502, `Gemini ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseJsonResponse(text);
}

async function analyzeWithClaude(env: Env, imageDataUrl: string): Promise<unknown> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(500, 'ANTHROPIC_API_KEY not configured');
  const { mediaType, data } = parseDataUrl(imageDataUrl);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
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
  if (!res.ok) throw new HttpError(502, `Claude ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { content?: { text?: string }[] };
  return parseJsonResponse(body?.content?.[0]?.text ?? '');
}

async function chatWithGemini(env: Env, history: ChatTurn[]): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new HttpError(500, 'GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
      contents: history.map((t) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }]
      })),
      generationConfig: { temperature: 0.7 }
    })
  });
  if (!res.ok) throw new HttpError(502, `Gemini ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
}

async function chatWithClaude(env: Env, history: ChatTurn[]): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(500, 'ANTHROPIC_API_KEY not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: CHAT_SYSTEM_PROMPT,
      messages: history.map((t) => ({ role: t.role, content: t.content }))
    })
  });
  if (!res.ok) throw new HttpError(502, `Claude ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { content?: { text?: string }[] };
  return (body?.content?.[0]?.text ?? '').trim();
}
