// Local preview: renders sample cards to state/images so you can eyeball the design.
// Usage: npm run preview
import { renderToFile } from "./image.js";
import { LIBRARY } from "../content/library.js";

const samples = [LIBRARY[0], LIBRARY[5], LIBRARY[24]];
for (const [i, item] of samples.entries()) {
  for (const platform of ["instagram", "linkedin"]) {
    const file = `preview-${i}-${platform}.png`;
    await renderToFile({
      platform,
      headline: item.headline,
      kicker: item.pillar.replace(/-/g, " "),
      fileName: file,
    });
    console.log("rendered", file, "→", item.headline);
  }
}
console.log("\nOpen state/images/preview-*.png to review.");
