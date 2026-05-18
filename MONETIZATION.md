# Monetization strategy — how Tidyup stays free without becoming spam

Tidyup is free for casual sellers. To stay free, we need revenue that aligns with what users actually want — not banner ads that drive them away.

## Core principles

1. **No banner ads. No popups. No interstitials.** If we wouldn't tolerate it in our own apps, we don't ship it.
2. **Helpful, not annoying.** Every monetized surface must answer a question the user is actually asking right then (e.g. "how do I ship this?" → cheap label).
3. **Clearly labeled.** Affiliate links say "Tip:" or "Sponsored" — never disguised as features. FTC requires this anyway.
4. **Always dismissible.** One tap to hide. Remembered for that listing.
5. **Anonymized data, not personal data.** Aggregated insights only. No selling individual user behavior.
6. **One-tap opt-out.** User menu has an "Hide recommendations" toggle that kills all of this site-wide.
7. **Pro tier removes everything.** Paying users see zero recommendations.

## The 6 revenue streams, ranked by quality

### 1. Shipping affiliate (highest leverage — helps the user, pays well)

When a user posts to eBay and the listing sells, they need a shipping label.

- **Pirate Ship** — open affiliate program, $0.50–$2 per label, no minimums
- **Shippo** — partner program, similar payout
- **EasyPost** — developer-friendly, higher commissions but more setup

Surface: after a sale is recorded on eBay, chat assistant says
> "Need to ship this? Pirate Ship gives you USPS rates 80% cheaper than the post office counter. [Print a label →]"

Frequency: once per sale. Dismissible.

### 2. Shipping supplies affiliate (post-sale)

After labels, users need bubble mailers, boxes, tape.

- **Amazon Associates** — ~3% commission, our links to specific products that are already cheap (no markup, just curation)
- **Uline** — higher volume, requires business account
- **ULINE Liquidation** — for occasional bulk buyers

Surface: once a user has posted >3 listings or recorded their first sale, suggest
> "Tip: starter shipping kit — 50 mailers + tape + thermal labels ($24 on Amazon)"

Frequency: once per "first sale" milestone, then once per month if active.

### 3. Trade-in alternatives (high commissions, genuine help for hard-to-sell items)

For items unlikely to sell well peer-to-peer (old iPhones, MacBooks, textbooks, video games), refer to instant-cash trade-in services.

- **Decluttr** — $5–15 per referral
- **BackMarket** — affiliate program for refurbished electronics
- **Gazelle** — phone trade-ins
- **Bookscouter / Decluttr Books** — for books

Surface: when AI identifies an item that falls into these categories, listing card includes a small button:
> "Faster cash: Decluttr offers a guaranteed $180 for this iPhone 11. [See offer →]"

Frame as alternative, not pressure. User is free to list normally.

### 4. Pro tier subscription ($7.99/mo)

For users who become serial sellers (>5 listings/month).

What Pro unlocks:
- **No recommendations** — completely ad-free experience
- **Unlimited active listings** (free tier capped at 5)
- **Claude Opus for high-value items** — better AI for items >$200 where listing quality matters
- **Bulk re-pricing** — drop prices across all your listings with one tap
- **Cross-platform inbox** — unified messages from all wired platforms (already a feature, but Pro gets full message search history)
- **Auto-relist** — items expire on Facebook Marketplace after 7 days; we re-post automatically
- **Priority support**

Free tier limits:
- 5 active listings at a time
- Standard Gemini for AI (still very good)
- Recommendations shown post-sale

Payment: Stripe. No card on file = stays free.

### 5. Aggregated insights (B2B revenue, opt-in)

Anonymized, aggregated pricing data is genuinely valuable to other businesses:
- Resale platforms want to understand category trends
- Brands want to know secondary-market prices
- Insurance companies value used-item depreciation curves

What we collect (anonymized at the point of capture, no user-tied):
- Item categories
- Asking price ranges
- Time-to-sale by platform
- Region (city-level, never finer)
- Condition reported

What we do NOT collect for this:
- User identities
- Photos
- Listing descriptions
- Anything that could identify a seller or buyer

How we sell it:
- Aggregated dashboards licensed to research firms ($2k-10k/quarter per dataset)
- API access for marketplaces ($500-2k/mo)
- One-off custom reports

User control:
- Privacy settings → "Contribute anonymized data to Tidyup insights" toggle (on by default with clear disclosure)
- Users see their own aggregated data back: "Items in your category sell in an average of 12 days"

Legal:
- Disclosed in Privacy Policy
- Honors do-not-sell signals (CCPA, etc.)
- Annual transparency report

### 6. Co-marketing partnerships (no user impact)

Once we have meaningful traffic, partner with brands:
- Label printer makers (Rollo, DYMO, MUNBYN) — they want resellers, we have resellers
- Photo lighting kits — same
- Cricut, scrapbooking, craft tool makers — match our seller demographic
- Storage solutions (the Container Store, IKEA) — declutter audience

Format: integrated content, no banner ads. "Tidyup × Rollo" guide about printing cheap shipping labels. Brand pays for the integration.

## What we will never do

- ❌ Sell individual user data
- ❌ Show banner ads, popups, or interstitials
- ❌ Run third-party ad scripts (Google Ads, Meta Pixel, etc.)
- ❌ Lock basic listing features behind paywall
- ❌ Charge sellers a percentage of sales
- ❌ Sell affiliated services as if they were neutral recommendations
- ❌ Make Pro tier required for safety features (always free)

## Implementation roadmap

| Phase | What | When |
|---|---|---|
| Now | Scaffolding (Recommendations component, dismiss state, opt-out toggle) | Tonight |
| Week 1 | Pirate Ship affiliate live (real link, real tracking) | After eBay setup is verified |
| Week 2 | Amazon Associates approval + supplies recommendation | Needs Kent's Associates application |
| Week 3 | Decluttr / BackMarket partner sign-ups | Apply during business hours |
| Month 2 | Pro tier — Stripe integration, paywall logic | After we have 50+ active free users |
| Month 3 | Insights data aggregation backend | Backend infrastructure work |
| Month 6 | Co-marketing — first brand integration | Needs reach/traction |

## Tracking & measurement

Per recommendation, track (anonymized):
- Impression (when shown)
- Dismiss (user closed it)
- Click (user tapped through to affiliate)
- Conversion (recorded via affiliate partner's tracking)

Display ratios in a private admin dashboard:
- Helpful = clicks / impressions
- Annoying = dismisses / impressions

Kill any recommendation where annoying > 50%. Always.

## Pro tier conversion target

Industry benchmark for free-to-paid conversion in B2C SaaS: 2-5%.
Tidyup's hook is concrete — power users who sell 20+ items/month save hours on bulk operations. Realistic conversion among that segment: 10-15%.

At 1,000 free users and a 10% conversion rate among the ~10% who are power users: ~10 Pro subscribers × $7.99 = ~$80/mo. Not life-changing on its own, but combines with shipping affiliates (~$200/mo at that scale) and supplies (~$50/mo) to ~$330/mo before any insights or co-marketing.

The real volume comes after 10,000+ users when shipping affiliates start producing $5–10k/mo passively.
