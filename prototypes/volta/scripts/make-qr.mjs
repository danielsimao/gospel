/*
 * Writes the tract's QR code as an SVG, so no QR library ships in the page.
 * Uses the app's own `qrcode` dependency.
 *
 * Run: node prototypes/volta/scripts/make-qr.mjs
 */
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

const svg = await QRCode.toString("https://temvolta.pt", { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d1c22", light: "#0000" } });
writeFileSync(new URL("../src/qr-temvolta.svg", import.meta.url), svg);
console.log("✓ wrote src/qr-temvolta.svg");
