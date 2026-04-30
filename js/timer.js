// Phase 3: Full implementation.
// Stub exports the interface contract used by main.js.

export function createTimer(options = {}) {
  const {
    onTick,
    onComplete,
    onStateChange,
  } = options;

  let _intervalId = null;
  let _remaining = 0;
  let _isRunning = false;
  let _mode = "work";
  let _sessionCount = 0;
  let _settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLong: 4,
  };

  function _notifyTick() {
    onTick?.(_remaining, _mode, _sessionCount);
  }

  function _notifyStateChange() {
    onStateChange?.({ isRunning: _isRunning, mode: _mode, remaining: _remaining });
  }

  function _notifyComplete() {
    onComplete?.(_mode, _sessionCount);
  }

  function _durationForMode(mode) {
    const map = {
      "long-break": _settings.longBreakDuration * 60,
      "short-break": _settings.shortBreakDuration * 60,
      work: _settings.workDuration * 60,
    };
    return map[mode];
  }

  function _nextMode() {
    if (_mode === "work") {
      const newCount = _sessionCount + 1;
      _sessionCount = newCount;
      const isLong = newCount % _settings.sessionsUntilLong === 0;
      return isLong ? "long-break" : "short-break";
    }
    return "work";
  }

  function _stopInterval() {
    clearInterval(_intervalId);
    _intervalId = null;
  }

  return {
    get remaining() {
      return _remaining;
    },
    get isRunning() {
      return _isRunning;
    },
    get mode() {
      return _mode;
    },
    get sessionCount() {
      return _sessionCount;
    },

    load(state) {
      _remaining = state.remaining;
      _mode = state.mode;
      _sessionCount = state.sessionCount;
      _settings = { ..._settings, ...state.settings };
      _isRunning = false;
    },

    applySettings(settings) {
      _settings = { ..._settings, ...settings };
    },

    setMode(mode) {
      _stopInterval();
      _isRunning = false;
      _mode = mode;
      _remaining = _durationForMode(mode);
      _notifyStateChange();
      _notifyTick();
    },

    start() {
      if (_isRunning) return;
      _isRunning = true;
      _notifyStateChange();

      _intervalId = setInterval(() => {
        _remaining -= 1;
        _notifyTick();

        if (_remaining <= 0) {
          _stopInterval();
          _isRunning = false;
          _notifyComplete();
          const next = _nextMode();
          _mode = next;
          _remaining = _durationForMode(next);
          _notifyStateChange();
          _notifyTick();
        }
      }, 1000);
    },

    pause() {
      if (!_isRunning) return;
      _stopInterval();
      _isRunning = false;
      _notifyStateChange();
    },

    reset() {
      _stopInterval();
      _isRunning = false;
      _remaining = _durationForMode(_mode);
      _notifyStateChange();
      _notifyTick();
    },

    skip() {
      _stopInterval();
      _isRunning = false;
      const next = _nextMode();
      _mode = next;
      _remaining = _durationForMode(next);
      _notifyStateChange();
      _notifyTick();
    },

    resetSessions() {
      _sessionCount = 0;
    },

    serialize() {
      return {
        isRunning: false,
        mode: _mode,
        remaining: _remaining,
        sessionCount: _sessionCount,
        settings: _settings,
      };
    },
  };
}
