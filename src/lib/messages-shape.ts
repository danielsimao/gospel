import type { Messages } from "@/lib/types";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

/*
 * The only thing standing between the hand-written `Messages` type and the two
 * JSON files it claims to describe.
 *
 * Nothing reads these. Their entire job is to fail `tsc` when the type and the
 * locale files disagree, which until now nothing did: `getMessages` resolves a
 * template-literal dynamic import so `messages.default` is `any`, and
 * `validateMessages` opens with `messages as Messages` and hand-checks about a
 * dozen leaves out of roughly eleven hundred. Every path from JSON to `Messages`
 * was a cast.
 *
 * The drift was not hypothetical. `home.journey.share` was declared
 * `{ label, description }` while both files carried
 * `{ label, descActive, descUpcoming }` — `share.description` was typed `string`
 * and was `undefined` at runtime, invisibly, for as long as it took to notice.
 *
 * Assignment from a variable skips excess-property checking, which is what makes
 * this usable: the many top-level blocks `Messages` deliberately does not model
 * (`learn`, `blog`, `footer`, `topBar`, …) pass untouched, while every field the
 * type does declare is checked against both locales. Adding a required field to
 * `Messages` without adding it to both JSONs now fails the build instead of
 * failing a reader.
 */
export const _enShape: Messages = en;
export const _ptShape: Messages = pt;
