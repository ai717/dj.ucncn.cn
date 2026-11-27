/**
 * 零版权内置合成舞曲与采样音效生成器
 * 使用 OfflineAudioContext 在浏览器本地毫秒级渲染高质量循环音频与真实波形峰值
 */

export const TRACK_CATALOG = [
  {
    id: 'sunrise-house',
    title: '晨曦 House (Sunrise)',
    genre: 'Piano House',
    bpm: 122,
    key: '8A · Am',
    energy: 8,
    bars: 8, // 32 beats
    color: '#38bdf8'
  },
  {
    id: 'night-shift',
    title: '夜班 Techno (Night Shift)',
    genre: 'Techno',
    bpm: 126,
    key: '8A · Am',
    energy: 9,
    bars: 8,
    color: '#fb923c'
  },
  {
    id: 'golden-hour',
    title: '落日 Disco (Golden Hour)',
    genre: 'Nu-Disco',
    bpm: 120,
    key: '8B · C',
    energy: 8,
    bars: 8,
    color: '#facc15'
  },
  {
    id: 'low-tide',
    title: '低潮 Boom-Bap (Low Tide)',
    genre: 'Boom-Bap',
    bpm: 92,
    key: '7A · Dm',
    energy: 6,
    bars: 8,
    color: '#a78bfa'
  }
];

const bufferCache = new Map();

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createNoiseBuffer(ctx, duration = 0.5) {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function triggerKick(ctx, dest, time, punch = 150, decay = 0.28, gainVal = 0.85) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(punch, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);

  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + decay + 0.02);
}

function triggerSnare(ctx, dest, noiseBuf, time, gainVal = 0.38) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.Q.value = 0.9;

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(gainVal, time);
  nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.18);

  const osc = ctx.createOscillator();
  const oGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(195, time);
  osc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
  oGain.gain.setValueAtTime(gainVal * 0.7, time);
  oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(oGain);
  oGain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.12);
}

function triggerHat(ctx, dest, noiseBuf, time, open = false, gainVal = 0.16) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(6500, time);

  const gain = ctx.createGain();
  const dur = open ? 0.18 : 0.045;
  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + dur + 0.01);
}

function triggerBass(ctx, dest, time, midi, dur, type = 'sawtooth', cutoff = 520, gainVal = 0.34) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(midiToFreq(midi), time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff * 1.6, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.55), time + dur * 0.85);
  filter.Q.value = 3.2;

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(gainVal, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function triggerChord(ctx, dest, time, midis, dur, type = 'triangle', cutoff = 2200, gainVal = 0.11) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, time);
  filter.frequency.exponentialRampToValueAtTime(cutoff * 0.45, time + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(gainVal, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  filter.connect(gain);
  gain.connect(dest);

  for (const m of midis) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(m), time);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }
}

export function computePeaks(buffer, bins = 480) {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / bins));
  const peaks = new Float32Array(bins);
  for (let i = 0; i < bins; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(data.length, start + step);
    for (let j = start; j < end; j++) {
      const v = Math.abs(data[j]);
      if (v > max) max = v;
    }
    peaks[i] = Math.min(1, max);
  }
  return peaks;
}

export async function registerLocalAudioFile(ctx, file) {
  const arrayBuf = await file.arrayBuffer();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const meta = {
    id,
    title: file.name.replace(/\.[^.]+$/, ''),
    genre: '本地音频',
    bpm: 124,
    key: '—',
    energy: 8,
    bars: Math.max(4, Math.round(audioBuf.duration / 2)),
    color: '#22c55e'
  };
  const peaks = computePeaks(audioBuf, 480);
  const rendered = { ...meta, buffer: audioBuf, peaks, duration: audioBuf.duration };
  bufferCache.set(id, rendered);
  TRACK_CATALOG.unshift(meta);
  return meta;
}

export async function getRenderedTrack(trackId) {
  if (bufferCache.has(trackId)) {
    return bufferCache.get(trackId);
  }

  const meta = TRACK_CATALOG.find((t) => t.id === trackId) || TRACK_CATALOG[0];
  const sampleRate = 44100;
  const beatDur = 60 / meta.bpm;
  const totalBeats = meta.bars * 4;
  const totalDur = totalBeats * beatDur;
  const length = Math.ceil(totalDur * sampleRate);

  const offline = new OfflineAudioContext(2, length, sampleRate);
  const master = offline.createDynamicsCompressor();
  master.threshold.value = -10;
  master.ratio.value = 4;
  master.connect(offline.destination);

  const noiseBuf = createNoiseBuffer(offline, 0.4);

  for (let b = 0; b < totalBeats; b++) {
    const t = b * beatDur;
    const bar = Math.floor(b / 4);
    const beatInBar = b % 4;

    if (meta.id === 'sunrise-house') {
      triggerKick(offline, master, t, 145, 0.25, 0.85);
      if (beatInBar === 1 || beatInBar === 3) {
        triggerSnare(offline, master, noiseBuf, t, 0.28);
      }
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.14);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.25, false, 0.06);

      const bassRoot = bar < 4 ? 33 : bar < 6 ? 29 : 31; // A1 -> F1 -> G1
      triggerBass(offline, master, t + beatDur * 0.5, bassRoot, beatDur * 0.42, 'sawtooth', 480, 0.32);
      if (beatInBar === 0 || beatInBar === 2) {
        const chord = bar < 4 ? [57, 60, 64, 67] : bar < 6 ? [53, 57, 60, 64] : [55, 59, 62, 67];
        triggerChord(offline, master, t, chord, beatDur * 0.85, 'triangle', 2400, 0.1);
      }
    } else if (meta.id === 'night-shift') {
      triggerKick(offline, master, t, 170, 0.3, 0.95);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.18);
      if (bar >= 4 && (beatInBar === 1 || beatInBar === 3)) {
        triggerSnare(offline, master, noiseBuf, t, 0.34);
      }
      // 16th rolling techno bass
      for (let s = 1; s < 4; s++) {
        triggerBass(offline, master, t + beatDur * (s * 0.25), 33, beatDur * 0.2, 'sawtooth', 420 + s * 90, 0.26);
      }
      if (beatInBar === 0 && bar % 2 === 0) {
        triggerChord(offline, master, t, [57, 64, 69], beatDur * 1.4, 'sawtooth', 1400, 0.07);
      }
    } else if (meta.id === 'golden-hour') {
      triggerKick(offline, master, t, 138, 0.24, 0.82);
      if (beatInBar === 1 || beatInBar === 3) {
        triggerSnare(offline, master, noiseBuf, t, 0.32);
      }
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.13);
      const root = bar < 4 ? 36 : 41; // C2 -> F2
      triggerBass(offline, master, t, root, beatDur * 0.35, 'square', 600, 0.24);
      triggerBass(offline, master, t + beatDur * 0.5, root + 12, beatDur * 0.35, 'square', 720, 0.22);
      if (beatInBar === 1 || beatInBar === 3) {
        const chord = bar < 4 ? [60, 64, 67, 71] : [65, 69, 72, 76];
        triggerChord(offline, master, t + beatDur * 0.25, chord, beatDur * 0.45, 'triangle', 2800, 0.11);
      }
    } else {
      // low-tide Boom-Bap (92 BPM)
      if (beatInBar === 0 || beatInBar === 2) {
        triggerKick(offline, master, t, 130, 0.28, 0.88);
      }
      if (beatInBar === 2) {
        triggerKick(offline, master, t + beatDur * 0.75, 125, 0.22, 0.68);
      }
      if (beatInBar === 1 || beatInBar === 3) {
        triggerSnare(offline, master, noiseBuf, t, 0.42);
      }
      triggerHat(offline, master, noiseBuf, t, false, 0.08);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.1);
      const root = bar < 4 ? 38 : 33; // D2 -> A1
      triggerBass(offline, master, t, root, beatDur * 0.7, 'sine', 340, 0.42);
      if (beatInBar === 0) {
        const chord = bar < 4 ? [62, 65, 69, 72] : [57, 60, 64, 67];
        triggerChord(offline, master, t, chord, beatDur * 1.8, 'sine', 1600, 0.13);
      }
    }
  }

  const buffer = await offline.startRendering();
  const peaks = computePeaks(buffer, 480);
  const result = { ...meta, buffer, peaks, duration: buffer.duration };
  bufferCache.set(trackId, result);
  return result;
}

/**
 * 采样垫一次性音效（空气喇叭 / 倒带 / 激光 / 上升）
 */
export function playSamplerPad(ctx, dest, padId) {
  const now = ctx.currentTime;
  if (padId === 'airhorn') {
    const freqs = [392, 493.88, 587.33];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.02);
    g.gain.setValueAtTime(0.22, now + 0.22);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    g.connect(dest);
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(g);
      osc.start(now);
      osc.stop(now + 0.58);
    }
  } else if (padId === 'laser') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.26);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (padId === 'rewind') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.42);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.47);
  } else {
    // riser
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
    g.gain.setValueAtTime(0.02, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.52);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.68);
  }
}
