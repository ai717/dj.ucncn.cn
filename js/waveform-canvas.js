/**
 * 高密度双轨波形与唱机总览波形渲染器（1:1 复刻 Backspin 实心多层次波形质感与 Hot Cue / CUE 标点）
 */

const HOT_CUE_COLORS = ['#e07f76', '#e3c88c', '#9fd4a3', '#b3a6e0', '#8ecfe0', '#e0a3c8', '#c9d08a', '#eab88c'];
const CUE_MARKER_COLOR = '#e5e7eb';

function drawCueMarker(ctx, x, h, dpr, color, label, dimmed) {
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.5;
  ctx.fillStyle = color;
  ctx.fillRect(x, 0, 1.5 * dpr, h);
  const bw = 12 * dpr;
  const bh = 13 * dpr;
  ctx.fillRect(x, h - bh, bw, bh);
  ctx.fillStyle = '#0d0d0f';
  ctx.font = `700 ${Math.round(9 * dpr)}px system-ui, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + 3.5 * dpr, h - 3.5 * dpr);
  ctx.restore();
}

function samplePeak(peaks, duration, timeSec) {
  let t = timeSec % duration;
  if (t < 0) t += duration;
  const exact = (t / duration) * peaks.length;
  const i0 = Math.floor(exact) % peaks.length;
  const i1 = (i0 + 1) % peaks.length;
  const frac = exact - Math.floor(exact);
  return peaks[i0] * (1 - frac) + peaks[i1] * frac;
}

export function drawScrollingWaveform(canvas, engine, deckId) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const deck = engine.decks[deckId];
  const color = deckId === 'A' ? '#8ecfe0' : '#eab88c';
  const dimColor = deckId === 'A' ? 'rgba(142, 207, 224, 0.28)' : 'rgba(234, 184, 140, 0.28)';
  const centerX = Math.floor(w * 0.5);
  const midY = h * 0.5;

  if (!deck.track) return;

  const { peaks, duration, bpm } = deck.track;
  const curTime = engine.getCurrentTime(deckId);
  const windowSec = engine.waveformWindowSec || 9;
  const pxPerSec = w / windowSec;

  // Loop 区间微弱绿底
  if (deck.loop4 && deck.loopEnd > deck.loopStart) {
    const x1 = centerX + (deck.loopStart - curTime) * pxPerSec;
    const x2 = centerX + (deck.loopEnd - curTime) * pxPerSec;
    ctx.fillStyle = 'rgba(159, 212, 163, 0.16)';
    ctx.fillRect(x1, 0, x2 - x1, h);
  }

  // 节拍网格线（先画在波形底层）
  const beatDur = 60 / bpm;
  const startBeat = Math.floor((curTime - windowSec / 2) / beatDur);
  const endBeat = Math.ceil((curTime + windowSec / 2) / beatDur);
  for (let b = startBeat; b <= endBeat; b++) {
    const x = centerX + (b * beatDur - curTime) * pxPerSec;
    const isBar = ((b % 4) + 4) % 4 === 0;
    ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // 逐像素密集垂直波形柱（1px 宽，无空隙，呈现真实高解析度音频波形）
  const colStep = Math.max(1, Math.floor(dpr));
  for (let x = 0; x < w; x += colStep) {
    const t = curTime + (x - centerX) / pxPerSec;
    const amp = samplePeak(peaks, duration, t);
    const barH = Math.max(3 * dpr, Math.pow(amp, 0.78) * (h * 0.9));
    const y = midY - barH * 0.5;

    if (x < centerX) {
      ctx.fillStyle = dimColor;
      ctx.fillRect(x, y, colStep, barH);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, colStep, barH);
      // 亮白高光芯部（对齐 Backspin 波形亮白核心）
      const coreH = barH * 0.56;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.fillRect(x, midY - coreH * 0.5, colStep, coreH);
    }
  }

  // CUE 起始点与 Hot Cue 1~8 彩色标点（带数字标签 C, 1..8）
  if (typeof deck.cuePoint === 'number' && deck.cuePoint > 0) {
    const cx = Math.round(centerX + (deck.cuePoint - curTime) * pxPerSec);
    if (cx >= -16 * dpr && cx <= w + 16 * dpr) {
      drawCueMarker(ctx, cx, h, dpr, CUE_MARKER_COLOR, 'C', cx < centerX);
    }
  }
  if (Array.isArray(deck.hotCues)) {
    deck.hotCues.forEach((pos, idx) => {
      if (pos === null || pos === undefined) return;
      const hx = Math.round(centerX + (pos - curTime) * pxPerSec);
      if (hx >= -16 * dpr && hx <= w + 16 * dpr) {
        drawCueMarker(ctx, hx, h, dpr, HOT_CUE_COLORS[idx] || '#ecebe8', String(idx + 1), hx < centerX);
      }
    });
  }

  // 中心播放头白线
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centerX - dpr * 0.5, 0, Math.max(1.5, dpr * 1.5), h);
}

export function drawOverviewWaveform(canvas, engine, deckId) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const deck = engine.decks[deckId];
  if (!deck.track) return;

  const { peaks, duration } = deck.track;
  const curTime = engine.getCurrentTime(deckId);
  const playX = Math.floor((curTime / duration) * w);
  const color = deckId === 'A' ? '#8ecfe0' : '#eab88c';
  const dimColor = deckId === 'A' ? 'rgba(142, 207, 224, 0.28)' : 'rgba(234, 184, 140, 0.28)';

  const step = Math.max(1, Math.floor(dpr));
  for (let x = 0; x < w; x += step) {
    const bin = Math.min(peaks.length - 1, Math.floor((x / w) * peaks.length));
    const barH = Math.max(2 * dpr, Math.pow(peaks[bin], 0.78) * (h * 0.92));
    const y = h - barH;
    ctx.fillStyle = x < playX ? dimColor : color;
    ctx.fillRect(x, y, step, barH);
    if (x >= playX) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(x, h - barH * 0.5, step, barH * 0.5);
    }
  }

  // CUE 竖线与 Hot Cue 1~8 彩色竖线
  if (typeof deck.cuePoint === 'number' && deck.cuePoint > 0) {
    const cx = Math.round((deck.cuePoint / duration) * w);
    ctx.fillStyle = CUE_MARKER_COLOR;
    ctx.fillRect(cx - 0.5 * dpr, 0, 1 * dpr, h);
  }
  if (Array.isArray(deck.hotCues)) {
    deck.hotCues.forEach((pos, idx) => {
      if (pos === null || pos === undefined) return;
      const hx = Math.round((pos / duration) * w);
      ctx.fillStyle = HOT_CUE_COLORS[idx] || '#ecebe8';
      ctx.fillRect(hx - 1 * dpr, 0, 2 * dpr, h);
    });
  }

  // 播放进度游标
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(playX - dpr * 0.5, 0, Math.max(1.5, dpr * 1.5), h);
}
