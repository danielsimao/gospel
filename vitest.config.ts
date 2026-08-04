import { defineConfig, configDefaults } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    /*
     * A git worktree checked out under .claude/ is a second, complete copy of
     * this repo, and vitest's default glob walks straight into it — so the
     * parent's suite runs the worktree's tests against the worktree's source.
     * One open worktree turned `pnpm test` from 17 files into 33 and 27
     * failures that belonged to somebody else's half-finished branch, which
     * also fails the pre-push hook and blocks a push that has nothing to do
     * with it.
     *
     * Spread rather than replace: naming `exclude` at all drops vitest's own
     * defaults, node_modules included.
     */
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
