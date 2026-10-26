/*
 * Walks every Once variant in a real browser, at phone and desktop width.
 *
 * For each path it checks: no console errors, no sideways scroll, the
 * method's order as actually walked, and all three exits on screen together
 * at phone width. It also checks the take-away kit: the WhatsApp text, a
 * seven-event .ics with correct line folding, the card image, and a print
 * sheet that fits one page.
 *
 * Needs Playwright (not a dependency of the app; a global install works).
 * Not named *.test.*, so vitest and the pre-push hook never pick it up.
 *
 * Run: node prototypes/once/scripts/verify-ui.mjs [screenshot-dir]
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try {
	playwright = require("playwright");
} catch {
	playwright = require(join(execSync("npm root -g").toString().trim(), "playwright"));
}

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const SHOTS = process.argv[2] || join(tmpdir(), "once-shots");
mkdirSync(SHOTS, { recursive: true });
const CHROME = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium"].find((p) => existsSync(p) && !p.endsWith("chromium"));

const ORDER = ["you", "law", "verdict", "mortality", "grace", "response", "exit", "kit"];
const failures = [];
const fail = (m) => failures.push(m);

function checkOrder(label, steps) {
	let last = 0;
	for (const s of steps) {
		const i = ORDER.indexOf(s);
		if (i < 0) continue;
		if (i < last && !(s === "verdict" && ORDER[last] === "mortality")) {
			fail(`${label}: "${s}" came after "${ORDER[last]}" (${steps.join(">")})`);
			return;
		}
		last = Math.max(last, i);
	}
	for (const need of ["law", "verdict", "mortality", "grace", "response", "exit", "kit"]) {
		if (!steps.includes(need)) fail(`${label}: never reached "${need}"`);
	}
}

async function exitsOnScreen(page, label, selector) {
	await page.locator(selector).last().hover();
	const boxes = await page.$$eval(selector, (els) =>
		els.map((e) => {
			const r = e.getBoundingClientRect();
			return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
		}),
	);
	const vw = page.viewportSize();
	if (boxes.length !== 3) fail(`${label}: expected 3 exits, found ${boxes.length}`);
	if (!boxes.every((b) => b.top >= 0 && b.bottom <= vw.height && b.left >= 0 && b.right <= vw.width)) {
		fail(`${label}: the three exits are not all on screen together`);
	}
	const styles = await page.$$eval(selector, (els) =>
		els.map((e) => {
			const c = getComputedStyle(e);
			return `${c.backgroundColor}|${c.color}|${c.borderColor}|${c.borderWidth}|${c.outlineStyle}|${e.getAttribute("aria-pressed")}`;
		}),
	);
	if (new Set(styles).size !== 1) fail(`${label}: the exits don't look identical (${styles.join(" / ")})`);
}

async function newPage(browser, width, opts = {}) {
	const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, reducedMotion: "reduce", ...opts });
	const page = await ctx.newPage();
	page.errors = [];
	page.on("pageerror", (e) => page.errors.push(String(e)));
	page.on("console", (m) => {
		if (m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.text())) page.errors.push(m.text());
	});
	return page;
}

async function finish(page, label) {
	if (page.errors.length) fail(`${label}: console errors: ${page.errors.join(" | ")}`);
	const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
	if (hs) fail(`${label}: the page scrolls sideways`);
	await page.context().close();
}

/* ---------- Stories ---------- */
const STORIES = {
	honest: { good: "Yes", why: "I'm a good person", law: ["h", "h", "h", "h"], verdict: ["Guilty"], where: ["Hell"], concern: "Yes", exit: "I'm turning to Him now" },
	evasive: {
		good: "Mostly", why: "Church, baptism, or a prayer I prayed", law: ["e", "e", "e", "ey"], park: "God is love. He'll just forgive.",
		verdict: ["Innocent", "Still innocent"], where: ["Heaven", "I've done more good than bad"], concern: "No", exit: "I need to think",
	},
	believer: { good: "No", why: "Jesus paid for my sins", law: ["h", "ey", "h", "h"], verdict: ["Guilty"], where: ["Heaven", "Jesus paid for me"], concern: "Not sure", exit: "I don't believe this" },
};
const STORY_SIZES = [[360, 640], [375, 667], [390, 844], [1280, 800]];
const WORD_BUDGET = 60;

/*
 * Every state of every card is inspected: it must not scroll, must stay within
 * the word budget, and on a 375×667 phone must fit without leaning on the
 * type-scaling safety net.
 */
async function walkStories(browser, [width, height], name, p) {
	const label = `stories/${name}@${width}x${height}`;
	const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
	const page = await ctx.newPage();
	page.errors = [];
	page.on("pageerror", (e) => page.errors.push(String(e)));
	await page.goto(`file://${DIST}stories.html`);
	const steps = [];
	let n = 0;
	const inspect = async (tag = "") => {
		const c = await page.evaluate(() => {
			const el = document.querySelector(".card");
			return { id: el.dataset.card, step: el.dataset.step, over: el.scrollHeight - el.clientHeight, fit: Number(el.dataset.fit), words: (el.innerText.match(/\S+/g) || []).length };
		});
		if (steps.at(-1)?.id !== c.id) steps.push(c);
		if (c.over > 1) fail(`${label}: card "${c.id}${tag}" scrolls by ${c.over}px`);
		if (c.words > WORD_BUDGET) fail(`${label}: card "${c.id}${tag}" has ${c.words} words (budget ${WORD_BUDGET})`);
		if (width === 375 && c.fit < 0.9) fail(`${label}: card "${c.id}${tag}" needed its type scaled to ${c.fit}`);
		if (width === 375) await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}-${String(n++).padStart(2, "0")}-${c.id}${tag.replace(/\W+/g, "-")}.png`) });
	};
	const btn = (t) => page.locator(".card").getByRole("button", { name: t, exact: true }).first();
	const go = () => page.locator("#foot").getByRole("button", { name: "Continue", exact: true }).click();
	const auto = () => page.waitForTimeout(650);

	await inspect(); await btn(p.good).click(); await inspect("+answer"); await go();
	await inspect(); await btn(p.why).click(); await auto();
	for (const [i, a] of p.law.entries()) {
		await inspect();
		if (a === "h") await page.locator(".card .choice").nth(0).click();
		else {
			await page.locator(".card .choice").nth(1).click();
			await inspect("+press");
			await page.locator(".card .choice").nth(a === "ey" ? 0 : 1).click();
		}
		await inspect("+result");
		if (i === 1 && p.park) {
			await page.locator("#foot").getByRole("button", { name: "But…" }).click();
			await page.locator(".sheet").getByRole("button", { name: p.park, exact: true }).click();
			await page.getByRole("button", { name: "Back to the question" }).click();
		}
		await go();
	}
	for (let i = 0; i < 3; i++) { await inspect(); await go(); } // admitted, testimony, Hebrews 9:27
	await inspect(); for (const v of p.verdict) { await btn(v).click(); await inspect(`+${v}`); } await go();
	await inspect(); for (const v of p.where) { await btn(v).click(); await inspect(`+${v}`); }
	if (p.where[0] === "Heaven") await go(); else await auto();
	await inspect(); await go(); // penalty
	await inspect(); await btn(p.concern).click(); await inspect("+answer"); await go();
	if (p.park) { await inspect(); await go(); }
	for (let i = 0; i < 9; i++) { await inspect(); await go(); } // dawn → Psalm 51
	await inspect();
	if (width < 500) await exitsOnScreen(page, label, ".card .choices .choice");
	await btn(p.exit).click();
	if (p.exit.startsWith("I'm turning")) { await inspect(); await page.locator(".card").getByRole("button", { name: "I'm ready" }).click(); }
	while (await page.locator("#foot").getByRole("button", { name: "Continue", exact: true }).count()) { await inspect(); await go(); }
	await inspect();
	if ((await page.locator(".card").getAttribute("data-card")) !== "kit") fail(`${label}: did not end on the take-away`);
	await page.getByRole("button", { name: "Seven mornings in John" }).click();
	const sheetOver = await page.evaluate(() => { const s = document.querySelector(".kit-pop"); return s ? s.scrollHeight - s.clientHeight : -1; });
	if (sheetOver < 0) fail(`${label}: "Seven mornings" did not open a sheet`);
	else if (width <= 390 && height >= 667 && sheetOver > 1) fail(`${label}: the "Seven mornings" sheet scrolls by ${sheetOver}px`);
	checkOrder(label, steps.map((s) => s.step));
	await finish(page, label);
}

/* The prototype's night colours: each one applies, and paper text stays readable on it. */
const NIGHTS = { navy: "#0e1322", violet: "#1c1631", charcoal: "#1d1b1a", ink: "#0b0b0c" };
const lum = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, k) => k - m); return (x + 0.05) / (y + 0.05); };
async function checkNights(browser) {
	for (const [id, hex] of Object.entries(NIGHTS)) {
		const label = `stories/night-${id}`;
		for (const [fg, what] of [["#ece7dd", "text"], ["#aeacbb", "dim text"]]) {
			if (contrast(fg, hex) < 4.5) fail(`${label}: ${what} contrast ${contrast(fg, hex).toFixed(2)} is under 4.5`);
		}
		const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
		const page = await ctx.newPage();
		await page.goto(`file://${DIST}stories.html#${id}`);
		const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		const want = `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
		if (bg !== want) fail(`${label}: background is ${bg}, expected ${want}`);
		await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}.png`) });
		await ctx.close();
	}
}

/* ---------- Conversation ---------- */
const CHAT = {
	honest: ["Go ahead", "Heaven or hell", "I'm a good person", "Yes", "Yes", "A liar", "Yes", "Yes", "Yes", "Yes", "No, He hasn't", "Guilty", "Hell", "Yes", "Tell me", "Go on", "So what happens?", "Who would do that?", "What do I do?", "And trust?", "How do I do that?", "EXITS", "I'm turning to Him now", "I'm ready to go on"],
	evasive: ["Go ahead", "Something. Not sure what", "Church, baptism, or a prayer I prayed", "Mostly", "Only white lies", "Still no", "Nothing that mattered", "BUT:God is love. He'll just forgive.", "Still no", "Not seriously", "Still no", "Everyone does", "Still no", "Angry, never hate", "Still no", "I think so", "I still think so", "Innocent", "Still innocent", "Heaven", "I've done more good than bad", "No", "No", "Go on", "So what happens?", "Who would do that?", "Why would He?", "What do I do?", "And trust?", "How do I do that?", "EXITS", "I need to think"],
	atheist: ["Go ahead", "Nothing. You just stop", "The building is the proof", "That's not proof", "No", "Yes", "Human", "A liar", "Yes", "Yes", "Yes", "Yes", "No, He hasn't", "Guilty", "I don't know", "Not sure", "Jesus died?", "Go on", "So what happens?", "Who would do that?", "What do I do?", "And trust?", "How do I do that?", "EXITS", "I don't believe this"],
};

async function walkChat(browser, width, name, steps) {
	const label = `conversation/${name}@${width}`;
	const page = await newPage(browser, width);
	await page.goto(`file://${DIST}conversation.html`);
	const dock = page.locator("#dock");
	for (const s of steps) {
		if (s === "EXITS") {
			await dock.locator(".chips.stack .chip").first().waitFor();
			if (width < 500) await exitsOnScreen(page, label, "#dock .chips.stack .chip");
			await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}-exits.png`) });
			continue;
		}
		if (s.startsWith("BUT:")) {
			await dock.getByRole("button", { name: "But…" }).click();
			await dock.getByRole("button", { name: s.slice(4), exact: true }).click();
			continue;
		}
		const b = dock.getByRole("button", { name: s, exact: true }).first();
		try {
			await b.waitFor({ timeout: 5000 });
		} catch {
			fail(`${label}: no "${s}" reply at node ${await page.evaluate(() => document.body.dataset.node)}`);
			await page.context().close();
			return;
		}
		await b.click();
	}
	await page.locator(".kitmsg").waitFor();
	await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}-end.png`) });
	const trail = await page.evaluate(() => window.__onceTrail || []);
	checkOrder(label, trail.map((t) => t.split(":")[1]));
	const law = new Set(trail.filter((t) => /^L\d/.test(t)).map((t) => t[1]));
	if (law.size !== 6) fail(`${label}: visited ${law.size} of 6 commandments`);
	await finish(page, label);
}

/* ---------- Letter ---------- */
async function walkLetter(browser, width, scheme) {
	const label = `letter/${scheme}@${width}`;
	const page = await newPage(browser, width, { colorScheme: scheme });
	await page.goto(`file://${DIST}letter.html`);
	const tap = (k) => page.locator(`[data-key="${k}"]`).click();
	await tap("after:something"); await tap("why:christ"); await tap("good:yes");
	for (const l of ["lie", "steal", "name", "lust", "hate", "first"]) await tap(`law-${l}:honest`);
	if (await page.locator("#ch4").isVisible()) fail(`${label}: chapter IV visible before the verdict`);
	await tap("verdict:guilty"); await tap("where:hell"); await tap("concern:yes");
	await page.getByRole("button", { name: "Keep reading" }).click();
	await page.locator('[data-ask="exit"]').scrollIntoViewIfNeeded();
	if (width < 500) await exitsOnScreen(page, label, '[data-ask="exit"] .tap');
	if (await page.locator("#ch6").isVisible()) fail(`${label}: chapter VI visible before an exit was chosen`);
	await tap("exit:now");
	await page.locator("#ending").evaluate((el) => el.scrollIntoView({ block: "start" }));
	await page.waitForTimeout(150);
	const where = await page.locator("#where").textContent();
	if (!where.startsWith("VII")) fail(`${label}: the rail says "${where}" while reading chapter VII`);
	await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}-ending.png`) });
	const steps = await page.$$eval("[data-step]", (els) => els.filter((e) => !e.closest("[hidden]")).map((e) => e.dataset.step));
	checkOrder(label, steps);
	await finish(page, label);
}

/* ---------- the kit ---------- */
async function checkKit(browser) {
	const label = "kit";
	const page = await newPage(browser, 390);
	await page.goto(`file://${DIST}stories.html`);
	await page.evaluate(() => { window.print = () => {}; });
	const result = await page.evaluate(async () => {
		const K = window.OnceKit;
		const host = document.createElement("div");
		document.body.append(host);
		K.mount(host);
		await K.loadJohn();
		const ics = K.buildIcs();
		const blob = await K.drawCard();
		const wa = host.querySelector('a[href^="https://wa.me/"]')?.href || "";
		const cal = host.querySelector('a[href^="https://calendar.google.com/"]')?.href || "";
		return { ics, card: blob?.size || 0, wa, cal, framed: K.framed };
	});
	const events = (result.ics.match(/BEGIN:VEVENT/g) || []).length;
	if (events !== 7) fail(`${label}: .ics has ${events} events, expected 7`);
	if (!/\r\n/.test(result.ics) || /[^\r]\n/.test(result.ics)) fail(`${label}: .ics lines are not CRLF`);
	const long = result.ics.split("\r\n").filter((l) => Buffer.byteLength(l, "utf8") > 75);
	if (long.length) fail(`${label}: ${long.length} .ics line(s) over 75 octets`);
	if (!result.ics.includes("DTSTART:") || /DTSTART:[0-9T]+Z/.test(result.ics)) fail(`${label}: .ics start times should be floating local time`);
	if (result.card < 20000) fail(`${label}: card image looks empty (${result.card} bytes)`);
	const waText = decodeURIComponent(result.wa.split("text=")[1] || "");
	for (const must of ["Hebrews 9:27-28", "God's Law", "John 1:1-18", "John 20:19-31"]) {
		if (!waText.includes(must)) fail(`${label}: WhatsApp text is missing "${must}"`);
	}
	if (waText.indexOf("God's Law") > waText.indexOf("But God sent")) fail(`${label}: WhatsApp text puts grace before the Law`);
	if (!/recur=RRULE%3AFREQ%3DDAILY%3BCOUNT%3D7/.test(result.cal)) fail(`${label}: Google Calendar link lacks the 7-day rule`);
	writeFileSync(join(SHOTS, "once-john-7-mornings.ics"), result.ics);

	await page.getByRole("button", { name: "Print a one-page summary" }).last().click();
	await page.emulateMedia({ media: "print" });
	const pdf = await page.pdf({ format: "A4" });
	const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
	if (pages !== 1) fail(`${label}: print sheet is ${pages} pages, expected 1`);
	writeFileSync(join(SHOTS, "print-sheet.pdf"), pdf);
	await finish(page, label);
}

/* ---------- the gallery (wrapped the way the artifact viewer wraps it) ---------- */
async function checkGallery(browser, width, scheme) {
	const label = `gallery/${scheme}@${width}`;
	const wrapped = join(DIST, "..", ".gallery-preview.html");
	writeFileSync(wrapped, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="file://${DIST}"><style>body{margin:0}</style></head><body>${readFileSync(join(DIST, "index.html"), "utf8")}</body></html>`);
	const page = await newPage(browser, width, { colorScheme: scheme });
	await page.goto(`file://${wrapped}`);
	await page.screenshot({ path: join(SHOTS, `${label.replace(/[/@]/g, "-")}.png`), fullPage: true });
	for (const href of ["stories.html", "conversation.html", "letter.html", "john.html"]) {
		if (!existsSync(join(DIST, href))) fail(`${label}: links to missing ${href}`);
	}
	await finish(page, label);
	execSync(`rm -f "${wrapped}"`);
}

const browser = await playwright.chromium.launch(CHROME ? { executablePath: CHROME } : {});
for (const size of STORY_SIZES) for (const [name, p] of Object.entries(STORIES)) await walkStories(browser, size, name, p);
await checkNights(browser);
for (const w of [390, 1280]) {
	for (const [name, s] of Object.entries(CHAT)) await walkChat(browser, w, name, s);
	for (const scheme of ["light", "dark"]) await walkLetter(browser, w, scheme);
	for (const scheme of ["light", "dark"]) await checkGallery(browser, w, scheme);
}
await checkKit(browser);
await browser.close();

if (failures.length) {
	console.error(`✗ ${failures.length} UI check(s) failed:`);
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}
console.log(`✓ Stories walked at ${STORY_SIZES.map((s) => s.join("×")).join(", ")} with no card scrolling; other variants at 390px and 1280px; kit and night colours checked. Screenshots: ${SHOTS}`);
