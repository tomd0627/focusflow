import { createAudio } from "./audio.js";
import { notifications } from "./notifications.js";
import { storage } from "./storage.js";
import { createTimer } from "./timer.js";

// ── Constants ─────────────────────────────────────────────────

const RING_CIRCUMFERENCE = 729.03;

const MODE_LABELS = {
  work: "Focus time",
  "short-break": "Short break",
  "long-break": "Long break",
};

// ── DOM references ────────────────────────────────────────────

const timerSection = document.querySelector(".timer-section");
const sessionTabsEl = document.querySelector(".session-tabs");
const tabs = document.querySelectorAll(".tab");
const ringProgress = document.querySelector(".ring-progress");
const ringGlow = document.querySelector(".ring-glow");
const timerTimeEl = document.getElementById("timer-time");
const timerLabelEl = document.getElementById("timer-label");
const playPauseBtn = document.getElementById("play-pause-btn");
const playPauseIcon = document.getElementById("play-pause-icon");
const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");
const sessionDotsEl = document.getElementById("session-dots");
const sessionCountLabelEl = document.getElementById("session-count-label");
const soundscapeGrid = document.querySelector(".soundscape-grid");
const settingsTrigger = document.getElementById("settings-trigger");
const settingsDialog = document.getElementById("settings-dialog");
const settingsClose = document.getElementById("settings-close");
const workDurationInput = document.getElementById("work-duration");
const shortBreakInput = document.getElementById("short-break-duration");
const longBreakInput = document.getElementById("long-break-duration");
const sessionsUntilLongInput = document.getElementById("sessions-until-long");
const notificationsToggle = document.getElementById("notifications-toggle");
const notificationStatus = document.getElementById("notification-status");
const resetSessionsBtn = document.getElementById("reset-sessions-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

// ── Module-level state ────────────────────────────────────────

let settings = storage.getDefaults().settings;
let _toastTimerId = null;

// ── Instances ─────────────────────────────────────────────────

const audio = createAudio();

const timer = createTimer({
  onTick(remaining, mode) {
    timerTimeEl.textContent = formatTime(remaining);
    timerTimeEl.dateTime = buildDatetime(remaining);
    updateRing(remaining, mode);
    updateTitle(remaining, mode, true);
    saveState();
  },
  onComplete(completedMode) {
    const msg =
      completedMode === "work"
        ? "Focus session complete — time for a break."
        : "Break's over. Back to work!";
    const sent = notifications.send("FocusFlow", msg);
    if (!sent) showToast(msg);
  },
  onStateChange({ isRunning, mode, remaining }) {
    renderPlayState(isRunning);
    renderMode(mode);
    updateRing(remaining, mode);
    updateTitle(remaining, mode, isRunning);
    timerSection.dataset.state = isRunning ? "running" : "idle";
    renderSessionCounter(timer.sessionCount, settings.sessionsUntilLong);
    saveState();
  },
});

// ── Helpers ───────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildDatetime(seconds) {
  return `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
}

function getDurationForMode(mode) {
  const map = {
    work: settings.workDuration * 60,
    "short-break": settings.shortBreakDuration * 60,
    "long-break": settings.longBreakDuration * 60,
  };
  return map[mode] ?? settings.workDuration * 60;
}

// ── Render functions ──────────────────────────────────────────

function updateRing(remaining, mode) {
  const total = getDurationForMode(mode);
  const fraction = total > 0 ? remaining / total : 1;
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
  ringGlow.style.strokeDashoffset = offset;
}

function renderMode(mode) {
  const isBreak = mode !== "work";
  timerSection.classList.toggle("timer-section--break", isBreak);
  document.body.dataset.mode = isBreak ? "break" : "work";
  timerLabelEl.textContent = MODE_LABELS[mode];

  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("tab--active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function renderPlayState(isRunning) {
  playPauseBtn.setAttribute("aria-pressed", String(isRunning));
  playPauseBtn.setAttribute("aria-label", isRunning ? "Pause timer" : "Start timer");
  playPauseIcon.innerHTML = `<use href="${isRunning ? "#icon-pause" : "#icon-play"}"/>`;
}

function renderSessionCounter(count, sessionsUntilLong) {
  const filled = count % sessionsUntilLong;

  // Rebuild dots when session-until-long changes
  if (sessionDotsEl.children.length !== sessionsUntilLong) {
    sessionDotsEl.innerHTML = "";
    for (let i = 0; i < sessionsUntilLong; i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.index = i;
      sessionDotsEl.appendChild(dot);
    }
  }

  sessionDotsEl.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("dot--filled", i < filled);
    dot.classList.toggle("dot--current", i === filled);
  });

  const next = filled + 1;
  sessionCountLabelEl.textContent = `Session ${next} of ${sessionsUntilLong}`;
}

function renderSoundscape(soundId, isActive) {
  const card = soundscapeGrid.querySelector(`.soundscape-card[data-sound="${soundId}"]`);
  const toggle = soundscapeGrid.querySelector(`.soundscape-toggle[data-sound="${soundId}"]`);
  card?.classList.toggle("soundscape-card--active", isActive);
  toggle?.setAttribute("aria-pressed", String(isActive));
}

function updateTitle(remaining, mode, isRunning) {
  const time = formatTime(remaining);
  const total = getDurationForMode(mode);
  if (isRunning) {
    document.title = `${time} — ${MODE_LABELS[mode]} | FocusFlow`;
  } else if (remaining < total) {
    document.title = `${time} — Paused | FocusFlow`;
  } else {
    document.title = "FocusFlow";
  }
}

function showToast(message, duration = 4500) {
  toastMessage.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(_toastTimerId);
  _toastTimerId = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, duration);
}

// ── Settings helpers ──────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function readSettingsForm() {
  return {
    workDuration: clamp(parseInt(workDurationInput.value, 10) || 25, 1, 60),
    shortBreakDuration: clamp(parseInt(shortBreakInput.value, 10) || 5, 1, 30),
    longBreakDuration: clamp(parseInt(longBreakInput.value, 10) || 15, 1, 60),
    sessionsUntilLong: clamp(parseInt(sessionsUntilLongInput.value, 10) || 4, 1, 10),
  };
}

function applySettings(newSettings) {
  const prevDuration = getDurationForMode(timer.mode);
  settings = { ...settings, ...newSettings };
  timer.applySettings(newSettings);

  // If the user hasn't started this mode's session yet, reset to the new duration
  if (!timer.isRunning && timer.remaining === prevDuration) {
    timer.reset();
  }

  renderSessionCounter(timer.sessionCount, settings.sessionsUntilLong);
  saveState();
}

// ── Persistence ───────────────────────────────────────────────

function saveState() {
  storage.save({
    mode: timer.mode,
    remaining: timer.remaining,
    isRunning: false,
    sessionCount: timer.sessionCount,
    settings,
    soundscapes: audio.serialize(),
  });
}

// ── Notification helpers ──────────────────────────────────────

function syncNotificationUI() {
  const granted = notifications.permission === "granted";
  const enabled = settings.notificationsEnabled && granted;
  notificationsToggle.setAttribute("aria-checked", String(enabled));

  if (!notifications.isSupported) {
    notificationStatus.textContent = "Notifications are not supported in this browser.";
    notificationsToggle.disabled = true;
  } else if (notifications.permission === "denied") {
    notificationStatus.textContent =
      "Notifications are blocked. Allow them in your browser settings, then refresh.";
    notificationsToggle.setAttribute("aria-checked", "false");
  } else if (enabled) {
    notificationStatus.textContent = "You'll be notified when each session ends.";
  } else {
    notificationStatus.textContent = "";
  }
}

// ── Event binding ─────────────────────────────────────────────

function bindEvents() {
  // Play / pause
  playPauseBtn.addEventListener("click", () => {
    if (timer.isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    timer.reset();
  });

  // Skip
  skipBtn.addEventListener("click", () => {
    timer.skip();
  });

  // Mode tabs
  sessionTabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    timer.setMode(tab.dataset.mode);
  });

  // Soundscape toggles
  soundscapeGrid.addEventListener("click", (e) => {
    const toggle = e.target.closest(".soundscape-toggle");
    if (!toggle) return;
    const soundId = toggle.dataset.sound;
    const isNowActive = audio.toggle(soundId);
    renderSoundscape(soundId, isNowActive);
    saveState();
  });

  // Volume sliders — live feedback on input, persist on change
  soundscapeGrid.addEventListener("input", (e) => {
    if (!e.target.classList.contains("volume-slider")) return;
    const card = e.target.closest(".soundscape-card");
    if (!card) return;
    audio.setVolume(card.dataset.sound, Number(e.target.value));
  });

  soundscapeGrid.addEventListener("change", (e) => {
    if (e.target.classList.contains("volume-slider")) saveState();
  });

  // Settings open
  settingsTrigger.addEventListener("click", () => {
    settingsDialog.showModal();
    settingsTrigger.setAttribute("aria-expanded", "true");
  });

  // Settings close via button
  settingsClose.addEventListener("click", () => {
    settingsDialog.close();
  });

  // Settings dialog closed (button or Escape) — apply and persist
  settingsDialog.addEventListener("close", () => {
    settingsTrigger.setAttribute("aria-expanded", "false");
    applySettings(readSettingsForm());
  });

  // Notification toggle
  notificationsToggle.addEventListener("click", async () => {
    if (!notifications.isSupported || notifications.permission === "denied") {
      syncNotificationUI();
      return;
    }

    if (notifications.permission !== "granted") {
      const result = await notifications.request();
      if (result !== "granted") {
        settings.notificationsEnabled = false;
        syncNotificationUI();
        saveState();
        return;
      }
    }

    const isNowEnabled = notificationsToggle.getAttribute("aria-checked") !== "true";
    settings.notificationsEnabled = isNowEnabled;
    syncNotificationUI();
    saveState();
  });

  // Reset session counter
  resetSessionsBtn.addEventListener("click", () => {
    timer.resetSessions();
    renderSessionCounter(0, settings.sessionsUntilLong);
    saveState();
    settingsDialog.close();
    showToast("Session counter reset.");
  });
}

// ── Init ──────────────────────────────────────────────────────

function init() {
  const saved = storage.load();
  settings = { ...storage.getDefaults().settings, ...saved.settings };

  // Restore timer
  timer.load(saved);

  // Restore soundscape volumes into audio module and slider UI
  // (Do NOT restore active state — audio requires a user gesture to start)
  Object.entries(saved.soundscapes).forEach(([id, { volume }]) => {
    audio.setVolume(id, volume);
    const slider = document.getElementById(`volume-${id}`);
    if (slider) slider.value = volume;
  });

  // Populate settings form
  workDurationInput.value = settings.workDuration;
  shortBreakInput.value = settings.shortBreakDuration;
  longBreakInput.value = settings.longBreakDuration;
  sessionsUntilLongInput.value = settings.sessionsUntilLong;

  // Render initial UI
  timerTimeEl.textContent = formatTime(saved.remaining);
  timerTimeEl.dateTime = buildDatetime(saved.remaining);
  updateRing(saved.remaining, saved.mode);
  document.body.dataset.mode = saved.mode === "work" ? "work" : "break";
  renderMode(saved.mode);
  renderPlayState(false);
  renderSessionCounter(saved.sessionCount, settings.sessionsUntilLong);
  updateTitle(saved.remaining, saved.mode, false);
  timerSection.dataset.state = "idle";

  // Notification UI
  syncNotificationUI();

  bindEvents();
}

init();
