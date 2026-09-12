// Export every created post's media into a tidy, durable archive folder + index.
//
// Runs two ways:
//   • locally:  ARCHIVE_OUT=C:/path/to/folder node scripts/export-archive.mjs
//   • as a routine: the archive.yml GitHub Action runs it with ARCHIVE_OUT=archive,
//     so the archive lives IN the repo and is refreshed automatically.
//
// What it does, every run:
//   • Re-renders every post image from the same renderer that published it, so images
//     the engine has pruned out of state/images are fully restored (identical bytes).
//   • Copies each reel video that is still on disk. Because archive filenames are stable
//     (date_platform_slug), a video copied once STAYS in the archive even after the main
//     repo prunes it from state/images — so the archive becomes the permanent home for
//     every video, while the live repo stays small. Videos are tiny kinetic-caption clips.
//   • Writes INDEX.md (human catalog with live links) + manifest.json (machine-readable),
//     grouped Posted / Scheduled / Drafts-not-posted.
//
// No volatile run-timestamp is written, so the routine only produces a commit when the
// posts themselves actually change — not on every scheduled tick.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { renderCard } from "../src/image.js";
import { imagePath } from "../src/state.js";

const OUT = process.env.ARCHIVE_OUT || "archive";
const COPY_VIDEOS = process.env.ARCHIVE_COPY_VIDEOS !== "0";
const q = JSON.parse(readFileSync("state/queue.json", "utf8"));

const STATUS_DIR = {
  posted: "Posted",
  approved: "Scheduled",
  pending: "Scheduled",
  publishing: "Scheduled",
  expired: "Drafts-not-posted",
  failed: "Drafts-not-posted",
  skipped: "Drafts-not-posted",
};

function slug(s) {
  return (s || "untitled")
    .toLowerCase()
    .replace(/["'""'']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
function datePart(iso) { return (iso || "").slice(0, 10) || "undated"; }

for (const dir of new Set(Object.values(STATUS_DIR))) {
  mkdirSync(join(OUT, dir), { recursive: true });
}

const index = [];
let rendered = 0, copied = 0, missingVideo = 0;

for (const p of q.posts) {
  const type = p.type || "image";
  const bucket = STATUS_DIR[p.status] || "Drafts-not-posted";
  const base = `${datePart(p.postedAt || p.createdAt)}_${p.platform}_${type === "reel" ? "reel_" : ""}${slug(p.headline)}`;
  const rec = {
    status: p.status, type, platform: p.platform, date: datePart(p.postedAt || p.createdAt),
    headline: p.headline, url: p.url || "", bucket, file: "", mediaPresent: false,
  };

  if (type === "reel") {
    const src = imagePath(p.imageFile);
    const dest = join(OUT, bucket, base + ".mp4");
    if (existsSync(src)) {
      if (COPY_VIDEOS) copyFileSync(src, dest);
      rec.file = `${bucket}/${base}.mp4`; rec.mediaPresent = true; copied++;
    } else if (existsSync(dest)) {
      // Already archived on an earlier run; the source was pruned since. Keep it.
      rec.file = `${bucket}/${base}.mp4`; rec.mediaPresent = true;
    } else {
      rec.file = "(video pruned before it was archived — see live URL)"; missingVideo++;
    }
  } else {
    const buf = await renderCard({ platform: p.platform, headline: p.headline, kicker: (p.pillar || "").replace(/-/g, " ") });
    const dest = join(OUT, bucket, base + ".png");
    writeFileSync(dest, buf);
    rec.file = `${bucket}/${base}.png`; rec.mediaPresent = true; rendered++;
  }
  index.push(rec);
}

// Build INDEX.md
const groups = { Posted: [], Scheduled: [], "Drafts-not-posted": [] };
for (const r of index) groups[r.bucket].push(r);
const line = (r) =>
  `| ${r.date} | ${r.type} | ${r.platform} | ${r.url ? `[live](${r.url})` : "—"} | ${r.file} | ${(r.headline || "").replace(/\|/g, "/")} |`;
let md = `# Callnomics — Social Media Media Archive\n\n`;
md += `Every image/video we've created for social, organized by status. Images are the exact branded cards we published (re-rendered from source); reel videos are the published clips. Refreshed automatically by the \`archive\` GitHub Action.\n\n`;
md += `**Summary:** ${index.length} total · ${groups.Posted.length} posted · ${groups.Scheduled.length} scheduled · ${groups["Drafts-not-posted"].length} unused drafts.\n`;
for (const g of ["Posted", "Scheduled", "Drafts-not-posted"]) {
  md += `\n## ${g} (${groups[g].length})\n\n| Date | Type | Platform | Live | File | Headline |\n|---|---|---|---|---|---|\n`;
  md += groups[g].sort((a, b) => b.date.localeCompare(a.date)).map(line).join("\n") + "\n";
}
writeFileSync(join(OUT, "INDEX.md"), md);
writeFileSync(join(OUT, "manifest.json"), JSON.stringify({ total: index.length, items: index }, null, 2));

console.log(`Archive written to: ${OUT}`);
console.log(`  images re-rendered: ${rendered}  |  videos copied: ${copied}  |  videos never archived (link-only): ${missingVideo}`);
