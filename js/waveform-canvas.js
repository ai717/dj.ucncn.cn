/**
 * 高密度双轨波形与唱机总览波形渲染器（1:1 复刻 Backspin 实心多层次波形质感）
 */

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
  const windowSec = 9;
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

  // 播放进度游标
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(playX - dpr * 0.5, 0, Math.max(1.5, dpr * 1.5), h);
}
