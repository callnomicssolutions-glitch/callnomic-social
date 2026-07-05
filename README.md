# Callnomic Social — free, self-running social engine

Posts about Callnomic to **LinkedIn + Instagram** on a schedule, with **you approving each
post from Telegram** before it goes live. Runs entirely in **GitHub Actions** (free) — no
server, no subscription, and images are **branded templates** so they cost **zero tokens**.

```
GitHub Actions (cron, free)
        │
        ├─ picks the next post from the content library (no AI cost)
        ├─ renders a branded image locally (no AI cost)
        ├─ Telegram → sends you the draft with ✅ / ✏️ / ❌ buttons
        │                       │
        │                  you tap ✅
        │                       ▼
        └─ next run → publishes to LinkedIn + Instagram
```

You only ever tap a button. Everything else is automatic.

---

## How it behaves

- Every **~5 min** the Action wakes up, checks your Telegram taps, and posts anything you approved.
- Every **`POST_INTERVAL_HOURS`** (default **12h**) it creates a new draft and sends it to you.
- It **alternates platforms**, so you get roughly **one LinkedIn + one Instagram post per day**.
- If you don't answer a draft within `PENDING_TTL_HOURS` (default 48h) it quietly expires — no spam.
- The default runs on the built-in **content library** (`content/library.js`) at **zero API cost**.
  Turn on `AI_FRESH=1` only if you want Groq to write fresh posts (uses your Groq free tier).

---

## One-time setup (~30–40 min)

You do this once. After that it runs itself.

### 1. Put this on GitHub
Create a **public** repo (public = unlimited free Actions minutes; no secrets live in the code,
they go in encrypted Settings). Then push this folder to it.
> Fadil: I can do this step for you with one command if you want — just say so.

### 2. Telegram approval bot (5 min)
1. In Telegram, open **@BotFather** → `/newbot` → follow prompts → copy the **bot token**.
2. Open your new bot and tap **Start** (send it any message).
3. Get your **chat id**: message **@userinfobot** → it replies with your numeric id.
4. You'll add both as secrets in step 5 (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

### 3. LinkedIn (company page posting)
1. Go to **developer.linkedin.com** → **Create app**, link it to your Callnomic company page.
2. Under **Products**, request **"Share on LinkedIn"** and **"Community Management API"**
   (needed to post as the organization; approval can take a little time).
3. Get your **organization URN**: it's `urn:li:organization:<id>` — the `<id>` is in your
   company page admin URL. → `LINKEDIN_ORG_URN`.
4. Generate an **access token** with scope `w_organization_social` (via the app's OAuth token tool).
   → `LINKEDIN_ACCESS_TOKEN`.
   ⚠️ LinkedIn tokens **expire ~60 days** — see "Maintenance" below.

### 4. Instagram (via a Facebook Page)
1. Convert your Instagram to a **Business** account and **connect it to a Facebook Page**.
2. At **developers.facebook.com** → create an app (type **Business**) → add **Instagram Graph API**.
3. Using the **Graph API Explorer**, grant `instagram_basic`, `instagram_content_publish`,
   `pages_read_engagement`, `pages_manage_posts`.
4. Get your **IG Business account id** → `IG_USER_ID`, and a **long-lived page access token**
   → `IG_ACCESS_TOKEN`. (Long-lived tokens last ~60 days — see "Maintenance".)

### 5. Add the secrets & settings in GitHub
Repo → **Settings → Secrets and variables → Actions**.

**Secrets** (encrypted):
| Secret | From |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather |
| `TELEGRAM_CHAT_ID` | @userinfobot |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn app |
| `LINKEDIN_ORG_URN` | e.g. `urn:li:organization:12345678` |
| `IG_USER_ID` | Graph API |
| `IG_ACCESS_TOKEN` | Graph API long-lived token |
| `GROQ_API_KEY` | *(optional)* only if you set `AI_FRESH=1` |

**Variables** (optional knobs — not secret):
| Variable | Default | Meaning |
|---|---|---|
| `PLATFORMS` | `linkedin,instagram` | which platforms to post to |
| `POST_INTERVAL_HOURS` | `12` | hours between drafts |
| `AI_FRESH` | *(unset)* | set to `1` to let Groq write fresh posts |
| `LINKEDIN_VERSION` | `202405` | LinkedIn API version month |

### 6. Turn it on
Repo → **Actions** tab → enable workflows. Then **Actions → Callnomic Social → Run workflow**
and tick **force_draft** to get your first draft in Telegram immediately.

---

## Using it day to day
- A draft lands in Telegram: branded image + the exact caption.
- **✅ Approve & post** → it publishes on the next run (within ~5 min).
- **✏️ Redo** → discards it and sends a different draft.
- **❌ Skip** → drops it; the next scheduled draft comes at the normal time.

## Add your own posts
Open **`content/library.js`** and add items to the `LIBRARY` array:
```js
{ pillar: "outcome", headline: "Short line for the image.", caption: "The post body…", tags: ["#GCC"] }
```
Preview the image design any time with `npm run preview` (writes to `state/images/`).

## Maintenance (the only recurring chore)
LinkedIn and Instagram tokens **expire ~every 60 days**. When posting starts failing, Telegram
will message you the error. Just regenerate the token (steps 3–4) and update the secret. That's it.

## Cost
- GitHub Actions: **free** (public repo).
- Images: **free** (local templates, no AI).
- Text: **free** (content library). Groq only if you opt in.
- LinkedIn / Instagram APIs: **free**.
