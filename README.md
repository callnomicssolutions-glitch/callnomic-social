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

- The Action wakes on a cron **and then stays online for `WATCH_MINUTES` (default 20)**
  long-polling Telegram, so a button tap is acted on within **seconds**.
  (The `*/5` cron alone is not enough: GitHub throttles frequent schedules down to
  roughly one run an hour, which made approvals feel like they did nothing.)
- Every **`POST_INTERVAL_HOURS`** (default **12h**) it creates a new draft and sends it to you.
- It **alternates platforms**, so you get roughly **one LinkedIn + one Instagram post per day**.
- If you don't answer a draft within `PENDING_TTL_HOURS` (default **168h / 7 days**) it
  expires — but **tapping ✅ on an expired draft still publishes it**; the media is
  re-rendered if it was cleaned up in the meantime.
- A publish that fails is **retried automatically** (up to `MAX_PUBLISH_ATTEMPTS`, default 3)
  before it's reported as failed.
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
- **✅ Approve & post** → it publishes within seconds if the run is watching, otherwise
  on the next run. Works on old drafts too.
- **✏️ Redo** → discards it and sends a different draft.
- **❌ Skip** → drops it; the next scheduled draft comes at the normal time.

### Typed commands (fallback when a tap doesn't land)
Send these to the bot in the same chat:

| Command | What it does |
|---|---|
| `/status` | everything waiting or failed, with ids |
| `/postall` | approve & publish **everything pending**, now |
| `/approve <id>` | publish one (id from `/status`) |
| `/skip <id>` | drop one |
| `/retry` | retry anything that failed |
| `/help` | the list above |

### Daily morning publishing
Queued content goes out in **one morning window**, not round the clock:

| Repo variable | Default | Meaning |
|---|---|---|
| `DAILY_HOUR_UTC` | `5` | window opens (05:00 UTC = 09:00 Gulf time) |
| `DAILY_WINDOW_HOURS` | `4` | how long it stays open |
| `DAILY_PER_BUCKET` | `1` | posts per bucket per day |

Buckets are **LinkedIn**, **Instagram feed** and **Instagram Reels** — so a normal
morning is one LinkedIn post, one Instagram post and one Reel, roughly an hour apart
(`MIN_GAP_HOURS`). Dedicated hourly crons cover the window so GitHub's throttling of the
`*/5` schedule can't make it miss a day.

This paces the **queue** only. Anything you approve by tapping ✅ publishes immediately.

### Never posts the same thing twice
Publishing is not undoable, so the engine records its intent **before** it publishes and
pushes that record straight away. If a run publishes and then loses its state — a
rejected push, a cancelled job, a dead runner — the next run still sees the post as
handled and leaves it alone. Two safeguards follow from this:
- If the intent can't be recorded, **the post is not published** and is retried later.
  A missed post is recoverable; a duplicate on a live account isn't.
- If an upload fails in a way that doesn't say whether it landed (a network error rather
  than an API rejection), the post is held in `publishing` and Telegram asks you to
  check. `/retry` releases it, `/skip <id>` drops it.

### Recovering a backlog
If drafts piled up unanswered, Actions → **Callnomic Social → Run workflow** and set
**backlog**:
- `pending` — approve & publish everything still pending, this run.
- `expired` — also revive expired drafts whose media still exists, **dripped ~2/day**
  so a backlog doesn't land as one spam-looking burst. Content already published is skipped.

## Add your own posts
Open **`content/library.js`** and add items to the `LIBRARY` array:
```js
{ pillar: "outcome", headline: "Short line for the image.", caption: "The post body…", tags: ["#GCC"] }
```
Preview the image design any time with `npm run preview` (writes to `state/images/`).

## Reels (educational, Instagram only)
Separate from the formal image posts: kinetic-caption videos that teach the business
community *why* they need AI, not just promote Callnomic — built for reach/conversion.
- Scripts live in **`content/reels.js`** (`REELS` array: `hook`, `lines[]`, `cta`, `tags`).
  Add your own the same way as the post library.
- Rendered with `@napi-rs/canvas` + `ffmpeg` (installed automatically on the runner) —
  zero AI/video-gen cost. Runs on its own cadence, default every **84h** (`REEL_INTERVAL_HOURS`
  repo variable), independent of the image-post schedule. Force one now: Actions →
  Callnomic Social → Run workflow → tick **force_reel**.
- **Audio is opt-in.** Drop licensed/royalty-free tracks into `brand/audio/` (`.mp3`/`.m4a`/`.wav`)
  and the renderer mixes one in automatically. Empty folder = silent, caption-first Reels
  (a legitimate, common style). We never auto-fetch "trending" audio — Instagram's trending
  library isn't reachable via the publishing API anyway, and licensing is your call.
- Preview the frame design without ffmpeg: `npm run preview-reel`.
- Turn Reels off entirely: repo variable `REELS_ENABLED=0`.

## Maintenance (the only recurring chore)
LinkedIn and Instagram tokens **expire ~every 60 days**. When posting starts failing, Telegram
will message you the error. Just regenerate the token (steps 3–4) and update the secret. That's it.

### When a platform refuses to publish
Some failures aren't transient and retrying makes them worse. If LinkedIn returns 401/403/426,
or Instagram returns an OAuth error (code 10/25/190/200 — expired token, missing permission, or
**"The Instagram account is restricted"**), the engine:
- **holds** the post instead of burning its retries and marking your content failed,
- messages you once with the exact platform error,
- **publishes it automatically** as soon as the block clears — nothing is lost.

Instagram's `code 25 / subcode 2207050` means Meta has restricted the account from publishing
via the API. It is usually a temporary integrity action, often triggered by posting a burst in a
short window. It clears on its own; check Instagram → *Settings → Account status* for details.
No amount of retrying speeds it up — which is why publishing is now capped at
`MAX_PER_PLATFORM_PER_RUN` (default 2) per platform per run, and backlog recovery drips.

## Cost
- GitHub Actions: **free** (public repo).
- Images: **free** (local templates, no AI).
- Text: **free** (content library). Groq only if you opt in.
- LinkedIn / Instagram APIs: **free**.
