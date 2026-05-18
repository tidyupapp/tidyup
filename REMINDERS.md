# Reminders

## 📅 2026-05-25 (Monday) — Retry creating `tidyup@icloud.com` iCloud alias

**Context:** Apple's iCloud Mail web interface blocked alias creation on 2026-05-18 with a 7-day cooldown ("You had the maximum number of aliases and deleted one recently"). The cooldown ends 2026-05-25.

**Why:** A branded `tidyup@icloud.com` address looks cleaner on the Google sign-in consent screen than the current fallback (`tidyupapp-support@googlegroups.com` Google Group or `distant_quieter6p@icloud.com` HME).

**Steps when you're ready:**

1. Sign in to iCloud.com → Mail
2. Click the settings gear in the Mailboxes column header → Settings
3. In the Aliases section, click "Add Alias"
4. Address: `tidyup` → becomes `tidyup@icloud.com`
5. Label: "Tidyup support"
6. **Full Name: "Tidyup"** (replace the auto-filled real name — privacy)
7. Click Create

**If `tidyup` is taken, try these in order:**
- `tidyupapp`
- `gettidyup`
- `tidyupsupport`
- `usetidyup`

**After the alias exists:**

Ask Claude (or yourself) to swap the Google Cloud OAuth User Support Email at:
https://console.cloud.google.com/auth/branding?project=tidyup-b4b71

⚠️ Heads up: Google's OAuth consent screen restricts the support email to the account's own Google addresses or Google Groups the user owns. iCloud aliases may not be selectable. If that's the case, keep `tidyupapp-support@googlegroups.com` as the OAuth support email and just use the iCloud alias for direct user emails.

**Already in place (don't redo):**
- iCloud HME: `distant_quieter6p@icloud.com` (used as OAuth Developer Contact)
- Google Group: `tidyupapp-support@googlegroups.com` (used as OAuth User Support Email, pending CAPTCHA completion)

---

## Other open follow-ups

### eBay developer signup
[EBAY_SETUP.md](EBAY_SETUP.md) walks through getting eBay developer credentials (~15 minutes). Once you have App ID, Cert ID, and RuName, set them as Worker secrets and the `Connect eBay` button on the Connections page works.

### Pirate Ship affiliate program
Sign up at https://pirateship.com for affiliate ID. Paste into `src/lib/recommendations.ts` so the recommendation link tracks to your account.

### Amazon Associates
Apply at https://affiliate-program.amazon.com. ~1 day approval. After, add curated shipping-supply product links to recommendations.

### Decluttr / BackMarket / BookScouter partner sign-ups
Quick web forms for each. After signup, paste affiliate IDs into recommendations.

### Google verification (removes "unverified app" warning)
Once you've done a few weeks of usage and have real privacy/terms text reviewed by a lawyer, submit the app for verification at the Verification Center in Google Cloud Console. Takes weeks.
