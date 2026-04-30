import { storage } from "./storage.js";
import { createTimer } from "./timer.js";
import { createAudio } from "./audio.js";
import { notifications } from "./notifications.js";

// Phase 3: Full UI wiring and event handling.
// Stub verifies modules load and exports resolve without errors.

const state = storage.load();
const audio = createAudio();
const timer = createTimer({
  onTick: (_remaining, _mode, _sessionCount) => {},
  onComplete: (_mode, _sessionCount) => {},
  onStateChange: (_snapshot) => {},
});

timer.load(state);

export { audio, notifications, timer };
