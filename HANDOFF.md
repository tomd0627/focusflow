# FocusFlow — Handoff

## Current Phase

**Phase 2 complete: Core HTML/CSS scaffold**

All static scaffold files are written and in place. The project has a complete visual structure
and design system but no live JS functionality yet — the timer does not tick, audio does not play.

---

## What Was Just Completed

- `index.html` — Full semantic markup with inline SVG sprite (13 icons), timer ring, soundscape
  cards, settings `<dialog>`, toast notification element
- `css/main.css` — Complete design system with "Candlelight" palette, all component styles,
  responsive layout (mobile → 560px → 768px), reduced-motion support, WCAG-compliant focus
  indicators
- `favicon.svg` — Amber clock-face SVG
- `netlify.toml` — Cache headers (1yr immutable for JS/CSS/SVG) + security headers
- `_redirects` — SPA fallback
- `.gitignore` — Replaced .NET template with correct web-stack rules
- `CLAUDE.md` — Full project documentation for future sessions
- `js/storage.js` — **Fully implemented** (localStorage load/save/clear with defaults + error handling)
- `js/timer.js` — **Fully implemented** (complete Pomodoro state machine — start/pause/reset/skip/setMode)
- `js/audio.js` — Stub with correct interface; synthesis not yet wired
- `js/notifications.js` — **Fully implemented** (request/send/isSupported)
- `js/main.js` — Stub that imports all modules; no UI wiring yet

---

## Exact Next Task

**Begin Phase 3: JS functionality + Web Audio API**

Priority order within Phase 3:
1. Implement `audio.js` — brown noise, rain, café soundscapes via Web Audio API
2. Wire `main.js` — connect timer, audio, notifications, storage to all DOM elements
3. Tab title updates (`"25:00 — Focus time | FocusFlow"` updating each tick)
4. Settings dialog open/close, form save, notification permission flow
5. localStorage restore on page load (timer state, soundscape volumes/active states)
6. Session counter dot rendering
7. Timer ring `stroke-dashoffset` animation via JS

---

## Decisions Made This Session

- **ES modules** (`type="module"`) chosen over global namespace — auto-deferred, strict mode,
  no build tool needed. Local dev requires an HTTP server (not `file://`).
- **`<dialog>` element** for settings — native focus trap, backdrop, Escape key, aria-modal.
- **SVG sprite** (`<defs>` + `<symbol>` + `<use>`) — all 13 icons inlined in HTML, zero requests.
- **Timer ring math:** viewBox 260×260, center 130,130, radius 116, circumference ≈ 729.03.
  `stroke-dashoffset` is set via JS inline style on `.ring-progress` and `.ring-glow`.
- **`timer.js` is fully implemented** even though it was labeled a "stub" — the state machine
  is complete; only the DOM wiring in `main.js` is missing.
- **Soundscape CSS:** volume controls are hidden (`opacity: 0`, `pointer-events: none`) and
  revealed when `.soundscape-card--active` is toggled by JS.
- **Break mode styling:** `.timer-section--break` class switches ring/button/dot colors to
  `--c-break` (sage green `#7aac8e`) via CSS cascade.

---

## Known Gotchas

- `audio.js` `play()` and `stop()` methods are empty stubs — they must be implemented in
  Phase 3 before the toggle works.
- `main.js` exports `audio`, `notifications`, `timer` for potential console inspection during
  development; these exports should be removed (or gated) before final deploy.
- The settings `<dialog>` uses native `showModal()` / `close()` — the trigger button's
  `aria-expanded` attribute must be toggled via JS alongside the dialog open/close.
- `DM Mono` doesn't load a bold weight — font-weight 300 and 400 only. Timer renders at 300
  (light) intentionally; don't add `font-weight: 700` to `.timer-time`.

---

## Remaining Phases

- **Phase 3** — JS functionality + Web Audio API ← next
- **Phase 4** — Pre-commit tooling (package.json, Husky, ESLint, Stylelint, Prettier, lint-staged)
- **Phase 5** — Recruiter audit + pre-deploy audit (Lighthouse CLI, contrast, focus, README final)
