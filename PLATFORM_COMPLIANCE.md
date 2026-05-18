# Platform compliance — how Tidyup stays out of trouble

This doc explains why every platform integration in Tidyup is on legally solid ground. Read this before you build anything that touches a third-party marketplace.

## The two-tier model

Tidyup connects to platforms in exactly two ways. There is no third way.

### Tier 1 — Official OAuth + API

We register Tidyup as a third-party developer on the platform. The user authorizes Tidyup once. After that, we call the platform's documented API to post listings and read messages on the user's behalf.

| Platform | Status |
|---|---|
| eBay | ✅ Wired (sandbox) |
| Etsy | 🔜 Same pattern, easy to add |
| Mercari | ⏳ Their API is partner-only — application required |
| Google Shopping | ⏳ Different model — we'd be the merchant |

Why this is safe:
- We sign their developer agreement when we register.
- We use scoped OAuth tokens — never the user's password.
- We respect rate limits documented in their API reference.
- We don't store or republish platform data outside the user's own dashboard.
- The user can revoke access from their account settings on the platform any time.

What we must NOT do, even though it's technically possible:
- Store OAuth tokens in client code.
- Cache listing data from another seller's listings.
- Use the API to scrape competitor pricing in bulk.
- Republish API responses to the public.

### Tier 2 — Clipboard + deep-link handoff

For platforms that have no public API (Facebook Marketplace, OfferUp, Nextdoor, Craigslist), Tidyup prepares the listing on the user's device and opens the platform's own posting page. The user pastes and clicks Publish themselves.

| Platform | Status |
|---|---|
| Facebook Marketplace | ✅ Wired |
| OfferUp | ✅ Wired |
| Nextdoor | ✅ Wired |
| Craigslist | ✅ Wired |

Why this is safe — and is the only safe approach for these platforms:
- We never make HTTP requests to the platform on the user's behalf.
- We never see the user's password or session cookie for these platforms.
- The user posts inside the platform's own UI, using their own logged-in session.
- The platform receives the listing exactly as if the user had typed it.
- Our involvement is functionally identical to the user composing the listing in Notes and pasting it.

This pattern has been used by cross-listing tools (Crosslist, Vendoo, Voolist, etc.) for years without legal action — because there is nothing to act against. We are not accessing the platform.

What we must NOT do — these are the actions that get apps sued or kicked off app stores:

- ❌ **Browser automation** (Puppeteer, Playwright, Selenium) to post on the user's behalf
- ❌ **Scraping** listings, prices, sold history, or messages from the platform's site
- ❌ **Bypassing rate limits, CAPTCHAs, or bot detection**
- ❌ **Using the user's password** for these platforms in any way
- ❌ **Reverse-engineering private APIs** (e.g. the JSON endpoints Facebook's web app uses internally)
- ❌ **Posting fake reviews, fake accounts, or coordinated inauthentic behavior**
- ❌ **Republishing platform data on a public Tidyup-hosted page**

If a future contributor proposes "let's just automate Facebook posts in the background," the answer is no. That is the exact failure mode that gets companies sued (Craigslist v. 3taps, hiQ v. LinkedIn, Meta v. multiple) and gets apps removed from the App Store.

## The "we never post for you" rule

Every UI flow that interacts with a tier-2 platform must:
1. Tell the user exactly what's about to happen.
2. Require an explicit tap to proceed.
3. Open the platform's own UI in a new tab/window.
4. Let the user be the one who hits Publish on the platform's page.

Tier-1 platforms (eBay, Etsy) are the only exception — because the user pre-authorized that automation via OAuth and the platform itself permits it.

## Data we store, data we don't

We store:
- Firebase user ID (sub), email, display name, profile picture
- OAuth access + refresh tokens for tier-1 platforms (encrypted at rest in D1)
- The user's own listings: title, description, price, photo URL, category
- Posting history: which platforms a listing was sent to and when
- Messages we receive via tier-1 platforms' inbox APIs

We do NOT store:
- The user's password for anything
- Other users' listings on tier-2 platforms (we don't scrape)
- Platform analytics or competitor pricing data
- Any tier-2 platform's internal data

## When in doubt

If you're about to build a feature that involves a third-party marketplace and aren't sure if it's in tier 1 or tier 2, the test is:

> "Does this feature send an HTTP request to the platform, on behalf of a user, without using a publicly-documented API?"

If yes — stop. Either find an API path (tier 1) or move to handoff (tier 2). There is no middle ground that survives contact with their legal team.

## Required visible disclosures

The login screen must display links to Terms of Service and Privacy Policy. Both should disclose:
- Tidyup is not affiliated with eBay, Facebook, OfferUp, Nextdoor, Craigslist, etc.
- Logos and platform names are trademarks of their respective owners.
- We never sell user data.
- We retain OAuth tokens until the user disconnects or deletes their account.

Stub Terms / Privacy pages live at `/terms` and `/privacy`. Before any wide launch, replace these with real documents reviewed by a lawyer.
