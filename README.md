# dsh-has-stripper

Local-only DSH client plugin. Deletes every CSS rule whose selector contains
`:has(` at runtime.

Why: with `:has()` present, changing one element's class makes Chromium re-evaluate
`:has()` matches up the ancestor chain. On a transcript with ~100k KaTeX nodes this
turns 22 class writes (opening the `/` command menu) into hundreds of milliseconds of
style recalculation per keystroke.

Verify: `window.__hasStripper` → `{ installed: true, removed: N, passes: M }`
Disable: `window.__hasStripper.stop()` (this session only)
