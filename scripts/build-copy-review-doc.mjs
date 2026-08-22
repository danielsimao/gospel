#!/usr/bin/env node
/**
 * Builds the PT copy-review booklets as .docx, for review in Google Docs.
 *
 * Drag the .docx into Google Drive and open it with Google Docs — the tables
 * survive the conversion. The reviewer types replacements into the third
 * column; everything else is left alone.
 *
 * The round trip is closed by scripts/apply-copy-review.mjs, which reads the
 * corrected file back and diffs it against src/messages/pt.json by id.
 *
 *   node scripts/build-copy-review-doc.mjs            # all booklets
 *   node scripts/build-copy-review-doc.mjs caminho    # one booklet by slug
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BOOKLETS,
  collect,
  loadMessages,
  MAP,
  ROOT,
  topicBooklets,
} from "./lib/copy-review.mjs";

const OUT = join(ROOT, "build", "copy-review-doc");

/* A4 (11906 dxa) less 1134 dxa margins each side. */
const COLS = [1100, 4300, 3272];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ *
 * OOXML fragments
 * ------------------------------------------------------------------ */

/** A paragraph. size is in points. */
function p(text, { size = 11, bold, italic, color, align, before = 0, after = 120, style } = {}) {
  const rpr =
    `<w:rPr>${bold ? "<w:b/>" : ""}${italic ? "<w:i/>" : ""}` +
    `${color ? `<w:color w:val="${color}"/>` : ""}` +
    `<w:sz w:val="${Math.round(size * 2)}"/><w:szCs w:val="${Math.round(size * 2)}"/></w:rPr>`;
  return (
    `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}` +
    `<w:spacing w:before="${before}" w:after="${after}"/>` +
    `${align ? `<w:jc w:val="${align}"/>` : ""}${rpr}</w:pPr>` +
    (text ? `<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>` : "") +
    `</w:p>`
  );
}

function cell(width, paras, { shade, valign = "top", span } = {}) {
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>` +
    (span ? `<w:gridSpan w:val="${span}"/>` : "") +
    (shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : "") +
    `<w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/>` +
    `<w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>` +
    `<w:vAlign w:val="${valign}"/>` +
    `</w:tcPr>${paras}</w:tc>`
  );
}

const row = (cells) => `<w:tr>${cells}</w:tr>`;

function table(rows) {
  return (
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>` +
    `<w:tblBorders>` +
    ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="D5CDC4"/>`)
      .join("") +
    `</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>` +
    `<w:tblGrid>${COLS.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>` +
    rows.join("") +
    `</w:tbl>`
  );
}

/* ------------------------------------------------------------------ *
 * Document body
 * ------------------------------------------------------------------ */

function renderGroup(group) {
  const header = row(
    [
      cell(COLS[0], p("Código", { size: 8, bold: true, color: "8A7A66" }), { shade: "F2EDE4" }),
      cell(COLS[1], p("Texto do site", { size: 8, bold: true, color: "8A7A66" }), { shade: "F2EDE4" }),
      cell(COLS[2], p("A minha correcção", { size: 8, bold: true, color: "8A1C1C" }), { shade: "FBF7F0" }),
    ].join(""),
  );

  const rows = [header];
  for (const sub of group.items) {
    if (sub.subheading) {
      rows.push(
        row(
          cell(
            COLS[0] + COLS[1] + COLS[2],
            p(sub.subheading, { size: 10.5, bold: true, color: "8A1C1C", before: 60, after: 60 }),
            { shade: "F7F3EC", span: 3 },
          ),
        ),
      );
    }
    for (const b of sub.blocks) {
      rows.push(
        row(
          [
            cell(COLS[0], p(b.id, { size: 8, color: "97887A" })),
            cell(
              COLS[1],
              (b.role ? p(b.role.toUpperCase(), { size: 7, color: "A89A8C", after: 40 }) : "") +
                p(b.value, { size: 11.5, after: 40 }),
            ),
            // Left deliberately empty — an empty cell means "no change".
            cell(COLS[2], p("", { size: 11.5 }), { shade: "FDFBF7" }),
          ].join(""),
        ),
      );
    }
  }

  return (
    p(group.title, { size: 17, bold: true, before: 360, after: 80 }) +
    (group.where ? p(group.where, { size: 9.5, italic: true, color: "6B625C", after: 160 }) : "") +
    table(rows)
  );
}

function renderDocument(booklet, collected) {
  const body =
    p(`Caderno ${booklet.number}`, { size: 9, bold: true, color: "8A1C1C", after: 60 }) +
    p(booklet.title, { size: 26, bold: true, after: 100 }) +
    (booklet.lead ? p(booklet.lead, { size: 12, color: "3D3733", after: 200 }) : "") +
    p(
      `Texto do site Se Morresses Hoje · ${collected.words.toLocaleString("pt-PT")} palavras`,
      { size: 9, color: "6B625C", after: 320 },
    ) +
    p("Como rever este texto", { size: 16, bold: true, after: 120 }) +
    p(
      "Este é o texto de um site que fala do Evangelho a quem entra nele pela primeira vez. Muitas dessas pessoas nunca ouviram nada disto. Precisamos de saber se está claro.",
      { size: 11, after: 160 },
    ) +
    p("Só é preciso escrever na coluna da direita — «A minha correcção».", { size: 11, bold: true, after: 100 }) +
    p("Leia a frase na coluna do meio. Se estiver bem, não escreva nada e siga em frente.", { size: 11, after: 60 }) +
    p("Se soar estranha, forçada, ou não se disser assim em português, escreva à direita como diria por palavras suas.", { size: 11, after: 60 }) +
    p("Se não perceber a frase, escreva à direita um ponto de interrogação.", { size: 11, after: 60 }) +
    p("Não é preciso escrever em todas as linhas. As que ficarem vazias entendemos como «está bem assim».", { size: 11, after: 160 }) +
    p("Três coisas que mais ajudam", { size: 12, bold: true, color: "8A1C1C", after: 80 }) +
    p("Soa a português? — Muito deste texto foi escrito primeiro em inglês. Se alguma frase souber a tradução, é isso mesmo que queremos apanhar.", { size: 10.5, after: 60 }) +
    p("Percebe-se? — Palavras difíceis, ideias que ficam pelo caminho, frases longas demais.", { size: 10.5, after: 60 }) +
    p("O tom está certo? — Deve ser sério mas com respeito e carinho. Nunca a ralhar, nunca a empurrar ninguém.", { size: 10.5, after: 160 }) +
    p(
      "Por favor não altere a coluna «Código» — é o que nos diz a que frase se refere cada correcção. Onde aparecer algo entre chavetas, como {count}, é um espaço que o site preenche sozinho com um número ou um nome; se reescrever a frase, deixe ficar essa parte tal como está.",
      { size: 9.5, italic: true, color: "6B625C", after: 240 },
    ) +
    collected.groups.map(renderGroup).join("") +
    p("Chegou ao fim.", { size: 16, bold: true, before: 400, after: 100 }) +
    p(
      "Muito obrigado pelo tempo e pelo cuidado. Cada correcção vai directa para o site — e vai ajudar alguém que o abra pela primeira vez a perceber o que lá está escrito.",
      { size: 11 },
    );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
</w:sectPr></w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>
<w:sz w:val="23"/><w:szCs w:val="23"/>
</w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

function writeDocx(path, documentXml) {
  const dir = mkdtempSync(join(tmpdir(), "docx-"));
  mkdirSync(join(dir, "_rels"), { recursive: true });
  mkdirSync(join(dir, "word", "_rels"), { recursive: true });
  writeFileSync(join(dir, "[Content_Types].xml"), CONTENT_TYPES);
  writeFileSync(join(dir, "_rels", ".rels"), ROOT_RELS);
  writeFileSync(join(dir, "word", "document.xml"), documentXml);
  writeFileSync(join(dir, "word", "styles.xml"), STYLES);
  writeFileSync(join(dir, "word", "_rels", "document.xml.rels"), DOC_RELS);
  rmSync(path, { force: true });
  // mimetype-style ordering is not required for .docx; a plain zip is valid.
  execFileSync("zip", ["-q", "-r", "-X", "-D", path, "[Content_Types].xml", "_rels", "word"], { cwd: dir });
  rmSync(dir, { recursive: true, force: true });
}

function main() {
  const filters = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const messages = loadMessages();
  const all = [...BOOKLETS, ...topicBooklets(messages)];
  const chosen = filters.length ? all.filter((b) => filters.some((f) => b.slug.includes(f))) : all;

  if (!chosen.length) {
    console.error(`No booklet matched. Available:\n  ${all.map((b) => b.slug).join("\n  ")}`);
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const fullMap = {};
  for (const booklet of chosen) {
    const collected = collect(messages, booklet);
    if (!collected.groups.length) continue;
    Object.assign(fullMap, collected.map);
    const file = join(OUT, `${booklet.slug}.docx`);
    writeDocx(file, renderDocument(booklet, collected));
    const blocks = collected.groups.reduce((a, g) => a + g.count, 0);
    console.log(`  ✓ ${`${booklet.slug}.docx`.padEnd(42)} ${String(blocks).padStart(4)} blocos`);
  }

  if (!filters.length) {
    writeFileSync(MAP, `${JSON.stringify(fullMap, null, 2)}\n`);
  }
  console.log(`\n${chosen.length} ficheiro(s) em build/copy-review-doc/`);
}

main();
