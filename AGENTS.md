<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This app is a Living Waters presentation

The doctrine is not decoration on a product — it is the product, and the design
serves it. **Read `docs/METHOD.md` before changing copy or flow in `/test`,
grace or the decision**, and fact-check the change against it. Things that are
load-bearing have been removed more than once by people who did not know they
were load-bearing.

Copy and flow changes that touch the method belong to the owner. When in doubt,
propose rather than commit.

# Verify against the thing, not a proxy for it

Four failures in one session, all the same shape — a convincing stand-in was
read instead of the actual subject:

- A "new" colour hinge was proposed for grace that had shipped months earlier.
  The messages file was read; the component was not.
- The collapsing-chain mechanic was proposed as an idea. `reading-plan/day-card`
  next door already does exactly that, auto-advance included.
- Undecided readers were routed away from `/next-steps` because the predicate
  `invitationResponse !== "dismissed"` looked like a category error. It is not:
  `/next-steps` picks a track, and `TrackThinking` is written for that reader.
  The destination was never opened. A test was then written pinning the mistake.
- A failing test was committed because only the last three lines of the run were
  read. The pre-push hook caught what the tail had cut off.

So, before acting:

- **Before proposing where a reader goes, open where they currently go.**
- **Before calling something new, grep for it.** This codebase has usually
  solved the problem once already, one route over.
- **Assert every scripted edit matched.** A bare `str.replace` that matches
  nothing succeeds silently; two guards were lost that way in one afternoon.
- **Read the whole test output.** `| tail -3` hides failures.

The cost is not the wrong patch — it is a confident wrong patch with a test
locking it in, which is harder to undo than no patch at all.
