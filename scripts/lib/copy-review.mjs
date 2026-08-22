/**
 * Shared model for the PT copy-review booklets.
 *
 * Both generators (PDF for print, DOCX for Google Docs) import from here so a
 * given block of copy gets the SAME id in both. If this ever forks, the ids in
 * docs/copy-review-map.json stop matching what the reviewer was handed.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const MESSAGES = join(ROOT, "src", "messages", "pt.json");
export const MAP = join(ROOT, "docs", "copy-review-map.json");

export const loadMessages = () => JSON.parse(readFileSync(MESSAGES, "utf8"));

export const SKIP_KEYS = new Set([
  "slug",
  "readingLink",
  "useOxfordComma",
  "separator",
  "href",
  "url",
  "icon",
  "id",
]);

export const isPlumbing = (key, value) =>
  typeof value !== "string" ||
  value.trim() === "" ||
  SKIP_KEYS.has(key) ||
  /^https?:\/\//.test(value) ||
  /^[a-z0-9-]+\.(png|jpg|svg|webp)$/i.test(value);

export const isMeta = (path) => /meta(Title|Description)$/.test(path);

/** Short role tag shown above each block, so she knows what she is looking at. */
export function roleOf(key, value) {
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
export function leaves(node, path = "") {
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

export const at = (obj, path) =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

/* ------------------------------------------------------------------ *
 * Booklet definitions — reading order follows docs/METHOD.md, not JSON order
 * ------------------------------------------------------------------ */

export const BOOKLETS = [
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
export function topicBooklets(messages) {
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

export function collect(messages, booklet) {
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

