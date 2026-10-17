// The second source of "what actually happened": git commits.
//
// Notes need Fadil to say something. Commits need nothing from him at all — they are
// already a dated, written record of what he built, and the commit messages across
// these repos are unusually descriptive. A week of them is enough to draft from.
//
// Read-only, via the GitHub API, with whatever token the workflow already has. A repo
// that 404s (private, renamed, no access) is skipped silently rather than failing the
// run — a missing repo should cost one input, not the digest.
const owner = () => process.env.GITHUB_REPO_OWNER || "callnomicssolutions-glitch";

// Which repos count as "what I'm working on". Opt in by name via ACTIVITY_REPOS. The
// default is NONE, deliberately.
//
// Listing every repo here is tempting and wrong. These commit logs are a debugging diary:
// "never promise a cart that is not there", "Stop telling customers we do not sell what the
// catalogue just returned", "the address the model made up". Every line is true, and every
// line describes our own product failing in front of a real customer - on the product we
// are selling, against a client's own catalogue and checkout. The SKIP filter below strips
// bot noise; it cannot tell honest-but-commercially-fatal from honest-and-safe, and it
// would wave all of that through as prime material for a public post.
//
// So commits stay off unless someone names a repo whose log they have read and would be
// happy to see quoted on LinkedIn. Notes (src/notes.js) are the intended input, because
// there Fadil chooses what goes in - the only filter that actually works here.
const repos = () =>
  (process.env.ACTIVITY_REPOS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const token = () => process.env.ACTIVITY_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

// Commit noise we never want a post written about. "social:" covers the engine's own
// state commits (parked / publishing / update state). Without it the digest reads the
// bot's bookkeeping as if it were Fadil's week - which is exactly what the first test
// produced: 60 of 60 commits were the engine talking to itself.
const SKIP = /^(social:|merge |bump |chore\(deps|wip\b|fixup!|squash!|\[skip ci\])/i;
// Belt and braces: filter by author too, so renaming the commit prefix can't let it back in.
const BOT_AUTHORS = new Set(["callnomic-bot", "github-actions[bot]", "web-flow"]);

async function repoCommits(repo, sinceIso) {
  const url =
    `https://api.github.com/repos/${owner()}/${repo}/commits` +
    `?since=${encodeURIComponent(sinceIso)}&per_page=100`;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "callnomic-social",
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(url, { headers });
  if (!r.ok) {
    console.warn(`[activity] ${repo}: ${r.status} — skipping`);
    return [];
  }
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((c) => !BOT_AUTHORS.has(c.author?.login || c.commit?.author?.name || ""))
    .map((c) => ({
      repo,
      at: c.commit?.author?.date || "",
      // First line only. The body is for engineers; the subject is the headline.
      subject: String(c.commit?.message || "").split("\n")[0].trim(),
    }))
    .filter((c) => c.subject && !SKIP.test(c.subject));
}

export async function recentCommits(days = 7) {
  const list = repos();
  if (!list.length) {
    // Say so. A silent empty list is how the GROQ key went missing for two runs.
    console.log("[activity] no ACTIVITY_REPOS set - digest will write from notes only");
    return [];
  }
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const all = [];
  for (const repo of list) {
    try {
      all.push(...(await repoCommits(repo, sinceIso)));
    } catch (e) {
      console.warn(`[activity] ${repo} failed:`, e.message);
    }
  }
  all.sort((a, b) => (a.at < b.at ? 1 : -1));
  // A week of commits can run to hundreds; the generator only needs the shape of it.
  return all.slice(0, 60);
}

export function commitsSummary(commits) {
  if (!commits.length) return "No commits found in the window.";
  const byRepo = {};
  for (const c of commits) (byRepo[c.repo] ||= []).push(c.subject);
  return Object.entries(byRepo)
    .map(([repo, subs]) => `<b>${repo}</b> (${subs.length})\n` +
      subs.slice(0, 6).map((s) => `• ${s.slice(0, 110)}`).join("\n"))
    .join("\n\n");
}
