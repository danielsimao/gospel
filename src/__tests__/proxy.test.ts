import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import proxy from "@/proxy";

const ORIGIN = "https://www.ifyoudiedtoday.com";

function request(path: string, acceptLanguage?: string) {
  return new NextRequest(new URL(path, ORIGIN), {
    headers: acceptLanguage ? { "accept-language": acceptLanguage } : undefined,
  });
}

describe("proxy locale handling", () => {
  it("passes through a correctly-prefixed path untouched", () => {
    const response = proxy(request("/en/learn/what-is-sin"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("normalises a miscased locale instead of prefixing it again", () => {
    // /EN/learn used to fall through to the deep-link branch and redirect to
    // /en/EN/learn, which 404s.
    const response = proxy(request("/EN/learn"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/en/learn`);
  });

  it("normalises a miscased locale with no further segments", () => {
    const response = proxy(request("/PT"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/pt`);
  });

  it("keeps the query string when normalising casing", () => {
    const response = proxy(request("/EN/test?utm_source=tract"));
    expect(response.headers.get("location")).toBe(`${ORIGIN}/en/test?utm_source=tract`);
  });

  it("prefixes a locale-less deep link", () => {
    const response = proxy(request("/test"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/en/test`);
  });

  it("keeps the query string on a locale-less deep link", () => {
    // The street cards' scans are attributed by these params; the redirect
    // used to drop them and the visits landed in PostHog as direct.
    const response = proxy(request("/test?utm_source=tract&utm_medium=print"));
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/en/test?utm_source=tract&utm_medium=print`,
    );
  });

  it("honours accept-language when prefixing", () => {
    const response = proxy(request("/learn", "pt-PT,pt;q=0.9"));
    expect(response.headers.get("location")).toBe(`${ORIGIN}/pt/learn`);
  });

  it("rewrites the bare domain rather than redirecting it", () => {
    const response = proxy(request("/"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(`${ORIGIN}/en`);
  });

  it("does not treat a non-locale first segment as a locale", () => {
    const response = proxy(request("/english/learn"));
    expect(response.headers.get("location")).toBe(`${ORIGIN}/en/english/learn`);
  });
});
