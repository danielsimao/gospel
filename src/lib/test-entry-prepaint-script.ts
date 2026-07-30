import { SELF_RATINGS, STORAGE_KEY } from "./self-rating-storage";

/**
 * Marks, during HTML parse, that the reader arrived at `/test` having already
 * answered "Are you a good person?" on the homepage.
 *
 * `/test` is prerendered and the answer lives in localStorage, so the server
 * always renders the landing screen's *question*. A reader who tapped an answer
 * one second earlier was therefore asked it again — measured on a throttled
 * phone, for 560ms — before the reply replaced it. `landing.tsx` says in as many
 * words that this screen exists not to do that: "the screen asking something the
 * reader just answered".
 *
 * game-shell already reads the key in a layout effect for this reason, with a
 * comment saying a requestAnimationFrame was "one paint too late". A layout
 * effect is also too late, just less so: it runs after hydration, and hydration
 * runs after the browser has painted the server's HTML. Only something inline
 * and blocking gets ahead of the first paint. The same lesson as
 * `stage-prepaint-script.ts` on the homepage, learned twice.
 *
 * It only reads. `takeSelfRating` clears the key as part of reading it, which is
 * what stops a stale claim being quoted at the verdict days later — so this must
 * not consume it, or the layout effect would find nothing and the reply would
 * never arrive at all.
 *
 * It stamps a flag, not the value. The three replies differ in copy, and CSS
 * cannot choose between texts; what it can do is withhold the question until
 * React knows which reply to render. A blank where the question would be, for
 * as long as hydration takes, is honest. Asking again is not.
 */
export function buildTestEntryPrepaintScript(): string {
  const ratings = SELF_RATINGS.map((r) => JSON.stringify(r)).join(",");
  return `(function(){try{var v=localStorage.getItem(${JSON.stringify(
    STORAGE_KEY,
  )});if([${ratings}].indexOf(v)>-1)document.documentElement.setAttribute("data-test-entry","reply");}catch(e){}})()`;
}

export const TEST_ENTRY_PREPAINT_SCRIPT = buildTestEntryPrepaintScript();
