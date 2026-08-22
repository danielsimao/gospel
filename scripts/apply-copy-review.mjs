#!/usr/bin/env node
/**
 * Closes the copy-review loop: reads a corrected review document back and
 * diffs it against src/messages/pt.json.
 *
 *   node scripts/apply-copy-review.mjs <ficheiro.docx>           # report only
 *   node scripts/apply-copy-review.mjs <ficheiro.docx> --write   # apply
 *
 * Corrections are matched by the id in the first column, never by matching the
 * Portuguese text — so a reviewer rewriting a sentence wholesale still lands on
 * exactly one key, and the mapping survives later edits to the copy underneath.
 *
 * Two kinds of edit are picked up:
 *   1. text typed into the third column ("A minha correcção") — the intended way
 *   2. the middle column edited in place — because some reviewers will do that
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

import { MAP, MESSAGES } from "./lib/copy-review.mjs";

/* ------------------------------------------------------------------ *
 * Minimal OOXML reading — depth-aware, so nested tables cannot desync it
 * ------------------------------------------------------------------ */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&(\w+);/g, (m, e) => ENTITIES[e] ?? m);

/** Returns the inner XML of every top-level <tag>…</tag> within `xml`. */
function elements(xml, tag) {
  const token = new RegExp(`<w:${tag}(?:\\s[^>]*)?>|</w:${tag}>|<w:${tag}(?:\\s[^>]*)?/>`, "g");
  const out = [];
  let depth = 0;
  let start = -1;
  // A for-loop (not while) so the self-closing `continue` still advances the regex.
  for (let m = token.exec(xml); m !== null; m = token.exec(xml)) {
    if (m[0].endsWith("/>")) continue; // self-closing, no content
    if (!m[0].startsWith("</")) {
      if (depth === 0) start = m.index + m[0].length;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start >= 0) out.push(xml.slice(start, m.index));
    }
  }
  return out;
}

/** All text in a run-container, with tabs/breaks flattened to whitespace. */
function textOf(xml) {
  return decode(
    xml
      .replace(/<w:tab\/>/g, " ")
      .replace(/<w:br\/>/g, "\n")
      .match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g)
      ?.map((t) => t.replace(/<[^>]+>/g, ""))
      .join("") ?? "",
  );
}

const paragraphsOf = (cellXml) => elements(cellXml, "p").map(textOf);

function readDocx(path) {
  const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const rows = [];
  for (const tbl of elements(xml, "tbl")) {
    for (const tr of elements(tbl, "tr")) {
      rows.push(elements(tr, "tc").map(paragraphsOf));
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 * Reading / writing a value at a dotted+indexed path
 * ------------------------------------------------------------------ */

const parts = (path) =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((k) => (/^\d+$/.test(k) ? Number(k) : k));

const getAt = (obj, path) => parts(path).reduce((a, k) => (a == null ? a : a[k]), obj);

function setAt(obj, path, value) {
  const ks = parts(path);
  const last = ks.pop();
  const target = ks.reduce((a, k) => a[k], obj);
  if (target == null) throw new Error(`unreachable path: ${path}`);
  target[last] = value;
}

/* ------------------------------------------------------------------ *
 * Diffing
 * ------------------------------------------------------------------ */

const ID_RE = /^[A-Z]{1,3}\d{0,2}-\d{2,}$/;
const norm = (s) => s.replace(/\s+/g, " ").trim();

function diff(rows, map, messages) {
  const changes = [];
  const problems = [];
  let matched = 0;

  for (const cells of rows) {
    if (cells.length < 3) continue; // header band or a sub-heading row
    const id = norm(cells[0].join(" "));
    if (!ID_RE.test(id)) continue;

    const path = map[id];
    if (!path) {
      problems.push({ id, why: "código desconhecido — não está no mapa" });
      continue;
    }
    const current = getAt(messages, path);
    if (typeof current !== "string") {
      problems.push({ id, why: `a chave ${path} já não existe no pt.json` });
      continue;
    }
    matched++;

    const correction = norm(cells[2].join("\n"));
    // The middle column carries an optional role tag paragraph above the text,
    // so the copy itself is the last paragraph.
    const shown = norm(cells[1][cells[1].length - 1] ?? "");

    let proposed = null;
    let via = null;
    if (correction && correction !== "?" && norm(correction) !== norm(current)) {
      proposed = correction;
      via = "coluna de correcção";
    } else if (!correction && shown && shown !== norm(current)) {
      proposed = shown;
      via = "editado no próprio texto";
    }

    if (correction === "?") {
      problems.push({ id, why: "marcado com «?» — não percebeu a frase", path, current });
      continue;
    }
    if (proposed) changes.push({ id, path, from: current, to: proposed, via });
  }
  return { changes, problems, matched };
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const OFF = "\x1b[0m";

function report({ changes, problems, matched }) {
  console.log(`\n${BOLD}${matched}${OFF} blocos lidos do documento.\n`);

  if (changes.length) {
    console.log(`${BOLD}${changes.length} alteração(ões) proposta(s)${OFF}\n`);
    for (const c of changes) {
      console.log(`${BOLD}${c.id}${OFF}  ${DIM}${c.path}${OFF}  ${DIM}(${c.via})${OFF}`);
      console.log(`  ${RED}− ${c.from}${OFF}`);
      console.log(`  ${GREEN}+ ${c.to}${OFF}\n`);
    }
  } else {
    console.log("Nenhuma alteração encontrada.\n");
  }

  if (problems.length) {
    console.log(`${YELLOW}${BOLD}${problems.length} ponto(s) a verificar${OFF}\n`);
    for (const p of problems) {
      console.log(`${YELLOW}${p.id}${OFF}  ${p.why}`);
      if (p.current) console.log(`  ${DIM}${p.current}${OFF}`);
    }
    console.log("");
  }
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const file = args.find((a) => !a.startsWith("--"));

  if (!file) {
    console.error("uso: node scripts/apply-copy-review.mjs <ficheiro.docx> [--write]");
    process.exit(1);
  }

  const map = JSON.parse(readFileSync(MAP, "utf8"));
  const messages = JSON.parse(readFileSync(MESSAGES, "utf8"));
  const rows = readDocx(file);
  const result = diff(rows, map, messages);
  report(result);

  if (!write) {
    if (result.changes.length) {
      console.log(`${DIM}Nada foi escrito. Repita com --write para aplicar.${OFF}`);
    }
    return;
  }
  if (!result.changes.length) return;

  for (const c of result.changes) setAt(messages, c.path, c.to);
  writeFileSync(MESSAGES, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`${GREEN}${result.changes.length} alteração(ões) escrita(s) em src/messages/pt.json${OFF}`);
}

main();
