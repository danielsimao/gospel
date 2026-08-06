import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  GO_LINKS,
  GO_FALLBACK,
  GO_MEDIUM,
  GO_CODE_PATTERN,
  resolveGoLink,
} from "@/lib/go-links";

/**
 * The printed link, which is the one link that cannot be fixed after the fact.
 *
 * Everything here guards a promise made to paper: that a code scans, that it
 * lands somewhere, that it can be re-pointed later, and that it is attributed
 * when it arrives. A regression in any of them is only discovered by someone
 * holding a sticker that does nothing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const route = strip(read("src", "app", "go", "[code]", "route.ts"));
const proxy = strip(read("src", "proxy.ts"));
const cards = strip(read("src", "app", "[locale]", "(content)", "cards", "page.tsx"));

describe("the codes themselves", () => {
  it("use an alphabet that survives being read off paper", () => {
    /*
     * Assume the camera fails and someone types it. `l`/`1` and `o`/`0` are the
     * pairs that get misread, so the digits 0 and 1 and the letters l and o are
     * all out. Two to four characters: distinct, and coarse enough as a QR to
     * scan from a distance.
     */
    for (const code of Object.keys(GO_LINKS)) {
      expect(code, `${code} is not typable off paper`).toMatch(GO_CODE_PATTERN);
    }
  });

  it("rejects the characters that get misread", () => {
    // Pinning the pattern itself, not just its current users — the next code
    // added will be checked against this and nothing else.
    for (const bad of ["l2", "o2", "a0", "a1", "a", "abcde", "AB", "a-b"]) {
      expect(GO_CODE_PATTERN.test(bad), `${bad} should not be a legal code`).toBe(false);
    }
    for (const good of ["ab", "sk2", "crt", "card"]) {
      expect(GO_CODE_PATTERN.test(good), `${good} should be a legal code`).toBe(true);
    }
  });

  it("sends every code somewhere that exists", () => {
    /*
     * A destination is a route in the app, not a string someone hoped was one.
     * `/test` has to resolve to src/app/[locale]/test — a typo here is a printed
     * QR leading to a 404, found by a stranger.
     */
    for (const [code, link] of Object.entries(GO_LINKS)) {
      const segment = link.destination.replace(/^\//, "");
      if (segment === "") continue; // the homepage, which is [locale]/page.tsx
      /* Route groups are invisible in the URL, so the file could be under any
         of them — /test lives in (immersive), /cards in (content). */
      const groups = readdirSync(join(ROOT, "src", "app", "[locale]"), {
        withFileTypes: true,
      })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(ROOT, "src", "app", "[locale]", entry.name, segment));
      expect(
        [join(ROOT, "src", "app", "[locale]", segment), ...groups].some(existsSync),
        `${code} points at ${link.destination}, which is not a route`,
      ).toBe(true);
    }
  });

  it("keeps one vocabulary for the medium", () => {
    // The street cards shipped as utm_medium=print. A second word for the same
    // thing splits the funnel and nobody notices until the numbers are halved.
    expect(GO_MEDIUM).toBe("print");
  });
});

describe("resolving a scan", () => {
  it("stamps source, medium and campaign on the destination", () => {
    const { path } = resolveGoLink("card", "pt");
    expect(path).toMatch(/^\/pt\/test\?/);
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("utm_source")).toBe("card");
    expect(params.get("utm_medium")).toBe("print");
    expect(params.get("utm_campaign")).toBe("street-card");
  });

  it("lets the reader's own language decide, unless the piece forces one", () => {
    // A sticker in a Lisbon café should not hand an English tourist Portuguese.
    expect(resolveGoLink("card", "en").path).toMatch(/^\/en\//);
    expect(resolveGoLink("card", "pt").path).toMatch(/^\/pt\//);
  });

  it("sends a sticker to the homepage and a tract to the test", () => {
    /*
     * Not a detail. A tract is handed over by someone who has already asked the
     * question out loud; a sticker on a wall has nobody to frame it, and the
     * Law arriving cold — "Are you a good person?" as the first thing a stranger
     * meets — is the method's own error. The homepage does the framing the
     * person would have done.
     */
    expect(resolveGoLink("sk2", "pt").path).toBe(
      "/pt?utm_source=sticker&utm_medium=print&utm_campaign=sticker-v1",
    );
    expect(resolveGoLink("crt", "pt").path).toMatch(/^\/pt\/test\?/);
  });

  it("writes the homepage as /pt, never /pt/", () => {
    // Two URLs for one page is two rows in every report.
    expect(resolveGoLink("sk2", "pt").path.split("?")[0]).toBe("/pt");
  });

  it("takes an unknown code to the homepage rather than a 404", () => {
    /*
     * The code is printed, the reader did nothing wrong, and the scan cannot be
     * had twice. The campaign says the code was bad, and the code itself rides
     * along as utm_content, so a typo on a print run is visible in PostHog
     * instead of silently costing scans.
     */
    const { known, path } = resolveGoLink("zz9", "en");
    expect(known).toBe(false);
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("utm_campaign")).toBe(GO_FALLBACK.campaign);
    expect(params.get("utm_content")).toBe("zz9");
    expect(path.split("?")[0]).toBe("/en");
  });

  it("lets a scan override the registry in the field", () => {
    // `/go/crt?utm_content=braga` labels one batch without a deploy.
    const params = new URLSearchParams({ utm_content: "braga" });
    const { path } = resolveGoLink("crt", "pt", params);
    expect(new URLSearchParams(path.split("?")[1]).get("utm_content")).toBe("braga");
    // …without losing the attribution it came for.
    expect(new URLSearchParams(path.split("?")[1]).get("utm_campaign")).toBe("tract-court");
  });

  it("does not inherit a prototype key as a code", () => {
    // `GO_LINKS[code]` on a plain object would resolve "constructor" to a
    // function and hand it to the redirect. Object.hasOwn is what stops it.
    for (const code of ["constructor", "toString", "__proto__"]) {
      expect(resolveGoLink(code, "en").known, `${code} resolved as a real code`).toBe(false);
    }
  });
});

describe("the route keeps the printed link re-pointable", () => {
  it("answers 307 and never 308", () => {
    /*
     * The whole point. A permanent redirect is cached by the browser for good,
     * so re-pointing a code would change the paper's meaning and reach nobody
     * who had already scanned it. proxy.ts uses 308 one file over — for locale
     * casing, which genuinely never changes — and that is the value that must
     * not be copied here.
     */
    expect(route).toMatch(/status:\s*307/);
    expect(route).not.toMatch(/308/);
  });

  it("refuses to be cached", () => {
    expect(route).toMatch(/"Cache-Control":\s*"no-store"/);
    expect(route).toMatch(/export const dynamic = "force-dynamic"/);
  });

  it("counts the scan after the response, not before it", () => {
    // The reader is waiting on the redirect; a slow analytics host must not be
    // in that path.
    expect(route).toMatch(/after\(\(\) => recordScan/);
  });

  it("counts scans without creating anyone", () => {
    /*
     * This is the one event on the site that fires without consent, so it has
     * to contain nobody: one fixed distinct_id for every scan ever, no person
     * profile, no geoip, no IP.
     */
    expect(route).toMatch(/distinct_id: "qr-scan"/);
    expect(route).toMatch(/\$process_person_profile: false/);
    expect(route).toMatch(/\$geoip_disable: true/);
    expect(route).toMatch(/\$ip: "0\.0\.0\.0"/);
  });

  it("does not treat a refused capture as a recorded scan", () => {
    /*
     * `fetch` only rejects on a transport failure, so a wrong token, a changed
     * API, a rate limit or an ingestion outage all arrive as a resolved promise
     * carrying a 4xx. Swallowed, the counter reads zero scans while being
     * refused every one of them — a number that looks like an answer.
     */
    expect(route).toMatch(/if \(!response\.ok\)/);
    // Both halves log: the refused capture above, and the transport failure in
    // the catch. One console.warn in the file satisfies neither on its own.
    expect(route).toMatch(/if \(!response\.ok\) \{[^}]*console\.warn/);
    expect(route).toMatch(/catch \(error\)[\s\S]{0,400}console\.warn/);
  });

  it("keeps preview scans out of the street's numbers", () => {
    // Previews carry the production token; without this, walking a branch build
    // lands in the same funnel as a sticker on a wall.
    expect(route).toMatch(/VERCEL_ENV !== "production"/);
  });
});

describe("the proxy lets the short links through", () => {
  it("exempts go/ — with the slash", () => {
    /*
     * Without the exemption the proxy's deep-link branch prepends a locale and
     * the scan spends a redirect reaching /en/go/… before the handler runs.
     *
     * With a bare `go` it would be a prefix match: /gospel, or any future route
     * starting with those two letters, would silently stop being proxied. The
     * slash is the whole guard.
     */
    const matcher = proxy.match(/matcher:\s*\[([^\]]+)\]/)?.[1] ?? "";
    expect(matcher).toContain("go/");
    expect(matcher, "a bare `go` would also exempt /gospel").not.toMatch(/\|go\|/);

    // And the pattern actually behaves: build it and check both paths.
    const source = matcher.replace(/^\s*"|"\s*$/g, "").replace(/\\\\/g, "\\");
    const pattern = new RegExp(`^${source}$`);
    expect(pattern.test("/go/card"), "/go/card should skip the proxy").toBe(false);
    expect(pattern.test("/gospel"), "/gospel must still be proxied").toBe(true);
    expect(pattern.test("/test"), "/test must still be proxied").toBe(true);

    /*
     * The boundaries the exemption's correctness actually rests on. Each of
     * these must still reach the proxy: `/go` with no code is not a short link
     * and has no handler; `/GO/card` is not exempt because the matcher is
     * case-sensitive, which is exactly why the proxy normalises it below; and
     * an encoded slash is not a path separator, so it is not `/go/<code>`.
     */
    expect(pattern.test("/go"), "/go bare must still be proxied").toBe(true);
    expect(pattern.test("/GO/card"), "/GO/card must reach the proxy to be lowercased").toBe(true);
    expect(pattern.test("/go%2Fcard"), "an encoded slash is not a short link").toBe(true);
  });

  it("lowercases a miscased code rather than 404ing it", () => {
    /*
     * Capitalisation arrives on its own — mail clients and phone keyboards both
     * do it to a typed URL — and the proxy already normalises a miscased locale
     * segment for that exact reason. Without the same treatment `/GO/card` is
     * read as a locale-less deep link and sent to `/en/GO/card`: a 404 with a
     * printed code on it, and no way to fix the paper.
     */
    expect(proxy).toMatch(/firstSegment\.toLowerCase\(\) === "go" && firstSegment !== "go"/);
    expect(proxy).toMatch(/segments\[1\] = "go"/);
    // 308, like the locale casing one file over: the canonical casing of a code
    // does not change, only what it resolves to.
    const branch = proxy.slice(proxy.indexOf('=== "go"'));
    expect(branch).toMatch(/NextResponse\.redirect\(lowered, 308\)/);
  });
});

describe("what is already printed", () => {
  it("prints the code on the cards, not a destination", () => {
    // A card in a wallet has to follow the site if the test ever moves.
    expect(cards).toMatch(/\/go\/card/);
    expect(cards, "the old baked-in destination is back").not.toMatch(
      /utm_campaign=street-card/,
    );
  });
});
