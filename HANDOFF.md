# FocusFlow — Handoff

## Current Phase

**Phase 3 complete: JS functionality + Web Audio API**

The application is fully functional. Timer ticks, soundscapes synthesize, settings persist,
desktop notifications fire, and all state survives page refresh.

---

## What Was Just Completed

**`js/audio.js`** — Full Web Audio API soundscape synthesis:

- Brown noise: leaky integrator (1/f² spectrum) on a 5-second looped buffer
- Rain: three layered noise bands (3800 Hz drops, 700 Hz hiss, 200 Hz rumble)
- Café: crowd murmur (700 Hz bandpass) + chatter layer with scheduled amplitude bursts
  - low mechanical hum (140 Hz lowpass). Burst scheduler runs every 8.5 s.
- All soundscapes: independent GainNode → master GainNode → destination
- `toggle()` creates/destroys nodes on demand; `setVolume()` uses `setTargetAtTime`
  for smooth ramps

**`js/main.js`** — Full DOM wiring:

- Timer callbacks: `onTick` updates display + ring + title + storage every second
- `onStateChange`: syncs play button, mode class, ring, title, session counter
- `onComplete`: sends desktop notification or falls back to in-app toast
- Ring animation: JS sets `strokeDashoffset` directly on SVG elements (CSS
  `transition: stroke-dashoffset 0.75s linear` handles the interpolation)
- Tab title: `"MM:SS — Focus time | FocusFlow"` while running, `"MM:SS — Paused"` when
  paused mid-session, `"FocusFlow"` when at rest
- Settings dialog: native `<dialog>` + `showModal()` / `close()`; settings applied on
  `close` event (covers both button click and Escape key)
- Notification toggle: requests permission on first enable, gracefully handles denied state
- Session dots: dynamically rebuilt if `sessionsUntilLong` changes
- localStorage: restored on init (volumes, settings, timer state); saved on every tick +
  every state change; soundscape `active` state is NOT restored on reload (requires
  user gesture to start audio)

**`css/main.css`** — Three bugs fixed:

- `tabular-nums: initial` → `font-variant-numeric: tabular-nums`
- Removed `--ring-circumference` / `--ring-offset` CSS vars (JS owns `strokeDashoffset`)
- Removed duplicate physical `bottom:` from `.toast` (already had `inset-block-end`)

---

## Exact Next Task

**Begin Phase 4: Pre-commit tooling**

1. Create `package.json` with all devDependencies
2. `npm install`
3. Configure Husky + lint-staged (pre-commit hook)
4. Write `.prettierrc` — formatting for HTML, CSS, JS; LF line endings
5. Write `.eslintrc.json` (ESLint flat config) — no unused vars, no console.log, enforce `===`
6. Write `stylelint.config.js` — alphabetical property order, logical properties,
   no duplicate selectors, no unnecessary vendor prefixes
7. Run linters against current code and fix any violations before committing Phase 4

---

## Decisions Made This Session

- **`AudioContext` construction**: called on first `toggle()` (requires user gesture). The
  `_ensureContext()` pattern avoids the "AudioContext was not allowed to start" warning.
- **Ring animation**: JS sets `strokeDashoffset` directly on SVG circle elements rather than
  via CSS custom properties, because CSS transitions don't animate custom-property-derived
  SVG presentation attributes without `@property` registration. Simpler to own it in JS.
- **Café burst scheduler**: uses `setValueAtTime` / `linearRampToValueAtTime` on a
  `GainNode` to schedule the next 9 seconds of chatter bursts, then `setTimeout` to
  reschedule. Avoids timer drift vs. calling `setTimeout` repeatedly.
- **No `active` restore on init**: browser autoplay policy blocks audio without a user
  gesture. Volumes are restored; active states are not.
- **Settings apply on `close` event**: handles both the X button and Escape key in one place.
- **Import sort order**: ESLint enforces alphabetical imports — `audio`, `notifications`,
  `storage`, `timer` (alphabetical by module filename).

## Known Gotchas for Phase 4

- Current `.gitignore` doesn't cover `.husky/` internal files that shouldn't be tracked
  (though Husky's own `.gitignore` inside `.husky/` handles this).
- CSS has `padding: var(--space-md) var(--space-lg)` shorthand in `.soundscape-toggle` —
  Stylelint logical-properties plugin may flag this; shorthand `padding:` is exempt from
  physical-vs-logical rules (shorthand is neutral).
- ESLint will need to be told to ignore `audio.js`'s `_buildBrown`, `_buildRain`,
  `_buildCafe` parameter names that start with `_` (they're intentionally named to match
  the factory pattern), OR the unused-vars rule should be set to `{ "argsIgnorePattern": "^_" }`.

---

## Remaining Phases

- **Phase 4** — Pre-commit tooling (package.json, Husky, ESLint, Stylelint, Prettier) ← next
- **Phase 5** — Recruiter audit + pre-deploy audit (Lighthouse CLI, contrast, focus, README final)
