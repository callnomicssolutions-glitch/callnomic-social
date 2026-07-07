// Local preview: renders a Reel's still frames (no ffmpeg needed) so you can eyeball
// the kinetic-caption design. Usage: npm run preview-reel
import { previewReelFrames } from "./reel.js";
import { REELS } from "../content/reels.js";
import { join } from "node:path";
import { STATE_DIR } from "./state.js";

const script = REELS[0];
const outDir = join(STATE_DIR, "images");
const files = await previewReelFrames(script, outDir);
console.log(`rendered ${files.length} beat frames for "${script.hook}":`);
for (const f of files) console.log(" -", f);
console.log("\nOpen state/images/preview-reel-*.png to review (each is one frame of the reel).");
