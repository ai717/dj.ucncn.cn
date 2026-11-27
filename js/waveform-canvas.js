/**
 * 顶部双轨滚动波形与唱机总览波形渲染器 (Canvas 2D)
 */

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
  const color = deckId === 'A' ? '#38bdf8' : '#fb923c';
  const dimColor = deckId === 'A' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)';

  // 中心播放头参考线
  const centerX = w * 0.5;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, 0, w, h);

  if (!deck.track) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.font = `${12 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Deck ${deckId} 未装盘 — 请从下方曲库选择或点击课程「自动装盘」`, centerX, h * 0.54);
    return;
  }

  const { peaks, duration, bpm } = deck.track;
  const curTime = engine.getCurrentTime(deckId);
  const windowSec = 8; // 屏幕左右共显示 8 秒窗口
  const pxPerSec = w / windowSec;

  // 绘制 Loop 4 区间高亮
  if (deck.loop4 && deck.loopEnd > deck.loopStart) {
    const x1 = centerX + (deck.loopStart - curTime) * pxPerSec;
    const x2 = centerX + (deck.loopEnd - curTime) * pxPerSec;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
    ctx.fillRect(x1, 0, x2 - x1, h);
  }

  // 绘制节拍网格线 (Beatgrid)
  const beatDur = 60 / bpm;
  const startBeat = Math.floor((curTime - windowSec / 2) / beatDur);
  const endBeat = Math.ceil((curTime + windowSec / 2) / beatDur);
  for (let b = startBeat; b <= endBeat; b++) {
    const bTime = b * beatDur;
    const x = centerX + (bTime - curTime) * pxPerSec;
    const isBar = ((b % 4) + 4) % 4 === 0;
    ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = isBar ? 1.5 * dpr : 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // 绘制高密度饱满音频波形（类似 Serato / Backspin 实心对称波形）
  const barWidth = Math.max(1.5 * dpr, w / 240);
  const numCols = Math.ceil(w / barWidth);
  for (let i = 0; i < numCols; i++) {
    const x = i * barWidth;
    const tOffset = (x - centerX) / pxPerSec;
    let sampleTime = (curTime + tOffset) % duration;
    if (sampleTime < 0) sampleTime += duration;

    const bin = Math.min(peaks.length - 1, Math.floor((sampleTime / duration) * peaks.length));
    const amp = peaks[bin];
    const barH = Math.max(2 * dpr, amp * (h * 0.88));
    const y = (h - barH) * 0.5;

    ctx.fillStyle = x < centerX ? dimColor : color;
    ctx.fillRect(x, y, Math.max(1, barWidth - 0.5 * dpr), barH);
    // 中心高光芯线，增强波形立体感
    if (x >= centerX && barH > 8 * dpr) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x, y + barH * 0.25, Math.max(1, barWidth - 0.5 * dpr), barH * 0.5);
    }
  }

  // 中心播放头红/白线
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, h);
  ctx.stroke();
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
  const progress = curTime / duration;
  const color = deckId === 'A' ? '#38bdf8' : '#fb923c';

  const step = w / peaks.length;
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const barH = Math.max(2 * dpr, peaks[i] * h * 0.85);
    ctx.fillStyle = (i / peaks.length) <= progress ? color : 'rgba(148, 163, 184, 0.35)';
    ctx.fillRect(x, (h - barH) * 0.5, Math.max(1, step * 0.8), barH);
  }

  // 播放进度游标
  const px = progress * w;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - dpr, 0, 2 * dpr, h);
}
