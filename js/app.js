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
  shortcutsDialog: document.getElementById('shortcuts-dialog'),
  challengeDialog: document.getElementById('challenge-dialog'),
  challengeBanner: document.getElementById('challenge-banner'),
  bannerTimerVal: document.getElementById('banner-timer-val'),
  challengeResult: document.getElementById('challenge-result'),
  challengeGrade: document.getElementById('challenge-grade'),
  challengeStats: document.getElementById('challenge-stats'),
  layoutModeBtn: document.getElementById('btn-layout-mode')
};

let blindChallengeActive = false;
let blindTimerId = null;
let blindRemaining = 30;

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
      bpmEl.textContent = (blindChallengeActive && id === 'B') ? '???' : engine.getEffectiveBPM(id).toFixed(1);
    } else {
      titleEl.textContent = '未装盘';
      metaEl.textContent = '— · —';
      bpmEl.textContent = '0.0';
    }

    pctEl.textContent = (blindChallengeActive && id === 'B')
      ? '盲听中'
      : `${d.tempoPercent >= 0 ? '+' : ''}${d.tempoPercent.toFixed(1)}%`;
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
    const echoEl = document.querySelector(`[data-echo="${id}"]`);
    if (echoEl && Math.abs(Number(echoEl.value) - d.echo) > 0.01) {
      echoEl.value = String(d.echo);
    }
    const revEl = document.querySelector(`[data-reverb="${id}"]`);
    if (revEl && Math.abs(Number(revEl.value) - d.reverb) > 0.01) {
      revEl.value = String(d.reverb);
    }
    const flgEl = document.querySelector(`[data-flanger="${id}"]`);
    if (flgEl && Math.abs(Number(flgEl.value) - d.flanger) > 0.01) {
      flgEl.value = String(d.flanger);
    }
    const cueMonBtn = document.querySelector(`[data-cue-mon="${id}"]`);
    if (cueMonBtn) cueMonBtn.classList.toggle('active', d.cueMonitor);
  }
  ui.crossfader.value = String(engine.crossfader);
  const isPro = document.body.classList.contains('pro-mode');
  ui.layoutModeBtn.textContent = isPro ? '模式: Pro' : '模式: Simple';
}

engine.onChange(syncUIWithEngine);

// 事件绑定
let premixController = null;
const premixBtn = document.getElementById('btn-premix-demo');

function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

premixBtn.addEventListener('click', async () => {
  if (premixController) {
    premixController.abort();
    return;
  }
  premixController = new AbortController();
  const { signal } = premixController;
  premixBtn.textContent = '⏹ 停止示范';

  try {
    await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
    await engine.loadTrack('B', 'night-shift', { silentAction: true });
    if (signal.aborted) return;

    engine.setCrossfader(-1, { silentAction: true });
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', -18, { silentAction: true });
    engine.setFilter('A', 0, { silentAction: true });
    engine.play('A', { silentAction: true });

    await abortableSleep(2200, signal);

    engine.syncDeck('B', { silentAction: true });
    engine.play('B', { silentAction: true });

    for (let v = -1; v <= 0; v += 0.1) {
      engine.setCrossfader(v, { silentAction: true });
      await abortableSleep(180, signal);
    }

    // Bass Swap + Filter Sweep
    engine.setEQ('A', 'low', -18, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    await abortableSleep(1200, signal);

    for (let i = 1; i <= 10; i++) {
      engine.setFilter('A', i * 0.06, { silentAction: true });
      engine.setCrossfader(i * 0.1, { silentAction: true });
      await abortableSleep(180, signal);
    }

    engine.triggerSampler('airhorn');
    await abortableSleep(1400, signal);
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  } finally {
    engine.pause('A', { silentAction: true });
    engine.pause('B', { silentAction: true });
    engine.setFilter('A', 0, { silentAction: true });
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    premixController = null;
    premixBtn.textContent = '🎧 高手示范';
  }
});

// 移动端面板切换
const workspaceGrid = document.querySelector('.workspace-grid');
workspaceGrid.dataset.mobileView = 'A';
document.querySelectorAll('.mobile-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mobile-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    workspaceGrid.dataset.mobileView = tab.dataset.mobilePanel;
  });
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

document.querySelectorAll('[data-echo]').forEach((input) => {
  input.addEventListener('input', () => {
    engine.setEcho(input.dataset.echo, Number(input.value));
  });
});

document.querySelectorAll('[data-reverb]').forEach((input) => {
  input.addEventListener('input', () => {
    engine.setReverb(input.dataset.reverb, Number(input.value));
  });
});

document.querySelectorAll('[data-flanger]').forEach((input) => {
  input.addEventListener('input', () => {
    engine.setFlanger(input.dataset.flanger, Number(input.value));
  });
});

document.querySelectorAll('[data-cue-mon]').forEach((btn) => {
  btn.addEventListener('click', () => {
    engine.toggleCueMonitor(btn.dataset.cueMon);
  });
});

document.getElementById('chk-split-cue').addEventListener('change', (e) => {
  engine.setSplitCue(e.target.checked);
});

ui.layoutModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('pro-mode');
  syncUIWithEngine();
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

// 30 秒盲听对拍挑战
function finishBlindChallenge() {
  if (!blindChallengeActive) return;
  clearInterval(blindTimerId);
  blindChallengeActive = false;
  ui.challengeBanner.hidden = true;

  const bpmA = engine.getEffectiveBPM('A');
  const bpmB = engine.getEffectiveBPM('B');
  const diff = Math.abs(bpmA - bpmB);
  engine.pause('A', { silentAction: true });
  engine.pause('B', { silentAction: true });
  syncUIWithEngine();

  let grade = 'C';
  if (diff <= 0.4) grade = 'S';
  else if (diff <= 1.0) grade = 'A';
  else if (diff <= 2.2) grade = 'B';

  ui.challengeGrade.textContent = grade;
  ui.challengeStats.innerHTML = `
    <div>Deck A：<strong>${bpmA.toFixed(1)} BPM</strong> · 你的 Deck B：<strong>${bpmB.toFixed(1)} BPM</strong></div>
    <div>BPM 误差：<strong>${diff.toFixed(2)} BPM</strong>（用时 ${30 - blindRemaining} 秒）</div>
  `;
  ui.challengeResult.hidden = false;
  ui.challengeDialog.showModal();
}

document.getElementById('btn-challenge').addEventListener('click', () => {
  ui.challengeResult.hidden = true;
  ui.challengeDialog.showModal();
});

document.getElementById('btn-challenge-start').addEventListener('click', async () => {
  ui.challengeDialog.close();
  await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
  await engine.loadTrack('B', 'night-shift', { silentAction: true });
  const randomOffset = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 3.5);
  engine.setTempo('A', 0, { silentAction: true });
  engine.setTempo('B', randomOffset, { silentAction: true });
  engine.setCrossfader(0, { silentAction: true });
  engine.play('A', { silentAction: true });
  engine.play('B', { silentAction: true });

  blindChallengeActive = true;
  blindRemaining = 30;
  ui.bannerTimerVal.textContent = '30';
  ui.challengeBanner.hidden = false;
  syncUIWithEngine();

  clearInterval(blindTimerId);
  blindTimerId = setInterval(() => {
    blindRemaining -= 1;
    ui.bannerTimerVal.textContent = String(Math.max(0, blindRemaining));
    if (blindRemaining <= 0) finishBlindChallenge();
  }, 1000);
});

document.getElementById('btn-banner-submit').addEventListener('click', finishBlindChallenge);

document.getElementById('btn-copy-challenge').addEventListener('click', async (e) => {
  const grade = ui.challengeGrade.textContent;
  const text = `🎧 我在 dj.ucncn.cn「30秒盲听对拍挑战」拿到 ${grade} 级！${ui.challengeStats.textContent.replace(/\s+/g, ' ').trim()}`;
  try {
    await navigator.clipboard.writeText(text);
    e.target.textContent = '✓ 已复制战绩';
    setTimeout(() => { e.target.textContent = '📋 复制战绩文案'; }, 1600);
  } catch (_) {}
});

// 生成并下载战绩分享海报 (Canvas 720x420 PNG)
document.getElementById('btn-download-poster').addEventListener('click', () => {
  const c = document.createElement('canvas');
  c.width = 720;
  c.height = 420;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 720, 420);
  grad.addColorStop(0, '#0b0e14');
  grad.addColorStop(1, '#162032');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 420);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 684, 384);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('BACKSPIN 中文版 · dj.ucncn.cn', 44, 68);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('30 秒盲听对拍挑战 · 战绩卡', 44, 120);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 110px sans-serif';
  ctx.fillText(ui.challengeGrade.textContent, 530, 260);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '22px sans-serif';
  const lines = ui.challengeStats.innerText.split('\n').filter(Boolean);
  lines.forEach((line, idx) => {
    ctx.fillText(line.trim(), 44, 210 + idx * 42);
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText('免设备 · 免注册 · 打开浏览器就能学的互动 DJ 教练', 44, 365);

  const link = document.createElement('a');
  link.download = 'dj-challenge-poster.png';
  link.href = c.toDataURL('image/png');
  link.click();
});

// Web MIDI 硬件控制器支持
const midiDialog = document.getElementById('midi-dialog');
const midiStatusEl = document.getElementById('midi-status');
const midiMapListEl = document.getElementById('midi-map-list');
const midiTargets = [
  { id: 'playA', label: 'Deck A 播放/暂停' },
  { id: 'playB', label: 'Deck B 播放/暂停' },
  { id: 'crossfader', label: 'Crossfader 交叉推子' },
  { id: 'tempoA', label: 'Deck A 调速推子' },
  { id: 'tempoB', label: 'Deck B 调速推子' }
];
const midiBindings = new Map();
let learningTarget = null;
let midiInitialized = false;

function renderMidiMappings() {
  midiMapListEl.innerHTML = '';
  for (const t of midiTargets) {
    const bound = midiBindings.get(t.id);
    const row = document.createElement('div');
    row.className = 'midi-map-row';
    row.innerHTML = `
      <span>${t.label}</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="crate-item-meta">${bound ? `CC/Note #${bound}` : '未绑定'}</span>
        <button type="button" class="mini-btn" data-midi-learn="${t.id}">
          ${learningTarget === t.id ? '等待触发…' : '学习'}
        </button>
      </div>
    `;
    midiMapListEl.appendChild(row);
  }
}

midiMapListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-midi-learn]');
  if (!btn) return;
  learningTarget = btn.dataset.midiLearn;
  renderMidiMappings();
});

function handleMidiMessage(msg) {
  const [status, data1, data2] = msg.data;
  const cmd = status & 0xf0;
  const key = `${cmd}:${data1}`;

  if (learningTarget) {
    midiBindings.set(learningTarget, key);
    learningTarget = null;
    renderMidiMappings();
    return;
  }

  for (const [targetId, boundKey] of midiBindings.entries()) {
    if (boundKey !== key) continue;
    if (targetId === 'playA' && data2 > 0) engine.togglePlay('A');
    else if (targetId === 'playB' && data2 > 0) engine.togglePlay('B');
    else if (targetId === 'crossfader') engine.setCrossfader((data2 / 127) * 2 - 1);
    else if (targetId === 'tempoA') engine.setTempo('A', ((data2 / 127) * 2 - 1) * 8);
    else if (targetId === 'tempoB') engine.setTempo('B', ((data2 / 127) * 2 - 1) * 8);
  }
}

async function initWebMidi() {
  renderMidiMappings();
  if (!navigator.requestMIDIAccess) {
    midiStatusEl.textContent = '当前浏览器不支持 Web MIDI API，请使用 Chrome 或 Edge。';
    return;
  }
  if (midiInitialized) return;
  try {
    const access = await navigator.requestMIDIAccess();
    midiInitialized = true;
    const updateInputs = () => {
      const inputs = Array.from(access.inputs.values());
      if (inputs.length === 0) {
        midiStatusEl.textContent = '未检测到外接 MIDI 控制器。请插入 USB 打碟机后刷新或重新打开此面板。';
      } else {
        midiStatusEl.textContent = `已连接设备：${inputs.map((i) => i.name).join('、')}`;
        inputs.forEach((input) => { input.onmidimessage = handleMidiMessage; });
      }
    };
    updateInputs();
    access.onstatechange = updateInputs;
  } catch (_) {
    midiStatusEl.textContent = '未能获取 MIDI 设备权限。';
  }
}

document.getElementById('btn-open-midi').addEventListener('click', () => {
  initWebMidi();
  midiDialog.showModal();
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
  } else if (e.code === 'Backquote') {
    document.body.classList.toggle('pro-mode');
    syncUIWithEngine();
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
