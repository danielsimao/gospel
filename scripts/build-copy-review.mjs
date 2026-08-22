#!/usr/bin/env node
/**
 * Builds print-ready PT copy-review booklets.
 *
 * Every block of copy gets a short stable ID printed in the margin (e.g. `GR-04`)
 * and a ruled space to write in. The ID -> JSON-key map is written alongside the
 * PDFs as `copy-review-map.json`, so handwritten feedback can be applied back to
 * `src/messages/pt.json` by ID rather than by fuzzy-matching Portuguese strings.
 *
 *   node scripts/build-copy-review.mjs            # all booklets
 *   node scripts/build-copy-review.mjs caminho    # one booklet by slug
 *   node scripts/build-copy-review.mjs --html     # skip the PDF step
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "build", "copy-review");
const MESSAGES = join(ROOT, "src", "messages", "pt.json");
const MAP = join(ROOT, "docs", "copy-review-map.json");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

/* ------------------------------------------------------------------ *
 * Which strings are copy, and which are plumbing
 * ------------------------------------------------------------------ */

// Keys whose values are never reader-facing prose.
const SKIP_KEYS = new Set([
  "slug",
  "readingLink",
  "useOxfordComma",
  "separator",
  "href",
  "url",
  "icon",
  "id",
]);

const isPlumbing = (key, value) =>
  typeof value !== "string" ||
  value.trim() === "" ||
  SKIP_KEYS.has(key) ||
  /^https?:\/\//.test(value) ||
  /^[a-z0-9-]+\.(png|jpg|svg|webp)$/i.test(value);

const isMeta = (path) => /meta(Title|Description)$/.test(path);

/** Short role tag shown above each block, so she knows what she is looking at. */
function roleOf(key, value) {
  if (isMeta(key)) return "no Google";
  if (/(^|\.)(cta\w*|.*Cta|.*Button|button)$/i.test(key)) return "botão";
  if (/[a-z]Label$/.test(key)) return "botão";
  if (/(^|\.)label$/.test(key)) return "etiqueta";
  if (/(heading|Heading|title|Title|eyebrow)$/.test(key)) return "título";
  if (/(scriptureRef)$/.test(key)) return "referência bíblica";
  if (/(scripture)$/.test(key)) return "versículo";
  if (value.length <= 28) return "etiqueta";
  return null;
}

/* ------------------------------------------------------------------ *
 * Walking the message tree
 * ------------------------------------------------------------------ */

/** Flattens a subtree into ordered { path, key, value } leaves. */
function leaves(node, path = "") {
  const out = [];
  if (Array.isArray(node)) {
    node.forEach((v, i) => out.push(...leaves(v, `${path}[${i}]`)));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      out.push(...leaves(v, path ? `${path}.${k}` : k));
    }
  } else {
    const key = path.split(".").pop() ?? path;
    out.push({ path, key: key.replace(/\[\d+\]$/, ""), value: node });
  }
  return out;
}

const at = (obj, path) =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

/* ------------------------------------------------------------------ *
 * Booklet definitions — reading order follows docs/METHOD.md, not JSON order
 * ------------------------------------------------------------------ */

const BOOKLETS = [
  {
    slug: "1-caminho",
    number: "1",
    title: "O caminho principal",
    lead: "Isto é o coração do site — o que uma pessoa vê do princípio ao fim. É a parte mais importante de todas.",
    groups: [
      {
        prefix: "AB",
        title: "A abertura",
        where: "A primeira coisa que a pessoa vê ao abrir o site.",
        paths: ["landing"],
      },
      {
        prefix: "PG",
        title: "As seis perguntas",
        where: "A pessoa responde a seis perguntas, uma de cada vez. Cada uma tem uma resposta honesta, uma desculpa, e o que o site responde a seguir.",
        paths: ["questions"],
        perItem: (i, item) => `Pergunta ${i + 1} — ${item.commandment ?? ""}`,
      },
      {
        prefix: "VD",
        title: "O veredicto",
        where: "Depois das seis perguntas, o site diz à pessoa o que as respostas dela mostram.",
        paths: ["verdict", "test.verdict", "test.verdictLabels"],
      },
      {
        prefix: "GR",
        title: "A graça",
        where: "A parte boa. O site explica, passo a passo, como a dívida pode ser paga.",
        paths: ["grace"],
      },
      {
        prefix: "DC",
        title: "A decisão",
        where: "Pede-se à pessoa que decida. Ela tem de poder dizer que não.",
        paths: ["invitation"],
      },
      {
        prefix: "PP",
        title: "Os próximos passos",
        where: "O que a pessoa vê depois de decidir. Há dois caminhos: quem decidiu seguir Cristo, e quem quer pensar mais.",
        paths: ["nextSteps"],
      },
      {
        prefix: "PA",
        title: "Partilhar",
        where: "As mensagens que a pessoa envia se quiser mostrar o site a alguém.",
        paths: ["share"],
      },
      {
        prefix: "BT",
        title: "Botões e palavras soltas do teste",
        where: "Palavras curtas que aparecem em botões e cantos do ecrã durante o teste.",
        paths: ["test"],
        exclude: ["test.verdict", "test.verdictLabels"],
      },
    ],
  },
  {
    slug: "2-site",
    number: "2",
    title: "O resto do site",
    lead: "As outras páginas: a entrada, quem somos, o plano de leitura, encontrar uma igreja, e o rodapé.",
    groups: [
      { prefix: "IN", title: "Página de entrada", where: "A página inicial do site.", paths: ["home", "eternity"] },
      { prefix: "SO", title: "Sobre", where: "A página que explica o que é este site e porque existe.", paths: ["about"] },
      { prefix: "PL", title: "Plano de leitura de 7 dias", where: "Sete dias a ler o Evangelho de João.", paths: ["readingPlan"] },
      { prefix: "IG", title: "Encontrar uma igreja", where: "Ajuda a encontrar uma igreja bíblica perto de casa.", paths: ["findChurch"] },
      { prefix: "TE", title: "Temas — a entrada", where: "A página que lista todos os temas para aprender. Os temas em si estão nos cadernos seguintes.", paths: ["learn"], exclude: ["learn.topics"] },
      { prefix: "CA", title: "Cartões e artigos", where: "Cartões para imprimir e a lista de artigos.", paths: ["cards", "blog"] },
      { prefix: "RO", title: "Rodapé e barra de cima", where: "As palavras no topo e no fundo de todas as páginas.", paths: ["topBar", "footer", "meta"] },
    ],
  },
  {
    slug: "3-legal",
    number: "3",
    title: "Textos legais",
    lead: "Privacidade e termos de utilização. Texto obrigatório — só é preciso ver se está compreensível.",
    groups: [
      { prefix: "PR", title: "Privacidade", where: "", paths: ["privacy"] },
      { prefix: "TR", title: "Termos", where: "", paths: ["terms"] },
    ],
  },
];

/** One booklet per `learn` topic — they are long-form articles. */
function topicBooklets(messages) {
  const topics = messages.learn?.topics ?? [];
  return topics.map((topic, i) => ({
    slug: `tema-${String(i + 1).padStart(2, "0")}-${topic.slug}`,
    number: `Tema ${i + 1}`,
    title: topic.title,
    lead: topic.subtitle ?? "",
    groups: [
      {
        prefix: `T${String(i + 1).padStart(2, "0")}`,
        title: topic.title,
        where: "Um artigo do site, para quem quer aprender mais sobre este assunto.",
        paths: [`learn.topics[${i}]`],
      },
    ],
  }));
}

/* ------------------------------------------------------------------ *
 * Collecting blocks
 * ------------------------------------------------------------------ */

function collect(messages, booklet) {
  const map = {};
  const groups = [];

  for (const group of booklet.groups) {
    const excluded = group.exclude ?? [];
    const items = [];
    let n = 0;

    for (const path of group.paths) {
      const node = at(messages, path);
      if (node === undefined) {
        console.warn(`  ! missing path: ${path}`);
        continue;
      }

      // Array-of-objects sections (questions, topic sections) get sub-headings.
      if (Array.isArray(node) && group.perItem) {
        node.forEach((item, i) => {
          const sub = { subheading: group.perItem(i, item), blocks: [] };
          for (const leaf of leaves(item, `${path}[${i}]`)) {
            if (isPlumbing(leaf.key, leaf.value)) continue;
            const id = `${group.prefix}-${String(++n).padStart(2, "0")}`;
            map[id] = leaf.path;
            sub.blocks.push({ id, ...leaf, role: roleOf(leaf.key, leaf.value) });
          }
          if (sub.blocks.length) items.push(sub);
        });
        continue;
      }

      const sub = { subheading: null, blocks: [] };
      for (const leaf of leaves(node, path)) {
        if (isPlumbing(leaf.key, leaf.value)) continue;
        if (excluded.some((e) => leaf.path === e || leaf.path.startsWith(`${e}.`) || leaf.path.startsWith(`${e}[`))) continue;
        const id = `${group.prefix}-${String(++n).padStart(2, "0")}`;
        map[id] = leaf.path;
        sub.blocks.push({ id, ...leaf, role: roleOf(leaf.key, leaf.value) });
      }
      if (sub.blocks.length) items.push(sub);
    }

    const count = items.reduce((a, s) => a + s.blocks.length, 0);
    if (count) groups.push({ ...group, items, count });
  }

  const words = groups
    .flatMap((g) => g.items)
    .flatMap((s) => s.blocks)
    .reduce((a, b) => a + b.value.split(/\s+/).length, 0);

  return { groups, map, words };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Shows `{count}` style placeholders as something a human can read past. */
const withPlaceholders = (s) =>
  esc(s).replace(/\{(\w+)\}/g, '<span class="ph">•••</span>');

function renderBlock(block) {
  const long = block.value.length > 90;
  return `
    <div class="block${long ? " long" : ""}">
      <div class="id">${esc(block.id)}</div>
      <div class="copy">
        ${block.role ? `<div class="role">${esc(block.role)}</div>` : ""}
        <p>${withPlaceholders(block.value)}</p>
      </div>
      <div class="notes"><span></span><span></span>${long ? "<span></span>" : ""}</div>
    </div>`;
}

function renderGroup(group) {
  return `
    <section class="group">
      <div class="group-head">
        <h2>${esc(group.title)}</h2>
        ${group.where ? `<p class="where">${esc(group.where)}</p>` : ""}
      </div>
      ${group.items
        .map(
          (sub) =>
            (sub.subheading ? `<h3 class="sub">${esc(sub.subheading)}</h3>` : "") +
            sub.blocks.map(renderBlock).join(""),
        )
        .join("")}
    </section>`;
}

function renderHtml(booklet, collected) {
  const pages = Math.max(1, Math.round(collected.words / 260));
  return `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8">
<title>${esc(booklet.title)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm 16mm 14mm; }
  @page :first { margin-top: 30mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "DejaVu Serif", "Liberation Serif", Georgia, serif;
    font-size: 13.5pt; line-height: 1.5; color: #14110f; margin: 0;
  }

  /* ---- cover ---- */
  .cover { page-break-after: always; }
  .cover .num {
    font-size: 12pt; letter-spacing: .18em; text-transform: uppercase;
    color: #8a1c1c; font-weight: bold; margin-bottom: 6mm;
  }
  .cover h1 { font-size: 34pt; line-height: 1.15; margin: 0 0 5mm; font-weight: normal; }
  .cover .lead { font-size: 15pt; line-height: 1.55; color: #3d3733; margin: 0 0 14mm; max-width: 132mm; }
  .cover .stat { font-size: 11.5pt; color: #6b625c; border-top: 1px solid #d8d0c8; padding-top: 4mm; }

  /* ---- instructions ---- */
  .how { page-break-after: always; }
  .how h2 { font-size: 21pt; font-weight: normal; margin: 0 0 6mm; }
  .how ol { padding-left: 8mm; margin: 0 0 9mm; }
  .how li { margin-bottom: 5mm; line-height: 1.55; }
  .how .tip {
    background: #f6f1e8; border-left: 3px solid #b8891f;
    padding: 5mm 6mm; font-size: 12.5pt; line-height: 1.55;
  }
  .how .tip strong { color: #8a1c1c; }

  /* ---- groups ---- */
  .group { page-break-before: always; }
  .group-head { border-bottom: 2px solid #14110f; padding-bottom: 3mm; margin-bottom: 7mm; }
  .group h2 { font-size: 20pt; font-weight: normal; margin: 0; }
  .where { font-size: 11.5pt; color: #6b625c; margin: 2.5mm 0 0; line-height: 1.45; font-style: italic; }
  h3.sub {
    font-size: 12pt; font-weight: bold; margin: 8mm 0 3mm;
    color: #8a1c1c; page-break-after: avoid;
  }

  /* ---- one block of copy ---- */
  .block {
    display: grid; grid-template-columns: 13mm 1fr 58mm; gap: 0 4mm;
    padding: 3mm 0; border-bottom: 1px dotted #cfc7bf;
    page-break-inside: avoid;
  }
  .id {
    font-family: "DejaVu Sans", sans-serif; font-size: 8.5pt; color: #97887a; letter-spacing: .04em; padding-top: 1.6mm; white-space: nowrap;
  }
  .role {
    font-family: "DejaVu Sans", sans-serif; font-size: 7.5pt; text-transform: uppercase;
    letter-spacing: .1em; color: #a89a8c; margin-bottom: 1mm;
  }
  .copy p { margin: 0; }
  .block.long .copy p { font-size: 13.5pt; }
  .block:not(.long) .copy p { font-size: 13pt; }
  .ph {
    background: #ece4d8; border-radius: 2mm; padding: 0 1.5mm;
    color: #8a7a66; font-size: 90%;
  }
  .notes { display: flex; flex-direction: column; justify-content: flex-start; gap: 6mm; padding-top: 5mm; }
  .notes span { border-bottom: 1px solid #ddd5cc; height: 0; display: block; }

  /* ---- end ---- */
  .end { page-break-before: always; text-align: center; padding-top: 40mm; }
  .end h2 { font-size: 22pt; font-weight: normal; margin: 0 0 5mm; }
  .end p { font-size: 13pt; color: #5d554f; max-width: 110mm; margin: 0 auto; line-height: 1.6; }
</style></head><body>

<div class="cover">
  <div class="num">Caderno ${esc(booklet.number)}</div>
  <h1>${esc(booklet.title)}</h1>
  ${booklet.lead ? `<p class="lead">${esc(booklet.lead)}</p>` : ""}
  <div class="stat">
    Texto do site <strong>Se Morresses Hoje</strong> &nbsp;·&nbsp;
    ${collected.words.toLocaleString("pt-PT")} palavras &nbsp;·&nbsp; cerca de ${pages} páginas
  </div>
</div>

<div class="how">
  <h2>Como rever este texto</h2>
  <p style="margin:0 0 7mm;color:#3d3733;">
    Este é o texto de um site que fala do Evangelho a quem entra nele pela primeira vez.
    Muitas dessas pessoas nunca ouviram nada disto. Precisamos de saber se está claro.
  </p>
  <ol>
    <li><strong>Leia devagar</strong>, do princípio ao fim, como se nunca tivesse visto isto.</li>
    <li><strong>Faça um círculo</strong> à volta de qualquer palavra ou frase que soe estranha, forçada, ou que não se diga assim em português.</li>
    <li><strong>Escreva ao lado</strong>, na coluna da direita, como diria a mesma coisa por palavras suas.</li>
    <li><strong>Ponha um ponto de interrogação</strong> ao lado do que não perceber à primeira leitura.</li>
    <li><strong>Ponha um visto</strong> junto do que estiver especialmente bem. Também é importante saber o que não mexer.</li>
    <li>O que estiver bem <strong>não precisa de marca nenhuma</strong>. Não é preciso escrever em todas as linhas.</li>
  </ol>
  <div class="tip">
    <p style="margin:0 0 4mm;"><strong>Três coisas que mais ajudam</strong></p>
    <p style="margin:0 0 3mm;">
      <strong>Soa a português?</strong> — Muito deste texto foi escrito primeiro em inglês.
      Se alguma frase souber a tradução, é isso mesmo que queremos apanhar.
    </p>
    <p style="margin:0 0 3mm;">
      <strong>Percebe-se?</strong> — Palavras difíceis, ideias que ficam pelo caminho, frases longas demais.
    </p>
    <p style="margin:0;">
      <strong>O tom está certo?</strong> — Deve ser sério mas com respeito e carinho. Nunca a ralhar,
      nunca a empurrar ninguém.
    </p>
  </div>
  <p style="margin:8mm 0 0;font-size:11.5pt;color:#6b625c;line-height:1.5;">
    O código à esquerda de cada texto (por exemplo <strong>AB-03</strong>) serve para sabermos
    exactamente a que frase se refere cada correcção. Se escrever numa folha à parte, indique o código.
    O sinal <span class="ph">•••</span> é onde o site preenche sozinho um número ou um nome.
  </p>
</div>

${collected.groups.map(renderGroup).join("")}

<div class="end">
  <h2>Chegou ao fim.</h2>
  <p>
    Muito obrigado pelo tempo e pelo cuidado. Cada correcção vai directa para o site —
    e vai ajudar alguém que o abra pela primeira vez a perceber o que lá está escrito.
  </p>
</div>

</body></html>`;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (!p) continue;
    try {
      execFileSync(p, ["--version"], { stdio: "pipe" });
      return p;
    } catch {}
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const htmlOnly = args.includes("--html");
  const filters = args.filter((a) => !a.startsWith("--"));

  const messages = JSON.parse(readFileSync(MESSAGES, "utf8"));
  const all = [...BOOKLETS, ...topicBooklets(messages)];
  const chosen = filters.length
    ? all.filter((b) => filters.some((f) => b.slug.includes(f)))
    : all;

  if (!chosen.length) {
    console.error(`No booklet matched. Available:\n  ${all.map((b) => b.slug).join("\n  ")}`);
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const chrome = htmlOnly ? null : findChrome();
  if (!htmlOnly && !chrome) {
    console.error("No Chromium found. Set CHROME_PATH, or pass --html.");
    process.exit(1);
  }

  const fullMap = {};
  let built = 0;

  for (const booklet of chosen) {
    const collected = collect(messages, booklet);
    if (!collected.groups.length) {
      console.warn(`  ! ${booklet.slug}: nothing to render, skipped`);
      continue;
    }
    Object.assign(fullMap, collected.map);

    const htmlPath = join(OUT, `${booklet.slug}.html`);
    writeFileSync(htmlPath, renderHtml(booklet, collected));

    let label = `${booklet.slug}.html`;
    if (chrome) {
      const pdfPath = join(OUT, `${booklet.slug}.pdf`);
      execFileSync(
        chrome,
        [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--no-pdf-header-footer",
          `--print-to-pdf=${pdfPath}`,
          `file://${htmlPath}`,
        ],
        { stdio: "pipe" },
      );
      rmSync(htmlPath);
      label = `${booklet.slug}.pdf`;
    }

    const blocks = collected.groups.reduce((a, g) => a + g.count, 0);
    console.log(
      `  ✓ ${label.padEnd(42)} ${String(blocks).padStart(4)} blocos  ${String(collected.words).padStart(6)} palavras`,
    );
    built++;
  }

  // The map is committed (unlike the PDFs) so handwritten feedback can still be
  // applied by ID after the copy underneath has moved on.
  const mapPath = filters.length ? join(OUT, "copy-review-map.json") : MAP;
  writeFileSync(mapPath, `${JSON.stringify(fullMap, null, 2)}\n`);
  console.log(`\n${built} caderno(s) em build/copy-review/`);
  console.log(`${Object.keys(fullMap).length} códigos em ${mapPath.replace(`${ROOT}/`, "")}`);
}

main();
