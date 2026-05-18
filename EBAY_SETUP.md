# eBay setup (for you, Kent — ~15 minutes)

The frontend and Worker are wired up for real eBay OAuth + auto-posting. The only thing missing is the eBay developer credentials, which require your business info + acceptance of their developer agreement. I can't do this for you.

## 1. Create an eBay developer account (5 min)

1. Go to https://developer.ebay.com/signin
2. Click **Sign In with eBay** and use your existing eBay account (or create one).
3. You'll be prompted to register as a developer. Accept the developer agreement.

## 2. Create an app (5 min)

1. Once signed in: https://developer.ebay.com/my/keys
2. Under **Keysets**, you'll see **Sandbox** and **Production** sections.
3. Click **Create a keyset** under **Sandbox** (use sandbox first — production needs more vetting).
4. Give it the application title `Tidyup` and continue.
5. You'll get three values for sandbox. We need two:
   - **App ID (Client ID)** — looks like `Kent-Tidyup-SBX-abc123-def4567`
   - **Cert ID (Client Secret)** — looks like `SBX-abc123def456-ghi7-jklm-nopq-rstuvwxyz`

## 3. Set up the RuName (OAuth redirect) (5 min)

1. On the same keys page, find **User Tokens** → **Get a Token from eBay via Your Application**.
2. Click **Add eBay Redirect URL** under Sandbox.
3. Fill in:
   - **Your auth accepted URL**: `https://tidyup-api.satraps-debate-0r.workers.dev/api/connections/ebay/callback`
   - **Your auth declined URL**: `https://tidyup-3xc.pages.dev/?ebay=cancelled`
   - **Your privacy policy URL**: anything works for sandbox; for production use a real URL
4. Save. eBay assigns you a **RuName** that looks like `Kent_Tidyup-Kent-Tidyu-abcde-fghijk`. Copy it.

## 4. Tell Tidyup about the credentials (3 commands)

From `C:\Users\Kent\projects\tidyup\worker`:

```powershell
cd C:\Users\Kent\projects\tidyup\worker
echo "PASTE_YOUR_APP_ID_HERE" | npx wrangler secret put EBAY_CLIENT_ID
echo "PASTE_YOUR_CERT_ID_HERE" | npx wrangler secret put EBAY_CLIENT_SECRET
```

Then open `worker/wrangler.toml` and replace the empty `EBAY_RUNAME = ""` with your RuName:

```toml
EBAY_RUNAME = "Kent_Tidyup-Kent-Tidyu-abcde-fghijk"
```

Then redeploy the Worker:

```powershell
npx wrangler deploy
```

## 5. Test it

1. Open https://tidyup-3xc.pages.dev
2. Sign in with Google
3. Tap your avatar → **Connections**
4. Click **Connect** next to eBay
5. eBay opens, asks you to sign in, asks to authorize Tidyup
6. After approval, you're redirected back to Tidyup with eBay marked Connected
7. Snap a photo of something → tap **Post to eBay** in the listing card
8. The listing appears in your **sandbox** eBay account: https://www.sandbox.ebay.com

## Going to production (later)

Sandbox is for testing only. Once you've confirmed posting works, repeat steps 2-4 under the **Production** section instead of Sandbox. Also change `EBAY_ENVIRONMENT = "sandbox"` to `EBAY_ENVIRONMENT = "production"` in `worker/wrangler.toml` and redeploy. Production approval can take a day or two — eBay reviews your app.

---

## Troubleshooting

- **"eBay not configured" error**: secrets aren't set. Run the `wrangler secret put` commands again.
- **"Invalid state" error**: the OAuth state expired (10 min TTL). Click Connect again.
- **eBay says "invalid_request"**: your RuName probably doesn't match. Double-check.
- **Listings appear with category 99**: eBay requires a real category for some items. We use a generic fallback. You can edit the listing on eBay to fix the category.
