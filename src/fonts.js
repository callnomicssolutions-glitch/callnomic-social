// Shared font registration for the canvas-based renderers (image.js + reel.js).
import { GlobalFonts } from "@napi-rs/canvas";
import { join } from "node:path";
import { ROOT } from "./state.js";

const FONT_DIR = join(ROOT, "brand", "font");
let registered = false;

export function ensureFonts() {
  if (registered) return;
  registered = true;
  try {
    GlobalFonts.registerFromPath(join(FONT_DIR, "Outfit-800.ttf"), "Outfit800");
    GlobalFonts.registerFromPath(join(FONT_DIR, "Outfit-600.ttf"), "Outfit600");
    GlobalFonts.registerFromPath(join(FONT_DIR, "Outfit-400.ttf"), "Outfit400");
  } catch (e) {
    console.warn("[fonts] registration warning:", e.message);
  }
}
