/*
 * Checks the Once prototypes against the method, without a browser.
 *
 *   - Conversation graph: every path reaches the verdict only after all six
 *     commandments; no grace node before the verdict; no mortality node after
 *     the response; every evasion is pressed once; every target exists.
 *   - Objections parked during the Law carry no grace content.
 *   - Post-exit copy never claims a tap saved anyone, and nothing after the
 *     response leans on death or deadlines.
 *   - Every quoted verse is a substring of the Berean Standard Bible text in
 *     data/verses.json.
 *   - The Letter's sections appear in the method's order.
 *
 * Deliberately outside vitest's glob, so it never runs in the owner's
 * pre-push hook. Run after build.mjs: node prototypes/once/scripts/verify-method.mjs
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const DIST = new URL("../dist/", import.meta.url);
const read = (f) => readFileSync(new URL(f, DIST), "utf8");
const { verses } = JSON.parse(readFileSync(new URL("../data/verses.json", import.meta.url), "utf8"));

const failures = new Set();
const fail = (msg) => failures.add(msg);
let checks = 0;
const check = (ok, msg) => {
	checks++;
	if (!ok) fail(msg);
};

/* Load the shared scripts the way a page does. */
const sandbox = { window: {}, Intl, console };
vm.createContext(sandbox);
for (const f of ["content.js", "objections.js", "chat-graph.js"]) vm.runInContext(read(f), sandbox, { filename: f });
const O = sandbox.window.ONCE;
const OB = sandbox.window.ONCE_OBJECTIONS;
const G = sandbox.window.ONCE_CHAT;

const DECISIONISM = /you('| a)re (now )?saved|pray this prayer|say this prayer|born again|welcome to the family|congratulations|forgiven now|you are forgiven|now you're a christian/i;
const PRESSURE = /appointed to die|tomorrow|deadline|no one is promised|could die|too late|every second|before you die|the count/i;
const GRACE_WORDS = /\bcross\b|forgiv|\bpaid\b|\bpays\b|mercy|\bgrace\b|\bsaved?\b|Jesus|Christ/i;

/* ---------- verses ---------- */
const seen = new Set();
function collectVerses(obj, where) {
	if (!obj || typeof obj !== "object" || seen.has(obj)) return;
	seen.add(obj);
	if (typeof obj.ref === "string" && typeof obj.text === "string" && /\d+:\d+/.test(obj.ref)) {
		const parts = verses[obj.ref];
		check(!!parts, `${where}: ${obj.ref} is not in verses.json`);
		if (parts) check(parts.join(" ").includes(obj.text), `${where}: quoted text of ${obj.ref} is not the BSB text`);
	}
	for (const v of Object.values(obj)) if (typeof v === "object") collectVerses(v, where);
}
collectVerses(O, "content.js");
collectVerses(OB, "objections.js");

/* ---------- objections ---------- */
for (const o of OB.law) {
	check(!GRACE_WORDS.test(o.a), `objections.js: law-phase answer "${o.q}" contains grace content`);
	check(!GRACE_WORDS.test(o.verse.text), `objections.js: law-phase verse ${o.verse.ref} contains grace content`);
	const s = OB.short?.[o.id];
	check(!!s, `objections.js: no short answer for "${o.q}"`);
	if (s) {
		check(!GRACE_WORDS.test(s.a), `objections.js: short law-phase answer "${o.q}" contains grace content`);
		check(!GRACE_WORDS.test(s.verse.text), `objections.js: short law-phase verse ${s.verse.ref} contains grace content`);
	}
}
for (const o of OB.grace) check(!!OB.short?.[o.id], `objections.js: no short answer for "${o.q}"`);

/* ---------- conversation graph ---------- */
const N = G.nodes;
const sampleStates = [];
for (const why of ["good", "believe", "church", "christ", "none"])
	for (const exit of ["now", "think", "no"])
		for (const parked of [[], ["perfect"]])
			sampleStates.push({
				why, exit, parked, good: "mostly", after: why === "none" ? "nothing" : "something",
				law: Object.fromEntries(O.law.map((c, i) => [c.id, i % 2 ? "admit" : "evade"])),
				verdict: "guilty", where: "heaven", whyHeaven: "goodgod", concern: "no",
			});
const textOf = (node, s) => {
	const msgs = typeof node.say === "function" ? node.say(s) : node.say || [];
	return msgs.map((m) => (typeof m === "string" ? m : m?.quote || m?.note || (m?.list ? m.list.map((x) => x.t).join(" ") : ""))).join(" ");
};
const versesOf = (node, s) => {
	const msgs = typeof node.say === "function" ? node.say(s) : node.say || [];
	return msgs.flatMap((m) => (m?.verse ? [m.verse] : m?.list ? m.list.map((x) => x.v) : []));
};
for (const [id, node] of Object.entries(N)) {
	for (const s of sampleStates) for (const v of versesOf(node, s)) collectVerses({ ...v }, `chat-graph.js ${id}`);
	const chips = typeof node.chips === "function" ? node.chips(sampleStates[0]) : node.chips || [];
	for (const c of chips) {
		if (c.to) check(!!N[c.to], `chat-graph.js: ${id} → missing node "${c.to}"`);
		if (c.evasion) check(!!N[c.to]?.press, `chat-graph.js: evasion on ${id} does not lead to a press`);
	}
	if (node.next) {
		for (const s of sampleStates) {
			const n = typeof node.next === "function" ? node.next(s) : node.next;
			check(!!N[n], `chat-graph.js: ${id} next → missing node "${n}"`);
		}
	}
	if (["exit", "kit"].includes(node.tag)) {
		for (const s of sampleStates) {
			const t = textOf(node, s);
			check(!DECISIONISM.test(t), `chat-graph.js: ${id} has decisionist copy: "${t.match(DECISIONISM)?.[0]}"`);
		}
	}
}

/*
 * Walk every path. State: node, verdict reached, response reached, which
 * commandments were visited. Chips and both kinds of `next` are followed.
 */
const ALL_LAW = (1 << O.law.length) - 1;
const lawBit = (id) => 1 << O.law.findIndex((c) => c.id === id);
const visited = new Set();
const queue = [{ id: G.start, verdict: false, response: false, law: 0 }];
let walked = 0;
while (queue.length) {
	const st = queue.shift();
	const key = `${st.id}|${st.verdict}|${st.response}|${st.law}`;
	if (visited.has(key)) continue;
	visited.add(key);
	walked++;
	const node = N[st.id];
	let { verdict, response, law } = st;
	if (node.law) law |= lawBit(node.law);
	if (node.tag === "verdict" && !verdict) {
		check(law === ALL_LAW, `chat-graph.js: reached the verdict at "${st.id}" without all six commandments`);
		verdict = true;
	}
	if (node.tag === "grace") check(verdict, `chat-graph.js: grace node "${st.id}" reachable before the verdict`);
	if (["response", "exit", "kit"].includes(node.tag)) response = true;
	if (node.tag === "mortality") check(!response, `chat-graph.js: mortality node "${st.id}" reachable after the response`);
	if (response) {
		for (const s of sampleStates) {
			const t = textOf(node, s);
			check(!PRESSURE.test(t), `chat-graph.js: "${st.id}" leans on death or deadlines after the response: "${t.match(PRESSURE)?.[0]}"`);
		}
	}
	const nexts = new Set();
	const chips = typeof node.chips === "function" ? node.chips(sampleStates[0]) : node.chips || [];
	for (const c of chips) if (c.to && !c.reset) nexts.add(c.to);
	if (node.next) for (const s of sampleStates) nexts.add(typeof node.next === "function" ? node.next(s) : node.next);
	for (const n of nexts) if (N[n]) queue.push({ id: n, verdict, response, law });
}
check(walked > 40, `chat-graph.js: walk covered only ${walked} states`);

/* ---------- shared post-exit copy ---------- */
const postExit = [
	...Object.values(O.after).flatMap((a) => [a.pause, a.ready, a.promiseLead, a.line].filter(Boolean)),
	...Object.values(O.ending).flatMap((d) => (typeof d === "string" ? [d] : [d.lead, d.tail, d.balance, ...(d.tests || []).map((t) => t.t)].filter(Boolean))),
	...O.essentials.map((e) => e.t),
	/* Stories' own short copy after the exits. */
	O.stories.pause,
	O.stories.ready,
	...Object.values(O.stories.answer).map((a) => a.line),
	...["good", "believe", "church", "christ"].map((k) => O.stories.ending[k].line),
	...O.stories.marks.lines.map((x) => x.t),
	O.stories.marks.balance,
	...O.stories.days.lines.map((x) => x.t),
];
for (const t of postExit) {
	check(!DECISIONISM.test(t), `content.js: decisionist copy after the exits: "${t}"`);
	check(!PRESSURE.test(t), `content.js: death or deadline pressure after the exits: "${t}"`);
}

/* ---------- the Letter: section order and post-exit prose ---------- */
const letter = read("letter.html");
const ORDER = ["you", "law", "verdict", "mortality", "grace", "response", "exit", "kit"];
const steps = [...letter.matchAll(/data-step="([a-z]+)"/g)].map((m) => m[1]);
let last = 0;
for (const s of steps) {
	const i = ORDER.indexOf(s);
	check(i >= last || (s === "verdict" && ORDER[last] === "mortality"), `letter.html: "${s}" appears after "${ORDER[last]}"`);
	last = Math.max(last, i);
}
for (const id of ["ch6", "ch7"]) {
	const m = letter.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`));
	const prose = (m?.[0] || "").replace(/<blockquote[\s\S]*?<\/blockquote>/g, " ").replace(/<[^>]+>/g, " ");
	check(!DECISIONISM.test(prose), `letter.html ${id}: decisionist copy`);
	check(!PRESSURE.test(prose), `letter.html ${id}: death or deadline pressure`);
}
for (const m of letter.matchAll(/<blockquote class="v[^"]*"[^>]*><p>([\s\S]*?)<\/p><cite>([^<]+)<\/cite>/g)) {
	const text = m[1].replace(/\.$/, "");
	const refs = m[2].replace(/–/g, "-");
	const parts = refs.includes("27-28") ? [...verses["Hebrews 9:27"], ...verses["Hebrews 9:28"]] : verses[refs];
	check(!!parts, `letter.html: ${refs} is not in verses.json`);
	if (parts) {
		const joined = parts.join(" ");
		const pieces = text.split(/ (?=so also Christ)/);
		check(pieces.every((p) => joined.includes(p.replace(/\.$/, ""))), `letter.html: quoted text of ${refs} is not the BSB text`);
	}
}

if (failures.size) {
	console.error(`✗ ${failures.size} distinct failure(s) in ${checks} checks:`);
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}
console.log(`✓ ${checks} method checks passed (${walked} conversation states walked)`);
