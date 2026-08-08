import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_BACKGROUND = "#060404";
export const OG_GOLD = "rgba(212, 168, 67, 0.7)";
export const OG_VIGNETTE = "radial-gradient(ellipse at center, transparent 0%, #060404 75%)";

export interface OgFont {
  name: string;
  data: Buffer;
  style: "normal";
  weight: 400 | 600;
}

/** Like loadOgFonts, but returns null instead of throwing — callers render with Satori's built-in fallback font. */
export async function loadOgFontsSafe(): Promise<OgFont[] | null> {
  try {
    return await loadOgFonts();
  } catch (error) {
    console.error("[og] Font files not found:", error);
    return null;
  }
}

/**
 * The score face, for OG surfaces that declare.
 *
 * Big Shoulders Bold, committed to the repo (SIL OFL) rather than read from
 * next/font's build cache — the cache's paths are an implementation detail
 * and satori needs raw TTF bytes. Same rule as the UI: this face marks
 * verdicts and scores (home-passed.test.ts scopes it), so only the story
 * card's stamped verdict asks for it. Null on failure, like loadOgFontsSafe —
 * the card renders with Geist rather than not at all.
 */
export async function loadScoreFontSafe(): Promise<OgFont | null> {
  try {
    const data = await readFile(
      join(process.cwd(), "src/lib/fonts/BigShouldersBold.ttf"),
    );
    return { name: "BigShoulders", data, style: "normal", weight: 600 };
  } catch (error) {
    console.error("[og] Score font not found:", error);
    return null;
  }
}

/** Geist SemiBold (display) + GeistMono Regular (labels). Throws if the font files are missing. */
export async function loadOgFonts(): Promise<OgFont[]> {
  const [geistSemiBold, geistMono] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf")),
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.ttf")),
  ]);

  return [
    { name: "Geist", data: geistSemiBold, style: "normal", weight: 600 },
    { name: "GeistMono", data: geistMono, style: "normal", weight: 400 },
  ];
}
