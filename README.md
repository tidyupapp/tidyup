# Tidyup

Snap a photo. We sell it for you.

A PWA (progressive web app) that lets a casual seller list household items across multiple marketplaces using AI to write the listing.

## What works in this prototype

- Conversational chat-first UI (mobile-first, responsive to tablet/desktop)
- Camera capture or photo library upload
- AI item recognition + listing generation (Claude or Gemini, switchable)
- Inline editable listing card (title, price range, description, platforms)
- Save listings to local storage
- Installable to home screen with custom icon and shortcuts
- Offline-ready service worker
- Dark mode follows system

## What is stubbed (next phases)

- Google sign-in (Firebase Auth)
- Real eBay API posting
- Deep-link handoff to Facebook Marketplace / OfferUp / Nextdoor / Craigslist
- Unified buyer inbox
- Public listing URLs / SEO pages
- Cloudflare Worker that hides API keys from the browser

---

## First-time setup

### 1. Install Node.js

You need Node 18 or newer. On Windows the easiest way:

**Option A — winget (recommended, comes with Windows 10/11):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Option B — download installer:**
- https://nodejs.org → download the LTS installer → run it → restart your terminal

Verify it worked:
```powershell
node --version
npm --version
```

### 2. Install project dependencies

From the project folder (`C:\Users\Kent\projects\tidyup`):
```powershell
npm install
```

### 3. Add your API keys

```powershell
copy .env.example .env.local
notepad .env.local
```

Fill in **at least one** of:
- `VITE_ANTHROPIC_API_KEY` — get it at https://console.anthropic.com/settings/keys
- `VITE_GEMINI_API_KEY` — get it at https://aistudio.google.com/apikey

Set `VITE_AI_PROVIDER=claude` or `VITE_AI_PROVIDER=gemini` to pick the default.

> Heads up: in this prototype the AI keys live in the browser. That's fine for local dev and demos but **don't deploy this to the public internet with keys still in the client**. We'll move calls behind a Cloudflare Worker in the next phase.

### 4. Run the dev server

```powershell
npm run dev
```

Open the URL it prints (usually http://localhost:5173). The `--host` flag means it also prints a `192.168.x.x` URL — open that on your phone (same Wi-Fi) and you can test the camera flow on real hardware.

### 5. Test on your phone

1. Open the local network URL on your phone's browser
2. Tap the share button → "Add to Home Screen" (iOS) or the install prompt (Android/Chrome)
3. Launch from the home screen icon
4. Tap "Take a photo" → snap something in your closet → watch the AI draft the listing

---

## Project layout

```
src/
  ai/
    claude.ts        — Claude (Anthropic) integration
    gemini.ts        — Gemini (Google AI Studio) integration
    index.ts         — provider router
    prompts.ts       — the system prompt
  components/
    Chat.tsx         — main conversational interface
    ListingCard.tsx  — editable inline listing card
    PhotoCapture.tsx — camera + library buttons with image compression
    InstallPrompt.tsx — non-intrusive "add to home screen" banner
  lib/
    storage.ts       — localStorage helpers
    types.ts         — shared TypeScript types
  App.tsx
  main.tsx
  styles.css
public/
  icon.svg           — placeholder app icon
vite.config.ts       — Vite + PWA plugin config
index.html
```

## Roadmap (the order we'll build things)

1. **MVP (this prototype)** — chat UI, AI listing, local save ← you are here
2. **Google sign-in** — Firebase Auth, sync across devices
3. **eBay live posting** — real API integration with OAuth
4. **Deep-link handoff** — FB Marketplace, OfferUp, Nextdoor, Craigslist
5. **Cloudflare Worker backend** — hides API keys, central storage
6. **Public listing URLs** — yourapp.com/l/abc123, SEO landing pages
7. **Unified buyer inbox** — AI-drafted replies across platforms
8. **Google Shopping feed** — your app as the Merchant Center
9. **Affiliate revenue** — shipping (Pirate Ship, Shippo), supplies, trade-ins

## Deploying (later)

When ready:
1. Push the repo to GitHub
2. Connect the repo to Cloudflare Pages → it auto-deploys on every push to `main`
3. You get a free `tidyup.pages.dev` URL with HTTPS
4. Add a custom domain whenever you buy one
