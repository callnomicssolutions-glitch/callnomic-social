// One-off: export every created post's media into a tidy archive folder with an index.
// Images are re-rendered fresh from the same renderer that posted them (identical output),
// so pruned images are fully restored. Reel videos are copied from state/images when present
// (ffmpeg isn't local, so pruned videos can't be re-rendered here — noted in the index).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { renderCard } from "../src/image.js";
import { imagePath } from "../src/state.js";

const OUT = process.env.ARCHIVE_OUT || "C:/Users/zaink/Callnomics-Social-Media-Archive";
const q = JSON.parse(readFileSync("state/queue.json", "utf8"));

const STATUS_DIR = {
  posted: "Posted",
  approved: "Scheduled",
  pending: "Scheduled",
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
    headline: p.headline, url: p.url || "", bucket, file: "",
  };

  if (type === "reel") {
    const src = imagePath(p.imageFile);
    const dest = join(OUT, bucket, base + ".mp4");
    if (existsSync(src)) { copyFileSync(src, dest); rec.file = `${bucket}/${base}.mp4`; copied++; }
    else { rec.file = "(video pruned locally — see live URL)"; missingVideo++; }
  } else {
    const buf = await renderCard({ platform: p.platform, headline: p.headline, kicker: (p.pillar || "").replace(/-/g, " ") });
    const dest = join(OUT, bucket, base + ".png");
    writeFileSync(dest, buf);
    rec.file = `${bucket}/${base}.png`;
    rendered++;
  }
  index.push(rec);
}

// Build INDEX.md
const groups = { Posted: [], Scheduled: [], "Drafts-not-posted": [] };
for (const r of index) groups[r.bucket].push(r);
const line = (r) =>
  `| ${r.date} | ${r.type} | ${r.platform} | ${r.url ? `[live](${r.url})` : "—"} | ${r.file} | ${(r.headline || "").replace(/\|/g, "/")} |`;
let md = `# Callnomics — Social Media Media Archive\n\nEvery image/video we've created for social, organized by status. Images are the exact branded cards we published (re-rendered from source); videos are the reel files. Generated ${new Date().toISOString().slice(0, 10)}.\n\n`;
md += `**Summary:** ${index.length} total · ${groups.Posted.length} posted · ${groups.Scheduled.length} scheduled · ${groups["Drafts-not-posted"].length} unused drafts.\n`;
for (const g of ["Posted", "Scheduled", "Drafts-not-posted"]) {
  md += `\n## ${g} (${groups[g].length})\n\n| Date | Type | Platform | Live | File | Headline |\n|---|---|---|---|---|---|\n`;
  md += groups[g].sort((a, b) => b.date.localeCompare(a.date)).map(line).join("\n") + "\n";
}
writeFileSync(join(OUT, "INDEX.md"), md);

console.log(`Archive written to: ${OUT}`);
console.log(`  images re-rendered: ${rendered}  |  videos copied: ${copied}  |  videos pruned (link-only): ${missingVideo}`);
