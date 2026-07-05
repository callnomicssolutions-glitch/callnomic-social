# Callnomic Social — complete step-by-step

Everything you need, start to finish. Phase 1 (Telegram) is already done and live.
This doc focuses on **Phase 2: automating the actual posting** to LinkedIn + Instagram.

---

## Part A — How the automation works (the big picture)

There is **no server** and **no monthly cost**. GitHub runs your schedule in its own cloud.

```
        ┌─────────────────────────── GitHub Actions (free cloud) ──────────────────────────┐
        │  runs every ~30 min automatically                                                 │
        │                                                                                   │
        │  1. Read your Telegram taps  ──►  did you Approve / Skip / Redo a draft?           │
        │  2. Publish approved posts   ──►  LinkedIn API + Instagram API                     │
        │  3. Every 12h: make a new draft ─► pick post + render branded image                │
        │                                    └─► send to your Telegram with buttons          │
        │  4. Save state back to the repo (its "memory")                                     │
        └───────────────────────────────────────────────────────────────────────────────────┘
```

**Your only job forever:** a draft arrives in Telegram → you tap ✅ → it posts itself.
The "automation" is: the schedule + your one tap. No copy-pasting, no logging into LinkedIn/IG.

**What makes posting automatic** = the platform API tokens. Once those 4 secrets exist in
GitHub, tapping ✅ makes the Action call LinkedIn/Instagram and publish for you. That's it.

---

## Part B — What's already done (Phase 1) ✅

1. Repo is live: `github.com/callnomicssolutions-glitch/callnomic-social`
2. Telegram bot created: `@callnomicsocialmediabot`
3. Secrets `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set (encrypted).
4. The workflow runs every 30 min and DMs you drafts with working buttons.

The only thing missing is telling it *where to post* — that's Phase 2 below.

---

## Part C — Phase 2, Step 1: LinkedIn (post to your Company Page)

You need two values: `LINKEDIN_ORG_URN` and `LINKEDIN_ACCESS_TOKEN`.

### C1. Create the LinkedIn app
1. Go to **https://www.linkedin.com/developers/apps** → **Create app**.
2. Fill: App name = `Callnomic Social`, **LinkedIn Page** = your Callnomic company page,
   upload the logo, agree, **Create app**.
3. Open the app → **Settings** tab → **Verify** the app with your Page (click the verify
   link; as Page admin you approve it). This links the app to your page.

### C2. Request the posting permission
1. App → **Products** tab.
2. Request **"Community Management API"** (this grants `w_organization_social` — posting as
   your company page). Also add **"Sign In with LinkedIn using OpenID Connect"** (for auth).
   - Community Management API may require a short review describing your use
     ("Scheduling our own company's organic posts"). Approval can take a few days.
   - If you'd rather post to your **personal profile** instead of the company page while you
     wait, request **"Share on LinkedIn"** (grants `w_member_social`) — see the note in C4.

### C3. Find your Organization URN
1. Open your **Callnomic Company Page** as admin.
2. Look at the URL of the admin view — it contains a number, e.g.
   `linkedin.com/company/12345678/admin/` → the id is `12345678`.
3. Your value is: `LINKEDIN_ORG_URN = urn:li:organization:12345678`

### C4. Generate the access token
1. App → **Auth** tab → find the **OAuth 2.0 tools** → **"Create a new access token"**
   (token generator).
2. Tick the scopes: `w_organization_social` (and `r_organization_social`).
3. Sign in, authorize → it gives you an **access token** → that's `LINKEDIN_ACCESS_TOKEN`.
   - ⚠️ Valid ~**60 days**. When it expires, repeat this step and update the secret.
   - Personal-profile fallback: if you only got `w_member_social`, tell me and I'll switch
     the code to post to your profile (uses your person URN instead of the org URN).

### C5. Give me the two values
Send me `LINKEDIN_ORG_URN` and `LINKEDIN_ACCESS_TOKEN` and I'll add them to GitHub (encrypted),
or you can add them yourself: repo → **Settings → Secrets and variables → Actions → New secret**.

---

## Part D — Phase 2, Step 2: Instagram (post to your IG Business account)

You need two values: `IG_USER_ID` and `IG_ACCESS_TOKEN`.
Instagram posting goes **through Facebook**, so the setup has a few hops.

### D1. Prerequisites (do these first)
1. Your Instagram must be a **Business** (or Creator) account:
   IG app → Settings → Account type → **Switch to professional → Business**.
2. Create/So have a **Facebook Page** for Callnomic, and **connect your IG to that Page**:
   IG app → Settings → **Accounts Centre** → add the Facebook Page, OR on the FB Page →
   Settings → **Linked accounts** → Instagram → connect.

### D2. Create the Meta app
1. Go to **https://developers.facebook.com/apps** → **Create app**.
2. Use case: choose **"Other"** → type **"Business"** → next.
3. Name = `Callnomic Social`, your email, **Create app**.
4. In the app dashboard → **Add product** → add **"Instagram"** (Instagram Graph API).

### D3. Make yourself a tester (so it works without full App Review)
- App → **App roles / Roles** → add yourself as **Admin/Tester** (you already are as creator).
- Because you own the IG account and you're an admin, you can publish in **Development mode** —
  no lengthy App Review needed for your own account.

### D4. Get a token + the two IDs with the Graph API Explorer
1. Open **https://developers.facebook.com/tools/explorer**.
2. Top right: select your app `Callnomic Social`.
3. Click **"Generate Access Token"** and grant these permissions:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
   `pages_read_engagement`, `business_management`.
4. Run these queries (type in the box, click **Submit**):
   - `me/accounts` → find your Page → copy its **`id`** (this is your PAGE_ID) and note its
     `access_token` (a page token).
   - `PAGE_ID?fields=instagram_business_account` → returns
     `{"instagram_business_account":{"id":"1784..."}}` → that id is your **`IG_USER_ID`**.

### D5. Make the token long-lived (~60 days)
Short tokens die in ~1 hour. Exchange for a long-lived one:
1. App → **Settings → Basic** → copy **App ID** and **App Secret**.
2. In a browser, open (replace the 3 CAPS values):
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN
   ```
   → returns a long-lived **user** token.
3. Run `me/accounts` again **with that long-lived token** → the Page's `access_token` you get
   back now is a **long-lived page token** → that's your **`IG_ACCESS_TOKEN`**.
   - ⚠️ Lasts ~**60 days**. When posting fails, redo D4–D5 and update the secret.

### D6. Give me the two values
Send me `IG_USER_ID` and `IG_ACCESS_TOKEN` and I'll add them (encrypted), or add them yourself
under repo → Settings → Secrets and variables → Actions.

---

## Part E — Turn it fully on & test
Once the 4 secrets exist:
1. Repo → **Actions → Callnomic Social → Run workflow** → tick **force_draft** → Run.
2. A fresh draft hits your Telegram → tap **✅ Approve & post**.
3. Within ~30 min the next run publishes it and Telegram replies with the **live post link**.

That's the whole loop, automated. From then on you just approve.

---

## Part F — Day-to-day & tuning
- **Cadence:** set repo Variable `POST_INTERVAL_HOURS` (default 12 → ~1 post/platform/day).
- **Platforms:** Variable `PLATFORMS` = `linkedin,instagram` (drop one to pause it).
- **Fresh AI posts:** Variable `AI_FRESH=1` + secret `GROQ_API_KEY` (optional; costs Groq tokens).
- **Add your own posts:** edit `content/library.js`, commit. Preview with `npm run preview`.
- **Token refresh (~every 60 days):** the bot Telegrams you the error → regenerate → update secret.

## Part G — Cost recap
GitHub Actions: free · Images: free (templates) · Text: free (library) · APIs: free.
No subscriptions anywhere.
