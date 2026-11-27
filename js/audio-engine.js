/**
 * Web Audio API 双唱机混音引擎
 * 支持双轨独立调速、等功率 Crossfader、三段 EQ、扫频 Filter、Cue、Loop 4 与电平表
 */

import { getRenderedTrack, playSamplerPad } from './synth-tracks.js';

export class DJAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterAnalyser = null;

    this.crossfader = -1; // -1 = A, 0 = Center, +1 = B
    this.masterVolume = 0.85;

    this.decks = {
      A: this._createDeckState('A'),
      B: this._createDeckState('B')
    };

    this.listeners = new Set();
    this.actionListeners = new Set();
  }

  _createDeckState(id) {
    return {
      id,
      track: null,
      isPlaying: false,
      source: null,
      offset: 0,           // 当前播放偏移（秒）
      startedAtCtx: 0,     // 上次 start 的 AudioContext.currentTime
      tempoPercent: 0,     // -8 to +8 (%)
      scratchOffsetRate: 0,// 临时搓碟速率叠加
      volume: 1.0,         // 0..1 通道推子
      eq: { high: 0, mid: 0, low: 0 }, // -12 to +6 dB (0 = center)
      filter: 0,           // -1 (LPF) .. 0 (Off) .. +1 (HPF)
      cuePoint: 0,
      hotCues: [null, null, null, null],
      loop4: false,
      loopStart: 0,
      loopEnd: 0,
      nodes: null
    };
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;

      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 256;

      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);

      this._initDeckNodes('A');
      this._initDeckNodes('B');
      this._applyCrossfader();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _initDeckNodes(deckId) {
    const d = this.decks[deckId];
    const ctx = this.ctx;

    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 320;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 0.8;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3200;

    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = 'allpass';
    sweepFilter.frequency.value = 1000;

    const channelGain = ctx.createGain();
    channelGain.gain.value = d.volume;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;

    const xfGain = ctx.createGain();

    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(sweepFilter);
    sweepFilter.connect(channelGain);
    channelGain.connect(analyser);
    analyser.connect(xfGain);
    xfGain.connect(this.masterGain);

    d.nodes = { eqLow, eqMid, eqHigh, sweepFilter, channelGain, analyser, xfGain };
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onAction(fn) {
    this.actionListeners.add(fn);
    return () => this.actionListeners.delete(fn);
  }

  _notify() {
    for (const fn of this.listeners) fn(this);
  }

  _emitAction(action) {
    for (const fn of this.actionListeners) fn(action, this);
  }

  async loadTrack(deckId, trackId, { silentAction = false } = {}) {
    this.ensureContext();
    const d = this.decks[deckId];
    if (d.isPlaying) {
      this.pause(deckId, { silentAction: true });
    }
    const track = await getRenderedTrack(trackId);
    d.track = track;
    d.offset = 0;
    d.cuePoint = 0;
    d.hotCues = [0, track.duration * 0.25, track.duration * 0.5, track.duration * 0.75];
    d.loop4 = false;
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'LOAD_TRACK', deck: deckId, trackId });
    }
    return track;
  }

  getPlaybackRate(deckId) {
    const d = this.decks[deckId];
    return Math.max(0.25, 1 + d.tempoPercent / 100 + d.scratchOffsetRate);
  }

  getEffectiveBPM(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return 0;
    return d.track.bpm * (1 + d.tempoPercent / 100);
  }

  getCurrentTime(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return 0;
    const dur = d.track.duration;
    if (!d.isPlaying || !this.ctx) return d.offset % dur;

    const elapsed = (this.ctx.currentTime - d.startedAtCtx) * this.getPlaybackRate(deckId);
    if (d.loop4 && d.loopEnd > d.loopStart) {
      const loopLen = d.loopEnd - d.loopStart;
      const raw = d.offset + elapsed;
      if (raw >= d.loopStart) {
        return d.loopStart + ((raw - d.loopStart) % loopLen);
      }
      return raw % dur;
    }
    return (d.offset + elapsed) % dur;
  }

  getBeatInfo(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return { beatInBar: 0, barInPhrase: 0, totalBeats: 0, phase: 0 };
    const pos = this.getCurrentTime(deckId);
    const beatDur = 60 / d.track.bpm;
    const totalBeats = pos / beatDur;
    const beatIndex = Math.floor(totalBeats);
    return {
      beatInBar: (beatIndex % 4) + 1,
      barInPhrase: (Math.floor(beatIndex / 4) % 8) + 1,
      totalBeats,
      phase: totalBeats - beatIndex
    };
  }

  play(deckId, { silentAction = false } = {}) {
    this.ensureContext();
    const d = this.decks[deckId];
    if (!d.track || d.isPlaying) return;

    this._startSource(deckId, d.offset);
    d.isPlaying = true;
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'PLAY', deck: deckId });
    }
  }

  pause(deckId, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.isPlaying) return;
    d.offset = this.getCurrentTime(deckId);
    this._stopSource(deckId);
    d.isPlaying = false;
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'PAUSE', deck: deckId });
    }
  }

  togglePlay(deckId) {
    const d = this.decks[deckId];
    if (d.isPlaying) this.pause(deckId);
    else this.play(deckId);
  }

  seek(deckId, seconds, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.track) return;
    const dur = d.track.duration;
    d.offset = ((seconds % dur) + dur) % dur;
    if (d.isPlaying) {
      this._stopSource(deckId);
      this._startSource(deckId, d.offset);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'SEEK', deck: deckId, value: d.offset });
    }
  }

  _startSource(deckId, offsetSec) {
    const d = this.decks[deckId];
    const src = this.ctx.createBufferSource();
    src.buffer = d.track.buffer;
    src.loop = true;
    if (d.loop4 && d.loopEnd > d.loopStart) {
      src.loopStart = d.loopStart;
      src.loopEnd = d.loopEnd;
    } else {
      src.loopStart = 0;
      src.loopEnd = d.track.duration;
    }
    src.playbackRate.value = this.getPlaybackRate(deckId);
    src.connect(d.nodes.eqLow);
    src.start(0, offsetSec % d.track.duration);
    d.source = src;
    d.startedAtCtx = this.ctx.currentTime;
  }

  _stopSource(deckId) {
    const d = this.decks[deckId];
    if (d.source) {
      try { d.source.stop(); } catch (_) {}
      d.source.disconnect();
      d.source = null;
    }
  }

  setTempo(deckId, percent, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    const clamped = Math.max(-8, Math.min(8, percent));
    if (d.isPlaying) {
      d.offset = this.getCurrentTime(deckId);
      d.startedAtCtx = this.ctx.currentTime;
    }
    d.tempoPercent = clamped;
    if (d.source) {
      d.source.playbackRate.setTargetAtTime(this.getPlaybackRate(deckId), this.ctx.currentTime, 0.015);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'TEMPO', deck: deckId, value: clamped });
    }
  }

  syncDeck(deckId, { silentAction = false } = {}) {
    const otherId = deckId === 'A' ? 'B' : 'A';
    const target = this.decks[deckId];
    const other = this.decks[otherId];
    if (!target.track || !other.track) return;

    const otherBpm = this.getEffectiveBPM(otherId);
    const neededPercent = ((otherBpm / target.track.bpm) - 1) * 100;
    this.setTempo(deckId, neededPercent, { silentAction: true });

    // 相位对齐到另一盘当前拍内位置
    const otherBeat = this.getBeatInfo(otherId);
    const beatDur = 60 / target.track.bpm;
    const currentPos = this.getCurrentTime(deckId);
    const currentBeatIdx = Math.floor(currentPos / beatDur);
    const alignedPos = (currentBeatIdx + otherBeat.phase) * beatDur;
    this.seek(deckId, alignedPos, { silentAction: true });

    if (!silentAction) {
      this._emitAction({ type: 'SYNC', deck: deckId });
    }
  }

  setCrossfader(val, { silentAction = false } = {}) {
    this.crossfader = Math.max(-1, Math.min(1, val));
    if (this.ctx) this._applyCrossfader();
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'CROSSFADER', value: this.crossfader });
    }
  }

  _applyCrossfader() {
    // 等功率曲线：x in [0, 1]
    const x = (this.crossfader + 1) / 2;
    const gainA = Math.cos(x * Math.PI * 0.5);
    const gainB = Math.sin(x * Math.PI * 0.5);
    this.decks.A.nodes.xfGain.gain.setTargetAtTime(gainA, this.ctx.currentTime, 0.01);
    this.decks.B.nodes.xfGain.gain.setTargetAtTime(gainB, this.ctx.currentTime, 0.01);
  }

  setChannelVolume(deckId, val, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    d.volume = Math.max(0, Math.min(1, val));
    if (d.nodes) {
      d.nodes.channelGain.gain.setTargetAtTime(d.volume, this.ctx.currentTime, 0.01);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'VOLUME', deck: deckId, value: d.volume });
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.01);
    }
    this._notify();
  }

  setEQ(deckId, band, db, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    const clamped = Math.max(-24, Math.min(6, db));
    d.eq[band] = clamped;
    if (d.nodes) {
      const node = band === 'low' ? d.nodes.eqLow : band === 'mid' ? d.nodes.eqMid : d.nodes.eqHigh;
      node.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.015);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'EQ', deck: deckId, band, value: clamped });
    }
  }

  setFilter(deckId, val, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    const clamped = Math.max(-1, Math.min(1, val));
    d.filter = clamped;
    if (d.nodes) {
      const f = d.nodes.sweepFilter;
      if (Math.abs(clamped) < 0.05) {
        f.type = 'allpass';
      } else if (clamped < 0) {
        f.type = 'lowpass';
        const freq = 220 * Math.pow(80, 1 + clamped);
        f.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
      } else {
        f.type = 'highpass';
        const freq = 60 * Math.pow(75, clamped);
        f.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
      }
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'FILTER', deck: deckId, value: clamped });
    }
  }

  cueAction(deckId, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.track) return;
    if (d.isPlaying) {
      this.pause(deckId, { silentAction: true });
      this.seek(deckId, d.cuePoint, { silentAction: true });
    } else {
      d.cuePoint = this.getCurrentTime(deckId);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'CUE', deck: deckId, value: d.cuePoint });
    }
  }

  triggerHotCue(deckId, index, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.track) return;
    const pos = d.hotCues[index];
    if (pos !== null && pos !== undefined) {
      this.seek(deckId, pos, { silentAction: true });
      if (!d.isPlaying) this.play(deckId, { silentAction: true });
    } else {
      d.hotCues[index] = this.getCurrentTime(deckId);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'HOT_CUE', deck: deckId, index });
    }
  }

  toggleLoop4(deckId, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.loop4 = !d.loop4;
    if (d.loop4) {
      const beatDur = 60 / d.track.bpm;
      const cur = this.getCurrentTime(deckId);
      const startBeat = Math.floor(cur / beatDur);
      d.loopStart = startBeat * beatDur;
      d.loopEnd = Math.min(d.track.duration, d.loopStart + beatDur * 4);
      if (d.isPlaying) {
        d.offset = cur;
        this._stopSource(deckId);
        this._startSource(deckId, d.offset);
      }
    } else if (d.isPlaying) {
      d.offset = this.getCurrentTime(deckId);
      this._stopSource(deckId);
      this._startSource(deckId, d.offset);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'LOOP4', deck: deckId, value: d.loop4 });
    }
  }

  setScratchDelta(deckId, rateDelta) {
    const d = this.decks[deckId];
    if (d.isPlaying && this.ctx) {
      d.offset = this.getCurrentTime(deckId);
      d.startedAtCtx = this.ctx.currentTime;
    }
    d.scratchOffsetRate = rateDelta;
    if (d.source && this.ctx) {
      d.source.playbackRate.setTargetAtTime(this.getPlaybackRate(deckId), this.ctx.currentTime, 0.01);
    }
  }

  triggerSampler(padId) {
    this.ensureContext();
    playSamplerPad(this.ctx, this.masterGain, padId);
    this._emitAction({ type: 'SAMPLER', padId });
  }

  getLevel(deckId) {
    const d = this.decks[deckId];
    if (!d.nodes || !d.isPlaying) return 0;
    const arr = new Uint8Array(d.nodes.analyser.frequencyBinCount);
    d.nodes.analyser.getByteTimeDomainData(arr);
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = Math.abs(arr[i] - 128) / 128;
      if (v > max) max = v;
    }
    return Math.min(1, max * 1.6);
  }
}
