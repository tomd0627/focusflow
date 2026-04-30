# FocusFlow

A Pomodoro timer with ambient soundscapes synthesized entirely via the **Web Audio API** — no audio files, no framework, no build step.

---

## Features

- **25 / 5 / 15 minute Pomodoro cycles** — work, short break, and long break modes with configurable durations
- **Ambient soundscapes** — brown noise, rain, and café atmosphere, each synthesized at runtime via Web Audio API nodes; mix and match with independent volume sliders
- **Desktop notifications** — fires at session end with graceful fallback to an in-app toast when permission is denied
- **Persistent state** — timer position, settings, and soundscape volumes survive page refresh via `localStorage`
- **Keyboard accessible** — full tab order, ARIA labels, visible focus rings, and skip-to-content link
- **Reduced motion** — ring animation and transitions respect `prefers-reduced-motion`

---

## Audio implementation

All three soundscapes are synthesized at runtime — there are zero audio file downloads:

| Soundscape      | Technique                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **Brown noise** | Leaky integrator (1/f² power spectrum) on a 5-second looped `AudioBuffer`                              |
| **Rain**        | Three layered bandpass / lowpass noise bands (3800 Hz drops · 700 Hz hiss · 200 Hz rumble)             |
| **Café**        | Bandpass crowd murmur + chatter `GainNode` with pre-scheduled amplitude bursts + 140 Hz mechanical hum |

`AudioContext` is created on first user interaction, satisfying the browser autoplay policy. Each soundscape feeds an independent `GainNode` → master `GainNode` → `destination`.

---

## Tech stack

| Layer         | Choice                               | Why                                                                    |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Language      | Vanilla JS (ES modules)              | Zero overhead, demonstrates raw platform knowledge                     |
| Styling       | Vanilla CSS (custom properties)      | Full control, logical properties, no class-name tooling needed         |
| Audio         | Web Audio API                        | Runtime synthesis — no asset pipeline, no licensing                    |
| Notifications | Notification API                     | Native, graceful degradation                                           |
| Persistence   | `localStorage`                       | Sufficient scope, no server required                                   |
| Fonts         | Google Fonts CDN (non-blocking)      | Inter + DM Mono, loaded via print-media trick to avoid render blocking |
| Linting       | ESLint 9 + Stylelint 16 + Prettier 3 | Enforced via Husky + lint-staged pre-commit hook                       |
| Deploy        | Netlify                              | Push-to-deploy, CDN, immutable asset caching                           |

---

## Lighthouse scores (production)

| Category       | Score |
| -------------- | ----- |
| Performance    | 100   |
| Accessibility  | 100   |
| Best Practices | 100   |
| SEO            | 100   |

---

## Local development

ES modules require an HTTP origin (not `file://`). Pick any local server:

```bash
# Option A — serve (Node)
npx serve .

# Option B — Python
python -m http.server 8000

# Option C — Vite (HMR)
npx vite --open
```

Then open `http://localhost:3000` (or whatever port the server reports).

### Linting

```bash
npm install           # installs devDependencies + sets up Husky pre-commit hook

npm run lint:js       # ESLint
npm run lint:css      # Stylelint
npm run fix:js        # ESLint --fix
npm run fix:css       # Stylelint --fix
npm run fix:format    # Prettier --write .
```

Linters run automatically on every `git commit` via lint-staged.

---

## Project structure

```
focusflow/
├── index.html              Single page, all markup
├── css/main.css            Full stylesheet, CSS custom properties
├── js/
│   ├── main.js             Entry point — DOM wiring, event binding, init
│   ├── timer.js            Pomodoro state machine (idle/running/paused, modes)
│   ├── audio.js            Web Audio API soundscape synthesis
│   ├── notifications.js    Desktop Notification API with permission handling
│   └── storage.js          localStorage persistence
├── favicon.svg             Amber clock-face SVG
├── netlify.toml            Cache + security headers
└── _redirects              SPA fallback (/* → index.html 200)
```

---

## Design

**Palette: "Candlelight"** — warm amber on deep charcoal. A deliberate departure from the portfolio's cool navy/cyan palette; focus tools benefit from warm, lamplight-adjacent tones that are easy on the eyes during long sessions.

All text/background pairs meet WCAG AA contrast (4.5:1 minimum). The amber accent achieves 7.1:1 on the dark background.
