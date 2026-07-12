import { describe, it, expect } from "vitest";
import { validateMessages, JOURNEY_STAGE_LEAVES } from "@/lib/i18n";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

type AnyRecord = Record<string, unknown>;

function cloneMessages(source: unknown): AnyRecord {
  return structuredClone(source) as AnyRecord;
}

describe("validateMessages — journeyStages deep validation", () => {
  it.each([["en", en], ["pt", pt]] as const)(
    "accepts the real %s message file",
    (locale, messages) => {
      expect(() => validateMessages(cloneMessages(messages), locale)).not.toThrow();
    },
  );

  it.each(JOURNEY_STAGE_LEAVES.map((path) => [path.join(".")] as const))(
    "throws when home.journeyStages.%s is missing",
    (dottedPath) => {
      const clone = cloneMessages(en);
      const path = dottedPath.split(".");
      let node = (clone.home as AnyRecord).journeyStages as AnyRecord;
      for (const key of path.slice(0, -1)) node = node[key] as AnyRecord;
      delete node[path[path.length - 1]!];
      expect(() => validateMessages(clone, "en")).toThrow(/journeyStages/);
    },
  );
});
