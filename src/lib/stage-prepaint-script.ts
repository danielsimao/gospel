import {
  CURRENT_VERSION,
  INVITATION_RESPONSES,
  LEGACY_TEST_COMPLETED_KEY,
  STORAGE_KEY,
} from "./journey-storage";

/**
 * The homepage's journey stage, resolved during HTML parse.
 *
 * The stage lives in localStorage, so the server cannot know it: every server
 * render of the homepage carries all five stage blocks and CSS reveals one.
 * This script is what tells the CSS which. It has to run before the first
 * paint, which means before any bundle loads, so it is emitted as a string and
 * cannot import anything — see `home-shell.tsx`.
 *
 * It is built from the same constants `journey-storage` reads with, rather than
 * repeating their values, so a renamed key or a bumped version cannot leave a
 * stale second copy behind. What it still duplicates is the derivation itself.
 * `src/__tests__/stage-prepaint.test.ts` runs this string against the same
 * records `readJourney`/`deriveStage` are given and asserts the two agree —
 * that test is the guard, and it did not exist when this script was first
 * written, which is how the bug below shipped.
 *
 * The validation matters more than it looks. `deriveStage` is only total
 * because `readJourney` sanitises the record first; this reads raw storage, so
 * an `invitationResponse` outside the three valid values used to be copied
 * straight onto <html>. No CSS rule matches an unknown stage, so the homepage
 * painted with every stage block hidden — no heading, no chips, no call to
 * action at all — until hydration corrected it. That is strictly worse than
 * the flicker this whole mechanism exists to remove, and it was reachable by a
 * rollback, a deploy skew across two tabs, or adding a fourth response value.
 *
 * The legacy branch gates on the raw storage key being absent, not on the
 * parsed record being falsy, because that is what `migrateLegacyJourney` gates
 * on. Gating on the parse meant a record holding "null", "", "0" or "false"
 * plus a legacy flag stamped "undecided" here while the migration left the
 * reader on "visitor" — the swap this exists to remove, in the population it
 * exists to serve. Only reachable by tampering or a foreign writer, but the two
 * should not be able to disagree at all.
 *
 * The legacy flag is read for a subtler reason. `migrateLegacyJourney` folds
 * `test_completed` into a real record, but it runs in `useJourney`'s effect —
 * after this. A reader who has not visited since that migration shipped has
 * the flag and no record, so without this branch they would be stamped
 * "visitor", see the stranger's front door, and get the full stage swap at
 * hydration. They are the population that has been away longest.
 */
export function buildStagePrepaintScript(): string {
  const responses = INVITATION_RESPONSES.map((r) => JSON.stringify(r)).join(",");
  return `(function(){try{var K=${JSON.stringify(STORAGE_KEY)},L=${JSON.stringify(
    LEGACY_TEST_COMPLETED_KEY,
  )},V=${CURRENT_VERSION},R=[${responses}],s="visitor",r=JSON.parse(localStorage.getItem(K)||"null");if(r&&r.version===V){if(R.indexOf(r.invitationResponse)>-1)s=r.invitationResponse;else if(typeof r.testCompletedAt==="number")s="undecided";}else if(localStorage.getItem(K)===null&&localStorage.getItem(L)==="1"){s="undecided";}document.documentElement.setAttribute("data-journey-stage",s);}catch(e){}})()`;
}

export const STAGE_PREPAINT_SCRIPT = buildStagePrepaintScript();
