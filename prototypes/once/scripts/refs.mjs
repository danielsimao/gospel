/*
 * Scripture references for the Once prototypes.
 *
 * Every verse a page shows is written as a placeholder in the source files:
 *
 *   {{BSB:Hebrews 9:27}}                       the whole verse
 *   {{BSB:Matthew 5:27-28}}                    a range inside one chapter
 *   {{BSB:Romans 13:14|clothe yourselves with the Lord Jesus Christ}}
 *                                              a fragment, checked to be a
 *                                              substring of the verse
 *
 * extract-verses.mjs resolves them against the Berean Standard Bible (public
 * domain since 2023-04-30) and build.mjs substitutes the text. No verse is
 * typed by hand.
 */

/*
 * JS sources use {{BSB:…}}. HTML sources use [[BSB:…]] instead, because
 * Biome's HTML parser reads {{…}} as a template expression and refuses it.
 */
export const PLACEHOLDER = /(?:\{\{|\[\[)BSB:([^}\]|]+?)(?:\|([^}\]]+))?(?:\}\}|\]\])/g;

/* Display name → book name in scrollmapper's BSB.json. */
const BOOKS = {
	Genesis: "Genesis",
	Exodus: "Exodus",
	Psalm: "Psalms",
	Psalms: "Psalms",
	Proverbs: "Proverbs",
	Ecclesiastes: "Ecclesiastes",
	Isaiah: "Isaiah",
	Jeremiah: "Jeremiah",
	Nahum: "Nahum",
	Matthew: "Matthew",
	Mark: "Mark",
	Luke: "Luke",
	John: "John",
	Acts: "Acts",
	Romans: "Romans",
	"1 Corinthians": "I Corinthians",
	"2 Corinthians": "II Corinthians",
	Galatians: "Galatians",
	Ephesians: "Ephesians",
	Philippians: "Philippians",
	Colossians: "Colossians",
	"1 Timothy": "I Timothy",
	Titus: "Titus",
	Hebrews: "Hebrews",
	James: "James",
	"1 Peter": "I Peter",
	"1 John": "I John",
	Revelation: "Revelation of John",
};

/*
 * The source folds a psalm's superscription into verse 1. The pages quote the
 * prayer, not the heading, so the heading is removed — but only after
 * checking it is exactly the text expected, so a changed source fails loudly.
 */
const PSALM_TITLES = {
	51: "For the choirmaster. A Psalm of David. When Nathan the prophet came to him after his adultery with Bathsheba. ",
};

/* The seven mornings in the take-away kit. */
export const KIT_READINGS = [
	{ ref: "John 1:1-18", title: "The Word became flesh" },
	{ ref: "John 3:1-21", title: "You must be born again" },
	{ ref: "John 6:35-51", title: "The bread of life" },
	{ ref: "John 11:17-44", title: "The resurrection and the life" },
	{ ref: "John 15:1-17", title: "The vine and the branches" },
	{ ref: "John 19:16-30", title: "It is finished" },
	{ ref: "John 20:19-31", title: "So that you may believe" },
];

export function parseRef(ref) {
	const m = ref.trim().match(/^(.+?) (\d+):(\d+)(?:-(\d+))?$/);
	if (!m) throw new Error(`Unparseable reference: "${ref}"`);
	const [, display, chapter, from, to] = m;
	const book = BOOKS[display];
	if (!book) throw new Error(`Unknown book "${display}" in "${ref}"`);
	return {
		display,
		book,
		chapter: Number(chapter),
		from: Number(from),
		to: Number(to ?? from),
	};
}

export function indexBible(bsb) {
	const index = new Map();
	for (const book of bsb.books) {
		const chapters = new Map();
		for (const ch of book.chapters) {
			chapters.set(ch.chapter, new Map(ch.verses.map((v) => [v.verse, v.text])));
		}
		index.set(book.name, chapters);
	}
	return index;
}

/* Returns the verses of a reference as an array of strings, or throws. */
export function resolve(index, ref) {
	const r = parseRef(ref);
	const chapter = index.get(r.book)?.get(r.chapter);
	if (!chapter) throw new Error(`No chapter for "${ref}"`);
	const out = [];
	for (let v = r.from; v <= r.to; v++) {
		let text = chapter.get(v);
		if (typeof text !== "string" || !text.trim()) {
			throw new Error(`Missing or empty verse ${r.book} ${r.chapter}:${v} (from "${ref}")`);
		}
		if (r.book === "Psalms" && v === 1 && PSALM_TITLES[r.chapter]) {
			const title = PSALM_TITLES[r.chapter];
			if (!text.startsWith(title)) {
				throw new Error(`Psalm ${r.chapter} superscription changed in source`);
			}
			text = text.slice(title.length);
		}
		out.push(text.trim());
	}
	return out;
}
