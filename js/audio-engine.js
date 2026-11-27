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
    this.splitCue = false;
    this.cutCurve = false; // false = smooth blend, true = sharp scratch cut
    this.quantize = true;
    this.autoMixBeats = 16;
    this.waveformWindowSec = 9;
    this.cueMix = 0.5;
    this.phonesVol = 0.85;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];

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
      tempoPercent: 0,     // -8 to +8 (or ±16 in Pro)
      tempoRange: 8,
      keyLock: true,
      slipMode: false,
      slipOriginCtx: 0,
      slipOriginOffset: 0,
      reversePlay: false,
      gridOffset: 0,       // Beatgrid 偏移微调（秒）
      keyShift: 0,         // 半音变调 (-6..+6)
      stemsExpanded: false,
      fxBeatDiv: 0.5,      // 0.25, 0.5, 1
      stems: { vocal: true, drums: true, bass: true, other: true },
      scratchOffsetRate: 0,// 临时搓碟速率叠加
      isScratching: false,
      wasPlayingBeforeScratch: false,
      scratchSource: null,
      scratchDir: 0,       // 1 = forward, -1 = backward, 0 = held still
      reversedBuffer: null,
      volume: 1.0,         // 0..1 通道推子
      gainTrim: 1.0,       // Pro Gain 旋钮 (0.2..1.8)
      eq: { high: 0, mid: 0, low: 0 }, // -12 to +6 dB (0 = center)
      filter: 0,           // -1 (LPF) .. 0 (Off) .. +1 (HPF)
      echo: 0,             // 0 .. 0.85 Echo send
      reverb: 0,           // 0 .. 0.85 Reverb send
      flanger: 0,          // 0 .. 0.85 Flanger wet
      cueMonitor: false,   // 耳机预听开关
      cuePoint: 0,
      hotCues: [null, null, null, null, null, null, null, null],
      loop4: false,
      loopBeats: 4,
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

      // 共享立体声卷积混响脉冲 (1.8s)
      this.reverbConvolver = this.ctx.createConvolver();
      this.reverbConvolver.buffer = this._createReverbImpulse(1.8, 2.4);
      this.reverbConvolver.connect(this.masterGain);

      // 分路耳机监听节点：Master 走左声道，Cue 走右声道
      this.cueBus = this.ctx.createGain();
      this.splitMerger = this.ctx.createChannelMerger(2);
      this.splitMasterMono = this.ctx.createGain();
      this.splitCueMono = this.ctx.createGain();
      this.splitMasterMono.connect(this.splitMerger, 0, 0);
      this.splitCueMono.connect(this.splitMerger, 0, 1);

      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);

      this._initDeckNodes('A');
      this._initDeckNodes('B');
      this._applyCrossfader();
      this._applyRouting();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _initDeckNodes(deckId) {
    const d = this.decks[deckId];
    const ctx = this.ctx;

    // 独立 4 频段分轨滤波链（不与用户手动 EQ 冲突）
    const stemBass = ctx.createBiquadFilter();
    stemBass.type = 'lowshelf';
    stemBass.frequency.value = 240;

    const stemVocal = ctx.createBiquadFilter();
    stemVocal.type = 'peaking';
    stemVocal.frequency.value = 1200;
    stemVocal.Q.value = 0.7;

    const stemDrums = ctx.createBiquadFilter();
    stemDrums.type = 'highshelf';
    stemDrums.frequency.value = 4200;

    const stemOther = ctx.createBiquadFilter();
    stemOther.type = 'peaking';
    stemOther.frequency.value = 500;
    stemOther.Q.value = 0.9;

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

    // Echo 延迟发送链：channelGain -> echoSend -> delay -> feedback -> lp -> masterGain
    const echoSend = ctx.createGain();
    echoSend.gain.value = 0;
    const echoDelay = ctx.createDelay(2.0);
    echoDelay.delayTime.value = 0.375; // ~3/4 beat at 120 BPM
    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = 0.42;
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 2400;

    // Reverb 混响发送链
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0;

    // Flanger 镶边发送链 (LFO 调制短延迟)
    const flangerSend = ctx.createGain();
    flangerSend.gain.value = 0;
    const flangerDelay = ctx.createDelay(0.05);
    flangerDelay.delayTime.value = 0.005;
    const flangerLfo = ctx.createOscillator();
    flangerLfo.type = 'sine';
    flangerLfo.frequency.value = 0.35;
    const flangerDepth = ctx.createGain();
    flangerDepth.gain.value = 0.003;
    flangerLfo.connect(flangerDepth);
    flangerDepth.connect(flangerDelay.delayTime);
    flangerLfo.start();

    // 耳机预听发送链 (推子前信号 -> cueBus)
    const cueSend = ctx.createGain();
    cueSend.gain.value = 0;

    stemBass.connect(stemVocal);
    stemVocal.connect(stemDrums);
    stemDrums.connect(stemOther);
    stemOther.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(sweepFilter);
    sweepFilter.connect(channelGain);
    channelGain.connect(analyser);
    analyser.connect(xfGain);
    xfGain.connect(this.masterGain);

    sweepFilter.connect(cueSend);
    cueSend.connect(this.cueBus);

    channelGain.connect(echoSend);
    echoSend.connect(echoDelay);
    echoDelay.connect(echoTone);
    echoTone.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoTone.connect(this.masterGain);

    channelGain.connect(reverbSend);
    reverbSend.connect(this.reverbConvolver);

    channelGain.connect(flangerSend);
    flangerSend.connect(flangerDelay);
    flangerDelay.connect(xfGain);

    d.nodes = { stemBass, stemVocal, stemDrums, stemOther, eqLow, eqMid, eqHigh, sweepFilter, channelGain, analyser, xfGain, echoSend, echoDelay, reverbSend, flangerSend, cueSend };
  }

  _createReverbImpulse(duration = 1.8, decay = 2.4) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  _applyRouting() {
    if (!this.ctx) return;
    try { this.masterAnalyser.disconnect(this.ctx.destination); } catch (_) {}
    try { this.masterAnalyser.disconnect(this.splitMasterMono); } catch (_) {}
    try { this.cueBus.disconnect(this.splitCueMono); } catch (_) {}
    try { this.splitMerger.disconnect(this.ctx.destination); } catch (_) {}

    if (this.splitCue) {
      this.masterAnalyser.connect(this.splitMasterMono);
      this.cueBus.connect(this.splitCueMono);
      this.splitMerger.connect(this.ctx.destination);
    } else {
      this.masterAnalyser.connect(this.ctx.destination);
    }
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
    d.reversedBuffer = null;
    d.offset = 0;
    d.gridOffset = 0;
    d.keyShift = 0;
    d.stemsExpanded = false;
    d.stems = { vocal: true, drums: true, bass: true, other: true };
    d.cuePoint = 0;
    d.hotCues = Array(8).fill(null);
    d.loop4 = false;
    d.loopBeats = 4;
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
    if (!d.isPlaying || d.isScratching || !this.ctx) return d.offset % dur;

    const elapsed = (this.ctx.currentTime - d.startedAtCtx) * this.getPlaybackRate(deckId);
    if (d.reversePlay) {
      return (((d.offset - elapsed) % dur) + dur) % dur;
    }
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
    const pos = Math.max(0, this.getCurrentTime(deckId) - (d.gridOffset || 0));
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

  pause(deckId, { silentAction = false, instant = false } = {}) {
    const d = this.decks[deckId];
    if (!d.isPlaying) return;
    d.offset = this.getCurrentTime(deckId);
    if (!instant && !silentAction && d.source && this.ctx) {
      // 模拟黑胶唱盘停转时的短促减速「咻~」刹车音（约 200ms 音高下坠）
      const oldSrc = d.source;
      d.source = null;
      this._clearBrakingSource(deckId);
      d.brakingSource = oldSrc;
      const now = this.ctx.currentTime;
      const curRate = Math.max(0.2, this.getPlaybackRate(deckId));
      try {
        oldSrc.playbackRate.cancelScheduledValues(now);
        oldSrc.playbackRate.setValueAtTime(curRate, now);
        oldSrc.playbackRate.exponentialRampToValueAtTime(0.05, now + 0.19);
        oldSrc.stop(now + 0.21);
        oldSrc.onended = () => {
          try { oldSrc.disconnect(); } catch (_) {}
          if (d.brakingSource === oldSrc) d.brakingSource = null;
        };
      } catch (_) {
        try { oldSrc.stop(); oldSrc.disconnect(); } catch (__) {}
      }
    } else {
      this._stopSource(deckId);
    }
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
    this._clearBrakingSource(deckId);
    const d = this.decks[deckId];
    const src = this.ctx.createBufferSource();
    const dur = d.track.duration;
    if (d.reversePlay) {
      src.buffer = this._getReversedBuffer(deckId);
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = dur;
      src.playbackRate.value = this.getPlaybackRate(deckId);
      if (src.detune) src.detune.value = (d.keyShift || 0) * 100;
      src.connect(d.nodes.stemBass);
      src.start(0, Math.max(0, dur - (offsetSec % dur)) % dur);
    } else {
      src.buffer = d.track.buffer;
      src.loop = true;
      if (d.loop4 && d.loopEnd > d.loopStart) {
        src.loopStart = d.loopStart;
        src.loopEnd = d.loopEnd;
      } else {
        src.loopStart = 0;
        src.loopEnd = dur;
      }
      src.playbackRate.value = this.getPlaybackRate(deckId);
      if (src.detune) src.detune.value = (d.keyShift || 0) * 100;
      src.connect(d.nodes.stemBass);
      src.start(0, offsetSec % dur);
    }
    d.source = src;
    d.startedAtCtx = this.ctx.currentTime;
  }

  _clearBrakingSource(deckId) {
    const d = this.decks[deckId];
    if (d.brakingSource) {
      try { d.brakingSource.stop(); } catch (_) {}
      try { d.brakingSource.disconnect(); } catch (_) {}
      d.brakingSource = null;
    }
  }

  _stopSource(deckId) {
    this._clearBrakingSource(deckId);
    const d = this.decks[deckId];
    if (d.source) {
      try { d.source.stop(); } catch (_) {}
      d.source.disconnect();
      d.source = null;
    }
  }

  setTempo(deckId, percent, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    const limit = d.tempoRange || 8;
    const clamped = Math.max(-limit, Math.min(limit, percent));
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
    const x = (this.crossfader + 1) / 2;
    let gainA, gainB;
    if (this.cutCurve) {
      // 搓碟锐利 Cut 曲线：极窄边缘切入
      gainA = x > 0.92 ? (1 - x) / 0.08 : 1;
      gainB = x < 0.08 ? x / 0.08 : 1;
    } else {
      // 等功率平滑混音曲线
      gainA = Math.cos(x * Math.PI * 0.5);
      gainB = Math.sin(x * Math.PI * 0.5);
    }
    this.decks.A.nodes.xfGain.gain.setTargetAtTime(gainA, this.ctx.currentTime, 0.01);
    this.decks.B.nodes.xfGain.gain.setTargetAtTime(gainB, this.ctx.currentTime, 0.01);
  }

  setCutCurve(enabled) {
    this.cutCurve = Boolean(enabled);
    if (this.ctx) this._applyCrossfader();
    this._notify();
  }

  setGainTrim(deckId, val) {
    const d = this.decks[deckId];
    d.gainTrim = Math.max(0.2, Math.min(1.8, val));
    if (d.nodes && this.ctx) {
      d.nodes.channelGain.gain.setTargetAtTime(d.volume * d.gainTrim, this.ctx.currentTime, 0.01);
    }
    this._notify();
  }

  setChannelVolume(deckId, val, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    d.volume = Math.max(0, Math.min(1, val));
    if (d.nodes) {
      d.nodes.channelGain.gain.setTargetAtTime(d.volume * d.gainTrim, this.ctx.currentTime, 0.01);
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

  setEcho(deckId, amount, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    const clamped = Math.max(0, Math.min(0.85, amount));
    d.echo = clamped;
    if (d.nodes && this.ctx) {
      if (d.track) {
        const beatDur = 60 / this.getEffectiveBPM(deckId);
        d.nodes.echoDelay.delayTime.setTargetAtTime(beatDur * (d.fxBeatDiv || 0.5), this.ctx.currentTime, 0.02);
      }
      d.nodes.echoSend.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'ECHO', deck: deckId, value: clamped });
    }
  }

  toggleTempoRange(deckId) {
    const d = this.decks[deckId];
    d.tempoRange = d.tempoRange === 8 ? 16 : 8;
    this.setTempo(deckId, d.tempoPercent, { silentAction: true });
    this._notify();
  }

  cycleFxBeatDiv(deckId) {
    const d = this.decks[deckId];
    const seq = [0.25, 0.5, 1];
    d.fxBeatDiv = seq[(seq.indexOf(d.fxBeatDiv) + 1) % seq.length];
    if (d.echo > 0) this.setEcho(deckId, d.echo, { silentAction: true });
    this._notify();
  }

  scaleTrackBpm(deckId, factor) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.track = { ...d.track, bpm: Math.max(50, Math.min(220, d.track.bpm * factor)) };
    this._notify();
  }

  toggleStem(deckId, stemName) {
    const d = this.decks[deckId];
    d.stems[stemName] = !d.stems[stemName];
    if (d.nodes && this.ctx) {
      d.nodes.stemBass.gain.setTargetAtTime(d.stems.bass ? 0 : -26, this.ctx.currentTime, 0.02);
      d.nodes.stemVocal.gain.setTargetAtTime(d.stems.vocal ? 0 : -22, this.ctx.currentTime, 0.02);
      d.nodes.stemDrums.gain.setTargetAtTime(d.stems.drums ? 0 : -22, this.ctx.currentTime, 0.02);
      d.nodes.stemOther.gain.setTargetAtTime(d.stems.other ? 0 : -18, this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  toggleReverse(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return;
    const cur = this.getCurrentTime(deckId);
    d.reversePlay = !d.reversePlay;
    d.offset = cur;
    if (d.isPlaying) {
      this._stopSource(deckId);
      this._startSource(deckId, d.offset);
    }
    this._notify();
  }

  setCueMix(val) {
    this.cueMix = Math.max(0, Math.min(1, val));
    if (this.splitCueMono && this.ctx) {
      this.splitCueMono.gain.setTargetAtTime(this.phonesVol * (0.2 + this.cueMix * 0.8), this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  setPhonesVol(val) {
    this.phonesVol = Math.max(0, Math.min(1, val));
    if (this.splitCueMono && this.ctx) {
      this.splitCueMono.gain.setTargetAtTime(this.phonesVol * (0.2 + this.cueMix * 0.8), this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  zoomWaveform(factor) {
    this.waveformWindowSec = Math.max(1.5, Math.min(24, this.waveformWindowSec * factor));
    this._notify();
    this._emitAction({ type: 'WAVE_ZOOM', value: this.waveformWindowSec });
  }

  setReverb(deckId, amount) {
    const d = this.decks[deckId];
    d.reverb = Math.max(0, Math.min(0.85, amount));
    if (d.nodes && this.ctx) {
      d.nodes.reverbSend.gain.setTargetAtTime(d.reverb, this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  setFlanger(deckId, amount) {
    const d = this.decks[deckId];
    d.flanger = Math.max(0, Math.min(0.85, amount));
    if (d.nodes && this.ctx) {
      d.nodes.flangerSend.gain.setTargetAtTime(d.flanger, this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  toggleCueMonitor(deckId) {
    this.ensureContext();
    const d = this.decks[deckId];
    d.cueMonitor = !d.cueMonitor;
    if (d.nodes) {
      d.nodes.cueSend.gain.setTargetAtTime(d.cueMonitor ? 1 : 0, this.ctx.currentTime, 0.015);
    }
    this._notify();
  }

  setSplitCue(enabled) {
    this.ensureContext();
    this.splitCue = Boolean(enabled);
    this._applyRouting();
    this._notify();
  }

  halveLoop(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.loopBeats = Math.max(0.5, d.loopBeats / 2);
    if (d.loop4) {
      const beatDur = 60 / d.track.bpm;
      d.loopEnd = Math.min(d.track.duration, d.loopStart + beatDur * d.loopBeats);
      if (d.isPlaying) {
        d.offset = this.getCurrentTime(deckId);
        this._stopSource(deckId);
        this._startSource(deckId, d.offset);
      }
    }
    this._notify();
  }

  doubleLoop(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.loopBeats = Math.min(16, d.loopBeats * 2);
    if (d.loop4) {
      const beatDur = 60 / d.track.bpm;
      d.loopEnd = Math.min(d.track.duration, d.loopStart + beatDur * d.loopBeats);
      if (d.isPlaying) {
        d.offset = this.getCurrentTime(deckId);
        this._stopSource(deckId);
        this._startSource(deckId, d.offset);
      }
    }
    this._notify();
  }

  beatJump(deckId, beats) {
    const d = this.decks[deckId];
    if (!d.track) return;
    const beatDur = 60 / d.track.bpm;
    this.seek(deckId, this.getCurrentTime(deckId) + beats * beatDur);
  }

  shiftGrid(deckId, deltaSec) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.gridOffset = Math.max(-0.5, Math.min(0.5, (d.gridOffset || 0) + deltaSec));
    this._notify();
  }

  nudgeTrackBpm(deckId, deltaBpm) {
    const d = this.decks[deckId];
    if (!d.track) return;
    const nextBpm = Math.round(Math.max(60, Math.min(200, d.track.bpm + deltaBpm)) * 10) / 10;
    d.track = { ...d.track, bpm: nextBpm };
    this._notify();
  }

  setKeyShift(deckId, semitones) {
    const d = this.decks[deckId];
    const clamped = Math.max(-6, Math.min(6, Math.round(semitones)));
    d.keyShift = clamped;
    if (d.source && d.source.detune && this.ctx) {
      d.source.detune.setTargetAtTime(clamped * 100, this.ctx.currentTime, 0.02);
    }
    this._notify();
  }

  matchKey(deckId) {
    const d = this.decks[deckId];
    const other = this.decks[deckId === 'A' ? 'B' : 'A'];
    if (!d.track || !other.track) return;
    const parseKey = (k) => {
      const m = String(k || '').match(/^(\d{1,2})([AB])$/i);
      if (!m) return null;
      return (Number(m[1]) - 1) * 7 % 12; // Camelot wheel steps (fifths) to chromatic pitch class
    };
    const p1 = parseKey(d.track.key);
    const p2 = parseKey(other.track.key);
    if (p1 === null || p2 === null) {
      this.setKeyShift(deckId, 0);
      return;
    }
    let diff = ((p2 - p1) % 12 + 12) % 12;
    if (diff > 6) diff -= 12;
    this.setKeyShift(deckId, diff);
  }

  toggleStemsSplit(deckId) {
    const d = this.decks[deckId];
    d.stemsExpanded = !d.stemsExpanded;
    if (!d.stemsExpanded) {
      d.stems = { vocal: true, drums: true, bass: true, other: true };
      if (d.nodes && this.ctx) {
        const now = this.ctx.currentTime;
        d.nodes.stemBass.gain.setTargetAtTime(0, now, 0.025);
        d.nodes.stemVocal.gain.setTargetAtTime(0, now, 0.025);
        d.nodes.stemDrums.gain.setTargetAtTime(0, now, 0.025);
        d.nodes.stemOther.gain.setTargetAtTime(0, now, 0.025);
      }
    }
    this._notify();
  }

  vinylBrake(deckId) {
    const d = this.decks[deckId];
    if (!d.track || !d.isPlaying) return;
    const steps = 8;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      this.setScratchDelta(deckId, -0.7 * (i / steps));
      if (i >= steps) {
        clearInterval(iv);
        this.pause(deckId, { silentAction: true });
        this.setScratchDelta(deckId, 0);
        this._emitAction({ type: 'VINYL_TRICK', deck: deckId, trick: 'brake' });
      }
    }, 55);
  }

  vinylSpinback(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return;
    this.triggerSampler('rewind');
    this.seek(deckId, Math.max(0, this.getCurrentTime(deckId) - 2.0), { silentAction: true });
    this._emitAction({ type: 'VINYL_TRICK', deck: deckId, trick: 'spinback' });
  }

  toggleRecording() {
    this.ensureContext();
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this._notify();
      return;
    }
    if (typeof MediaRecorder === 'undefined') return;
    const dest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(dest);
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(dest.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      try { this.masterGain.disconnect(dest); } catch (_) {}
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spinlab-mix-${Date.now()}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    this.mediaRecorder.start();
    this.isRecording = true;
    this._notify();
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
      let t = this.getCurrentTime(deckId);
      if (this.quantize) {
        const beatDur = 60 / d.track.bpm;
        t = (Math.round(t / beatDur) * beatDur) % d.track.duration;
      }
      d.hotCues[index] = t;
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'HOT_CUE', deck: deckId, index });
    }
  }

  clearHotCue(deckId, index) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.hotCues[index] = null;
    this._notify();
  }

  toggleLoop4(deckId, { silentAction = false } = {}) {
    const d = this.decks[deckId];
    if (!d.track) return;
    d.loop4 = !d.loop4;
    if (d.loop4) {
      const beatDur = 60 / d.track.bpm;
      const cur = this.getCurrentTime(deckId);
      d.slipOriginCtx = this.ctx ? this.ctx.currentTime : 0;
      d.slipOriginOffset = cur;
      const startBeat = this.quantize ? Math.round(cur / beatDur) : Math.floor(cur / beatDur);
      d.loopStart = Math.max(0, startBeat * beatDur);
      d.loopEnd = Math.min(d.track.duration, d.loopStart + beatDur * d.loopBeats);
      if (d.isPlaying) {
        d.offset = cur;
        this._stopSource(deckId);
        this._startSource(deckId, d.offset);
      }
    } else if (d.isPlaying) {
      let nextPos = this.getCurrentTime(deckId);
      if (d.slipMode && this.ctx) {
        const slipElapsed = (this.ctx.currentTime - d.slipOriginCtx) * this.getPlaybackRate(deckId);
        nextPos = (d.slipOriginOffset + slipElapsed) % d.track.duration;
      }
      d.offset = nextPos;
      this._stopSource(deckId);
      this._startSource(deckId, d.offset);
    }
    this._notify();
    if (!silentAction) {
      this._emitAction({ type: 'LOOP4', deck: deckId, value: d.loop4 });
    }
  }

  _getReversedBuffer(deckId) {
    const d = this.decks[deckId];
    if (!d.track) return null;
    if (d.reversedBuffer) return d.reversedBuffer;
    const src = d.track.buffer;
    const rev = this.ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
    for (let ch = 0; ch < src.numberOfChannels; ch++) {
      const sData = src.getChannelData(ch);
      const rData = rev.getChannelData(ch);
      for (let i = 0, n = sData.length; i < n; i++) {
        rData[i] = sData[n - 1 - i];
      }
    }
    d.reversedBuffer = rev;
    return rev;
  }

  _stopScratchSource(deckId) {
    const d = this.decks[deckId];
    if (d.scratchSource) {
      try { d.scratchSource.stop(); } catch (_) {}
      try { d.scratchSource.disconnect(); } catch (_) {}
      d.scratchSource = null;
    }
    d.scratchDir = 0;
  }

  beginScratch(deckId) {
    this.ensureContext();
    const d = this.decks[deckId];
    if (!d.track) return;
    d.isScratching = true;
    d.wasPlayingBeforeScratch = d.isPlaying;
    if (d.isPlaying) {
      d.offset = this.getCurrentTime(deckId);
      d.slipOriginCtx = this.ctx.currentTime;
      d.slipOriginOffset = d.offset;
      this._stopSource(deckId);
    }
    this._stopScratchSource(deckId);
  }

  moveScratch(deckId, deltaSec, speedRatio) {
    const d = this.decks[deckId];
    if (!d.track || !d.isScratching) return;
    const dur = d.track.duration;
    d.offset = (((d.offset + deltaSec) % dur) + dur) % dur;

    const absRate = Math.min(3.5, Math.abs(speedRatio));
    if (absRate < 0.08) {
      this._stopScratchSource(deckId);
      return;
    }

    const dir = speedRatio >= 0 ? 1 : -1;
    if (d.scratchSource && d.scratchDir === dir) {
      d.scratchSource.playbackRate.setTargetAtTime(absRate, this.ctx.currentTime, 0.012);
    } else {
      this._stopScratchSource(deckId);
      const buf = dir > 0 ? d.track.buffer : this._getReversedBuffer(deckId);
      const startOffset = dir > 0 ? d.offset : Math.max(0, dur - d.offset);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = absRate;
      src.connect(d.nodes.eqLow);
      src.start(0, startOffset % dur);
      d.scratchSource = src;
      d.scratchDir = dir;
    }
    this._emitAction({ type: 'SCRATCH', deck: deckId, value: speedRatio });
  }

  endScratch(deckId) {
    const d = this.decks[deckId];
    if (!d.isScratching) return;
    d.isScratching = false;
    this._stopScratchSource(deckId);
    if (d.wasPlayingBeforeScratch && d.track) {
      if (d.slipMode && this.ctx) {
        const slipElapsed = (this.ctx.currentTime - d.slipOriginCtx) * this.getPlaybackRate(deckId);
        d.offset = (d.slipOriginOffset + slipElapsed) % d.track.duration;
      }
      this._startSource(deckId, d.offset);
      d.isPlaying = true;
    }
    this._notify();
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
    if (Math.abs(rateDelta) >= 0.15) {
      this._emitAction({ type: 'SCRATCH', deck: deckId, value: rateDelta });
    }
  }

  triggerSampler(padId) {
    this.ensureContext();
    playSamplerPad(this.ctx, this.masterGain, padId);
    this._emitAction({ type: 'SAMPLER', padId });
  }

  async connectLiveInput(deckId) {
    this.ensureContext();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器不支持麦克风/实时音频输入');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const d = this.decks[deckId];
    if (d.liveSource) {
      try { d.liveSource.disconnect(); } catch (_) {}
    }
    const src = this.ctx.createMediaStreamSource(stream);
    src.connect(d.nodes.eqLow);
    d.liveSource = src;
    d.track = {
      id: `live-${deckId}`,
      title: '实时音频输入 (Mic / Line-in)',
      genre: 'Live Input',
      bpm: 120,
      key: '—',
      energy: 8,
      duration: 60,
      peaks: new Float32Array(1200).fill(0.45)
    };
    this._notify();
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
