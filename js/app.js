import { TRACK_CATALOG, registerLocalAudioFile } from './synth-tracks.js';
import { DJAudioEngine } from './audio-engine.js';
import { drawScrollingWaveform, drawOverviewWaveform } from './waveform-canvas.js';
import { LESSONS } from './lessons-data.js';
import { CoachEngine } from './coach-engine.js';

const engine = new DJAudioEngine();

const ui = {
  lessonBadge: document.getElementById('lesson-progress-badge'),
  coachTag: document.getElementById('coach-lesson-tag'),
  coachTitle: document.getElementById('coach-title'),
  coachDesc: document.getElementById('coach-desc'),
  coachFeedback: document.getElementById('coach-feedback'),
  btnShowMe: document.getElementById('btn-show-me'),
  btnPrev: document.getElementById('btn-coach-prev'),
  btnSkip: document.getElementById('btn-coach-skip'),
  phaseMeter: document.getElementById('phase-meter'),
  crossfader: document.getElementById('crossfader'),
  crateList: document.getElementById('crate-list'),
  lessonsDialog: document.getElementById('lessons-dialog'),
  lessonsDialogList: document.getElementById('lessons-dialog-list'),
  shortcutsDialog: document.getElementById('shortcuts-dialog')
};

const coach = new CoachEngine(engine, {
  updateCoachPanel({ lesson, step, stepNumber, totalSteps, completedCount, totalLessons, isDemoRunning, feedback }) {
    ui.lessonBadge.textContent = `${completedCount} / ${totalLessons}`;
    ui.coachTag.textContent = `第 ${lesson.number} 课 · ${lesson.title} (${stepNumber}/${totalSteps})`;
    ui.coachTitle.textContent = step.title;
    ui.coachDesc.textContent = step.instruction;

    ui.btnShowMe.disabled = isDemoRunning;
    ui.btnPrev.disabled = isDemoRunning;
    ui.btnSkip.disabled = isDemoRunning;

    if (feedback) {
      ui.coachFeedback.hidden = false;
      ui.coachFeedback.className = `coach-feedback ${feedback.type}`;
      ui.coachFeedback.textContent = feedback.text;
    } else {
      ui.coachFeedback.hidden = true;
    }
  }
});

function renderCrate() {
  ui.crateList.innerHTML = '';
  for (const t of TRACK_CATALOG) {
    const row = document.createElement('div');
    row.className = 'crate-item';
    row.innerHTML = `
      <div class="crate-item-info">
        <strong>${t.title}</strong>
        <span class="crate-item-meta">${t.genre} · ${t.bpm} BPM · ${t.key}</span>
      </div>
      <div class="crate-item-btns">
        <button type="button" class="mini-btn" data-load="A:${t.id}">→ A</button>
        <button type="button" class="mini-btn" data-load="B:${t.id}">→ B</button>
      </div>
    `;
    ui.crateList.appendChild(row);
  }
}

function renderLessonsModal() {
  ui.lessonsDialogList.innerHTML = '';
  LESSONS.forEach((lesson, idx) => {
    const done = coach.state.completedLessons.includes(lesson.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lesson-option ${done ? 'done' : ''}`;
    btn.innerHTML = `
      <div>
        <strong>第 ${lesson.number} 课 · ${lesson.title}</strong>
        <div class="crate-item-meta">${lesson.summary}</div>
      </div>
      <span>${done ? '✓ 已完成' : lesson.duration}</span>
    `;
    btn.addEventListener('click', () => {
      coach.selectLesson(idx);
      ui.lessonsDialog.close();
    });
    ui.lessonsDialogList.appendChild(btn);
  });
}

function syncUIWithEngine() {
  for (const id of ['A', 'B']) {
    const d = engine.decks[id];
    const titleEl = document.getElementById(`track-title-${id}`);
    const metaEl = document.getElementById(`track-meta-${id}`);
    const bpmEl = document.getElementById(`bpm-${id}`);
    const pctEl = document.getElementById(`tempo-pct-${id}`);
    const playBtn = document.getElementById(`play-${id}`);
    const loopBtn = document.getElementById(`loop4-${id}`);
    const tempoSlider = document.getElementById(`tempo-${id}`);

    if (d.track) {
      titleEl.textContent = d.track.title;
      metaEl.textContent = `${d.track.genre} · ${d.track.key}`;
      bpmEl.textContent = engine.getEffectiveBPM(id).toFixed(1);
    } else {
      titleEl.textContent = '未装盘';
      metaEl.textContent = '— · —';
      bpmEl.textContent = '0.0';
    }

    pctEl.textContent = `${d.tempoPercent >= 0 ? '+' : ''}${d.tempoPercent.toFixed(1)}%`;
    tempoSlider.value = String(d.tempoPercent);

    playBtn.classList.toggle('active', d.isPlaying);
    playBtn.textContent = d.isPlaying ? 'PAUSE' : 'PLAY';
    loopBtn.classList.toggle('active', d.loop4);

    // 同步 EQ / Filter / Volume 控件值（如 Show me 自动演示改动时）
    for (const band of ['high', 'mid', 'low']) {
      const el = document.querySelector(`[data-eq="${id}:${band}"]`);
      if (el && Number(el.value) !== d.eq[band]) el.value = String(d.eq[band]);
    }
    const filterEl = document.querySelector(`[data-filter="${id}"]`);
    if (filterEl && Math.abs(Number(filterEl.value) - d.filter) > 0.01) {
      filterEl.value = String(d.filter);
    }
  }
  ui.crossfader.value = String(engine.crossfader);
}

engine.onChange(syncUIWithEngine);

// 事件绑定
let premixRunning = false;
let premixAbort = false;
const premixBtn = document.getElementById('btn-premix-demo');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

premixBtn.addEventListener('click', async () => {
  if (premixRunning) {
    premixAbort = true;
    return;
  }
  premixRunning = true;
  premixAbort = false;
  premixBtn.textContent = '⏹ 停止示范';

  try {
    await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
    await engine.loadTrack('B', 'night-shift', { silentAction: true });
    engine.setCrossfader(-1, { silentAction: true });
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', -18, { silentAction: true });
    engine.setFilter('A', 0, { silentAction: true });
    engine.play('A', { silentAction: true });

    await sleep(2200);
    if (premixAbort) return;

    engine.syncDeck('B', { silentAction: true });
    engine.play('B', { silentAction: true });

    for (let v = -1; v <= 0; v += 0.1) {
      if (premixAbort) return;
      engine.setCrossfader(v, { silentAction: true });
      await sleep(180);
    }

    // Bass Swap + Filter Sweep
    engine.setEQ('A', 'low', -18, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    await sleep(1200);

    for (let i = 1; i <= 10; i++) {
      if (premixAbort) return;
      engine.setFilter('A', i * 0.06, { silentAction: true });
      engine.setCrossfader(i * 0.1, { silentAction: true });
      await sleep(180);
    }

    engine.triggerSampler('airhorn');
    await sleep(1400);
  } finally {
    engine.pause('A', { silentAction: true });
    engine.pause('B', { silentAction: true });
    engine.setFilter('A', 0, { silentAction: true });
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    premixRunning = false;
    premixBtn.textContent = '🎧 高手示范';
  }
});

document.getElementById('input-local-audio').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const ctx = engine.ensureContext();
  for (const f of files) {
    try {
      await registerLocalAudioFile(ctx, f);
    } catch (err) {
      console.error('本地音频解码失败:', f.name, err);
    }
  }
  renderCrate();
  e.target.value = '';
});

document.getElementById('btn-load-demo-pair').addEventListener('click', async () => {
  await engine.loadTrack('A', 'sunrise-house');
  await engine.loadTrack('B', 'night-shift');
  engine.setCrossfader(-1, { silentAction: true });
});

document.getElementById('master-volume').addEventListener('input', (e) => {
  engine.setMasterVolume(Number(e.target.value));
});

ui.crossfader.addEventListener('input', (e) => {
  engine.setCrossfader(Number(e.target.value));
});

for (const id of ['A', 'B']) {
  document.getElementById(`play-${id}`).addEventListener('click', () => engine.togglePlay(id));
  document.getElementById(`cue-${id}`).addEventListener('click', () => engine.cueAction(id));
  document.getElementById(`sync-${id}`).addEventListener('click', () => engine.syncDeck(id));
  document.getElementById(`loop4-${id}`).addEventListener('click', () => engine.toggleLoop4(id));
  document.getElementById(`tempo-${id}`).addEventListener('input', (e) => {
    engine.setTempo(id, Number(e.target.value));
  });
}

document.querySelectorAll('[data-hotcue]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const [deck, idx] = btn.dataset.hotcue.split(':');
    engine.triggerHotCue(deck, Number(idx));
  });
});

document.querySelectorAll('[data-eq]').forEach((input) => {
  input.addEventListener('input', () => {
    const [deck, band] = input.dataset.eq.split(':');
    engine.setEQ(deck, band, Number(input.value));
  });
});

document.querySelectorAll('[data-filter]').forEach((input) => {
  input.addEventListener('input', () => {
    engine.setFilter(input.dataset.filter, Number(input.value));
  });
});

document.querySelectorAll('[data-vol]').forEach((input) => {
  input.addEventListener('input', () => {
    engine.setChannelVolume(input.dataset.vol, Number(input.value));
  });
});

document.querySelectorAll('[data-sampler]').forEach((btn) => {
  btn.addEventListener('click', () => engine.triggerSampler(btn.dataset.sampler));
});

ui.crateList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-load]');
  if (!btn) return;
  const [deck, trackId] = btn.dataset.load.split(':');
  engine.loadTrack(deck, trackId);
});

// 波形点击/拖拽跳转
document.querySelectorAll('.overview-canvas').forEach((canvas) => {
  canvas.addEventListener('click', (e) => {
    const deckId = canvas.dataset.deck;
    const deck = engine.decks[deckId];
    if (!deck.track) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    engine.seek(deckId, ratio * deck.track.duration);
  });
});

// 黑胶唱盘按住搓碟交互
document.querySelectorAll('.vinyl-platter').forEach((platter) => {
  const deckId = platter.dataset.deck;
  let dragging = false;
  let lastX = 0;

  platter.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    platter.setPointerCapture(e.pointerId);
  });

  platter.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    engine.setScratchDelta(deckId, Math.max(-0.6, Math.min(0.8, dx * 0.04)));
  });

  const endScratch = () => {
    if (!dragging) return;
    dragging = false;
    engine.setScratchDelta(deckId, 0);
  };
  platter.addEventListener('pointerup', endScratch);
  platter.addEventListener('pointercancel', endScratch);
});

// 教练按钮与弹窗
ui.btnShowMe.addEventListener('click', () => coach.runShowMe());
ui.btnPrev.addEventListener('click', () => coach.prevStep());
ui.btnSkip.addEventListener('click', () => coach.skipStep());

document.getElementById('btn-open-lessons').addEventListener('click', () => {
  renderLessonsModal();
  ui.lessonsDialog.showModal();
});

document.getElementById('btn-reset-progress').addEventListener('click', () => {
  coach.resetProgress();
  renderLessonsModal();
});

document.getElementById('btn-open-shortcuts').addEventListener('click', () => {
  ui.shortcutsDialog.showModal();
});

// Dialog closedby="any" 渐进增强兜底（遵循 modern-web-guidance dialog 规范）
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
    dialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && outside(e, dialog)) dialog.close();
    });
  }
}

// 键盘快捷键
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    engine.togglePlay('A');
  } else if (e.code === 'Enter' && !ui.lessonsDialog.open && !ui.shortcutsDialog.open) {
    e.preventDefault();
    engine.togglePlay('B');
  } else if (e.key === 's' || e.key === 'S') {
    engine.syncDeck('B');
  } else if (e.key === 'ArrowLeft') {
    engine.setCrossfader(engine.crossfader - 0.1);
  } else if (e.key === 'ArrowRight') {
    engine.setCrossfader(engine.crossfader + 0.1);
  } else if (e.key === '?') {
    if (ui.shortcutsDialog.open) ui.shortcutsDialog.close();
    else ui.shortcutsDialog.showModal();
  } else if (['1', '2', '3', '4'].includes(e.key)) {
    const pads = ['airhorn', 'rewind', 'laser', 'riser'];
    engine.triggerSampler(pads[Number(e.key) - 1]);
  }
});

// 60fps 动画循环：波形、黑胶旋转、小节灯、相位差、VU 电平
const platterAngles = { A: 0, B: 0 };
let lastFrame = performance.now();

function animate(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;

  for (const id of ['A', 'B']) {
    drawScrollingWaveform(document.getElementById(`wave-scroll-${id}`), engine, id);
    drawOverviewWaveform(document.getElementById(`wave-overview-${id}`), engine, id);

    const d = engine.decks[id];
    if (d.isPlaying) {
      platterAngles[id] = (platterAngles[id] + dt * 120 * engine.getPlaybackRate(id)) % 360;
      document.getElementById(`platter-${id}`).style.transform = `rotate(${platterAngles[id]}deg)`;
    }

    // 4拍小节灯
    const beatInfo = engine.getBeatInfo(id);
    const dots = document.querySelectorAll(`#beats-${id} span`);
    dots.forEach((dot, idx) => {
      const active = d.track && (idx + 1 === beatInfo.beatInBar);
      dot.classList.toggle('on', Boolean(active));
      dot.classList.toggle('bar-start', idx === 0);
    });

    // VU 电平表
    const lvl = engine.getLevel(id);
    document.getElementById(`vu-${id}`).style.height = `${Math.round(lvl * 100)}%`;
  }

  // 相位对齐指示
  if (engine.decks.A.isPlaying && engine.decks.B.isPlaying && engine.decks.A.track && engine.decks.B.track) {
    const bA = engine.getBeatInfo('A').phase;
    const bB = engine.getBeatInfo('B').phase;
    let diff = bB - bA;
    if (diff > 0.5) diff -= 1;
    if (diff < -0.5) diff += 1;
    const ms = Math.round(diff * (60000 / engine.getEffectiveBPM('A')));
    if (Math.abs(ms) <= 22) {
      ui.phaseMeter.textContent = '节拍已同步 ✓';
      ui.phaseMeter.classList.add('synced');
    } else {
      ui.phaseMeter.textContent = ms > 0 ? `B 领先 ${ms} ms` : `B 落后 ${Math.abs(ms)} ms`;
      ui.phaseMeter.classList.remove('synced');
    }
  } else {
    ui.phaseMeter.textContent = '播放双盘可实时对比节拍';
    ui.phaseMeter.classList.remove('synced');
  }

  requestAnimationFrame(animate);
}

// 初始化渲染
renderCrate();
syncUIWithEngine();
coach.renderStep();
requestAnimationFrame(animate);
