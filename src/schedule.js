// Shared daily scheduling. Both the backlog recovery tool and the engine's auto-queue
// put posts on the same calendar, so they can't hand two posts the same slot.
//
// Buckets are LinkedIn, the Instagram feed and Instagram Reels. Each gets `perBucket`
// slots a day, so a normal morning is one LinkedIn post, one Instagram post and one
// Reel rather than three of the same thing.

const DAY_MS = 86_400_000;

export function bucketOf(post) {
  return post.type === "reel" ? "instagram-reel" : post.platform;
}

// The first morning slot still ahead of us. Resolving "is it in the past?" per offset
// instead would put the first two posts of a bucket on the same morning.
export function firstMorning(dailyHour, from = Date.now()) {
  const d = new Date(from);
  d.setUTCHours(dailyHour, 5, 0, 0);
  return d.getTime() <= from ? d.getTime() + DAY_MS : d.getTime();
}

/**
 * Put `posts` into the daily queue, filling the earliest day whose bucket still has
 * room. Slots already taken by other queued posts are respected, so staging twice (or
 * staging while the auto-queue is also running) spreads posts out instead of stacking
 * them on one morning.
 */
export function assignDailySlots(state, posts, { dailyHour = 5, perBucket = 1 } = {}) {
  const base = firstMorning(dailyHour);
  const staging = new Set(posts);

  // bucket -> Map(dayOffset -> posts already scheduled that day)
  const taken = new Map();
  const claim = (b, idx) => {
    if (!taken.has(b)) taken.set(b, new Map());
    const m = taken.get(b);
    m.set(idx, (m.get(idx) || 0) + 1);
  };
  for (const p of state.posts) {
    if (staging.has(p)) continue;
    if (p.status !== "approved" || !p.paced || !p.publishAfter) continue;
    const idx = Math.round((new Date(p.publishAfter).getTime() - base) / DAY_MS);
    if (idx >= 0) claim(bucketOf(p), idx);
  }

  for (const p of posts) {
    const b = bucketOf(p);
    const m = taken.get(b) || new Map();
    let idx = 0;
    while ((m.get(idx) || 0) >= perBucket) idx += 1;
    claim(b, idx);
    p.status = "approved";
    p.paced = true;
    p.attempts = 0;
    p.error = "";
    p.publishStartedAt = "";
    p.publishAfter = new Date(base + idx * DAY_MS).toISOString();
  }
  return posts;
}
