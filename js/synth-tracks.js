/**
 * 零版权内置合成舞曲与采样音效生成器
 * 使用 OfflineAudioContext 在浏览器本地毫秒级渲染高质量循环音频与真实波形峰值
 */

export const TRACK_CATALOG = [
  {
    id: 'sunrise-house',
    title: '晨曦浩室',
    genre: '钢琴浩室',
    bpm: 122,
    key: '8A · Am',
    energy: 8,
    bars: 8, // 32 beats
    color: '#38bdf8'
  },
  {
    id: 'night-shift',
    title: '深夜铁克诺',
    genre: '电子铁克诺',
    bpm: 126,
    key: '8A · Am',
    energy: 9,
    bars: 8,
    color: '#fb923c'
  },
  {
    id: 'golden-hour',
    title: '落日迪斯科',
    genre: '复古迪斯科',
    bpm: 120,
    key: '8B · C',
    energy: 8,
    bars: 8,
    color: '#facc15'
  },
  {
    id: 'low-tide',
    title: '低潮律动',
    genre: '经典说唱',
    bpm: 92,
    key: '7A · Dm',
    energy: 6,
    bars: 8,
    color: '#a78bfa'
  },
  {
    id: 'neon-vocal',
    title: '霓虹人声吉他',
    genre: '人声浩室',
    bpm: 124,
    key: '8A · Am',
    energy: 9,
    bars: 8,
    color: '#ec4899'
  },
  {
    id: 'rush-hour',
    title: '极速碎拍',
    genre: '鼓打贝斯',
    bpm: 174,
    key: '8A · Am',
    energy: 10,
    bars: 8,
    color: '#ef4444'
  },
  {
    id: 'velvet-deep',
    title: '丝绒深邃',
    genre: '深邃浩室',
    bpm: 121,
    key: '9A · Em',
    energy: 7,
    bars: 8,
    color: '#2dd4bf'
  },
  {
    id: 'warehouse-tech',
    title: '仓库节拍',
    genre: '科技浩室',
    bpm: 125,
    key: '8A · Am',
    energy: 9,
    bars: 8,
    color: '#34d399'
  },
  {
    id: 'tokyo-lofi',
    title: '东京雨夜',
    genre: '柔和嘻哈',
    bpm: 86,
    key: '7A · Dm',
    energy: 5,
    bars: 8,
    color: '#c084fc'
  },
  {
    id: 'arcade-synth',
    title: '街机霓虹',
    genre: '合成器波',
    bpm: 114,
    key: '6A · Gm',
    energy: 8,
    bars: 8,
    color: '#f472b6'
  },
  {
    id: 'london-2step',
    title: '伦敦车库',
    genre: '英伦车库',
    bpm: 130,
    key: '7A · Dm',
    energy: 8,
    bars: 8,
    color: '#60a5fa'
  },
  {
    id: 'berlin-melodic',
    title: '柏林天际线',
    genre: '旋律铁克诺',
    bpm: 132,
    key: '9A · Em',
    energy: 9,
    bars: 8,
    color: '#818cf8'
  },
  {
    id: 'island-bounce',
    title: '海岛律动',
    genre: '热带舞曲',
    bpm: 104,
    key: '9A · Em',
    energy: 7,
    bars: 8,
    color: '#fbbf24'
  },
  {
    id: 'astral-trance',
    title: '星际迷幻',
    genre: '出神舞曲',
    bpm: 138,
    key: '8A · Am',
    energy: 10,
    bars: 8,
    color: '#38bdf8'
  },
  { id: 'sunset-lounge', title: '日落酒廊', genre: '弛放浩室', bpm: 118, key: '5A · Cm', energy: 6, bars: 8, color: '#fb923c' },
  { id: 'midnight-acid', title: '午夜酸音', genre: '酸性铁克诺', bpm: 134, key: '10A · Bm', energy: 9, bars: 8, color: '#a3e635' },
  { id: 'tokyo-citypop', title: '都市霓虹', genre: '新迪斯科', bpm: 116, key: '9B · G', energy: 7, bars: 8, color: '#f472b6' },
  { id: 'cyber-trap', title: '赛博重拍', genre: '电子陷阱', bpm: 140, key: '4A · Fm', energy: 9, bars: 8, color: '#e879f9' },
  { id: 'ibiza-anthem', title: '伊比萨盛夏', genre: '渐进浩室', bpm: 128, key: '10B · D', energy: 9, bars: 8, color: '#facc15' },
  { id: 'afterhours-min', title: '深夜极简', genre: '极简科技', bpm: 124, key: '11A · F#m', energy: 7, bars: 8, color: '#94a3b8' },
  { id: 'golden-funk', title: '黄金放克', genre: '放克浩室', bpm: 122, key: '7B · F', energy: 8, bars: 8, color: '#fbbf24' },
  { id: 'sub-dubstep', title: '深渊重低音', genre: '回响贝斯', bpm: 140, key: '1A · Abm', energy: 10, bars: 8, color: '#ef4444' },
  { id: 'amber-ambient', title: '琥珀氛围', genre: '有机浩室', bpm: 119, key: '12A · Dbm', energy: 6, bars: 8, color: '#f59e0b' },
  { id: 'retro-break', title: '复古碎拍', genre: '碎拍舞曲', bpm: 132, key: '3A · Bbm', energy: 8, bars: 8, color: '#34d399' },
  { id: 'harbor-afro', title: '海港部落', genre: '非洲浩室', bpm: 120, key: '2A · Ebm', energy: 8, bars: 8, color: '#2dd4bf' },
  { id: 'warehouse-hard', title: '工业重拍', genre: '硬核铁克诺', bpm: 142, key: '8A · Am', energy: 10, bars: 8, color: '#f87171' },
  { id: 'velvet-rnb', title: '丝绒节奏', genre: '当代节奏布鲁斯', bpm: 96, key: '5A · Cm', energy: 6, bars: 8, color: '#c084fc' },
  { id: 'aurora-melodic', title: '极光旋律', genre: '旋律浩室', bpm: 123, key: '9A · Em', energy: 8, bars: 8, color: '#38bdf8' },
  { id: 'subway-dnb', title: '地下快车', genre: '液态鼓打贝斯', bpm: 172, key: '10A · Bm', energy: 9, bars: 8, color: '#60a5fa' },
  { id: 'dawn-electro', title: '破晓电音', genre: '电音摇滚', bpm: 127, key: '11B · A', energy: 9, bars: 8, color: '#818cf8' }
];

const EXTRA_STYLE_PRESETS = {
  'sunset-lounge': { drum: 'fourFloor', root: 36, pad: 48, arp: [60, 63, 67, 70], bassWave: 'sine', cutoff: 420 },
  'midnight-acid': { drum: 'techno', root: 35, pad: 47, arp: [59, 62, 66, 71], bassWave: 'sawtooth', cutoff: 980 },
  'tokyo-citypop': { drum: 'fourFloor', root: 31, pad: 43, arp: [67, 71, 74, 78], bassWave: 'square', cutoff: 640 },
  'cyber-trap': { drum: 'trap', root: 29, pad: 41, arp: [65, 68, 72, 77], bassWave: 'sawtooth', cutoff: 520 },
  'ibiza-anthem': { drum: 'fourFloor', root: 38, pad: 50, arp: [62, 66, 69, 74], bassWave: 'sawtooth', cutoff: 760 },
  'afterhours-min': { drum: 'techno', root: 30, pad: 42, arp: [66, 69, 73, 76], bassWave: 'triangle', cutoff: 380 },
  'golden-funk': { drum: 'fourFloor', root: 29, pad: 41, arp: [65, 69, 72, 76], bassWave: 'square', cutoff: 700 },
  'sub-dubstep': { drum: 'trap', root: 32, pad: 44, arp: [56, 59, 63, 68], bassWave: 'sawtooth', cutoff: 460 },
  'amber-ambient': { drum: 'fourFloor', root: 37, pad: 49, arp: [61, 64, 68, 73], bassWave: 'sine', cutoff: 340 },
  'retro-break': { drum: 'twoStep', root: 34, pad: 46, arp: [58, 61, 65, 70], bassWave: 'sawtooth', cutoff: 580 },
  'harbor-afro': { drum: 'fourFloor', root: 39, pad: 51, arp: [63, 66, 70, 75], bassWave: 'triangle', cutoff: 480 },
  'warehouse-hard': { drum: 'techno', root: 33, pad: 45, arp: [57, 60, 64, 69], bassWave: 'sawtooth', cutoff: 840 },
  'velvet-rnb': { drum: 'groove', root: 36, pad: 48, arp: [60, 63, 67, 72], bassWave: 'sine', cutoff: 360 },
  'aurora-melodic': { drum: 'fourFloor', root: 28, pad: 40, arp: [64, 67, 71, 76], bassWave: 'sawtooth', cutoff: 620 },
  'subway-dnb': { drum: 'dnb', root: 35, pad: 47, arp: [59, 62, 66, 71], bassWave: 'sawtooth', cutoff: 440 },
  'dawn-electro': { drum: 'techno', root: 33, pad: 45, arp: [69, 73, 76, 81], bassWave: 'square', cutoff: 780 }
};

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

export function triggerVocalChop(ctx, dest, time, midi, dur, vowel = 'a', gainVal = 0.16) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(midiToFreq(midi), time);

  // 双共振峰滤波器模拟人声切片质感
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.setValueAtTime(vowel === 'a' ? 750 : 450, time);
  f1.Q.value = 4.5;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.setValueAtTime(vowel === 'a' ? 1200 : 900, time);
  f2.Q.value = 5.0;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(gainVal, time + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(f1);
  osc.connect(f2);
  f1.connect(g);
  f2.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function triggerGuitarPluck(ctx, dest, time, midi, dur, gainVal = 0.14) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(midiToFreq(midi), time);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(3400, time);
  lp.frequency.exponentialRampToValueAtTime(600, time + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gainVal, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(lp);
  lp.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function computePeaks(buffer, bins = 480) {
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

/**
 * 轻量纯前端能量峰值间隔 BPM 估算器（分析前 20 秒音频）
 */
export function estimateBPM(buffer) {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const maxSamples = Math.min(data.length, sampleRate * 20);
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms 能量窗 -> 50 Hz 包络
  const energies = [];

  for (let i = 0; i < maxSamples; i += windowSize) {
    let sum = 0;
    const end = Math.min(maxSamples, i + windowSize);
    for (let j = i; j < end; j++) {
      sum += data[j] * data[j];
    }
    energies.push(sum / (end - i));
  }

  // 在 75..165 BPM 范围内用自相关寻找最强节拍周期
  const fps = sampleRate / windowSize; // ~50
  const minLag = Math.floor((60 / 165) * fps);
  const maxLag = Math.ceil((60 / 75) * fps);
  let bestLag = Math.round((60 / 124) * fps);
  let bestScore = -1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = 0; i < energies.length - lag; i++) {
      score += energies[i] * energies[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const rawBpm = (60 * fps) / bestLag;
  return Math.round(Math.max(75, Math.min(165, rawBpm)));
}

export async function registerLocalAudioFile(ctx, file) {
  const arrayBuf = await file.arrayBuffer();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const detectedBpm = estimateBPM(audioBuf);
  const meta = {
    id,
    title: file.name.replace(/\.[^.]+$/, ''),
    genre: '本地音频',
    bpm: detectedBpm,
    key: '—',
    energy: 8,
    bars: Math.max(4, Math.round((audioBuf.duration * detectedBpm) / 240)),
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
    } else if (meta.id === 'neon-vocal') {
      triggerKick(offline, master, t, 152, 0.25, 0.88);
      if (beatInBar === 1 || beatInBar === 3) {
        triggerSnare(offline, master, noiseBuf, t, 0.3);
      }
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.14);
      const root = bar < 4 ? 33 : 29;
      triggerBass(offline, master, t + beatDur * 0.5, root, beatDur * 0.4, 'sawtooth', 500, 0.3);
      // 人声切片 + 吉他拨弦交替
      const vNotes = [69, 72, 74, 72];
      triggerVocalChop(offline, master, t, vNotes[beatInBar], beatDur * 0.45, beatInBar % 2 === 0 ? 'a' : 'o', 0.18);
      triggerGuitarPluck(offline, master, t + beatDur * 0.25, root + 24, beatDur * 0.35, 0.13);
      triggerGuitarPluck(offline, master, t + beatDur * 0.75, root + 31, beatDur * 0.35, 0.11);
    } else if (meta.id === 'rush-hour') {
      // 174 BPM Drum & Bass 两步碎拍
      if (beatInBar === 0) triggerKick(offline, master, t, 165, 0.2, 0.9);
      if (beatInBar === 2) triggerKick(offline, master, t + beatDur * 0.5, 155, 0.18, 0.78);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.45);
      triggerHat(offline, master, noiseBuf, t, false, 0.1);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.12);
      const root = bar < 4 ? 33 : 36;
      triggerBass(offline, master, t, root, beatDur * 0.9, 'sawtooth', 380, 0.38);
    } else if (meta.id === 'velvet-deep') {
      // 121 BPM Deep House (9A · Em)
      triggerKick(offline, master, t, 132, 0.28, 0.84);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.2);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.11);
      const root = bar < 4 ? 28 : 33; // E1 -> A1
      triggerBass(offline, master, t + beatDur * 0.5, root, beatDur * 0.45, 'sine', 360, 0.38);
      if (beatInBar === 0) {
        const chord = bar < 4 ? [52, 55, 59, 62] : [57, 60, 64, 67];
        triggerChord(offline, master, t, chord, beatDur * 1.6, 'sine', 1500, 0.12);
      }
    } else if (meta.id === 'warehouse-tech') {
      // 125 BPM Tech House (8A · Am) - 干净底鼓与反拍切分，适合对拍练习
      triggerKick(offline, master, t, 155, 0.25, 0.92);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.32);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.16);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.75, false, 0.08);
      const bassPattern = [33, 33, 36, 33];
      triggerBass(offline, master, t + beatDur * 0.5, bassPattern[beatInBar], beatDur * 0.36, 'sawtooth', 520, 0.32);
      if (beatInBar === 3) triggerGuitarPluck(offline, master, t + beatDur * 0.5, 69, beatDur * 0.25, 0.12);
    } else if (meta.id === 'tokyo-lofi') {
      // 86 BPM Lo-Fi Chillhop (7A · Dm)
      if (beatInBar === 0 || beatInBar === 2) triggerKick(offline, master, t, 118, 0.28, 0.8);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.28);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.07);
      const root = bar < 4 ? 38 : 34; // D2 -> Bb1
      triggerBass(offline, master, t, root, beatDur * 0.8, 'triangle', 320, 0.36);
      if (beatInBar === 0 || beatInBar === 2) {
        const chord = bar < 4 ? [62, 65, 69, 72] : [58, 62, 65, 69];
        triggerChord(offline, master, t + 0.015, chord, beatDur * 1.4, 'triangle', 1200, 0.12);
      }
    } else if (meta.id === 'arcade-synth') {
      // 114 BPM Synthwave (6A · Gm)
      triggerKick(offline, master, t, 145, 0.28, 0.86);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.36);
      const root = bar < 4 ? 31 : 36; // G1 -> C2
      for (let s = 0; s < 2; s++) {
        triggerBass(offline, master, t + beatDur * (s * 0.5), root, beatDur * 0.42, 'sawtooth', 620, 0.26);
      }
      const arp = [67, 70, 74, 79];
      triggerGuitarPluck(offline, master, t + beatDur * 0.25, arp[beatInBar], beatDur * 0.32, 0.14);
      triggerGuitarPluck(offline, master, t + beatDur * 0.75, arp[(beatInBar + 1) % 4], beatDur * 0.32, 0.12);
    } else if (meta.id === 'london-2step') {
      // 130 BPM UK Garage / 2-Step (7A · Dm)
      if (beatInBar === 0) triggerKick(offline, master, t, 148, 0.24, 0.88);
      if (beatInBar === 2) triggerKick(offline, master, t + beatDur * 0.5, 142, 0.22, 0.78);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.32);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.33, false, 0.1);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.66, true, 0.11);
      const root = bar < 4 ? 38 : 33;
      triggerBass(offline, master, t + beatDur * 0.5, root, beatDur * 0.4, 'square', 460, 0.28);
      triggerVocalChop(offline, master, t + beatDur * 0.25, 69 + (beatInBar % 2) * 3, beatDur * 0.35, 'o', 0.15);
    } else if (meta.id === 'berlin-melodic') {
      // 132 BPM Melodic Techno (9A · Em)
      triggerKick(offline, master, t, 165, 0.27, 0.92);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.15);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.24);
      for (let s = 1; s < 4; s++) {
        triggerBass(offline, master, t + beatDur * (s * 0.25), 28, beatDur * 0.2, 'sawtooth', 480 + s * 110, 0.25);
      }
      const mel = [64, 67, 71, 76];
      triggerGuitarPluck(offline, master, t + beatDur * 0.5, mel[(b + bar) % 4], beatDur * 0.45, 0.15);
    } else if (meta.id === 'island-bounce') {
      // 104 BPM Moombahton / Afrobeats (9A · Em)
      triggerKick(offline, master, t, 140, 0.26, 0.88);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t + beatDur * 0.5, 0.3);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.25, false, 0.09);
      const root = bar < 4 ? 40 : 35; // E2 -> B1
      triggerBass(offline, master, t, root, beatDur * 0.45, 'triangle', 480, 0.34);
      const plucks = [64, 67, 71, 67];
      triggerGuitarPluck(offline, master, t + beatDur * 0.5, plucks[beatInBar], beatDur * 0.35, 0.15);
    } else if (meta.id === 'astral-trance') {
      // 138 BPM Progressive Trance (8A · Am)
      triggerKick(offline, master, t, 172, 0.26, 0.92);
      triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.16);
      if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.3);
      for (let s = 1; s < 4; s++) {
        triggerBass(offline, master, t + beatDur * (s * 0.25), 33, beatDur * 0.18, 'sawtooth', 620, 0.24);
      }
      const lead = [69, 72, 76, 81];
      triggerGuitarPluck(offline, master, t, lead[beatInBar], beatDur * 0.35, 0.14);
      if (beatInBar === 0) {
        triggerChord(offline, master, t, [57, 60, 64, 69], beatDur * 1.8, 'sawtooth', 2200, 0.1);
      }
    } else if (EXTRA_STYLE_PRESETS[meta.id]) {
      const cfg = EXTRA_STYLE_PRESETS[meta.id];
      const root = bar < 4 ? cfg.root : cfg.root + (bar % 2 === 0 ? 5 : 3);
      if (cfg.drum === 'fourFloor') {
        triggerKick(offline, master, t, 148, 0.25, 0.86);
        if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.28);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.13);
        triggerBass(offline, master, t + beatDur * 0.5, root, beatDur * 0.42, cfg.bassWave, cfg.cutoff, 0.32);
      } else if (cfg.drum === 'techno') {
        triggerKick(offline, master, t, 168, 0.28, 0.92);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.15);
        if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.26);
        for (let s = 1; s < 4; s++) {
          triggerBass(offline, master, t + beatDur * (s * 0.25), root, beatDur * 0.2, cfg.bassWave, cfg.cutoff, 0.26);
        }
      } else if (cfg.drum === 'trap') {
        if (beatInBar === 0 || beatInBar === 3) triggerKick(offline, master, t, 136, 0.3, 0.9);
        if (beatInBar === 2) triggerSnare(offline, master, noiseBuf, t, 0.42);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.25, false, 0.1);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.1);
        triggerBass(offline, master, t, root, beatDur * 0.85, cfg.bassWave, cfg.cutoff, 0.36);
      } else if (cfg.drum === 'twoStep' || cfg.drum === 'dnb') {
        if (beatInBar === 0) triggerKick(offline, master, t, 158, 0.22, 0.88);
        if (beatInBar === 2) triggerKick(offline, master, t + beatDur * 0.5, 148, 0.2, 0.78);
        if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.4);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, true, 0.12);
        triggerBass(offline, master, t, root, beatDur * 0.75, cfg.bassWave, cfg.cutoff, 0.35);
      } else {
        // groove
        if (beatInBar === 0 || beatInBar === 2) triggerKick(offline, master, t, 126, 0.26, 0.82);
        if (beatInBar === 1 || beatInBar === 3) triggerSnare(offline, master, noiseBuf, t, 0.3);
        triggerHat(offline, master, noiseBuf, t + beatDur * 0.5, false, 0.08);
        triggerBass(offline, master, t, root, beatDur * 0.7, cfg.bassWave, cfg.cutoff, 0.34);
      }
      triggerGuitarPluck(offline, master, t + beatDur * 0.25, cfg.arp[(b + bar) % cfg.arp.length], beatDur * 0.35, 0.13);
      if (beatInBar === 0) {
        triggerChord(offline, master, t, cfg.arp.slice(0, 3), beatDur * 1.6, 'triangle', 1700, 0.11);
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

  // 为每首舞曲铺设柔和的持续和弦 Pad，让听感更饱满、波形自然连贯
  const padMap = {
    'golden-hour': 48,
    'low-tide': 50,
    'tokyo-lofi': 50,
    'london-2step': 50,
    'velvet-deep': 40,
    'berlin-melodic': 40,
    'island-bounce': 40,
    'arcade-synth': 43
  };
  const padRoot = EXTRA_STYLE_PRESETS[meta.id]?.pad || padMap[meta.id] || 45;
  for (let bar = 0; bar < meta.bars; bar++) {
    const bt = bar * 4 * beatDur;
    const shift = bar % 4 === 2 ? -2 : bar % 4 === 3 ? -4 : 0;
    triggerChord(offline, master, bt, [padRoot + shift, padRoot + shift + 7, padRoot + shift + 12], beatDur * 3.9, 'sawtooth', 900, 0.14);
  }

  const buffer = await offline.startRendering();
  const peaks = computePeaks(buffer, 1200);
  const result = { ...meta, buffer, peaks, duration: buffer.duration };
  bufferCache.set(trackId, result);
  return result;
}

/**
 * 8 键 DJ 采样器精确 DSP 缓冲区合成器（与 Backspin 音色/时长/包络完全一致）
 */
const samplerCache = new Map();

function polyBlep(t, dt) {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

function createSVF(sr) {
  let low = 0, band = 0;
  return (x, cutoff, q, mode) => {
    const f = Math.min(0.85, 2 * Math.sin((Math.PI * Math.min(cutoff, sr * 0.42)) / sr));
    const damp = 1 / Math.max(0.5, q);
    const high = x - low - damp * band;
    band += f * high;
    low += f * band;
    return mode === 'bp' ? band : mode === 'hp' ? high : low;
  };
}

function finalizeSamplerBuffer(ctx, data) {
  const sr = ctx.sampleRate;
  const fadeSamples = Math.min(data.length, Math.floor(sr * 0.012));
  for (let i = 0; i < fadeSamples; i++) {
    data[data.length - 1 - i] *= i / fadeSamples;
  }
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0.0001) {
    const scale = 0.88 / peak;
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }
  const buf = ctx.createBuffer(1, data.length, sr);
  buf.getChannelData(0).set(data);
  return buf;
}

function getSamplerBuffer(ctx, padId) {
  if (samplerCache.has(padId)) return samplerCache.get(padId);
  const sr = ctx.sampleRate;
  let data;

  if (padId === 'airhorn') {
    const dur = 1.1;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    const freqs = [466, 554, 698];
    const phases = [0, 0.3, 0.6];
    const svf = createSVF(sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 6 * t);
      const droop = t > dur - 0.35 ? 1 - 0.03 * ((t - (dur - 0.35)) / 0.35) : 1;
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        const dt = (freqs[k] * vib * droop) / sr;
        phases[k] = (phases[k] + dt) % 1;
        sum += 2 * phases[k] - 1 - polyBlep(phases[k], dt);
      }
      const env = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.12);
      const filtered = svf(sum / 3, 2400, 1.2, 'lp');
      data[i] = Math.tanh(1.4 * filtered) * env;
    }
  } else if (padId === 'siren') {
    const dur = 2.0;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 850 + 330 * Math.sin(2 * Math.PI * 2.6 * t);
      phase += (2 * Math.PI * freq) / sr;
      const env = Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.25);
      data[i] = Math.sin(phase) * env;
    }
  } else if (padId === 'laser') {
    const dur = 0.4;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 2800 * Math.pow(180 / 2800, t / dur);
      phase += (2 * Math.PI * freq) / sr;
      data[i] = Math.sin(phase) * Math.exp(-t / 0.22);
    }
  } else if (padId === 'rewind') {
    const dur = 0.9;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    let phase = 0;
    const svf = createSVF(sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 220 * Math.pow(9, t / dur);
      const dt = freq / sr;
      phase = (phase + dt) % 1;
      const saw = 2 * phase - 1 - polyBlep(phase, dt);
      const wobble = 0.7 + 0.3 * Math.sin(2 * Math.PI * 34 * t);
      const noise = (Math.random() * 2 - 1) * 0.5;
      const bpFreq = 1500 + 4000 * (t / dur);
      const env = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.05);
      data[i] = (saw * wobble * 0.65 + svf(noise, bpFreq, 1.5, 'bp')) * env;
    }
  } else if (padId === 'boom') {
    const dur = 1.8;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 32 + 100 * Math.exp(-t / 0.09);
      phase += (2 * Math.PI * freq) / sr;
      data[i] = Math.tanh(2.2 * Math.sin(phase)) * Math.exp(-t / 0.55);
    }
  } else if (padId === 'snareroll') {
    const dur = 2.0;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    const hitLen = Math.floor(sr * 0.16);
    const hit = new Float32Array(hitLen);
    const bpSvf = createSVF(sr);
    const hpSvf = createSVF(sr);
    let p = 0;
    for (let i = 0; i < hitLen; i++) {
      const t = i / sr;
      const f = 190 * Math.exp(-t / 0.04) + 70;
      p += (2 * Math.PI * f) / sr;
      const body = Math.sin(p) * Math.exp(-t / 0.045);
      const n = Math.random() * 2 - 1;
      const snap = (bpSvf(n, 2600, 1.2, 'bp') * 0.7 + hpSvf(n, 5200, 0.8, 'hp') * 0.5) * Math.exp(-t / 0.06);
      hit[i] = body * 0.6 + snap;
    }
    let curT = 0;
    let interval = 0.22;
    while (curT < 1.9) {
      const amp = 0.35 + 0.65 * (curT / 1.9);
      const startIdx = Math.floor(curT * sr);
      for (let j = 0; j < hitLen && startIdx + j < len; j++) {
        data[startIdx + j] += hit[j] * amp;
      }
      curT += interval;
      interval = Math.max(0.045, interval * 0.9);
    }
  } else if (padId === 'aah') {
    const dur = 0.6;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    let phase = 0;
    const f1 = createSVF(sr);
    const f2 = createSVF(sr);
    const f3 = createSVF(sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const vib = 1 + 0.012 * Math.sin(2 * Math.PI * 5 * t);
      const droop = t > 0.35 ? 1 - 0.04 * ((t - 0.35) / 0.25) : 1;
      const dt = (220 * vib * droop) / sr;
      phase = (phase + dt) % 1;
      const saw = 2 * phase - 1 - polyBlep(phase, dt);
      const v = f1(saw, 730, 9, 'bp') * 1.0 + f2(saw, 1090, 8, 'bp') * 0.6 + f3(saw, 2440, 9, 'bp') * 0.25;
      const env = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.18);
      data[i] = v * env;
    }
  } else if (padId === 'crash') {
    // 2.2s 镲片重击（金属方波泛音群 + 宽带高通金属衰减）
    const dur = 2.2;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    const ratios = [1, 1.48, 1.71, 2.13, 2.67, 3.31];
    const phases = new Float64Array(ratios.length);
    const hp = createSVF(sr);
    const bp = createSVF(sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let metal = 0;
      for (let k = 0; k < ratios.length; k++) {
        phases[k] = (phases[k] + (340 * ratios[k]) / sr) % 1;
        metal += phases[k] < 0.5 ? 1 : -1;
      }
      const noise = Math.random() * 2 - 1;
      const bright = hp(noise * 0.75 + metal * 0.12, 4600, 0.85, 'hp') + bp(noise, 7800, 1.2, 'bp') * 0.55;
      const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.62);
      data[i] = bright * env;
    }
  } else if (padId === 'clap') {
    // 0.55s 多层错峰电子拍手 + 混响尾音
    const dur = 0.55;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    const bp1 = createSVF(sr);
    const bp2 = createSVF(sr);
    const offsets = [0, 0.011, 0.022, 0.034];
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const n = Math.random() * 2 - 1;
      let burstEnv = 0;
      for (let k = 0; k < offsets.length; k++) {
        const dt = t - offsets[k];
        if (dt >= 0) {
          burstEnv += (k === offsets.length - 1 ? Math.exp(-dt / 0.14) : Math.exp(-dt / 0.012) * 0.85);
        }
      }
      const tone = bp1(n, 1450, 1.4, 'bp') * 0.8 + bp2(n, 2900, 1.1, 'bp') * 0.55;
      data[i] = tone * burstEnv * Math.min(1, (dur - t) / 0.06);
    }
  } else {
    // riser (2.0s)
    const dur = 2.0;
    const len = Math.floor(sr * dur);
    data = new Float32Array(len);
    const svf = createSVF(sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const u = t / dur;
      const cutoff = 300 * Math.pow(30, u);
      const env = (u * u) * Math.min(1, (dur - t) / 0.05);
      data[i] = svf(Math.random() * 2 - 1, cutoff, 1.6, 'bp') * env;
    }
  }

  const buf = finalizeSamplerBuffer(ctx, data);
  samplerCache.set(padId, buf);
  return buf;
}

export function playSamplerPad(ctx, dest, padId) {
  const src = ctx.createBufferSource();
  src.buffer = getSamplerBuffer(ctx, padId);
  const g = ctx.createGain();
  g.gain.value = 0.55;
  src.connect(g);
  g.connect(dest);
  src.start();
}
