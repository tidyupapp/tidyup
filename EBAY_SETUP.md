# eBay setup (~15 minutes)

The frontend and Worker are wired up for real eBay OAuth + auto-posting. The only thing missing is eBay developer credentials, which require accepting eBay's developer agreement and providing business info — that's an account-holder action.

## 1. Create an eBay developer account (5 min)

1. Go to https://developer.ebay.com/signin
2. Click **Sign In with eBay** and use an existing eBay account (or create one).
3. You'll be prompted to register as a developer. Accept the developer agreement.

## 2. Create an app (5 min)

1. Once signed in: https://developer.ebay.com/my/keys
2. Under **Keysets**, you'll see **Sandbox** and **Production** sections.
3. Click **Create a keyset** under **Sandbox** (use sandbox first — production needs more vetting).
4. Give it the application title `Tidyup` and continue.
5. You'll get three values for sandbox. We need two:
   - **App ID (Client ID)** — looks like `Username-Tidyup-SBX-abc123-def4567`
   - **Cert ID (Client Secret)** — looks like `SBX-abc123def456-ghi7-jklm-nopq-rstuvwxyz`

## 3. Set up the RuName (OAuth redirect) (5 min)

1. On the same keys page, find **User Tokens** → **Get a Token from eBay via Your Application**.
2. Click **Add eBay Redirect URL** under Sandbox.
3. Fill in:
   - **Your auth accepted URL**: `https://tidyup-api.satraps-debate-0r.workers.dev/api/connections/ebay/callback`
   - **Your auth declined URL**: `https://tidyup-app.pages.dev/?ebay=cancelled`
   - **Your privacy policy URL**: `https://tidyup-app.pages.dev/privacy.html`
4. Save. eBay assigns a **RuName** that looks like `Username_Tidyup-Username-Tidyu-abcde-fghijk`. Copy it.

## 4. Tell Tidyup about the credentials

From the worker directory:

```powershell
cd projects\tidyup\worker
echo "PASTE_APP_ID_HERE" | npx wrangler secret put EBAY_CLIENT_ID
echo "PASTE_CERT_ID_HERE" | npx wrangler secret put EBAY_CLIENT_SECRET
```

Then open `worker/wrangler.toml` and replace the empty `EBAY_RUNAME = ""` with the RuName:

```toml
EBAY_RUNAME = "Username_Tidyup-Username-Tidyu-abcde-fghijk"
```

Then redeploy the Worker:

```powershell
npx wrangler deploy
```

## 5. Test it

1. Open https://tidyup-app.pages.dev
2. Sign in with Google
3. Tap the avatar → **Connections**
4. Click **Connect** next to eBay
5. eBay opens, asks to sign in, asks to authorize Tidyup
6. After approval, redirected back to Tidyup with eBay marked Connected
7. Snap a photo of something → tap **Post to eBay** in the listing card
8. The listing appears in the **sandbox** eBay account: https://www.sandbox.ebay.com

## Going to production (later)

Sandbox is for testing only. Once posting works, repeat steps 2-4 under the **Production** section instead of Sandbox. Also change `EBAY_ENVIRONMENT = "sandbox"` to `EBAY_ENVIRONMENT = "production"` in `worker/wrangler.toml` and redeploy. Production approval can take a day or two — eBay reviews each app.

---

## Troubleshooting

- **"eBay not configured" error**: secrets aren't set. Run the `wrangler secret put` commands again.
- **"Invalid state" error**: the OAuth state expired (10 min TTL). Click Connect again.
- **eBay says "invalid_request"**: the RuName probably doesn't match. Double-check.
- **Listings appear with category 99**: eBay requires a real category for some items. We use a generic fallback. Edit the listing on eBay to fix the category.
