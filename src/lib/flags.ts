/**
 * Build-time switches for surfaces the site can live without.
 *
 * Read on the server and passed down as props. Deliberately not `NEXT_PUBLIC_`:
 * Next inlines those by matching the literal text at build time, so they are
 * easy to read wrongly and end up shipped to the browser for no reason. Nothing
 * here is a secret, but nothing here needs to travel either.
 */

/**
 * The blog's entrances — the header link, the footer link, and the homepage's
 * latest-post card.
 *
 * Off by default, which is the current state of things: the owner has no time
 * to write, and a nav pointing at a blog nobody is tending is a promise the
 * site is not keeping. `BLOG_ENABLED=true` brings all three back; nothing else
 * needs setting.
 *
 * What this does NOT do, and the distinction is the whole point: `/blog` and
 * every published post still render, still carry their metadata, and stay in
 * the sitemap. Four posts are indexed. Turning them off would forfeit that and
 * make coming back a matter of waiting on a re-crawl, in exchange for nothing —
 * an unlinked page costs no maintenance. The blog goes quiet, not away.
 */
export const BLOG_ENABLED = process.env.BLOG_ENABLED === "true";
