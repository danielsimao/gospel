/*
 * Builds prototypes/once/data/verses.json from the full Berean Standard Bible.
 *
 * Input is scrollmapper/bible_databases formats/json/BSB.json, which is too
 * large to keep in the repo (8 MB). Only the cited references and the Gospel
 * of John are written out, so the pages can be rebuilt without a network call.
 *
 * Run: node prototypes/once/scripts/extract-verses.mjs <path/to/BSB.json>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { indexBible, KIT_READINGS, PLACEHOLDER, resolve } from "./refs.mjs";

const bsbPath = process.argv[2];
if (!bsbPath) {
	console.error("Usage: node extract-verses.mjs <path/to/BSB.json>");
	process.exit(1);
}

const SRC = new URL("../src/", import.meta.url);
const OUT = new URL("../data/verses.json", import.meta.url);

const bsb = JSON.parse(readFileSync(bsbPath, "utf8"));
const index = indexBible(bsb);

const refs = new Set(KIT_READINGS.map((r) => r.ref));
for (const file of readdirSync(SRC)) {
	if (!/\.(html|js)$/.test(file)) continue;
	const text = readFileSync(new URL(file, SRC), "utf8");
	for (const m of text.matchAll(PLACEHOLDER)) refs.add(m[1].trim());
}

const verses = {};
const failures = [];
for (const ref of [...refs].sort()) {
	try {
		verses[ref] = resolve(index, ref);
	} catch (err) {
		failures.push(err.message);
	}
}

/*
 * John in full, chapter by chapter. A verse the source leaves empty (5:4 is
 * absent from the earliest manuscripts) is kept as null so the reader can
 * show the gap honestly instead of renumbering.
 */
const johnChapters = index.get("John");
const john = [];
for (let c = 1; c <= johnChapters.size; c++) {
	const ch = johnChapters.get(c);
	const out = [];
	for (let v = 1; v <= ch.size; v++) {
		const t = ch.get(v);
		out.push(typeof t === "string" && t.trim() ? t.trim() : null);
	}
	john.push(out);
}

if (failures.length) {
	console.error(`✗ ${failures.length} reference(s) did not resolve:`);
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}

writeFileSync(
	OUT,
	`${JSON.stringify(
		{
			translation: "Berean Standard Bible (BSB)",
			license: "Public domain (dedicated 2023-04-30, berean.bible/terms.htm)",
			source: "github.com/scrollmapper/bible_databases formats/json/BSB.json",
			verses,
			john,
		},
		null,
		1,
	)}\n`,
);
console.log(
	`✓ ${Object.keys(verses).length} references resolved; John: ${john.length} chapters, ${john.flat().length} verses`,
);
