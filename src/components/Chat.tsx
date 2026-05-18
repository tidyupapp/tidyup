import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, Listing, Platform, Provider } from '../lib/types';
import { analyzeItem, chat, type ChatTurn } from '../ai';
import { upsertListing } from '../lib/storage';
import { handoffToPlatform, openPlatformUrl, platformLabel } from '../lib/handoff';
import { PhotoCapture } from './PhotoCapture';
import { ListingCard } from './ListingCard';
import { markFirstSuccess } from './InstallPrompt';

interface Props {
  provider: Provider;
}

const GREETING =
  "Hi! I'm Tidyup. Got something around the house you want to sell? Snap a photo and I'll write the listing. Or just ask me anything about selling.";

export function Chat({ provider }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: id(), kind: 'text', from: 'assistant', text: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleText() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const thinkingId = id();
    setMessages((m) => [
      ...m,
      { id: id(), kind: 'text', from: 'user', text },
      { id: thinkingId, kind: 'thinking', from: 'assistant' }
    ]);

    try {
      const history = buildChatHistory(messages, text);
      const reply = await chat(history, provider);
      setMessages((m) =>
        m.filter((x) => x.id !== thinkingId).concat({
          id: id(),
          kind: 'text',
          from: 'assistant',
          text: reply || "(I didn't have a reply for that — try rephrasing?)"
        })
      );
    } catch (err) {
      setMessages((m) =>
        m.filter((x) => x.id !== thinkingId).concat({
          id: id(),
          kind: 'text',
          from: 'assistant',
          text: `Hit an error: ${(err as Error).message}`
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoto(imageDataUrl: string) {
    if (busy) return;
    setBusy(true);
    const thinkingId = id();
    setMessages((m) => [
      ...m,
      { id: id(), kind: 'photo', from: 'user', imageDataUrl },
      { id: thinkingId, kind: 'thinking', from: 'assistant' }
    ]);

    try {
      const draft = await analyzeItem(imageDataUrl, provider);
      const listing: Listing = {
        id: id(),
        createdAt: Date.now(),
        imageDataUrl,
        title: draft.title,
        description: draft.description,
        priceMin: draft.priceMin,
        priceMax: draft.priceMax,
        category: draft.category,
        condition: draft.condition,
        suggestedPlatforms: draft.suggestedPlatforms ?? [],
        selectedPlatforms: draft.suggestedPlatforms ?? [],
        status: 'draft',
        postedTo: []
      };

      setMessages((m) =>
        m.filter((x) => x.id !== thinkingId).concat([
          {
            id: id(),
            kind: 'text',
            from: 'assistant',
            text: `Looks like a ${draft.identifiedItem}. Here's the listing — tap any field to tweak it, then post.`
          },
          { id: id(), kind: 'listing', from: 'assistant', listing }
        ])
      );
      if (draft.notes) {
        setMessages((m) =>
          m.concat({ id: id(), kind: 'text', from: 'assistant', text: `💡 ${draft.notes}` })
        );
      }
      markFirstSuccess();
    } catch (err) {
      setMessages((m) =>
        m.filter((x) => x.id !== thinkingId).concat({
          id: id(),
          kind: 'text',
          from: 'assistant',
          text: `Something went wrong: ${(err as Error).message}`
        })
      );
    } finally {
      setBusy(false);
    }
  }

  function updateListing(next: Listing) {
    setMessages((m) =>
      m.map((msg) =>
        msg.kind === 'listing' && msg.listing.id === next.id ? { ...msg, listing: next } : msg
      )
    );
  }

  async function postListingTo(target: Listing, platform: Platform) {
    setBusy(true);
    try {
      const result = await handoffToPlatform(target, platform);
      const updated: Listing = {
        ...target,
        postedTo: [...new Set([...target.postedTo, platform])],
        status: 'published'
      };
      upsertListing(updated);
      updateListing(updated);
      openPlatformUrl(result.url);

      const lines = [
        `Opening ${platformLabel(platform)} in a new tab.`,
        '✅ Listing text is copied to your clipboard.',
        result.photoDownloaded ? '✅ Photo downloaded to your device.' : '⚠️ Photo download blocked — long-press the photo above and "Save Image" to use it.',
        '',
        ...result.instructions
      ];
      setMessages((m) =>
        m.concat({ id: id(), kind: 'text', from: 'assistant', text: lines.join('\n') })
      );
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (err) {
      setMessages((m) =>
        m.concat({
          id: id(),
          kind: 'text',
          from: 'assistant',
          text: `Couldn't hand off: ${(err as Error).message}`
        })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat">
      <div className="messages" ref={scrollRef}>
        {messages.map((msg) => (
          <MessageView
            key={msg.id}
            msg={msg}
            onListingChange={updateListing}
            onPostTo={postListingTo}
          />
        ))}
      </div>
      <div className="composer">
        <form
          className="text-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleText();
          }}
        >
          <input
            className="text-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything, or tap below to snap a photo…"
            disabled={busy}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" className="send-button" disabled={busy || !input.trim()}>
            ➤
          </button>
        </form>
        <PhotoCapture onPhoto={handlePhoto} disabled={busy} />
      </div>
    </div>
  );
}

function MessageView({
  msg,
  onListingChange,
  onPostTo
}: {
  msg: ChatMessage;
  onListingChange: (l: Listing) => void;
  onPostTo: (l: Listing, p: Platform) => void;
}) {
  if (msg.kind === 'text') {
    return (
      <div className={`bubble ${msg.from}`}>
        {msg.text.split('\n').map((line, i) => (
          <p key={i}>{line || ' '}</p>
        ))}
      </div>
    );
  }
  if (msg.kind === 'photo') {
    return (
      <div className={`bubble ${msg.from} photo`}>
        <img src={msg.imageDataUrl} alt="uploaded" />
      </div>
    );
  }
  if (msg.kind === 'thinking') {
    return (
      <div className="bubble assistant thinking">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    );
  }
  if (msg.kind === 'listing') {
    return (
      <div className="bubble assistant card-wrap">
        <ListingCard
          listing={msg.listing}
          onChange={onListingChange}
          onPostTo={(p) => onPostTo(msg.listing, p)}
        />
      </div>
    );
  }
  return null;
}

function buildChatHistory(messages: ChatMessage[], nextUserText: string): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    if (m.kind === 'text') {
      turns.push({ role: m.from === 'assistant' ? 'assistant' : 'user', content: m.text });
    } else if (m.kind === 'photo') {
      turns.push({ role: 'user', content: '[user uploaded a photo of an item to sell]' });
    } else if (m.kind === 'listing') {
      turns.push({
        role: 'assistant',
        content: `[generated a listing: "${m.listing.title}" at $${m.listing.priceMin}-${m.listing.priceMax}]`
      });
    }
  }
  turns.push({ role: 'user', content: nextUserText });
  return turns.slice(-20);
}

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}
