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
