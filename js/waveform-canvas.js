/**
 * 顶部双轨连续实心波形与唱机总览波形渲染器 (1:1 复刻 Backspin 实心包络质感)
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
  const color = deckId === 'A' ? '#7dd3fc' : '#fdba74';
  const dimColor = deckId === 'A' ? 'rgba(125, 211, 252, 0.28)' : 'rgba(253, 186, 116, 0.28)';
  const centerX = Math.floor(w * 0.5);
  const midY = h * 0.5;

  if (!deck.track) return;

  const { peaks, duration, bpm } = deck.track;
  const curTime = engine.getCurrentTime(deckId);
  const windowSec = 8;
  const pxPerSec = w / windowSec;

  // Loop 区间高亮
  if (deck.loop4 && deck.loopEnd > deck.loopStart) {
    const x1 = centerX + (deck.loopStart - curTime) * pxPerSec;
    const x2 = centerX + (deck.loopEnd - curTime) * pxPerSec;
    ctx.fillStyle = 'rgba(134, 239, 172, 0.16)';
    ctx.fillRect(x1, 0, x2 - x1, h);
  }

  // 逐像素计算上下对称连续包络
  const step = Math.max(1, Math.floor(dpr));
  const drawHalf = (startX, endX, fillStyle, coreStyle) => {
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    for (let x = startX; x <= endX; x += step) {
      const t = curTime + (x - centerX) / pxPerSec;
      const amp = samplePeak(peaks, duration, t);
      ctx.lineTo(x, midY - Math.max(1.5 * dpr, amp * (h * 0.46)));
    }
    for (let x = endX; x >= startX; x -= step) {
      const t = curTime + (x - centerX) / pxPerSec;
      const amp = samplePeak(peaks, duration, t);
      ctx.lineTo(x, midY + Math.max(1.5 * dpr, amp * (h * 0.46)));
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();

    if (coreStyle) {
      ctx.beginPath();
      ctx.moveTo(startX, midY);
      for (let x = startX; x <= endX; x += step) {
        const t = curTime + (x - centerX) / pxPerSec;
        const amp = samplePeak(peaks, duration, t);
        ctx.lineTo(x, midY - amp * (h * 0.24));
      }
      for (let x = endX; x >= startX; x -= step) {
        const t = curTime + (x - centerX) / pxPerSec;
        const amp = samplePeak(peaks, duration, t);
        ctx.lineTo(x, midY + amp * (h * 0.24));
      }
      ctx.closePath();
      ctx.fillStyle = coreStyle;
      ctx.fill();
    }
  };

  drawHalf(0, centerX, dimColor, null);
  drawHalf(centerX, w, color, 'rgba(255, 255, 255, 0.65)');

  // 节拍网格线
  const beatDur = 60 / bpm;
  const startBeat = Math.floor((curTime - windowSec / 2) / beatDur);
  const endBeat = Math.ceil((curTime + windowSec / 2) / beatDur);
  for (let b = startBeat; b <= endBeat; b++) {
    const x = centerX + (b * beatDur - curTime) * pxPerSec;
    const isBar = ((b % 4) + 4) % 4 === 0;
    ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // 中心播放头白线
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
  const playX = Math.floor((curTime / duration) * w);
  const color = deckId === 'A' ? '#7dd3fc' : '#fdba74';
  const dimColor = deckId === 'A' ? 'rgba(125, 211, 252, 0.25)' : 'rgba(253, 186, 116, 0.25)';
  const midY = h * 0.5;

  const drawSegment = (x0, x1, fill) => {
    ctx.beginPath();
    ctx.moveTo(x0, midY);
    for (let x = x0; x <= x1; x++) {
      const bin = Math.min(peaks.length - 1, Math.floor((x / w) * peaks.length));
      ctx.lineTo(x, midY - Math.max(1, peaks[bin] * h * 0.45));
    }
    for (let x = x1; x >= x0; x--) {
      const bin = Math.min(peaks.length - 1, Math.floor((x / w) * peaks.length));
      ctx.lineTo(x, midY + Math.max(1, peaks[bin] * h * 0.45));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  drawSegment(0, playX, dimColor);
  drawSegment(playX, w, color);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(playX - dpr, 0, 2 * dpr, h);
}
