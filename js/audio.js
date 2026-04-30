export function createAudio() {
  let _ctx = null;
  let _masterGain = null;

  const _sounds = {
    brown: { active: false, volume: 0.5, instance: null },
    cafe: { active: false, volume: 0.5, instance: null },
    rain: { active: false, volume: 0.5, instance: null },
  };

  function _ensureContext() {
    if (_ctx) return;
    _ctx = new AudioContext();
    _masterGain = _ctx.createGain();
    _masterGain.connect(_ctx.destination);
  }

  function _resume() {
    if (_ctx.state === "suspended") _ctx.resume();
  }

  // ── Noise buffer generators ──────────────────────────────────

  function _whiteNoiseBuffer(seconds) {
    const len = Math.floor(_ctx.sampleRate * seconds);
    const buf = _ctx.createBuffer(2, len, _ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // Leaky integrator approximates 1/f² power spectrum (brown/red noise).
  // k=0.02 gives a rolloff starting around 140 Hz at 44100 Hz sample rate.
  function _brownNoiseBuffer(seconds) {
    const len = Math.floor(_ctx.sampleRate * seconds);
    const buf = _ctx.createBuffer(2, len, _ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  function _loopSource(buffer) {
    const src = _ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  // ── Soundscape builders ──────────────────────────────────────

  function _buildBrown(volume) {
    const out = _ctx.createGain();
    out.gain.value = volume;
    out.connect(_masterGain);

    const src = _loopSource(_brownNoiseBuffer(5));
    src.connect(out);
    src.start();

    return {
      gainNode: out,
      stop() {
        src.stop();
        out.disconnect();
      },
    };
  }

  function _buildRain(volume) {
    const out = _ctx.createGain();
    out.gain.value = volume;
    out.connect(_masterGain);

    // Three layered noise bands for a natural rain texture.
    const layers = [
      // High-frequency crackle — individual drops
      { freq: 3800, type: "bandpass", Q: 0.5, level: 0.35, dur: 3 },
      // Mid hiss — steady rainfall body
      { freq: 700, type: "lowpass", Q: 0.8, level: 0.5, dur: 4 },
      // Low rumble — distant thunder presence
      { freq: 200, type: "lowpass", Q: 0.5, level: 0.25, dur: 3 },
    ];

    const sources = layers.map(({ freq, type, Q, level, dur }) => {
      const src = _loopSource(_whiteNoiseBuffer(dur));
      const filter = _ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = Q;
      const g = _ctx.createGain();
      g.gain.value = level;
      src.connect(filter);
      filter.connect(g);
      g.connect(out);
      src.start();
      return src;
    });

    return {
      gainNode: out,
      stop() {
        sources.forEach((s) => {
          s.stop();
        });
        out.disconnect();
      },
    };
  }

  function _buildCafe(volume) {
    const out = _ctx.createGain();
    out.gain.value = volume;
    out.connect(_masterGain);

    // Steady crowd murmur — bandpass around speech fundamentals
    const murmurSrc = _loopSource(_whiteNoiseBuffer(6));
    const murmurFilter = _ctx.createBiquadFilter();
    murmurFilter.type = "bandpass";
    murmurFilter.frequency.value = 700;
    murmurFilter.Q.value = 0.7;
    const murmurGain = _ctx.createGain();
    murmurGain.gain.value = 0.45;
    murmurSrc.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(out);
    murmurSrc.start();

    // Chatter layer — higher frequency speech presence, animated with bursts
    const chatterSrc = _loopSource(_whiteNoiseBuffer(4));
    const chatterFilter = _ctx.createBiquadFilter();
    chatterFilter.type = "bandpass";
    chatterFilter.frequency.value = 1800;
    chatterFilter.Q.value = 1.4;
    const chatterGain = _ctx.createGain();
    chatterGain.gain.value = 0.08;
    chatterSrc.connect(chatterFilter);
    chatterFilter.connect(chatterGain);
    chatterGain.connect(out);
    chatterSrc.start();

    // Low mechanical hum — espresso machine, ventilation
    const humSrc = _loopSource(_whiteNoiseBuffer(3));
    const humFilter = _ctx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.value = 140;
    humFilter.Q.value = 0.5;
    const humGain = _ctx.createGain();
    humGain.gain.value = 0.18;
    humSrc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(out);
    humSrc.start();

    // Burst scheduler: animates chatterGain to mimic conversational rhythm.
    // Bursts are pre-scheduled in 9 s windows to avoid timer drift.
    let _timerId = null;
    let _alive = true;

    function _scheduleBursts() {
      if (!_alive) return;
      const now = _ctx.currentTime;
      let t = 0;
      while (t < 9) {
        const onset = now + t;
        const dur = 0.15 + Math.random() * 0.55;
        const peak = 0.2 + Math.random() * 0.38;
        chatterGain.gain.setValueAtTime(0.06, onset);
        chatterGain.gain.linearRampToValueAtTime(peak, onset + dur * 0.3);
        chatterGain.gain.linearRampToValueAtTime(0.06, onset + dur);
        t += 0.25 + Math.random() * 1.4;
      }
      _timerId = setTimeout(_scheduleBursts, 8500);
    }
    _scheduleBursts();

    return {
      gainNode: out,
      stop() {
        _alive = false;
        clearTimeout(_timerId);
        murmurSrc.stop();
        chatterSrc.stop();
        humSrc.stop();
        out.disconnect();
      },
    };
  }

  // ── Builder dispatch ─────────────────────────────────────────

  const _builders = {
    brown: _buildBrown,
    cafe: _buildCafe,
    rain: _buildRain,
  };

  // ── Public API ───────────────────────────────────────────────

  return {
    get isReady() {
      return _ctx !== null;
    },

    toggle(soundId) {
      _ensureContext();
      _resume();
      const sound = _sounds[soundId];
      if (!sound) return false;

      if (sound.active) {
        sound.instance?.stop();
        sound.instance = null;
        sound.active = false;
      } else {
        sound.instance = _builders[soundId](sound.volume);
        sound.active = true;
      }

      return sound.active;
    },

    setVolume(soundId, value) {
      const sound = _sounds[soundId];
      if (!sound) return;
      sound.volume = value;
      if (sound.instance?.gainNode && _ctx) {
        sound.instance.gainNode.gain.setTargetAtTime(value, _ctx.currentTime, 0.05);
      }
    },

    isActive(soundId) {
      return _sounds[soundId]?.active ?? false;
    },

    getVolume(soundId) {
      return _sounds[soundId]?.volume ?? 0.5;
    },

    stopAll() {
      Object.keys(_sounds).forEach((id) => {
        if (_sounds[id].active) this.toggle(id);
      });
    },

    serialize() {
      return Object.fromEntries(
        Object.entries(_sounds).map(([id, { active, volume }]) => [
          id,
          { active, volume },
        ]),
      );
    },
  };
}
