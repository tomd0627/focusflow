const STORAGE_KEY = "focusflow_state";

const defaults = {
  mode: "work",
  remaining: 25 * 60,
  isRunning: false,
  sessionCount: 0,
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLong: 4,
    notificationsEnabled: false,
  },
  soundscapes: {
    brown: { active: false, volume: 0.5 },
    cafe: { active: false, volume: 0.5 },
    rain: { active: false, volume: 0.5 },
  },
};

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaults);
      const saved = JSON.parse(raw);
      return { ...structuredClone(defaults), ...saved };
    } catch {
      return structuredClone(defaults);
    }
  },

  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or unavailable — silently degrade
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getDefaults() {
    return structuredClone(defaults);
  },
};
