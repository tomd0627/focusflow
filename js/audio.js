// Phase 3: Full Web Audio API implementation.
// Stub provides the interface so main.js can import safely.

export function createAudio() {
  let _ctx = null;
  let _masterGain = null;

  const _sources = {
    brown: { gainNode: null, bufferSource: null, active: false },
    cafe: { gainNode: null, bufferSource: null, active: false },
    rain: { gainNode: null, bufferSource: null, active: false },
  };

  function _ensureContext() {
    if (_ctx) return;
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _masterGain = _ctx.createGain();
    _masterGain.connect(_ctx.destination);
  }

  return {
    get isReady() {
      return _ctx !== null;
    },

    init() {
      _ensureContext();
    },

    toggle(soundId) {
      _ensureContext();
      const source = _sources[soundId];
      if (!source) return false;
      if (source.active) {
        this.stop(soundId);
      } else {
        this.play(soundId);
      }
      return source.active;
    },

    play(_soundId) {
      // Phase 3: synthesize and connect Web Audio nodes
    },

    stop(_soundId) {
      // Phase 3: disconnect and nullify nodes
    },

    setVolume(soundId, value) {
      const source = _sources[soundId];
      if (source?.gainNode) {
        source.gainNode.gain.setTargetAtTime(value, _ctx.currentTime, 0.05);
      }
    },

    isActive(soundId) {
      return _sources[soundId]?.active ?? false;
    },

    stopAll() {
      Object.keys(_sources).forEach((id) => {
        if (_sources[id].active) this.stop(id);
      });
    },
  };
}
