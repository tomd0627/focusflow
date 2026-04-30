# FocusFlow — CLAUDE.md

## Project Overview

Pomodoro timer with Web Audio API ambient soundscapes. Portfolio project for tomdeluca.dev.
Vanilla HTML/CSS/JS, ES modules, no framework, no build tool (devDependencies are linting only).

## Architecture

```
focusflow/
├── index.html              Single page, all markup
├── css/main.css            Full stylesheet, CSS custom properties
├── js/
│   ├── main.js             Entry point — imports and wires all modules
│   ├── timer.js            Pomodoro state machine (idle/running/paused, modes, session count)
│   ├── audio.js            Web Audio API soundscape synthesis
│   ├── notifications.js    Desktop Notification API with graceful permission fallback
│   └── storage.js          localStorage persistence of timer + settings state
├── favicon.svg             Amber clock-face SVG
├── netlify.toml            Cache + security headers
└── _redirects              SPA fallback (/* → index.html 200)
```

## Design

**Palette: "Candlelight"** — warm amber on deep charcoal. Deliberate departure from the
portfolio's cool navy/cyan. Chosen because focus tools benefit from warm, lamplight-adjacent
tones that are easy on eyes during long sessions.

| Token                | Value                  |
| -------------------- | ---------------------- |
| `--c-bg`             | `#121010`              |
| `--c-surface`        | `#1d1917`              |
| `--c-surface-raised` | `#272220`              |
| `--c-text-primary`   | `#f0e8d8`              |
| `--c-text-secondary` | `#b5a394`              |
| `--c-text-muted`     | `#756456`              |
| `--c-accent`         | `#d4904a` (work/amber) |
| `--c-break`          | `#7aac8e` (break/sage) |
| `--c-danger`         | `#c06b52`              |

**Fonts:** `DM Mono` (timer display, prevents digit layout shift), `Inter` (UI labels).
Both from Google Fonts CDN with `preconnect` + `font-display: swap`.

**Icons:** Inline SVG sprite (`<defs>` + `<symbol>` + `<use>`) — no icon library.

## Audio Implementation

All audio synthesized at runtime via Web Audio API — zero audio files.

- **Brown noise:** White noise buffer → BiquadFilterNode (lowpass, ~200 Hz)
- **Rain:** Two noise layers (high bandpass for drops, low bandpass for hiss) + stereo offset
- **Café:** Mid-frequency bandpass (500–2000 Hz crowd hum) + scheduled GainNode bursts

AudioContext is created on first user interaction to comply with browser autoplay policy.
Each soundscape has an independent GainNode for per-source volume control. All feed into a
master GainNode → AudioContext.destination.

## Timer Logic

State machine with three modes: `work`, `short-break`, `long-break`.
Transitions: work → short-break (repeat N times) → long-break → work.

```
idle → running → paused → running → (tick to zero) → [next mode]
```

Session counter increments on work session completion. After N work sessions (default 4),
the next break is a long break.

Tab title updates every second: `"25:00 — Focus time | FocusFlow"`.

## localStorage Schema

```json
{
  "mode": "work",
  "remaining": 1500,
  "isRunning": false,
  "sessionCount": 2,
  "settings": {
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "sessionsUntilLong": 4,
    "notificationsEnabled": false
  },
  "soundscapes": {
    "brown": { "active": false, "volume": 0.5 },
    "rain": { "active": false, "volume": 0.5 },
    "cafe": { "active": false, "volume": 0.5 }
  }
}
```

## Pre-commit Tooling

Husky + lint-staged. Run `npm install` once after cloning to set up hooks.

- **Prettier** — formats HTML, CSS, JS
- **ESLint** — JS linting (no unused vars, no console.log, enforce `===`)
- **Stylelint** — CSS (alphabetical properties, logical properties, no duplicates)

## Deployment

Netlify. Push to `master` → auto-deploy via GitHub integration.
Assets (JS, CSS, SVG) served with `Cache-Control: public, max-age=31536000, immutable`.
Netlify's CDN is invalidated on every deploy, so immutable caching is safe.

## Local Development

ES modules require HTTP (not `file://`). Start a dev server:

```bash
npx serve .
# or
python -m http.server 8000
# or
npx vite --open   # if you prefer HMR
```

## Phased Build Log

- Phase 1: Pre-code declaration (palette, structure, typefaces, dependencies) ✓
- Phase 2: Core HTML/CSS scaffold ✓
- Phase 3: JS functionality + Web Audio API ✓
- Phase 4: Pre-commit tooling (Husky, ESLint, Stylelint, Prettier) ✓
- Phase 5: Recruiter audit + pre-deploy audit (Lighthouse, contrast, README) — pending
