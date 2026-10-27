/*
 * Tem volta? — the take-away. Shown last, after the three exits.
 *
 * temvolta.pt is a campaign front door: what comes next lives on Se Morresses
 * Hoje (reading plan, questions, finding a church). The kit only has to make
 * sure the reader leaves with something, even if they never come back:
 *
 *   1. Enviar para mim no WhatsApp (works inside Instagram's in-app browser)
 *   2. Guardar o cartão (a 1080×1920 image, never with the reader's answers)
 *   3. Ler João, 7 manhãs (Se Morresses Hoje's reading plan)
 *   + small links: questions, a church, a real person, copy, start over
 *
 * Host pages style it through --kit-fg, --kit-muted, --kit-line,
 * --kit-surface, --kit-accent, --kit-accent-fg, --kit-sans, --kit-sheet-bg.
 */
(() => {
	const T = window.TV;
	const framed = (() => {
		try {
			return window.self !== window.top;
		} catch {
			return true;
		}
	})();

	function h(tag, attrs, ...kids) {
		const el = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs || {})) {
			if (v == null || v === false) continue;
			if (k === "class") el.className = v;
			else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
			else el.setAttribute(k, v === true ? "" : v);
		}
		for (const c of kids.flat()) if (c != null && c !== false) el.append(typeof c === "string" ? document.createTextNode(c) : c);
		return el;
	}

	/* The text that travels: the Law first, then grace, then where to read. */
	function summaryText() {
		return [
			"TEM VOLTA?",
			"",
			`“${T.examine.verse.text}” ${T.examine.verse.ref}`,
			"",
			"Todos quebrámos a Lei de Deus: mentimos, roubámos, cobiçámos. Julgados por ela, somos culpados, e o salário do pecado é a morte (Romanos 6:23).",
			"",
			"Mas Jesus, Deus feito homem, pagou a nossa dívida na cruz e ressuscitou ao terceiro dia (1 Coríntios 15:3-4).",
			"",
			`“${T.dawn.verse.text}” ${T.dawn.verse.ref}`,
			"",
			"Volta-te do pecado e confia só em Jesus.",
			"",
			`Sete manhãs em João: ${T.handoff.readings.join(", ")}`,
			T.handoff.readingPlan,
			"",
			"Bíblia Livre (CC BY) · temvolta.pt",
		].join("\n");
	}

	async function copy(text, button) {
		const label = button.textContent;
		try {
			await navigator.clipboard.writeText(text);
			button.textContent = "Copiado";
		} catch {
			button.textContent = "Seleciona o texto abaixo";
			const pre = button.closest(".kit")?.querySelector(".kit-copytext");
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

	async function drawCard() {
		try {
			await Promise.all(['italic 400 58px "Newsreader"', '800 64px "Archivo"', '400 34px "Archivo"', '500 26px "IBM Plex Mono"'].map((f) => document.fonts.load(f)));
			await document.fonts.ready;
		} catch {
			/* fall back to whatever is loaded */
		}
		const W = 1080;
		const H = 1920;
		const side = 120;
		const c = document.createElement("canvas");
		c.width = W;
		c.height = H;
		const ctx = c.getContext("2d");
		const split = 960;
		ctx.fillStyle = "#1c1631";
		ctx.fillRect(0, 0, W, split);
		const sky = ctx.createLinearGradient(0, split, 0, H);
		sky.addColorStop(0, "#d2dce8");
		sky.addColorStop(0.55, "#efdccb");
		sky.addColorStop(1, "#f4c29a");
		ctx.fillStyle = sky;
		ctx.fillRect(0, split, W, H - split);
		const maxW = W - side * 2;

		ctx.fillStyle = "#ece7dd";
		ctx.font = '800 64px "Archivo", "Arial Black", sans-serif';
		ctx.fillText("Tem volta?", side, 380);

		ctx.font = 'italic 400 54px "Newsreader", Georgia, serif';
		let y = 520;
		for (const l of wrap(ctx, `“${T.card.law.text}.”`, maxW)) {
			ctx.fillText(l, side, y);
			y += 70;
		}
		ctx.fillStyle = "rgba(236,231,221,.62)";
		ctx.font = '500 26px "IBM Plex Mono", monospace';
		ctx.fillText(T.card.law.ref.toUpperCase(), side, y + 14);

		ctx.fillStyle = "#161b2a";
		ctx.font = 'italic 400 54px "Newsreader", Georgia, serif';
		y = split + 120;
		for (const l of wrap(ctx, `“${T.dawn.verse.text}”`, maxW)) {
			ctx.fillText(l, side, y);
			y += 70;
		}
		ctx.fillStyle = "rgba(22,27,42,.62)";
		ctx.font = '500 26px "IBM Plex Mono", monospace';
		ctx.fillText(T.dawn.verse.ref.toUpperCase(), side, y + 14);

		ctx.fillStyle = "#161b2a";
		ctx.font = '400 34px "Archivo", Arial, sans-serif';
		y += 100;
		for (const l of T.card.lines) {
			for (const w of wrap(ctx, l, maxW)) {
				ctx.fillText(w, side, y);
				y += 48;
			}
		}
		ctx.fillStyle = "rgba(22,27,42,.72)";
		ctx.font = '500 26px "IBM Plex Mono", monospace';
		ctx.fillText("temvolta.pt · Bíblia Livre (CC BY)", side, Math.min(y + 40, H - 320));
		return new Promise((resolve) => c.toBlob(resolve, "image/png"));
	}

	/* ---------- sheet ---------- */

	const VARS = ["--kit-fg", "--kit-muted", "--kit-line", "--kit-surface", "--kit-accent", "--kit-accent-fg", "--kit-sans", "--kit-sheet-bg"];
	let open = null;
	function closeSheet() {
		if (!open) return;
		open.backdrop.remove();
		open.sheet.remove();
		document.removeEventListener("keydown", onKey);
		open.opener?.focus?.({ preventScroll: true });
		open = null;
	}
	function onKey(e) {
		if (e.key === "Escape") closeSheet();
	}
	function openSheet(root, title, kids) {
		closeSheet();
		const vars = getComputedStyle(root);
		const style = VARS.map((v) => `${v}:${vars.getPropertyValue(v)}`).join(";");
		const backdrop = h("div", { class: "kit-backdrop", onclick: closeSheet });
		const sheet = h(
			"div",
			{ class: "kit kit-pop", role: "dialog", "aria-modal": "true", "aria-label": title, style },
			h("div", { class: "kit-pop-head" }, h("h3", {}, title), h("button", { class: "kit-x", type: "button", "aria-label": "Fechar", onclick: closeSheet }, "×")),
			kids,
		);
		open = { backdrop, sheet, opener: document.activeElement };
		document.body.append(backdrop, sheet);
		document.addEventListener("keydown", onKey);
		sheet.querySelector(".kit-x")?.focus({ preventScroll: true });
	}

	const CSS = `
.kit{display:grid;gap:14px;font-family:var(--kit-sans);color:var(--kit-fg)}
.kit [hidden]{display:none!important}
.kit h3{margin:0;font:600 12px/1.2 var(--kit-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--kit-muted)}
.kit p{margin:0;line-height:1.45}
.kit-stack{display:grid;gap:10px}
.kit-btn{appearance:none;display:flex;align-items:center;justify-content:center;min-height:54px;width:100%;padding:12px 18px;border-radius:999px;border:1px solid var(--kit-line);background:transparent;color:var(--kit-fg);font:500 17px/1.2 var(--kit-sans);text-decoration:none;cursor:pointer}
.kit-btn.primary{background:var(--kit-accent);color:var(--kit-accent-fg);border-color:transparent}
.kit-btn:focus-visible,.kit-link:focus-visible,.kit-x:focus-visible{outline:2px solid var(--kit-fg);outline-offset:3px}
.kit-links{display:flex;flex-wrap:wrap;gap:2px 18px}
.kit-link{appearance:none;background:none;border:0;padding:7px 0;color:var(--kit-muted);font:500 15px/1.3 var(--kit-sans);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.kit-note{font-size:14px;color:var(--kit-muted)}
.kit-copytext{white-space:pre-wrap;font:13px/1.45 var(--kit-sans);background:var(--kit-surface);padding:12px;border-radius:10px;max-height:200px;overflow:auto;margin:0}
.kit-badge{justify-self:start;padding:3px 9px;border-radius:999px;border:1px dashed var(--kit-muted);font:600 11px/1.4 var(--kit-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--kit-muted)}
.kit-backdrop{position:fixed;inset:0;background:rgba(8,8,14,.5);z-index:40}
.kit-pop{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:min(560px,100%);max-height:88vh;overflow:auto;z-index:41;background:var(--kit-sheet-bg,#fff);padding:16px 20px calc(20px + env(safe-area-inset-bottom,0px));border-radius:20px 20px 0 0}
.kit-pop-head{display:flex;justify-content:space-between;align-items:center}
.kit-x{width:44px;height:44px;border:0;background:none;color:var(--kit-fg);font:400 26px/1 var(--kit-sans);cursor:pointer;border-radius:50%}
.kit-card-preview{max-height:54vh;max-width:100%;width:auto;justify-self:center;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25)}`;

	function mount(root, opts = {}) {
		if (!document.getElementById("tv-kit-css")) document.head.append(h("style", { id: "tv-kit-css" }, CSS));
		const text = summaryText();
		let blob = null;
		const ready = drawCard().then((b) => {
			blob = b;
			return b;
		});
		const downloadsReady = (async () => {
			try {
				return window.claude?.use ? await window.claude.use("downloads") : null;
			} catch {
				return null;
			}
		})();

		async function card() {
			const status = h("p", { class: "kit-note", role: "status" });
			const img = h("img", { class: "kit-card-preview", alt: "Cartão com Romanos 3:23 e Isaías 44:22." });
			openSheet(root, "O cartão", [img, h("p", { class: "kit-note" }, "No telemóvel, carrega na imagem para a guardar nas fotografias."), status]);
			const b = blob || (await ready);
			if (!b) return;
			img.src = URL.createObjectURL(b);
			const downloads = await Promise.race([downloadsReady, new Promise((r) => setTimeout(() => r(null), 300))]);
			if (downloads) {
				try {
					await downloads.save({ filename: "tem-volta.png", data: b });
					status.textContent = "Guardado.";
				} catch (err) {
					status.textContent = err?.code === "declined" ? "" : "Aqui não dá para guardar. Carrega na imagem.";
				}
				return;
			}
			const file = typeof File === "function" ? new File([b], "tem-volta.png", { type: "image/png" }) : null;
			if (file && navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], title: "Tem volta?" });
					return;
				} catch {
					/* the preview is still there */
				}
			}
			if (!framed) {
				const url = URL.createObjectURL(b);
				const a = h("a", { href: url, download: "tem-volta.png" });
				document.body.append(a);
				a.click();
				a.remove();
				setTimeout(() => URL.revokeObjectURL(url), 60000);
			}
		}

		const talk = () =>
			openSheet(root, "Falar com uma pessoa real", [
				h("span", { class: "kit-badge" }, "Protótipo · sem equipa"),
				h("p", {}, "Na versão real, isto abre uma conversa de WhatsApp com um voluntário. Ele ouve-te, responde às tuas perguntas com a Bíblia e ajuda-te a encontrar uma igreja perto de ti."),
				h("p", { class: "kit-note" }, "Nada do que respondeste aqui é passado a ninguém. Só começas a conversa se quiseres. Ainda não há ninguém do outro lado."),
			]);

		const kit = h(
			"section",
			{ class: "kit", "aria-label": "Leva isto contigo" },
			h("h3", {}, "Leva isto contigo"),
			h(
				"div",
				{ class: "kit-stack" },
				h("a", { class: "kit-btn primary", href: `https://wa.me/?text=${encodeURIComponent(text)}`, target: "_blank", rel: "noopener" }, "Enviar para mim no WhatsApp"),
				h("button", { class: "kit-btn", type: "button", onclick: card }, "Guardar o cartão"),
				h("a", { class: "kit-btn", href: T.handoff.readingPlan, target: "_blank", rel: "noopener" }, "Ler João: sete manhãs"),
			),
			h(
				"div",
				{ class: "kit-links" },
				h("a", { class: "kit-link", href: T.handoff.learn, target: "_blank", rel: "noopener" }, "Perguntas que as pessoas fazem"),
				h("a", { class: "kit-link", href: T.handoff.church, target: "_blank", rel: "noopener" }, "Encontrar uma igreja"),
				h("button", { class: "kit-link", type: "button", onclick: talk }, "Falar com uma pessoa real"),
				h("button", { class: "kit-link", type: "button", onclick: (e) => copy(text, e.currentTarget) }, "Copiar o texto"),
				(opts.links || []).map((l) => h("button", { class: "kit-link", type: "button", onclick: l.onclick }, l.label)),
			),
			h("pre", { class: "kit-copytext", hidden: true }, text),
		);
		root.replaceChildren(kit);
		return kit;
	}

	window.TVKit = { mount, summaryText, drawCard, closeSheet };
})();
