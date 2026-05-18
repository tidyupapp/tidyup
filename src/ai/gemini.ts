import type { AiListingDraft } from '../lib/types';
import { LISTING_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from './prompts';
import type { ChatTurn } from './claude';

const MODEL = 'gemini-2.5-flash';

function requireKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('AIza...')) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env.local');
  }
  return apiKey;
}

export async function analyzeWithGemini(imageDataUrl: string): Promise<AiListingDraft> {
  const apiKey = requireKey();
  const { mediaType, data } = parseDataUrl(imageDataUrl);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
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
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return parseJsonResponse(body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
}

export async function chatWithGemini(history: ChatTurn[]): Promise<string> {
  const apiKey = requireKey();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
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

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return (body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
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
