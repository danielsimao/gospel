/*
 * Checks the Tem volta? prototype against the method, the brand rules and the phone.
 *
 * Method (no browser):
 *   - every quoted verse is a substring of the Bíblia Livre text in data/verses.json
 *   - "Mas…" answers raised during the Law carry no grace content
 *   - nothing after the exits claims a tap saved anyone, or leans on death or deadlines
 * Brand and links:
 *   - no volta.com.pt anywhere; every link to Se Morresses Hoje is one of the three
 *     hand-off pages, and never /pt/next-steps (it sends strangers home)
 * Browser (Playwright; a global install is enough):
 *   - three paths at 360×640, 375×667, 390×844 and 1280×800: no card scrolls, every
 *     card is within the word budget, the method's order holds, the metaphor-break
 *     card comes after the reader's verdict, the exits are identical and on screen
 *   - the take-away: WhatsApp text puts the Law before grace, the card renders
 *   - the concept board: no errors, no sideways scroll, the QR code loads
 *
 * Not a *.test.* file, so it stays out of vitest and the owner's pre-push hook.
 * Run after build: node prototypes/volta/scripts/verify.mjs [screenshot-dir]
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const SHOTS = process.argv[2] || join(tmpdir(), "tem-volta-shots");
mkdirSync(SHOTS, { recursive: true });
const { verses } = JSON.parse(readFileSync(new URL("../data/verses.json", import.meta.url), "utf8"));

const failures = new Set();
let checks = 0;
const check = (ok, msg) => {
	checks++;
	if (!ok) failures.add(msg);
};

/* ---------- method ---------- */
const sandbox = { window: {}, Intl, console };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(DIST, "content.js"), "utf8"), sandbox);
const T = sandbox.window.TV;
const OB = sandbox.window.TV_OBJECTIONS;

const DECISIONISM = /(estás|és|foste) salv|reza esta oração|diz esta oração|nasceste de novo|bem-vind[oa] à família|parabéns|já estás perdoad|agora és cristã/i;
const PRESSURE = /amanhã|prazo|ninguém tem garantid|podes morrer|tarde demais|a cada segundo|antes de morreres/i;
const GRACE_WORDS = /\bcruz\b|perdo|\bpag(ou|a|o)\b|miseric|\bgraça\b|\bsalv|Jesus|Cristo/i;

const seen = new Set();
function walkVerses(obj, where) {
	if (!obj || typeof obj !== "object" || seen.has(obj)) return;
	seen.add(obj);
	if (typeof obj.key === "string" && typeof obj.text === "string") {
		const parts = verses[obj.key];
		check(!!parts, `${where}: ${obj.key} is not in verses.json`);
		if (parts) check(parts.join(" ").includes(obj.text), `${where}: quoted text of ${obj.ref} is not the Bíblia Livre text`);
	}
	for (const v of Object.values(obj)) if (typeof v === "object") walkVerses(v, where);
}
walkVerses(T, "content.js");
walkVerses(OB, "content.js objections");
check(seen.size > 40, "verse walk found too little");

for (const o of OB.law) {
	check(!GRACE_WORDS.test(o.a), `law-phase answer "${o.q}" contains grace content`);
	check(!GRACE_WORDS.test(o.verse.text), `law-phase verse ${o.verse.ref} contains grace content`);
}
const postExit = [
	T.pause,
	T.ready,
	...Object.values(T.answer).map((a) => a.line),
	...["good", "believe", "church", "christ"].map((k) => T.ending[k].line),
	...T.days.lines.map((x) => x.t),
];
for (const t of postExit) {
	check(!DECISIONISM.test(t), `decisionist copy after the exits: "${t}"`);
	check(!PRESSURE.test(t), `death or deadline pressure after the exits: "${t}"`);
}
check(/Ele pagou por ti/.test(T.breaks.line), "the metaphor-break line is missing");

/* Card order in the source: grace, the break and "the dented who return" all come after the verdict. */
{
	const html = readFileSync(join(DIST, "tem-volta.html"), "utf8");
	/* Search only inside the deck's card list: the progress phases also have an id "verdict". */
	const deck = html.slice(html.indexOf("function cards()"));
	const at = (id) => deck.indexOf(`{ id: "${id}"`);
	for (const id of ["dawn", "breaks", "dented", "repent", "trust"]) {
		check(at(id) > at("verdict") && at("verdict") > 0, `tem-volta.html: card "${id}" is placed before the reader's verdict`);
	}
	check(at("once") < at("dawn"), "tem-volta.html: Hebrews 9:27 is placed after dawn");
}

/* ---------- brand and links ---------- */
const ALLOWED = new Set([T.handoff.readingPlan, T.handoff.learn, T.handoff.church]);
for (const f of readdirSync(DIST).filter((x) => /\.(html|js)$/.test(x))) {
	const text = readFileSync(join(DIST, f), "utf8");
	/* The owner's board may name the official site in prose; nothing may link to it, and reader-facing files never mention it. */
	check(!/(https?:\/\/|href=["'])[^"'\s]*volta\.com\.pt/i.test(text), `${f}: links to volta.com.pt`);
	if (f !== "index.html") check(!/volta\.com\.pt/i.test(text), `${f}: mentions volta.com.pt in reader-facing copy`);
	check(!/https?:\/\/[^"'\s]*next-steps/.test(text), `${f}: links to /pt/next-steps`);
	for (const m of text.matchAll(/https:\/\/www\.ifyoudiedtoday\.com\/[^\s"'`)]+/g)) {
		check(ALLOWED.has(m[0]), `${f}: hand-off link ${m[0]} is not one of the three allowed pages`);
	}
}

/* ---------- browser ---------- */
const require = createRequire(import.meta.url);
let playwright;
try {
	playwright = require("playwright");
} catch {
	playwright = require(join(execSync("npm root -g").toString().trim(), "playwright"));
}
const CHROME = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find((p) => existsSync(p));
const browser = await playwright.chromium.launch(CHROME ? { executablePath: CHROME } : {});

const ORDER = ["you", "law", "verdict", "mortality", "grace", "response", "exit", "kit"];
const PATHS = {
	honest: { reveal: "Sim", why: "Sou boa pessoa", law: ["h", "h", "h", "h"], verdict: ["Rejeitado"], where: ["Inferno"], concern: "Sim", exit: "Volto agora para Ele" },
	evasive: {
		reveal: "Talvez", why: "O batismo, a missa, as orações", law: ["e", "e", "e", "ey"], park: "Deus é amor. Ele perdoa.",
		verdict: ["Aceite", "Continuo a dizer aceite"], where: ["Céu", "Fiz mais bem do que mal"], concern: "Não", exit: "Preciso de pensar",
	},
	believer: { reveal: "Não", why: "Jesus pagou por mim", law: ["h", "ey", "h", "h"], verdict: ["Rejeitado"], where: ["Céu", "Jesus pagou por mim"], concern: "Não sei", exit: "Não acredito nisto" },
};
const SIZES = [[360, 640], [375, 667], [390, 844], [1280, 800]];
const BUDGET = 60;

let page0 = null;
async function walk([width, height], name, p) {
	const label = `tem-volta/${name}@${width}x${height}`;
	const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
	page0 = ctx;
	const page = await ctx.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(String(e)));
	await page.goto(`file://${DIST}tem-volta.html`);
	const steps = [];
	let n = 0;
	const inspect = async (tag = "") => {
		const c = await page.evaluate(() => {
			const el = document.querySelector(".card");
			return { id: el.dataset.card, step: el.dataset.step, over: el.scrollHeight - el.clientHeight, fit: Number(el.dataset.fit), words: (el.innerText.match(/\S+/g) || []).length };
		});
		if (steps.at(-1)?.id !== c.id) steps.push(c);
		check(c.over <= 1, `${label}: card "${c.id}${tag}" scrolls by ${c.over}px`);
		check(c.words <= BUDGET, `${label}: card "${c.id}${tag}" has ${c.words} words (budget ${BUDGET})`);
		if (width === 375) {
			check(c.fit >= 0.9, `${label}: card "${c.id}${tag}" needed its type scaled to ${c.fit}`);
			await page.screenshot({ path: join(SHOTS, `${name}-${String(n++).padStart(2, "0")}-${c.id}${tag.replace(/\W+/g, "-")}.png`) });
		}
	};
	const btn = (t) => page.locator(".card").getByRole("button", { name: t, exact: true }).first();
	const go = () => page.locator("#foot").getByRole("button", { name: "Continuar", exact: true }).click();
	const auto = () => page.waitForTimeout(650);

	await inspect(); await btn("Vamos ver").click();
	await inspect(); await btn(p.reveal).click(); await inspect("+answer"); await go();
	await inspect(); await btn(p.why).click(); await auto();
	await inspect(); await go(); // Lamentações 3:40
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
			await page.locator("#foot").getByRole("button", { name: "Mas…" }).click();
			await page.locator(".sheet").getByRole("button", { name: p.park, exact: true }).click();
			await page.getByRole("button", { name: "Voltar à pergunta" }).click();
		}
		await go();
	}
	await page.waitForTimeout(950); // the receipt prints
	for (let i = 0; i < 3; i++) { await inspect(); await go(); } // receipt, testimony, Hebrews 9:27
	await inspect(); for (const v of p.verdict) { await btn(v).click(); await inspect(`+${v}`); } await go();
	await inspect(); for (const v of p.where) { await btn(v).click(); await inspect(`+${v}`); }
	if (p.where[0] === "Céu") await go(); else await auto();
	await inspect(); await go(); // penalty
	await inspect(); await btn(p.concern).click(); await inspect("+answer"); await go();
	if (p.park) { await inspect(); await go(); }
	for (let i = 0; i < 10; i++) { await inspect(); await go(); } // dawn → pray
	await inspect();
	if (width < 500) {
		await page.locator(".card .choices .choice").last().hover();
		const boxes = await page.$$eval(".card .choices .choice", (els) => els.map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { top: r.top, bottom: r.bottom, style: `${c.backgroundColor}|${c.color}|${c.borderColor}|${c.borderWidth}|${e.getAttribute("aria-pressed")}` }; }));
		check(boxes.length === 3, `${label}: expected 3 exits, found ${boxes.length}`);
		check(boxes.every((b) => b.top >= 0 && b.bottom <= height), `${label}: the three exits are not all on screen`);
		check(new Set(boxes.map((b) => b.style)).size === 1, `${label}: the exits don't look identical`);
	}
	await btn(p.exit).click();
	if (p.exit.startsWith("Volto")) { await inspect(); await page.locator(".card").getByRole("button", { name: "Continuar" }).click(); }
	while (await page.locator("#foot").getByRole("button", { name: "Continuar", exact: true }).count()) { await inspect(); await go(); }
	await inspect();
	check((await page.locator(".card").getAttribute("data-card")) === "kit", `${label}: did not end on the take-away`);

	const order = steps.map((s) => s.step);
	let last = 0;
	for (const s of order) {
		const i = ORDER.indexOf(s);
		check(i >= last || (s === "verdict" && ORDER[last] === "mortality"), `${label}: "${s}" came after "${ORDER[last]}"`);
		last = Math.max(last, i);
	}
	const ids = steps.map((s) => s.id);
	check(ids.indexOf("breaks") > ids.indexOf("verdict"), `${label}: the metaphor breaks before the reader's verdict`);
	check(ids.indexOf("dented") > ids.indexOf("verdict"), `${label}: "God doesn't reject the dented" comes before the verdict`);
	check(errors.length === 0, `${label}: errors: ${errors.join(" | ")}`);
	await ctx.close();
}

/* A walk that stalls (a card moved, a button missing) is itself a failure: report it and carry on. */
for (const size of SIZES) {
	for (const [name, p] of Object.entries(PATHS)) {
		try {
			await walk(size, name, p);
		} catch (err) {
			check(false, `tem-volta/${name}@${size.join("x")}: the walk stalled (${String(err.message).split("\n")[0]})`);
			await page0?.close().catch(() => {});
		}
	}
}

/* The take-away. */
{
	const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
	const page = await ctx.newPage();
	await page.goto(`file://${DIST}tem-volta.html`);
	const r = await page.evaluate(async () => {
		const host = document.createElement("div");
		document.body.append(host);
		window.TVKit.mount(host);
		const blob = await window.TVKit.drawCard();
		return { wa: host.querySelector('a[href^="https://wa.me/"]')?.href || "", card: blob?.size || 0 };
	});
	const text = decodeURIComponent(r.wa.split("text=")[1] || "");
	check(text.includes("Lei de Deus") && text.indexOf("Lei de Deus") < text.indexOf("Isaías 44:22"), "kit: WhatsApp text must put the Law before Isaiah 44:22");
	check(text.includes(T.handoff.readingPlan), "kit: WhatsApp text lacks the reading plan link");
	check(r.card > 20000, `kit: card image looks empty (${r.card} bytes)`);
	await ctx.close();
}

/* The concept board, wrapped the way the artifact viewer wraps it. */
for (const [width, scheme] of [[390, "light"], [1280, "light"], [390, "dark"], [1280, "dark"]]) {
	const wrapped = join(DIST, "..", ".board-preview.html");
	writeFileSync(wrapped, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="file://${DIST}"><style>body{margin:0}</style></head><body>${readFileSync(join(DIST, "index.html"), "utf8")}</body></html>`);
	const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
	const page = await ctx.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(String(e)));
	await page.goto(`file://${wrapped}`);
	await page.waitForTimeout(400);
	const r = await page.evaluate(() => ({ hs: document.documentElement.scrollWidth > window.innerWidth + 1, qr: [...document.querySelectorAll("img.qr")].every((i) => i.naturalWidth > 0) }));
	check(!r.hs, `board@${width} ${scheme}: scrolls sideways`);
	check(r.qr, `board@${width} ${scheme}: QR code did not load`);
	check(errors.length === 0, `board@${width} ${scheme}: errors: ${errors.join(" | ")}`);
	await page.screenshot({ path: join(SHOTS, `board-${scheme}-${width}.png`), fullPage: true });
	await ctx.close();
	rmSync(wrapped, { force: true });
}

await browser.close();
if (failures.size) {
	console.error(`✗ ${failures.size} distinct failure(s) in ${checks} checks:`);
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}
console.log(`✓ ${checks} checks passed: method, brand and links, three paths at ${SIZES.map((s) => s.join("×")).join(", ")}, kit, board. Screenshots: ${SHOTS}`);
