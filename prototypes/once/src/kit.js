/*
 * Once — the take-away kit. Shown after the three exits, in every variant.
 *
 * The reader may never come back, so they leave with something that lasts.
 * Nothing goes through a server of ours. Order matters: the first action is
 * the one that still works inside an Instagram or TikTok in-app browser.
 *
 *   1. Send to myself on WhatsApp (a wa.me link) + Copy
 *   2. Save the card (canvas PNG)
 *   3. Seven mornings in John (Google Calendar link; .ics only in a real tab)
 *   4. Talk to a real person (prototype: not staffed)
 *   5. Read John here
 *   6. Print a one-page summary (only in a real tab: framed pages cannot print)
 *
 * The card and the print sheet are generic tracts. They never carry the
 * reader's own answers, because an image gets shared.
 *
 * Host pages style the kit through CSS custom properties: --kit-fg,
 * --kit-muted, --kit-line, --kit-surface, --kit-accent, --kit-accent-fg,
 * --kit-sans, --kit-serif.
 */
(() => {
	const O = window.ONCE;
	const READINGS = /* KIT_READINGS */ [];

	const framed = (() => {
		try {
			return window.self !== window.top;
		} catch {
			return true;
		}
	})();

	function h(tag, attrs, ...children) {
		const el = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs || {})) {
			if (v == null || v === false) continue;
			if (k === "class") el.className = v;
			else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
			else el.setAttribute(k, v === true ? "" : v);
		}
		for (const c of children.flat()) {
			if (c == null || c === false) continue;
			el.append(typeof c === "string" ? document.createTextNode(c) : c);
		}
		return el;
	}

	/* ---------- the text that travels ---------- */

	function summaryText() {
		const lines = [
			"ONCE",
			"",
			`“${O.once.text} ${O.dawn.text}.” Hebrews 9:27-28`,
			"",
			"We have all broken God's Law. We have lied, stolen, lusted and hated. Judged by that Law we are guilty, and its penalty is death and hell. (Romans 6:23; Revelation 21:8)",
			"",
			"But God sent His Son. Jesus, God in flesh, lived the life we couldn't, died to pay our fine in full, and rose on the third day. (Romans 5:8; 1 Corinthians 15:3-4)",
			"",
			"Turn from your sin and trust Him alone. (Mark 1:15)",
			"",
			"Seven mornings in the Gospel of John:",
			...READINGS.map((r, i) => `${i + 1}. ${r.ref} · ${r.title}`),
			"",
			"John is the fourth book of the New Testament. Any Bible has it.",
			"Scripture: Berean Standard Bible (public domain).",
		];
		return lines.join("\n");
	}

	async function copy(text, button) {
		const label = button.textContent;
		try {
			await navigator.clipboard.writeText(text);
			button.textContent = "Copied";
		} catch {
			button.textContent = "Select the text below to copy";
			const pre = button.parentElement.parentElement.querySelector(".kit-copytext");
			if (pre) {
				pre.hidden = false;
				const range = document.createRange();
				range.selectNodeContents(pre);
				const sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
		setTimeout(() => {
			button.textContent = label;
		}, 2400);
	}

	/* ---------- the card ---------- */

	const CARD = { w: 1080, h: 1920, safeTop: 300, safeBottom: 320, side: 120 };

	function wrap(ctx, text, maxWidth) {
		const words = text.split(/\s+/);
		const lines = [];
		let line = "";
		for (const w of words) {
			const test = line ? `${line} ${w}` : w;
			if (ctx.measureText(test).width > maxWidth && line) {
				lines.push(line);
				line = w;
			} else line = test;
		}
		if (line) lines.push(line);
		return lines;
	}

	function spaced(ctx, text, x, y, spacing) {
		let cx = x;
		for (const ch of text) {
			ctx.fillText(ch, cx, y);
			cx += ctx.measureText(ch).width + spacing;
		}
	}

	async function drawCard() {
		const fonts = [
			'italic 400 60px "Newsreader"',
			'600 30px "Archivo"',
			'400 36px "Archivo"',
			'800 44px "Archivo"',
		];
		try {
			await Promise.all(fonts.map((f) => document.fonts.load(f)));
			await document.fonts.ready;
		} catch {
			/* fall back to whatever is loaded */
		}
		const c = document.createElement("canvas");
		c.width = CARD.w;
		c.height = CARD.h;
		const ctx = c.getContext("2d");
		const split = 1010;
		const night = "#0e1322";
		const paper = "#ece7dd";
		const ink = "#171c2b";

		ctx.fillStyle = night;
		ctx.fillRect(0, 0, CARD.w, split);
		const sky = ctx.createLinearGradient(0, split, 0, CARD.h);
		sky.addColorStop(0, "#c9d6e6");
		sky.addColorStop(0.55, "#efd9c6");
		sky.addColorStop(1, "#f6c8a4");
		ctx.fillStyle = sky;
		ctx.fillRect(0, split, CARD.w, CARD.h - split);

		const maxW = CARD.w - CARD.side * 2;
		ctx.textBaseline = "alphabetic";

		ctx.fillStyle = "rgba(236,231,221,.62)";
		ctx.font = '800 44px "Archivo", "Arial Black", sans-serif';
		spaced(ctx, "ONCE", CARD.side, CARD.safeTop + 50, 14);

		ctx.fillStyle = paper;
		ctx.font = 'italic 400 60px "Newsreader", Georgia, serif';
		let y = CARD.safeTop + 190;
		for (const l of wrap(ctx, O.once.text, maxW)) {
			ctx.fillText(l, CARD.side, y);
			y += 78;
		}
		ctx.fillStyle = "rgba(236,231,221,.6)";
		ctx.font = '600 30px "Archivo", Arial, sans-serif';
		spaced(ctx, "HEBREWS 9:27", CARD.side, y + 24, 4);

		ctx.fillStyle = ink;
		ctx.font = 'italic 400 60px "Newsreader", Georgia, serif';
		y = split + 130;
		for (const l of wrap(ctx, `${O.dawn.text}.`, maxW)) {
			ctx.fillText(l, CARD.side, y);
			y += 78;
		}
		ctx.fillStyle = "rgba(23,28,43,.62)";
		ctx.font = '600 30px "Archivo", Arial, sans-serif';
		spaced(ctx, "HEBREWS 9:28", CARD.side, y + 24, 4);

		ctx.fillStyle = ink;
		ctx.font = '400 34px "Archivo", Arial, sans-serif';
		y += 110;
		const four = [
			"We have all broken God's Law.",
			"Judged by it, we are guilty.",
			"Jesus paid the fine in full. He died and rose.",
			"Turn from your sin and trust Him.",
		];
		for (const l of four) {
			for (const w of wrap(ctx, l, maxW)) {
				ctx.fillText(w, CARD.side, y);
				y += 48;
			}
		}
		ctx.font = '600 30px "Archivo", Arial, sans-serif';
		ctx.fillStyle = "rgba(23,28,43,.72)";
		y = Math.min(y + 40, CARD.h - CARD.safeBottom);
		ctx.fillText("Start with John 1  ·  Berean Standard Bible", CARD.side, y);
		return new Promise((resolve) => c.toBlob(resolve, "image/png"));
	}

	/* ---------- the calendar ---------- */

	const pad = (n) => String(n).padStart(2, "0");
	const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

	function googleCalendarUrl() {
		const start = new Date();
		start.setDate(start.getDate() + 1);
		const day = ymd(start);
		const details = [
			"One passage each morning for seven days:",
			...READINGS.map((r, i) => `Day ${i + 1}: ${r.ref} · ${r.title}`),
			"",
			"Read it slowly. What does it show you about Jesus?",
		].join("\n");
		const p = new URLSearchParams({
			action: "TEMPLATE",
			text: "Seven mornings in John",
			dates: `${day}T073000/${day}T074500`,
			details,
			recur: "RRULE:FREQ=DAILY;COUNT=7",
		});
		return `https://calendar.google.com/calendar/render?${p.toString()}`;
	}

	const icsEscape = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

	/* Fold at 75 octets without splitting a multi-byte character. */
	function fold(line) {
		const enc = new TextEncoder();
		const out = [];
		let cur = "";
		let bytes = 0;
		let limit = 75;
		for (const ch of line) {
			const b = enc.encode(ch).length;
			if (bytes + b > limit) {
				out.push(cur);
				cur = "";
				bytes = 0;
				limit = 74; /* continuation lines start with a space */
			}
			cur += ch;
			bytes += b;
		}
		out.push(cur);
		return out.join("\r\n ");
	}

	function buildIcs() {
		const john = window.ONCE_JOHN;
		const now = new Date();
		const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
		const lines = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Once prototype//Seven mornings in John//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
		];
		john.readings.forEach((r, i) => {
			const d = new Date();
			d.setDate(d.getDate() + 1 + i);
			const verses = [];
			for (let v = r.from; v <= r.to; v++) {
				const t = john.chapters[r.chapter - 1][v - 1];
				if (t) verses.push(`${v} ${t}`);
			}
			const desc = `${verses.join(" ")}\n\nRead it slowly. What does it show you about Jesus?\n\nBerean Standard Bible (public domain)`;
			const summary = `Day ${i + 1} · ${r.ref} · ${r.title}`;
			lines.push(
				"BEGIN:VEVENT",
				`UID:once-john-${i + 1}-${now.getTime()}@once.prototype`,
				`DTSTAMP:${stamp}`,
				`DTSTART:${ymd(d)}T073000`,
				"DURATION:PT15M",
				"TRANSP:TRANSPARENT",
				`SUMMARY:${icsEscape(summary)}`,
				`DESCRIPTION:${icsEscape(desc)}`,
				"BEGIN:VALARM",
				"ACTION:DISPLAY",
				`DESCRIPTION:${icsEscape(summary)}`,
				"TRIGGER:PT0M",
				"END:VALARM",
				"END:VEVENT",
			);
		});
		lines.push("END:VCALENDAR");
		return `${lines.map(fold).join("\r\n")}\r\n`;
	}

	function loadJohn() {
		if (window.ONCE_JOHN) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const s = document.createElement("script");
			s.src = "john-data.js";
			s.onload = resolve;
			s.onerror = reject;
			document.head.append(s);
		});
	}

	function saveBlob(blob, filename) {
		const url = URL.createObjectURL(blob);
		const a = h("a", { href: url, download: filename });
		document.body.append(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 60000);
	}

	/* ---------- the print sheet ---------- */

	function printSheet() {
		document.querySelector(".kit-print")?.remove();
		const v = (x) => h("p", { class: "kit-p-verse" }, `“${x.text}” `, h("span", {}, x.ref));
		const sheet = h(
			"div",
			{ class: "kit-print", "aria-hidden": "true" },
			h("h1", {}, "Once"),
			h("p", { class: "kit-p-lead" }, "The message, in the order the Bible gives it."),
			h("h2", {}, "The Law"),
			h("p", {}, "Have you ever lied, stolen, used God's name as a curse, or looked with lust? Those are four of the Ten Commandments."),
			v(O.readBack.law),
			h("h2", {}, "Judgment"),
			v(O.once),
			v(O.where.verses[0]),
			h("h2", {}, "The cross"),
			v({ ref: "Hebrews 9:28", text: O.dawn.text }),
			h("p", {}, "A good judge can't let the guilty go. But if someone pays the fine in full, the case can be dismissed. Jesus, God in flesh, paid it, and rose."),
			v(O.court[3].verses[0]),
			v(O.court[3].verses[2]),
			h("h2", {}, "Turn and trust"),
			v(O.respond.repentVerses[1]),
			h("p", {}, "No formula. Psalm 51 is how King David prayed:"),
			v(O.respond.psalm[0]),
			h("h2", {}, "Seven mornings in John"),
			h("ol", {}, READINGS.map((r) => h("li", {}, `${r.ref} · ${r.title}`))),
			h("p", { class: "kit-p-small" }, "Scripture: Berean Standard Bible (public domain)."),
		);
		document.body.append(sheet);
		document.documentElement.classList.add("kit-printing");
		const done = () => {
			document.documentElement.classList.remove("kit-printing");
			window.removeEventListener("afterprint", done);
		};
		window.addEventListener("afterprint", done);
		window.print();
	}

	/* ---------- styles ---------- */

	const CSS = `
.kit{display:grid;gap:22px;font-family:var(--kit-sans);color:var(--kit-fg)}
.kit [hidden]{display:none!important}
.kit h3{margin:0;font:600 13px/1.2 var(--kit-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--kit-muted)}
.kit p{margin:0;line-height:1.5}
.kit-group{display:grid;gap:12px;padding-top:18px;border-top:1px solid var(--kit-line)}
.kit-row{display:flex;flex-wrap:wrap;gap:10px}
.kit-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 18px;border-radius:999px;border:1px solid var(--kit-line);background:transparent;color:var(--kit-fg);font:500 16px/1.2 var(--kit-sans);text-decoration:none;cursor:pointer}
.kit-btn.primary{background:var(--kit-accent);color:var(--kit-accent-fg);border-color:transparent}
.kit-btn:focus-visible{outline:2px solid var(--kit-fg);outline-offset:3px}
.kit-copytext{white-space:pre-wrap;font:13px/1.45 var(--kit-sans);background:var(--kit-surface);padding:12px;border-radius:10px;max-height:220px;overflow:auto;margin:0}
.kit-list{margin:0;padding:0;list-style:none;display:grid;gap:6px;font-variant-numeric:tabular-nums}
.kit-list li{display:grid;grid-template-columns:9.2em 1fr;gap:10px}
.kit-list b{font-weight:600;white-space:nowrap}
.kit-note{font-size:14px;color:var(--kit-muted)}
.kit-badge{justify-self:start;display:inline-block;padding:3px 9px;border-radius:999px;border:1px dashed var(--kit-muted);font:600 11px/1.4 var(--kit-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--kit-muted)}
.kit-sheet{display:grid;gap:10px;padding:16px;border-radius:14px;background:var(--kit-surface)}
.kit-card-preview{max-width:min(260px,70%);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.kit-print{display:none}
@media print{
  html.kit-printing body > *:not(.kit-print){display:none!important}
  html.kit-printing .kit-print{display:block;color:#000;background:#fff;font:10.5pt/1.45 Georgia,serif}
  .kit-print h1{font:700 20pt/1 Arial,sans-serif;letter-spacing:.2em;margin:0 0 4pt}
  .kit-print h2{font:700 9pt/1 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:12pt 0 4pt}
  .kit-print p,.kit-print ol{margin:0 0 5pt}
  .kit-p-verse{font-style:italic;break-inside:avoid}
  .kit-p-verse span{font-style:normal;font-size:8.5pt;letter-spacing:.06em}
  .kit-p-small{font-size:8.5pt}
  @page{margin:14mm}
}`;

	function injectCss() {
		if (document.getElementById("kit-css")) return;
		document.head.append(h("style", { id: "kit-css" }, CSS));
	}

	/* ---------- mount ---------- */

	function mount(root) {
		injectCss();
		const text = summaryText();
		let cardBlob = null;
		const cardReady = drawCard().then((b) => {
			cardBlob = b;
			return b;
		});
		const downloadsReady = (async () => {
			try {
				return window.claude?.use ? await window.claude.use("downloads") : null;
			} catch {
				return null;
			}
		})();
		if (!framed) loadJohn().catch(() => {});

		const preview = h("div", { class: "kit-sheet", hidden: true });
		const status = h("p", { class: "kit-note", role: "status" });

		async function saveCard() {
			const blob = cardBlob || (await cardReady);
			if (!blob) return;
			const downloads = await Promise.race([downloadsReady, new Promise((r) => setTimeout(() => r(null), 300))]);
			showPreview(blob);
			if (downloads) {
				try {
					await downloads.save({ filename: "once-card.png", data: blob });
					status.textContent = "Saved.";
				} catch (err) {
					status.textContent =
						err?.code === "declined" ? "" : "Saving isn't available here. Press and hold the image to keep it.";
				}
				return;
			}
			const file = typeof File === "function" ? new File([blob], "once-card.png", { type: "image/png" }) : null;
			if (file && navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], title: "Once" });
					return;
				} catch {
					/* shared sheet closed, or refused: the preview is still there */
				}
			}
			if (!framed) saveBlob(blob, "once-card.png");
		}

		function showPreview(blob) {
			preview.replaceChildren(
				h("img", {
					class: "kit-card-preview",
					src: URL.createObjectURL(blob),
					alt: "A card with Hebrews 9:27 and 9:28 and the message in four lines.",
				}),
				h("p", { class: "kit-note" }, "On a phone, press and hold the image to save it to your photos."),
			);
			preview.hidden = false;
		}

		const person = h(
			"div",
			{ class: "kit-sheet", hidden: true, id: "kit-person" },
			h("span", { class: "kit-badge" }, "Prototype · not staffed"),
			h(
				"p",
				{},
				"In a live version of Once, this opens a WhatsApp chat with a volunteer who has walked this road. They will listen, answer your questions from the Bible, and help you find a church near you.",
			),
			h(
				"p",
				{ class: "kit-note" },
				"Nothing you answered here is passed on. You start the conversation, and only if you want to. No one is on the other end yet.",
			),
		);

		const kit = h(
			"section",
			{ class: "kit", "aria-label": "Take it with you" },
			h("h3", {}, "Take it with you"),
			h("p", { class: "kit-note" }, "Your answers stayed on this device. These go only where you send them."),
			h(
				"div",
				{ class: "kit-group" },
				h(
					"div",
					{ class: "kit-row" },
					h(
						"a",
						{
							class: "kit-btn primary",
							href: `https://wa.me/?text=${encodeURIComponent(text)}`,
							target: "_blank",
							rel: "noopener",
						},
						"Send to myself on WhatsApp",
					),
					h("button", { class: "kit-btn", type: "button", onclick: (e) => copy(text, e.currentTarget) }, "Copy the text"),
				),
				h("pre", { class: "kit-copytext", hidden: true }, text),
			),
			h(
				"div",
				{ class: "kit-group" },
				h("p", {}, "A card for your lock screen or to pass on. It has none of your answers on it."),
				h("div", { class: "kit-row" }, h("button", { class: "kit-btn", type: "button", onclick: saveCard }, "Save the card")),
				preview,
				status,
			),
			h(
				"div",
				{ class: "kit-group" },
				h("p", {}, "Seven mornings in the Gospel of John. One passage a day, about ten minutes."),
				h(
					"ol",
					{ class: "kit-list" },
					READINGS.map((r, i) => h("li", {}, h("b", {}, `${i + 1} · ${r.ref}`), h("span", {}, r.title))),
				),
				h(
					"div",
					{ class: "kit-row" },
					h(
						"a",
						{ class: "kit-btn", href: googleCalendarUrl(), target: "_blank", rel: "noopener" },
						"Add to Google Calendar",
					),
					!framed &&
						h(
							"button",
							{
								class: "kit-btn",
								type: "button",
								onclick: async () => {
									await loadJohn();
									saveBlob(new Blob([buildIcs()], { type: "text/calendar" }), "once-john-7-mornings.ics");
								},
							},
							"Calendar file (.ics)",
						),
					h("a", { class: "kit-btn", href: "john.html" }, "Read John here"),
				),
			),
			h(
				"div",
				{ class: "kit-group" },
				h("p", {}, "Rather talk to someone?"),
				h(
					"div",
					{ class: "kit-row" },
					h(
						"button",
						{
							class: "kit-btn",
							type: "button",
							"aria-expanded": "false",
							"aria-controls": "kit-person",
							onclick: (e) => {
								person.hidden = !person.hidden;
								e.currentTarget.setAttribute("aria-expanded", String(!person.hidden));
							},
						},
						"Talk to a real person",
					),
					!framed && h("button", { class: "kit-btn", type: "button", onclick: printSheet }, "Print a one-page summary"),
				),
				person,
			),
		);
		root.replaceChildren(kit);
		return kit;
	}

	window.OnceKit = { mount, summaryText, buildIcs, loadJohn, drawCard, framed };
})();
