import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { JOURNEY_STAGES, type JourneyStage } from "@/lib/journey-storage";

/**
 * Structural checks on the journey-stage markup and CSS, not a cascade test.
 *
 * The real behaviour — which block a browser reveals for a given attribute —
 * cannot be tested here. Vitest runs in `environment: "node"`, and even under
 * jsdom `globals.css` opens with `@import "tailwindcss"`, which jsdom neither
 * resolves nor runs PostCSS over; the cascade these rules depend on would not
 * exist. A jsdom assertion here would be testing a fiction.
 *
 * What this file can do is pin the three lists that have to agree — the
 * JourneyStage union, the `data-stage` attributes in the markup, and the reveal
 * rules in the stylesheet — so a sixth stage cannot be added to two of them and
 * forgotten in the third. That is the failure mode: a stage whose block exists
 * but which no rule reveals renders an empty page section, silently, forever.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const css = readFileSync(join(ROOT, "src", "app", "globals.css"), "utf8");
/** Comments in this file quote selectors that were removed, so any assertion
    about what the stylesheet no longer contains has to read the rules only. */
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, "");
const homeShell = readFileSync(join(ROOT, "src", "components", "home-shell.tsx"), "utf8");

/** Whitespace-tolerant, so reformatting either file does not break these. Reads
    the comment-stripped text: comments in globals.css quote selectors that were
    removed, so matching against the raw file would let a deleted rule pass on
    the strength of its own explanatory comment. */
function hasRule(selector: string): boolean {
  const pattern = selector
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(pattern).test(cssRules);
}

describe("journey stage markup and CSS", () => {
  it("renders exactly one block per journey stage", () => {
    const found = [...homeShell.matchAll(/data-stage="([^"]+)"/g)].map((m) => m[1]);
    // Sorted rather than set-compared: a duplicated stage is its own bug, and a
    // typo like data-stage="commited" produces a block hidden for every reader.
    expect([...found].sort()).toEqual([...JOURNEY_STAGES].sort());
  });

  it("scopes every stage block with data-slot, so the global selector cannot overreach", () => {
    // `[data-stage]` alone is one character from Radix's `data-state`. The CSS
    // matches `[data-slot="journey-stage"][data-stage=...]`, so a wrapper that
    // forgot the slot would never be revealed.
    const wrappers = [...homeShell.matchAll(/data-slot="journey-stage" data-stage="([^"]+)"/g)];
    expect(wrappers).toHaveLength(JOURNEY_STAGES.length);
  });

  it("has a reveal rule for every journey stage", () => {
    for (const stage of JOURNEY_STAGES) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="journey-stage"][data-stage="${stage}"]`),
        `globals.css has no reveal rule for the "${stage}" stage`,
      ).toBe(true);
    }
  });

  it("falls back to the visitor block when no stage is named", () => {
    // The script sets no attribute if storage cannot be read. Without this
    // unconditional default, that reader would see no stage block at all.
    expect(hasRule('[data-slot="journey-stage"][data-stage="visitor"]')).toBe(true);
  });

  it("takes the visitor default back for each non-visitor stage by name", () => {
    /*
     * Enumerated, never negated. Written as
     * `:not([data-journey-stage="visitor"])` this rule removed the visitor
     * fallback for ANY other attribute value — so an unrecognised stage hid all
     * five blocks and the homepage painted with no call to action. Naming the
     * four means an unrecognised value degrades to the visitor door instead.
     */
    for (const stage of JOURNEY_STAGES.filter((s) => s !== "visitor")) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="journey-stage"][data-stage="visitor"]`),
        `globals.css does not hide the visitor block for the "${stage}" stage`,
      ).toBe(true);
    }
    expect(cssRules).not.toMatch(/:not\(\[data-journey-stage="visitor"\]\)/);
  });

  it("names no stage the JourneyStage union does not", () => {
    const inCss = new Set(
      [...cssRules.matchAll(/data-journey-stage="([^"]+)"/g)].map((m) => m[1] as JourneyStage),
    );
    for (const stage of inCss) {
      expect(JOURNEY_STAGES).toContain(stage);
    }
  });

  it("keeps the stage rules after the Tailwind import", () => {
    /*
     * The real constraint, and the second attempt at testing it.
     *
     * The first version asserted these rules were not inside an `@layer`, by
     * counting `@layer …{` against every `}` in the preceding stylesheet. Those
     * counts are never unbalanced in a real file, so the assertion could not
     * fail — wrapping the whole block in `@layer utilities` still passed. It was
     * a guard that did not guard, which is the exact fault it was written to
     * prevent elsewhere.
     *
     * Measured in a browser, layering turns out not to be the hazard at all:
     * inside `@layer utilities` the behaviour is identical, because the base
     * rule ties with a `.contents` utility at (0,1,0) and wins on source order.
     * Putting these rules BEFORE Tailwind's utilities is what breaks it — four
     * stages become visible at once. So source order is the invariant.
     */
    const importAt = cssRules.indexOf('@import "tailwindcss"');
    const rulesAt = cssRules.indexOf('[data-slot="journey-stage"] {');
    expect(importAt).toBeGreaterThan(-1);
    expect(rulesAt).toBeGreaterThan(importAt);
  });

  it("lets nothing else set display on a stage wrapper", () => {
    // A `class="contents"` on these wrappers was inert but was the only
    // declaration that could ever compete with the rules above. Keeping the
    // wrappers class-free is what makes the source-order argument sufficient.
    const wrappers = homeShell.match(/<div data-slot="journey-stage"[^>]*>/g) ?? [];
    expect(wrappers).toHaveLength(JOURNEY_STAGES.length);
    for (const w of wrappers) expect(w).not.toMatch(/className=/);
  });
});

describe("the post-test band", () => {
  /*
   * The reading plan is follow-up — the method's step for AFTER the verdict —
   * so the shell gates it behind the same pre-paint attribute the stage blocks
   * ride. Same three-list agreement problem as above: the wrapper in the
   * markup, the hide-by-default rule, and one reveal rule per post-test stage.
   * A missing reveal hides the plan from that stage silently, forever.
   */
  const POST_TEST = JOURNEY_STAGES.filter((s) => s !== "visitor");

  it("wraps the reading band in a class-free, stage-free slot", () => {
    const wrappers = homeShell.match(/<div data-slot="post-test-band"[^>]*>/g) ?? [];
    expect(wrappers).toHaveLength(1);
    // No className, for the display argument above; no data-stage, because
    // the exactly-one-block-per-stage assertion counts those.
    expect(wrappers[0]).not.toMatch(/className=|data-stage=/);
    const slotAt = homeShell.indexOf('data-slot="post-test-band"');
    const bandAt = homeShell.indexOf("<ReadingBand");
    expect(slotAt).toBeGreaterThan(-1);
    expect(bandAt).toBeGreaterThan(slotAt);
  });

  it("hides the band by default, so a visitor or an unknown stage never sees it", () => {
    expect(hasRule('[data-slot="post-test-band"] { display: none')).toBe(true);
  });

  it("reveals the band for each post-test stage by name, never by negation", () => {
    for (const stage of POST_TEST) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="post-test-band"]`),
        `globals.css does not reveal the post-test band for the "${stage}" stage`,
      ).toBe(true);
    }
    // Written as :not(...visitor...) the reveal would fire for garbage stages.
    expect(cssRules).not.toMatch(/:not\([^)]*\)\s*\[data-slot="post-test-band"\]/);
  });
});

describe("the colour spine, before the Law", () => {
  /*
   * METHOD.md: "Gold does not appear during the Law. It arrives once, and its
   * arrival is the event. Do not spend it early."
   *
   * The visitor block is the earliest surface on the whole journey — a reader
   * who has not been asked anything yet. It is where gold costs the most to
   * spend, and it is exactly where it crept in: the test section's "Tap your
   * answer to begin" shipped in gold on the strength of being a caption rather
   * than a control. A caption register is not an exemption from the spine.
   *
   * Scoped to the stage blocks, and that scope is the whole argument — state
   * it precisely, because the obvious "improvement" is to widen it and that
   * would be wrong:
   *
   * - The stages past the verdict may carry gold. Grace has arrived for them,
   *   which is the point, and the committed block's blockquote does.
   * - The score and questions bands below the stage group carry gold too, and
   *   they render for all five stages including visitors. That is deliberate
   *   (see the bands comment in home-shell) — they are pre-evangelism, and the
   *   owner settled the gold door on the score band. So the rule this guard
   *   enforces is not "no gold on a visitor's screen"; it is the narrower and
   *   actually-violated one: the stage copy itself, which is where the test is
   *   introduced, does not spend gold before the Law.
   *
   * Bounding matters for the same reason. The visitor block is the LAST stage
   * wrapper, so "slice to the next wrapper" runs to end-of-file and silently
   * swallows the bands region — a guard that looks scoped and is not. It stops
   * at the first band instead.
   *
   * What this cannot prove, stated so nobody mistakes green for airtight: it
   * reads source text, so it catches gold WRITTEN in a form the codebase
   * uses. A colour computed at runtime, or an arbitrary near-gold hex nobody
   * has used before (#D5A944), renders gold and matches nothing here. The
   * hsl and oklch branches are a best effort at the same hue, not a proof.
   *
   * The render-tree walk also does not follow a dynamic `import()`. Nothing
   * inside the visitor block uses one today — home-shell's only dynamic
   * import, DeathGlobe, sits outside it — so this is a known gap, not a live
   * bypass. Named here rather than left for someone to discover, because an
   * unstated limitation is how a guard earns trust it has not verified.
   */
  /*
   * Every way this codebase can say gold, because matching only the hex is a
   * guard with four doors left open. All four forms are in live use here:
   *
   *   #D4A843               globals.css:10 and most components
   *   rgba(212,168,67,…)    verdict-screen, invitation-screen, questions-band
   *   --color-gold          globals.css:10 defines it
   *   to-gold / text-gold   invitation-screen:95 uses the utility
   *
   * Spacing is tolerated in the rgb form because both `rgba(212,168,67` and
   * `rgba(212, 168, 67` appear in the tree.
   *
   * oklch's hue is normally the last number before the closing paren (or a
   * `/ alpha`), not followed by a space — `oklch\([^)]*\b8[0-9]\s` demanded a
   * trailing space and so matched nothing anyone would actually write. The
   * lookahead below accepts whitespace, `)`, or `/` as the boundary instead.
   */
  const GOLD =
    /#D4A843|rgba?\(\s*212\s*,\s*168\s*,\s*67|hsla?\(\s*4[0-6]\b[^)]*\b6[0-9]%|oklch\([^)]*\b8[0-9](?:\.\d+)?(?=[\s)/])|--color-gold|\b(?:text|bg|border|from|via|to|ring|shadow|fill|stroke|decoration|outline|accent|caret|divide)-gold\b/i;

  /** Comments discuss gold constantly — "spent gold on the front door", "the
      gold band two hundred lines below". Only the code may be asserted on. */
  const stripComments = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\/.*$/gm, "");

  /**
   * Repo modules a file imports, by the name it renders them under.
   *
   * Named, default, and namespace imports all resolve. Only "@/…" and
   * "./…"/"../…" specifiers are kept — a bare package name (framer-motion,
   * lucide-react) is not this app's own component tree, and following it into
   * node_modules is not this guard's job. The specifier itself is returned
   * unconverted: turning "@/x" into "src/x" or a relative path into an
   * absolute one both need to know which FILE is doing the importing, which
   * this function does not — that happens once, at the point of use, where
   * the importing file's own directory is actually in scope.
   */
  function importsOf(source: string): Map<string, string> {
    const map = new Map<string, string>();
    const add = (name: string | undefined, spec: string) => {
      const clean = name?.replace(/^\s*type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (clean && /^[A-Z]/.test(clean) && (spec.startsWith("@/") || spec.startsWith("."))) {
        map.set(clean, spec);
      }
    };
    for (const [, names, spec] of source.matchAll(
      /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+"([^"]+)"/g,
    )) {
      for (const raw of names.split(",")) add(raw, spec);
    }
    // default and namespace: `import X from "…"`, `import * as X from "…"`
    for (const [, name, spec] of source.matchAll(
      /import\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s+from\s+"([^"]+)"/g,
    )) {
      add(name, spec);
    }
    return map;
  }

  /** An import specifier to a path relative to the repo root, given the
      directory (also repo-root-relative) of the file that wrote it. Null for
      anything that is not this app's own source. */
  function specToRelPath(spec: string, fromDir: string): string | null {
    if (spec.startsWith("@/")) return join("src", spec.slice(2));
    if (spec.startsWith(".")) return join(fromDir, spec);
    return null;
  }

  function resolve(rel: string): string | null {
    for (const cand of [`${rel}.tsx`, `${rel}.ts`, `${rel}/index.tsx`, `${rel}/index.ts`]) {
      const file = join(ROOT, cand);
      if (existsSync(file)) return file;
    }
    return null;
  }

  /** The repo-root-relative directory an already-resolved file lives in, so
      THAT file's own relative imports resolve against the right base. */
  function relDirOf(absFile: string): string {
    return dirname(absFile.slice(ROOT.length + 1));
  }

  /**
   * One hop of a bare re-export: `export { Foo } from "./foo"` or
   * `export { Foo as Bar } from "./foo"`. A barrel does nothing but this, so
   * reading its own text finds no gold even when the component it re-exports
   * is full of it — the tag has to be chased into the file that defines it.
   */
  function reexportTarget(
    source: string,
    tagName: string,
    fromDir: string,
  ): { rel: string; name: string } | null {
    for (const [, names, spec] of source.matchAll(/export\s+\{([^}]+)\}\s+from\s+"([^"]+)"/g)) {
      for (const raw of names.split(",")) {
        const parts = raw.trim().split(/\s+as\s+/);
        const localName = (parts.length > 1 ? parts[1] : parts[0]).trim();
        if (localName !== tagName) continue;
        const rel = specToRelPath(spec, fromDir);
        if (rel) return { rel, name: parts[0].trim() };
      }
    }
    return null;
  }

  /**
   * Resolves a rendered tag to the file that actually defines it, following
   * barrel re-exports until one stops (no repo barrel does this today, so
   * this branch is proven against a constructed case below, not a live one).
   * Capped at 5 hops so a re-export cycle throws a clear error rather than
   * hanging the run.
   */
  function resolveDefinition(
    spec: string,
    fromDir: string,
    tagName: string,
  ): { file: string; dir: string; source: string } | null {
    let rel = specToRelPath(spec, fromDir);
    let name = tagName;
    for (let hop = 0; hop < 5; hop++) {
      if (!rel) return null;
      const file = resolve(rel);
      if (!file) return null;
      const dir = relDirOf(file);
      const source = stripComments(readFileSync(file, "utf8"));
      const next = reexportTarget(source, name, dir);
      if (!next) return { file, dir, source };
      rel = next.rel;
      name = next.name;
    }
    throw new Error(`re-export chain for ${tagName} did not resolve within 5 hops — check for a cycle`);
  }

  /**
   * Components whose DEFAULT is gold, so absence of a gold token proves nothing.
   *
   * `ui/button.tsx` declares `defaultVariants: { variant: "gold" }` and the
   * component signature repeats `variant = "gold"` — a bare `<Button>` renders
   * gold while its call site contains no gold string at all. Scanning
   * button.tsx's own source is the wrong answer too: it legitimately defines
   * every variant for callers elsewhere, so it would fail for the whole app.
   * The honest check is at the usage: inside this block, a Button must name a
   * variant, and that variant may not be gold.
   */
  const GOLD_BY_DEFAULT = new Set(["Button"]);

  /** home-shell.tsx's own directory, repo-root-relative — where the walk's
      first hop resolves its "./…" and "@/…" imports against. */
  const HOME_SHELL_DIR = dirname(join("src", "components", "home-shell.tsx"));

  /**
   * Every repo component rendered inside `block`, transitively.
   *
   * One hop was not enough: a child that renders a grandchild carrying gold
   * would pass. Recursion follows only tags that are actually RENDERED, so a
   * shared primitive enters the set when someone puts it on screen and not
   * merely because it exists — which is what keeps button.tsx out of a scan
   * it would always fail (it defines every variant for callers elsewhere).
   */
  function renderedTree(block: string, source: string, sourceDir: string) {
    const seen = new Set<string>();
    const out: Array<{ name: string; source: string; usedIn: string }> = [];
    const goldDefaultUses: Array<{ name: string; tag: string; usedIn: string }> = [];

    const walk = (markup: string, imports: Map<string, string>, dir: string, where: string, depth: number) => {
      if (depth > 6) return;
      for (const tag of new Set([...markup.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]))) {
        if (GOLD_BY_DEFAULT.has(tag)) {
          for (const [, attrs] of markup.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))) {
            goldDefaultUses.push({ name: tag, tag: attrs, usedIn: where });
          }
          continue;
        }
        const spec = imports.get(tag);
        if (!spec) continue;
        const def = resolveDefinition(spec, dir, tag);
        if (!def || seen.has(def.file)) continue;
        seen.add(def.file);
        out.push({ name: tag, source: def.source, usedIn: where });
        walk(def.source, importsOf(def.source), def.dir, tag, depth + 1);
      }
    };

    walk(block, importsOf(source), sourceDir, "the visitor block", 0);
    return { components: out, goldDefaultUses };
  }

  function stageBlock(stage: JourneyStage): string {
    const open = homeShell.indexOf(`<div data-slot="journey-stage" data-stage="${stage}">`);
    expect(open, `no block found for the ${stage} stage`).toBeGreaterThan(-1);
    const nextStage = homeShell.indexOf('<div data-slot="journey-stage"', open + 1);
    // The first band marks the end of the stage group. If it is ever renamed
    // this throws rather than quietly widening every assertion below.
    const firstBand = homeShell.indexOf("<PassedBand", open + 1);
    expect(firstBand, "the stage group's end marker (<PassedBand) moved").toBeGreaterThan(-1);
    const end = nextStage === -1 ? firstBand : Math.min(nextStage, firstBand);
    return homeShell.slice(open, end);
  }

  it("spends no gold on a reader the Law has not met", () => {
    expect(
      stripComments(stageBlock("visitor")),
      "gold appeared in the visitor block — METHOD.md: do not spend it early",
    ).not.toMatch(GOLD);
  });

  it("spends none in the components that block renders, at any depth", () => {
    // Where the regression would actually hide: the markup stays neutral and
    // the gold moves a file or two down, into a child nobody re-reads.
    const { components } = renderedTree(stageBlock("visitor"), homeShell, HOME_SHELL_DIR);
    expect(
      components.map((c) => c.name),
      "no repo component resolved inside the visitor block — the import scan broke",
    ).not.toHaveLength(0);
    for (const { name, source, usedIn } of components) {
      expect(
        source,
        `${name} (rendered by ${usedIn}) spends gold before the Law`,
      ).not.toMatch(GOLD);
    }
  });

  it("lets no gold-by-default component in without naming a quieter variant", () => {
    /*
     * The vector no token scan can see. `<Button>` with no variant IS gold —
     * ui/button.tsx defaults it — so the call site reads perfectly neutral
     * while the screen does not. Checked at the usage rather than in
     * button.tsx, which defines every variant and would fail for the whole app.
     */
    const { goldDefaultUses } = renderedTree(stageBlock("visitor"), homeShell, HOME_SHELL_DIR);
    for (const { name, tag, usedIn } of goldDefaultUses) {
      const variant = tag.match(/variant=(?:"([^"]+)"|\{"([^"]+)"\})/);
      expect(
        variant?.[1] ?? variant?.[2],
        `<${name}> in ${usedIn} names no variant, and its default is gold — before the Law`,
      ).toBeDefined();
      expect(
        variant?.[1] ?? variant?.[2],
        `<${name}> in ${usedIn} is gold before the Law`,
      ).not.toBe("gold");
    }
  });

  it("still lets gold through after the verdict, so this guard is not vacuous", () => {
    // If the committed block ever loses its gold, the assertions above stop
    // proving anything and this fails to say so.
    expect(stripComments(stageBlock("committed"))).toMatch(GOLD);
  });

  /*
   * The four mechanisms below are proven directly, against synthetic markup,
   * rather than by mutating a real file and re-running the suite — that
   * proof lived only in a shell session and left nothing behind. Each test
   * either resolves to a REAL file (so a wrong path fails loudly, not
   * silently) or checks pure logic that needs no filesystem at all.
   */
  describe("the mechanism, proven directly", () => {
    it("finds gold through a real multi-hop @/ import, without touching any file on disk", () => {
      // band-spine.tsx is real, gold-bearing ground truth — checked directly
      // so this cannot go stale silently if that ever changes.
      const bandSpineSource = stripComments(
        readFileSync(join(ROOT, "src", "components", "home", "band-spine.tsx"), "utf8"),
      );
      expect(bandSpineSource, "band-spine.tsx lost the gold token this test relies on").toMatch(GOLD);

      const syntheticParent =
        'import { BandSpine } from "@/components/home/band-spine";\n' +
        'export const X = () => <BandSpine label="x" tone="gold" />;';
      const { components } = renderedTree(syntheticParent, syntheticParent, "src/components/home");
      const found = components.find((c) => c.name === "BandSpine");
      expect(found, "the resolver did not find BandSpine through a direct @/ import").toBeDefined();
      expect(found?.source).toMatch(GOLD);
    });

    it("follows a relative import to a real sibling file", () => {
      // topic-nav.tsx is imported relatively by topic-page.tsx in the real
      // tree — reused here so the relative-path branch is proven against
      // real import syntax rather than a fixture that could drift from it.
      const syntheticParent = 'import { TopicNav } from "./topic-nav";\nexport const X = () => <TopicNav />;';
      const { components } = renderedTree(syntheticParent, syntheticParent, "src/components/learn");
      expect(
        components.map((c) => c.name),
        'relative import "./topic-nav" did not resolve to a real file',
      ).toContain("TopicNav");
    });

    it("follows a barrel re-export to the file that actually defines the component", () => {
      // No barrel exists in this repo today — a file with nothing but
      // `export { X } from "./x"` — which is exactly why this would be a
      // silent bypass rather than one an existing file already catches.
      // Constructed here against the real topic-nav.tsx, so it is a real
      // target rather than an invented one.
      const target = reexportTarget(
        'export { TopicNav } from "./topic-nav";',
        "TopicNav",
        "src/components/learn",
      );
      expect(target, "the barrel scan found no re-export for TopicNav").not.toBeNull();
      expect(
        resolve(target?.rel ?? ""),
        `barrel target ${target?.rel} did not resolve to a real file`,
      ).not.toBeNull();
    });

    it("catches a bare <Button>, whose gold is in its default and not its markup", () => {
      const synthetic = "<div><Button>Go</Button></div>";
      const { goldDefaultUses } = renderedTree(synthetic, synthetic, "src/components");
      expect(goldDefaultUses).toHaveLength(1);
      expect(goldDefaultUses[0]?.tag).not.toMatch(/variant=/);
    });

    it("clears a Button that names a variant other than gold", () => {
      const synthetic = '<div><Button variant="ghost">Go</Button></div>';
      const { goldDefaultUses } = renderedTree(synthetic, synthetic, "src/components");
      const variant = goldDefaultUses[0]?.tag.match(/variant=(?:"([^"]+)"|\{"([^"]+)"\})/);
      expect(variant?.[1] ?? variant?.[2]).toBe("ghost");
    });
  });

  it("recognises every form this codebase writes gold in", () => {
    /*
     * The guard's own coverage, pinned. A matcher that only knew the hex
     * passed while `to-gold`, `rgba(212,168,67…)` and `var(--color-gold)` all
     * walked straight through it — so the alternation is asserted directly
     * rather than trusted.
     */
    for (const form of [
      "#D4A843",
      "#d4a843",
      "rgba(212,168,67,0.3)",
      "rgba(212, 168, 67, 0.3)",
      "rgb(212,168,67)",
      "var(--color-gold)",
      "text-gold",
      "to-gold",
      "border-gold/30",
      "hsl(43, 63%, 55%)",
      "hsla(43, 63%, 55%, 0.5)",
      "oklch(0.75 0.13 85)",
      "oklch(75% 0.13 85)",
      "oklch(0.75 0.13 85 / 0.5)",
    ]) {
      expect(form, `the gold matcher does not recognise ${form}`).toMatch(GOLD);
    }
    // And it must not fire on prose, on unrelated colours, or on a hue/lightness
    // that merely looks adjacent to gold's.
    for (const safe of [
      "text-white/70",
      "the gold band below",
      "#D4A844",
      "goldilocks",
      "hsl(210, 63%, 55%)",
      "oklch(0.75 0.13 185)",
    ]) {
      expect(safe, `the gold matcher false-positives on ${safe}`).not.toMatch(GOLD);
    }
  });
});
