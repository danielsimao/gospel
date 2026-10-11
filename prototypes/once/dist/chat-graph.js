/*
 * Once · Conversation — the scripted graph.
 *
 * Comfort's street conversation as nodes. It is scripted on purpose: every
 * line is fixed in advance, so it costs nothing to run and cannot drift
 * doctrinally. The page says so, and nothing pretends a person is typing.
 *
 * A node:
 *   tag     you | law | verdict | mortality | grace | response | exit | kit
 *   say     messages, or (state) => messages. A message is a string,
 *           { verse }, { quote }, { note }, { list }, or { kit: true }.
 *   chips   [{ label, to, set, href }], or (state) => chips
 *   next    the node that follows when there are no chips: an id or (state) => id
 *   dawn    the sky changes here, once
 *   but     the "But…" chip is offered on this node
 *
 * scripts/verify-method.mjs walks this graph to check the method: no grace
 * before the verdict, no mortality after the response, every evasion pressed
 * once, every path through all six commandments.
 */
(() => {
	const O = window.ONCE;
	const list = (items) => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);
	const nodes = {};

	nodes.hello = {
		tag: "you",
		say: ["Can I ask you a question most people never get asked?"],
		chips: [
			{ label: "Go ahead", to: "after" },
			{ label: "Not now", to: "notnow" },
		],
	};
	nodes.notnow = {
		tag: "you",
		say: ["Fair enough. If you ever want it, the whole Gospel of John is here, no questions asked."],
		chips: [
			{ label: "Read John", href: "john.html" },
			{ label: "Actually, go ahead", to: "after" },
		],
	};
	nodes.after = {
		tag: "you",
		say: ["What do you think happens when someone dies?"],
		chips: [
			{ label: "Heaven or hell", to: "why", set: { after: "heavenhell" } },
			{ label: "Something. Not sure what", to: "why", set: { after: "something" } },
			{ label: "Never really thought about it", to: "thought", set: { after: "never" } },
			{ label: "Nothing. You just stop", to: "build1", set: { after: "nothing", why: "none" } },
		],
	};
	nodes.thought = { tag: "you", say: ["Most people haven't. Give me five minutes."], next: "why" };

	/* The atheist beat: Comfort's building and builder, then the conscience. */
	nodes.build1 = {
		tag: "you",
		say: ["Can I ask you something first? If you saw a building, how would you know someone built it?"],
		chips: [
			{ label: "The building is the proof", to: "build2" },
			{ label: "Obviously someone did", to: "build2" },
		],
	};
	nodes.build2 = {
		tag: "you",
		say: [
			"Right. The same reasoning goes all the way up.",
			{ verse: { ref: "Hebrews 3:4", text: "And every house is built by someone, but God is the builder of everything." } },
			"A painting tells you there's a painter. Creation tells you there's a Creator.",
			{ verse: { ref: "Romans 1:20", text: "For since the creation of the world God’s invisible qualities, His eternal power and divine nature, have been clearly seen, being understood from His workmanship, so that men are without excuse." } },
		],
		chips: [
			{ label: "Fair enough", to: "cons" },
			{ label: "That's not proof", to: "build3" },
		],
	};
	nodes.build3 = { tag: "you", say: ["Maybe not yet. Then look at a witness you carry everywhere."], next: "cons" };
	nodes.cons = {
		tag: "you",
		say: [
			"Your conscience. You know some things are wrong without anyone telling you. Scripture says that's God's law, written on your heart.",
			{ verse: { ref: "Romans 2:15", text: "So they show that the work of the law is written on their hearts, their consciences also bearing witness, and their thoughts either accusing or defending them" } },
		],
		next: "good",
	};

	/* The diagnostic. Testimony only: quoted back later, never used to skip anything. */
	nodes.why = {
		tag: "you",
		say: [O.why.q],
		chips: O.why.options.map((o) => ({ label: o.label, to: "whyHold", set: { why: o.id } })),
	};
	nodes.whyHold = { tag: "you", say: [O.why.hold], next: "good" };
	nodes.good = {
		tag: "you",
		say: [O.good.q],
		chips: O.good.options.map((o) => ({ label: o.label, to: "goodReply", set: { good: o.id } })),
	};
	nodes.goodReply = {
		tag: "you",
		say: (s) => [O.good.reply[s.good], "These are six of the Ten Commandments. Answer honestly. Nobody sees this but you."],
		next: "L0",
	};

	/* The Law: six commandments, each evasion pressed exactly once. */
	O.law.forEach((c, i) => {
		const after = i + 1 < O.law.length ? `L${i + 1}` : "sum";
		const admit = { law: { [c.id]: "admit" } };
		nodes[`L${i}`] = {
			tag: "law",
			but: true,
			law: c.id,
			say: [c.q],
			chips: [
				{ label: c.honest, to: `L${i}y`, set: admit },
				{ label: c.evade, to: `L${i}p`, evasion: true },
			],
		};
		nodes[`L${i}p`] = {
			tag: "law",
			but: true,
			law: c.id,
			press: true,
			say: [c.press],
			chips: [
				{ label: c.pressYes, to: `L${i}y`, set: admit },
				{ label: c.pressNo, to: `L${i}n`, set: { law: { [c.id]: "evade" } } },
			],
		};
		nodes[`L${i}y`] = {
			tag: "law",
			law: c.id,
			say: [c.named, ...(c.standard ? [{ verse: c.standard }] : [])],
			next: after,
		};
		nodes[`L${i}n`] = { tag: "law", law: c.id, say: ["Noted. That's your answer, and it stays yours."], next: after };
	});

	/* Comfort's own move on the first one: let the reader say the word. */
	nodes.L0y = {
		tag: "law",
		law: "lie",
		say: ["What do you call someone who tells lies?"],
		chips: [
			{ label: "A liar", to: "L0y2" },
			{ label: "Human", to: "L0h" },
		],
	};
	nodes.L0h = {
		tag: "law",
		law: "lie",
		say: ["Human, yes. But someone who tells lies is…"],
		chips: [{ label: "A liar", to: "L0y2" }],
	};
	nodes.L0y2 = { tag: "law", law: "lie", say: ["Your word, not mine."], next: "L1" };

	/* The read-back: admitted and evaded kept apart, the testimony quoted. */
	nodes.sum = {
		tag: "verdict",
		say: (s) => {
			const admitted = O.law.filter((c) => s.law[c.id] === "admit");
			const evaded = O.law.filter((c) => s.law[c.id] === "evade");
			const out = ["Can I read back what you told me?"];
			if (admitted.length) out.push(`${O.readBack.admitted} ${list(admitted.map((c) => c.name))}.`);
			if (evaded.length) out.push({ note: O.readBack.evaded(list(evaded.map((c) => c.denied))) });
			if (!admitted.length) out.push(O.readBack.noneAdmitted, { verse: O.readBack.noneVerse });
			if (s.good) out.push({ quote: `Asked if you're a good person, you said: “${O.good.quote[s.good]}”` });
			const why = O.why.options.find((o) => o.id === s.why);
			if (why) out.push({ quote: `${O.readBack.whyQuote}: “${why.label}.”` });
			if (s.after === "nothing") out.push({ quote: "And you said that when we die, we just stop." });
			out.push("That's six of the Ten. And the Law doesn't grade on a curve.", { verse: O.readBack.law });
			return out;
		},
		next: "once",
	};

	nodes.once = {
		tag: "mortality",
		say: ["Can I show you one sentence from the Bible? I'll only give you the first half for now.", { verse: O.once }],
		next: "v1",
	};

	nodes.v1 = {
		tag: "verdict",
		but: true,
		say: [O.verdict.q],
		chips: [
			{ label: "Guilty", to: "v1g", set: { verdict: "guilty" } },
			{ label: "Innocent", to: "v1i" },
		],
	};
	nodes.v1g = { tag: "verdict", say: ["Those are your words. Your answers say the same."], next: "v2" };
	nodes.v1i = {
		tag: "verdict",
		say: [O.verdict.innocentPress, { verse: O.verdict.innocentVerse }],
		chips: [
			{ label: "Guilty", to: "v1g", set: { verdict: "guilty" } },
			{ label: "Still innocent", to: "v1s", set: { verdict: "innocent" } },
		],
	};
	nodes.v1s = { tag: "verdict", say: [O.verdict.stillInnocent], next: "v2" };

	nodes.v2 = {
		tag: "verdict",
		but: true,
		say: [O.where.q],
		chips: O.where.options.map((o) => ({
			label: o.label,
			to: o.id === "heaven" ? "v2why" : "v2lead",
			set: { where: o.id },
		})),
	};
	nodes.v2why = {
		tag: "verdict",
		say: [O.where.whyHeaven.q],
		chips: O.where.whyHeaven.options.map((o) => ({ label: o.label, to: "v2wr", set: { whyHeaven: o.id } })),
	};
	nodes.v2wr = {
		tag: "verdict",
		say: (s) => {
			const o = O.where.whyHeaven.options.find((x) => x.id === s.whyHeaven);
			return [o.reply, ...(o.verse ? [{ verse: o.verse }] : [])];
		},
		next: "v2lead",
	};
	nodes.v2lead = {
		tag: "verdict",
		say: (s) => [O.where.lead[s.where], ...O.where.verses.map((v) => ({ verse: v }))],
		next: "c1",
	};

	nodes.c1 = {
		tag: "verdict",
		but: true,
		say: [O.concern.q],
		chips: O.concern.options.map((o) => ({ label: o.label, to: "c1r", set: { concern: o.id } })),
	};
	nodes.c1r = {
		tag: "verdict",
		say: (s) => [O.concern.reply[s.concern], ...(s.concern === "no" ? [{ verse: O.concern.noVerse }] : [])],
		next: (s) => (s.parked.length ? "parked" : "g0"),
	};

	/* Objections parked during the Law are answered here: still before the cross. */
	nodes.parked = {
		tag: "verdict",
		say: (s) => {
			const OB = window.ONCE_OBJECTIONS;
			const out = ["Earlier you asked me something, and I said I'd come back to it."];
			for (const id of s.parked) {
				const o = OB.law.find((x) => x.id === id);
				if (o) out.push({ quote: `You asked: “${o.q}”` }, o.a, { verse: o.verse });
			}
			return out;
		},
		next: "g0",
	};

	nodes.g0 = {
		tag: "verdict",
		say: ["Do you know what God did so that you wouldn't have to go there?"],
		chips: [
			{ label: "Jesus died?", to: "g1" },
			{ label: "No", to: "g1" },
			{ label: "Tell me", to: "g1" },
		],
	};

	/* Dawn. */
	nodes.g1 = {
		tag: "grace",
		dawn: true,
		say: ["Here's how that sentence ends.", { verse: O.dawn }, O.dawnLine],
		next: "court1",
	};
	nodes.court1 = {
		tag: "grace",
		but: true,
		say: [O.court[0].line, ...O.court[0].verses.map((v) => ({ verse: v }))],
		chips: [{ label: "Go on", to: "court2" }],
	};
	nodes.court2 = {
		tag: "grace",
		but: true,
		say: [O.court[1].line, ...O.court[1].verses.map((v) => ({ verse: v }))],
		chips: [{ label: "So what happens?", to: "court3" }],
	};
	nodes.court3 = {
		tag: "grace",
		but: true,
		say: [O.court[2].line, ...O.court[2].verses.map((v) => ({ verse: v }))],
		chips: [{ label: "Who would do that?", to: "jesus" }],
	};
	nodes.jesus = {
		tag: "grace",
		but: true,
		say: [{ verse: O.court[3].verses[0] }, O.court[3].line, ...O.court[3].verses.slice(1).map((v) => ({ verse: v }))],
		chips: [
			{ label: "Why would He?", to: "why316" },
			{ label: "What do I do?", to: "r1" },
		],
	};
	nodes.why316 = {
		tag: "grace",
		say: ["Because He loves you. That's the reason Scripture gives.", { verse: { ref: "John 3:16", text: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life." } }],
		chips: [{ label: "What do I do?", to: "r1" }],
	};

	nodes.r1 = {
		tag: "response",
		but: true,
		say: [O.respond.repent, ...O.respond.repentVerses.map((v) => ({ verse: v }))],
		chips: [{ label: "And trust?", to: "r2" }],
	};
	nodes.r2 = {
		tag: "response",
		but: true,
		say: [O.respond.trust, { verse: O.respond.trustVerse }],
		chips: [{ label: "How do I do that?", to: "r3" }],
	};
	nodes.r3 = {
		tag: "response",
		say: [O.respond.psalmLead, ...O.respond.psalm.map((v) => ({ verse: v })), O.respond.psalmTail],
		next: "exits",
	};

	/* Three equal exits. No default, no confirm, no clock. */
	nodes.exits = {
		tag: "exit",
		exits: true,
		say: [O.exits.q],
		chips: O.exits.options.map((o) => ({ label: o.label, to: o.id === "now" ? "now" : "end", set: { exit: o.id } })),
	};
	nodes.now = {
		tag: "exit",
		say: [O.after.now.pause],
		chips: [{ label: O.after.now.ready, to: "end" }],
	};

	/* The ending: conditional promises, the tailored paragraph, the kit. */
	nodes.end = {
		tag: "kit",
		say: (s) => {
			const out = [];
			const a = O.after[s.exit];
			if (s.exit === "now") out.push(a.promiseLead, { verse: a.promise });
			if (s.exit === "think") out.push(a.line, ...a.verses.map((v) => ({ verse: v })));
			if (s.exit === "no") out.push(a.line);
			const d = O.ending[s.why];
			if (d && !(d.examine && s.exit === "no")) {
				out.push("If we never meet again, this is the one thing I'd want you to hear.");
				if (d.examine) out.push({ note: "Examine yourself" });
				if (d.examine && s.exit === "now") out.push(O.ending.examineNowIntro);
				out.push(d.lead, ...d.verses.map((v) => ({ verse: v })));
				if (d.tests) {
					out.push({ list: d.tests.map((t) => ({ t: t.t, v: t.v })) });
					out.push(d.balance, ...d.balanceVerses.map((v) => ({ verse: v })));
				}
				if (d.tail) out.push(d.tail);
				if (d.tailVerse) out.push({ verse: d.tailVerse });
			}
			if (s.exit === "now") out.push("For the days ahead:", { list: O.essentials.map((x) => ({ t: x.t, v: x.v })) });
			out.push({ kit: true });
			return out;
		},
		chips: [
			{ label: "Read John", href: "john.html" },
			{ label: "Start over", to: "hello", reset: true },
		],
	};

	window.ONCE_CHAT = { start: "hello", nodes };
})();
