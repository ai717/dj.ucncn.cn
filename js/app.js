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
  setList: document.getElementById('set-list'),
  lessonsDialog: document.getElementById('lessons-dialog'),
  lessonsDialogList: document.getElementById('lessons-dialog-list'),
  shortcutsDialog: document.getElementById('shortcuts-dialog'),
  challengeDialog: document.getElementById('challenge-dialog'),
  challengeBanner: document.getElementById('challenge-banner'),
  bannerTimerVal: document.getElementById('banner-timer-val'),
  challengeResult: document.getElementById('challenge-result'),
  challengeGrade: document.getElementById('challenge-grade'),
  challengeStats: document.getElementById('challenge-stats'),
  btnSimple: document.getElementById('btn-mode-simple'),
  btnPro: document.getElementById('btn-mode-pro')
};

let blindChallengeActive = false;
let blindTimerId = null;
let blindRemaining = 30;
let crateFilter = '';
let crateSort = null;
let crateSortAsc = true;
const setQueue = [];
const customSamplerBuffers = new Map();
const activeFxMode = { A: 'echo', B: 'echo' };

const coach = new CoachEngine(engine, {
  updateCoachPanel({ lesson, step, stepNumber, totalSteps, completedCount, totalLessons, isLessonActive, isDemoRunning, feedback }) {
    ui.lessonBadge.textContent = `${completedCount}/${totalLessons}`;
    const fill = document.getElementById('lesson-meter-fill');
    const txt = document.getElementById('lesson-meter-text');
    if (fill) fill.style.width = `${Math.round((completedCount / totalLessons) * 100)}%`;
    if (txt) txt.textContent = `${completedCount}/${totalLessons}`;
    ui.coachTag.textContent = `第 ${lesson.number} / ${totalLessons} 课 · ${lesson.title} (${stepNumber}/${totalSteps})`;
    ui.coachTitle.textContent = isLessonActive ? step.title : `${lesson.title}（自由练习模式）`;
    ui.coachDesc.textContent = isLessonActive ? step.instruction : '点击右侧「继续上课」开启高亮引导，或自由打碟练习。';
    const toggleBtn = document.getElementById('btn-coach-toggle');
    if (toggleBtn) toggleBtn.textContent = isLessonActive ? '退出引导' : '继续上课';

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

let crateSource = 'all'; // 'all' | 'local'
let setTab = 'queue';    // 'queue' | 'played'
const playedTracks = [];

function trackDurationSec(t) {
  return Math.round(((t.bars || 8) * 4 * 60) / (t.bpm || 120));
}

function fmtShortTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function renderMixesWellNext() {
  const bar = document.getElementById('mixes-well-bar');
  if (!bar) return;
  const activeDeck = engine.decks.A.isPlaying ? 'A' : engine.decks.B.isPlaying ? 'B' : 'A';
  const cur = engine.decks[activeDeck].track;
  if (!cur) { bar.innerHTML = ''; return; }
  const curKey = (cur.key || '').split('·')[0].trim();
  const targetDeck = activeDeck === 'A' ? 'B' : 'A';
  const matches = TRACK_CATALOG.filter((t) => t.id !== cur.id).filter((t) => {
    const k = (t.key || '').split('·')[0].trim();
    const keyOk = k === curKey || k[0] === curKey[0];
    const bpmOk = Math.abs(t.bpm - cur.bpm) <= 10;
    return keyOk || bpmOk;
  }).slice(0, 2);

  if (!matches.length) { bar.innerHTML = ''; return; }
  bar.innerHTML = `<span>推荐接歌：</span>` + matches.map((m) =>
    `<button type="button" class="mix-chip" data-mix-load="${targetDeck}:${m.id}">${m.title} · ${m.bpm} BPM → ${targetDeck}</button>`
  ).join('');
}

function renderCrate() {
  ui.crateList.innerHTML = '';
  let list = TRACK_CATALOG.filter((t) => {
    if (crateSource === 'local' && !t.id.startsWith('local-')) return false;
    if (!crateFilter) return true;
    const q = crateFilter.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q);
  });
  if (crateSort) {
    list = [...list].sort((a, b) => {
      const av = a[crateSort];
      const bv = b[crateSort];
      if (typeof av === 'string') return crateSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return crateSortAsc ? av - bv : bv - av;
    });
  }
  if (list.length === 0) {
    ui.crateList.innerHTML = '<div class="crate-item-meta" style="padding:10px;">暂无匹配的曲目，点击「+ 添加音乐」或「+ 添加文件夹」导入本地音频。</div>';
    renderMixesWellNext();
    return;
  }
  for (const t of list) {
    const onA = engine.decks.A.track?.id === t.id;
    const onB = engine.decks.B.track?.id === t.id;
    const played = playedTracks.some((p) => p.id === t.id);
    const badgeA = onA ? '<span class="crate-deck-pill deck-a">A</span>' : '';
    const badgeB = onB ? '<span class="crate-deck-pill deck-b">B</span>' : '';
    const check = played ? '<span class="crate-check">✓</span>' : '';
    const keyShort = (t.key || '—').split('·')[0].trim();
    const row = document.createElement('div');
    row.className = `crate-item compact-row ${onA || onB ? 'loaded' : ''}`;
    row.innerHTML = `
      <span class="crate-song">${badgeA}${badgeB}<strong>${t.title}</strong>${check}</span>
      <span class="crate-col">${keyShort}</span>
      <span class="crate-col">${t.bpm.toFixed(1)}</span>
      <span class="crate-col">${t.energy}</span>
      <span class="crate-col">${fmtShortTime(trackDurationSec(t))}</span>
      <div class="crate-item-btns">
        <button type="button" class="hw-sm" data-load="A:${t.id}">→ A</button>
        <button type="button" class="hw-sm" data-load="B:${t.id}">→ B</button>
        <button type="button" class="hw-sm" data-add-set="${t.id}">+ 待播</button>
      </div>
    `;
    ui.crateList.appendChild(row);
  }
  renderMixesWellNext();
}

function renderSetList() {
  document.getElementById('played-count').textContent = String(playedTracks.length);
  const items = setTab === 'queue' ? setQueue : playedTracks;
  const totalSec = items.reduce((acc, t) => acc + trackDurationSec(t), 0);
  document.getElementById('set-summary').textContent = `${items.length} 首 · ${fmtShortTime(totalSec)}`;
  ui.setList.innerHTML = '';
  if (items.length === 0) {
    ui.setList.innerHTML = setTab === 'queue'
      ? '<div class="crate-item-meta" style="padding:10px;">在左侧曲库点击「+ 待播」按演出顺序排入歌曲，点击「自动连播」即可连续自动混音。</div>'
      : '<div class="crate-item-meta" style="padding:10px;">本次会话还没有播放记录。</div>';
    return;
  }
  items.forEach((t, idx) => {
    const row = document.createElement('div');
    row.className = 'set-row';
    const isFirst = idx === 0;
    const isLast = idx === items.length - 1;
    row.innerHTML = `
      <span class="set-idx">${idx + 1}</span>
      <span class="crate-song"><strong>${t.title}</strong></span>
      <span class="crate-col" style="text-align:right;">${Math.round(t.bpm)}</span>
      <div class="crate-item-btns">
        ${setTab === 'queue' ? `
          <button type="button" class="hw-sm set-icon-btn" data-move-up="${idx}" ${isFirst ? 'disabled' : ''} title="上移">↑</button>
          <button type="button" class="hw-sm set-icon-btn" data-move-down="${idx}" ${isLast ? 'disabled' : ''} title="下移">↓</button>
          <button type="button" class="hw-sm set-icon-btn" data-remove-set="${idx}" title="移出">×</button>
        ` : `
          <button type="button" class="hw-sm" data-load="A:${t.id}">→ A</button>
          <button type="button" class="hw-sm" data-load="B:${t.id}">→ B</button>
        `}
      </div>
    `;
    ui.setList.appendChild(row);
  });
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

function describeKnobArc(deg) {
  if (Math.abs(deg) < 1) return '';
  const r = 19;
  const cx = 24;
  const cy = 24;
  const startRad = -Math.PI / 2;
  const endRad = ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const sweep = deg > 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function updateKnobVisual(knobUnit, val) {
  const min = Number(knobUnit.dataset.min);
  const max = Number(knobUnit.dataset.max);
  const def = Number(knobUnit.dataset.default ?? (min + max) / 2);
  let deg = 0;
  if (val >= def) {
    const span = max - def || 1;
    deg = Math.min(1, (val - def) / span) * 135;
  } else {
    const span = def - min || 1;
    deg = -Math.min(1, (def - val) / span) * 135;
  }
  knobUnit.dataset.val = String(val);
  const rotor = knobUnit.querySelector('.knob-rotor');
  if (rotor) rotor.setAttribute('transform', `rotate(${deg.toFixed(1)} 24 24)`);

  // 动态外环亮色弧线（CH A 冰蓝 #8ecfe0，CH B 暖橙 #eab88c）
  const svg = knobUnit.querySelector('.knob-svg');
  if (svg) {
    let arc = svg.querySelector('.knob-arc');
    if (!arc) {
      arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arc.setAttribute('class', 'knob-arc');
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke-width', '2.6');
      arc.setAttribute('stroke-linecap', 'round');
      const key = knobUnit.dataset.knob || '';
      const color = key.includes(':A') ? '#8ecfe0' : key.includes(':B') ? '#eab88c' : '#ecebe8';
      arc.setAttribute('stroke', color);
      svg.insertBefore(arc, svg.querySelector('.knob-rotor'));
    }
    arc.setAttribute('d', describeKnobArc(deg));
  }
}

function setLayoutMode(isPro) {
  document.body.classList.toggle('pro-mode', isPro);
  ui.btnSimple.classList.toggle('active', !isPro);
  ui.btnPro.classList.toggle('active', isPro);
}

function syncUIWithEngine() {
  for (const id of ['A', 'B']) {
    const d = engine.decks[id];
    const titleEl = document.getElementById(`track-title-${id}`);
    const keyCodeEl = document.getElementById(`key-code-${id}`);
    const keyNameEl = document.getElementById(`key-name-${id}`);
    const bpmEl = document.getElementById(`bpm-${id}`);
    const pctEl = document.getElementById(`tempo-pct-${id}`);
    const playBtn = document.getElementById(`play-${id}`);
    const loopBtn = document.getElementById(`loop4-${id}`);
    const tempoSlider = document.getElementById(`tempo-${id}`);

    if (d.track) {
      titleEl.textContent = d.track.title;
      const [kCode = '—', kName = ''] = (d.track.key || '—').split('·').map((s) => s.trim());
      if (keyCodeEl) keyCodeEl.textContent = kCode;
      if (keyNameEl) keyNameEl.textContent = kName;
      bpmEl.textContent = (blindChallengeActive && id === 'B') ? '???' : engine.getEffectiveBPM(id).toFixed(1);
    } else {
      titleEl.textContent = '未装盘';
      if (keyCodeEl) keyCodeEl.textContent = '—';
      if (keyNameEl) keyNameEl.textContent = '';
      bpmEl.textContent = '0.0';
    }

    pctEl.textContent = (blindChallengeActive && id === 'B')
      ? '盲听中'
      : `BPM · ${d.tempoPercent >= 0 ? '+' : ''}${d.tempoPercent.toFixed(1)}%`;
    tempoSlider.value = String(d.tempoPercent);

    playBtn.classList.toggle('active', d.isPlaying);
    playBtn.textContent = d.isPlaying ? '❚❚' : '▶';
    loopBtn.classList.toggle('active', d.loop4);
    const deckEl = document.querySelector(`.deck-panel[data-deck="${id}"]`);
    if (deckEl) deckEl.classList.toggle('playing', d.isPlaying);

    // 同步圆形旋钮角度
    const gainKnob = document.querySelector(`[data-knob="gain:${id}"]`);
    if (gainKnob) updateKnobVisual(gainKnob, d.gainTrim);
    for (const band of ['high', 'mid', 'low']) {
      const k = document.querySelector(`[data-knob="eq:${id}:${band}"]`);
      if (k) updateKnobVisual(k, d.eq[band]);
    }
    const filterKnob = document.querySelector(`[data-knob="filter:${id}"]`);
    if (filterKnob) updateKnobVisual(filterKnob, d.filter);

    const cueMonBtn = document.querySelector(`[data-cue-mon="${id}"]`);
    if (cueMonBtn) cueMonBtn.classList.toggle('active', d.cueMonitor);

    // Hot Cue 仅在用户实际打点后亮起实心色块
    document.querySelectorAll(`[data-hotcue^="${id}:"]`).forEach((btn) => {
      const idx = Number(btn.dataset.hotcue.split(':')[1]);
      btn.classList.toggle('set', Boolean(d.track && d.hotCues[idx] !== null && d.hotCues[idx] !== undefined));
    });

    // FX 按钮激活态
    const fxMode = activeFxMode[id];
    document.querySelectorAll(`[data-fx-toggle^="${id}:"]`).forEach((btn) => {
      const [, mode] = btn.dataset.fxToggle.split(':');
      btn.classList.toggle('active', mode === fxMode && d[mode] > 0);
    });
    const fxSlider = document.querySelector(`[data-fx-wet="${id}"]`);
    if (fxSlider) fxSlider.value = String(d[fxMode] || 0);

    // Pro 模式状态同步：调速范围、效果拍数、锁调/滑移、分轨
    const rangeBtn = document.querySelector(`[data-tempo-range="${id}"]`);
    if (rangeBtn) {
      rangeBtn.textContent = `±${d.tempoRange}%`;
      tempoSlider.min = String(-d.tempoRange);
      tempoSlider.max = String(d.tempoRange);
    }
    const fxDivBtn = document.querySelector(`[data-fx-div="${id}"]`);
    if (fxDivBtn) fxDivBtn.textContent = d.fxBeatDiv === 0.25 ? '1/4' : d.fxBeatDiv === 0.5 ? '1/2' : '1';
    for (const mKey of ['keyLock', 'slipMode']) {
      const mBtn = document.querySelector(`[data-mode-toggle="${id}:${mKey}"]`);
      if (mBtn) mBtn.classList.toggle('active', Boolean(d[mKey]));
    }
    for (const sKey of ['vocal', 'drums', 'bass', 'other']) {
      const sBtn = document.querySelector(`[data-stem="${id}:${sKey}"]`);
      if (sBtn) sBtn.classList.toggle('active', Boolean(d.stems[sKey]));
    }
    const splitBtn = document.querySelector(`.tagged-row > [data-stem-split="${id}"]`);
    const stemGroup = document.querySelector(`[data-stem-group="${id}"]`);
    if (splitBtn && stemGroup) {
      splitBtn.hidden = Boolean(d.stemsExpanded);
      stemGroup.hidden = !d.stemsExpanded;
    }
    const keyValBtn = document.querySelector(`[data-key-reset="${id}"]`);
    if (keyValBtn) {
      const ks = d.keyShift || 0;
      keyValBtn.textContent = ks > 0 ? `+${ks}` : String(ks);
      keyValBtn.classList.toggle('active', ks !== 0);
    }
    const revBtn = document.querySelector(`[data-rev="${id}"]`);
    if (revBtn) revBtn.classList.toggle('active', Boolean(d.reversePlay));
  }

  document.querySelectorAll('[data-automix-beats]').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.automixBeats) === engine.autoMixBeats);
  });
  const qBtn = document.getElementById('btn-quantize-toggle');
  if (qBtn) qBtn.classList.toggle('active', engine.quantize);
  const zoomOutBtn = document.getElementById('btn-wave-zoom-out');
  const zoomInBtn = document.getElementById('btn-wave-zoom-in');
  if (zoomOutBtn) zoomOutBtn.disabled = engine.waveformWindowSec >= 23.9;
  if (zoomInBtn) zoomInBtn.disabled = engine.waveformWindowSec <= 1.55;
  const cueMixKnob = document.querySelector('[data-knob="cuemix"]');
  if (cueMixKnob) updateKnobVisual(cueMixKnob, engine.cueMix);
  const phonesKnob = document.querySelector('[data-knob="phones"]');
  if (phonesKnob) updateKnobVisual(phonesKnob, engine.phonesVol);

  const masterKnob = document.querySelector('[data-knob="master"]');
  if (masterKnob) updateKnobVisual(masterKnob, engine.masterVolume);
  renderCrate();
  ui.crossfader.value = String(engine.crossfader);
  const recBtn = document.getElementById('btn-rec');
  if (recBtn) {
    recBtn.classList.toggle('recording', engine.isRecording);
    recBtn.innerHTML = engine.isRecording ? '<span class="rec-dot"></span>停止' : '<span class="rec-dot"></span>录音';
  }
  const curveBtn = document.getElementById('btn-curve-toggle');
  if (curveBtn) {
    curveBtn.textContent = engine.cutCurve ? '搓碟切割' : '平滑曲线';
    curveBtn.classList.toggle('active', engine.cutCurve);
  }
  const phonesSel = document.getElementById('sel-headphones-mode');
  if (phonesSel && phonesSel.value !== 'second') {
    phonesSel.value = engine.splitCue ? 'split' : 'off';
  }
}

engine.onChange(syncUIWithEngine);

// 圆形硬件旋钮上下拖动 + 双击复位
document.querySelectorAll('.knob-unit').forEach((unit) => {
  let dragging = false;
  let startY = 0;
  let startVal = 0;

  const applyVal = (v) => {
    const min = Number(unit.dataset.min);
    const max = Number(unit.dataset.max);
    const clamped = Math.max(min, Math.min(max, v));
    const parts = unit.dataset.knob.split(':');
    if (parts[0] === 'gain') engine.setGainTrim(parts[1], clamped);
    else if (parts[0] === 'eq') engine.setEQ(parts[1], parts[2], clamped);
    else if (parts[0] === 'filter') engine.setFilter(parts[1], clamped);
    else if (parts[0] === 'master') engine.setMasterVolume(clamped);
    else if (parts[0] === 'cuemix') engine.setCueMix(clamped);
    else if (parts[0] === 'phones') engine.setPhonesVol(clamped);
  };

  unit.addEventListener('pointerdown', (e) => {
    dragging = true;
    startY = e.clientY;
    startVal = Number(unit.dataset.val);
    unit.setPointerCapture(e.pointerId);
  });

  unit.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const min = Number(unit.dataset.min);
    const max = Number(unit.dataset.max);
    const delta = (startY - e.clientY) / 90;
    applyVal(startVal + delta * (max - min));
  });

  const stop = () => { dragging = false; };
  unit.addEventListener('pointerup', stop);
  unit.addEventListener('pointercancel', stop);
  unit.addEventListener('dblclick', () => applyVal(Number(unit.dataset.default)));
});

// 顶部 Premixes / 模式切换 / 装盘 / 录音
let premixController = null;
const premixBtn = document.getElementById('btn-premix-demo');
function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
    function onAbort() { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const premixDialog = document.getElementById('premix-dialog');

async function runPremixDemo(premixId) {
  if (premixController) premixController.abort();
  premixController = new AbortController();
  const { signal } = premixController;
  premixBtn.textContent = '⏹ 停止示范';
  try {
    // 统一初始化混音台状态
    engine.setFilter('A', 0, { silentAction: true });
    engine.setFilter('B', 0, { silentAction: true });
    engine.setEcho('A', 0);
    engine.setEcho('B', 0);
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    engine.setCutCurve(false);

    if (premixId === 'sunset-to-skyline') {
      // 1. 落日到天际线：落日迪斯科 -> 晨曦浩室 -> 深夜铁克诺（两段低音置换长混音）
      await engine.loadTrack('A', 'golden-hour', { silentAction: true });
      await engine.loadTrack('B', 'sunrise-house', { silentAction: true });
      if (signal.aborted) return;
      engine.setCrossfader(-1, { silentAction: true });
      engine.setEQ('B', 'low', -18, { silentAction: true });
      engine.play('A', { silentAction: true });
      await abortableSleep(3200, signal);

      engine.syncDeck('B', { silentAction: true });
      engine.play('B', { silentAction: true });
      for (let i = 1; i <= 10; i++) {
        engine.setCrossfader(-1 + i * 0.1, { silentAction: true });
        await abortableSleep(260, signal);
      }
      engine.setEQ('A', 'low', -18, { silentAction: true });
      engine.setEQ('B', 'low', 0, { silentAction: true });
      await abortableSleep(2600, signal);
      for (let i = 1; i <= 10; i++) {
        engine.setFilter('A', i * 0.055, { silentAction: true });
        engine.setCrossfader(i * 0.1, { silentAction: true });
        await abortableSleep(240, signal);
      }
      engine.pause('A', { silentAction: true, instant: true });
      engine.setFilter('A', 0, { silentAction: true });
      engine.setEQ('A', 'low', -18, { silentAction: true });
      await abortableSleep(1200, signal);

      // 第二段过渡：B(晨曦浩室) -> A(深夜铁克诺)
      await engine.loadTrack('A', 'night-shift', { silentAction: true });
      if (signal.aborted) return;
      engine.syncDeck('A', { silentAction: true });
      engine.play('A', { silentAction: true });
      for (let i = 1; i <= 10; i++) {
        engine.setCrossfader(1 - i * 0.1, { silentAction: true });
        await abortableSleep(260, signal);
      }
      engine.setEQ('B', 'low', -18, { silentAction: true });
      engine.setEQ('A', 'low', 0, { silentAction: true });
      await abortableSleep(2600, signal);
      for (let i = 1; i <= 10; i++) {
        engine.setFilter('B', i * 0.055, { silentAction: true });
        engine.setCrossfader(-i * 0.1, { silentAction: true });
        await abortableSleep(220, signal);
      }
      await abortableSleep(2000, signal);
    } else if (premixId === 'all-the-tricks') {
      // 2. 全套花式连招：滤波铺垫 + 同步切歌 + 递减循环 + 搓碟 + 回声 + 黑胶急刹
      await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
      await engine.loadTrack('B', 'night-shift', { silentAction: true });
      if (signal.aborted) return;
      engine.setCrossfader(-1, { silentAction: true });
      engine.setEQ('B', 'low', -18, { silentAction: true });
      engine.play('A', { silentAction: true });

      // 滤波铺垫
      for (let i = 1; i <= 8; i++) {
        engine.setFilter('A', i * 0.05, { silentAction: true });
        await abortableSleep(220, signal);
      }
      engine.setFilter('A', 0, { silentAction: true });

      // 同步并推入 B 盘
      engine.syncDeck('B', { silentAction: true });
      engine.play('B', { silentAction: true });
      for (let i = 1; i <= 10; i++) {
        engine.setCrossfader(-1 + i * 0.1, { silentAction: true });
        await abortableSleep(180, signal);
      }
      engine.setEQ('A', 'low', -18, { silentAction: true });
      engine.setEQ('B', 'low', 0, { silentAction: true });
      for (let i = 1; i <= 10; i++) {
        engine.setCrossfader(i * 0.1, { silentAction: true });
        await abortableSleep(150, signal);
      }
      engine.pause('A', { silentAction: true, instant: true });

      // 4 -> 2 -> 1 拍递减循环加速 + 空气喇叭 Drop
      engine.toggleLoop4('B', { silentAction: true });
      await abortableSleep(1800, signal);
      engine.halveLoop('B');
      await abortableSleep(1100, signal);
      engine.halveLoop('B');
      await abortableSleep(900, signal);
      engine.toggleLoop4('B', { silentAction: true });
      engine.triggerSampler('airhorn');
      await abortableSleep(1400, signal);

      // 实时短搓碟
      engine.beginScratch('B');
      for (let k = 0; k < 3; k++) {
        engine.moveScratch('B', -0.06, -1.4);
        await abortableSleep(110, signal);
        engine.moveScratch('B', 0.07, 1.5);
        await abortableSleep(110, signal);
      }
      engine.endScratch('B');
      await abortableSleep(1000, signal);

      // 回声淡出 + 黑胶急刹
      engine.setEcho('B', 0.55);
      await abortableSleep(1400, signal);
      engine.vinylBrake('B');
      await abortableSleep(1200, signal);
    } else if (premixId === 'scratch-session') {
      // 3. 嘻哈搓碟秀：低潮律动打底 + 霓虹人声吉他婴儿搓 / 前推切音 / 横推截断
      await engine.loadTrack('A', 'low-tide', { silentAction: true });
      await engine.loadTrack('B', 'neon-vocal', { silentAction: true });
      if (signal.aborted) return;
      engine.setCutCurve(true);
      engine.setCrossfader(-1, { silentAction: true });
      engine.play('A', { silentAction: true });
      await abortableSleep(1800, signal);

      engine.setCrossfader(0, { silentAction: true });
      engine.seek('B', 1.2, { silentAction: true });

      // 婴儿搓（Baby Scratch）
      engine.beginScratch('B');
      for (let k = 0; k < 4; k++) {
        engine.moveScratch('B', 0.08, 1.35);
        await abortableSleep(140, signal);
        engine.moveScratch('B', -0.08, -1.35);
        await abortableSleep(140, signal);
      }
      engine.endScratch('B');
      await abortableSleep(500, signal);

      // 前推切音（Forward Cut）
      for (let k = 0; k < 4; k++) {
        engine.setCrossfader(0, { silentAction: true });
        engine.beginScratch('B');
        engine.moveScratch('B', 0.11, 1.5);
        await abortableSleep(170, signal);
        engine.setCrossfader(-1, { silentAction: true });
        engine.moveScratch('B', -0.11, -1.6);
        await abortableSleep(150, signal);
        engine.endScratch('B');
      }

      // 横推截断（Transformer）
      engine.play('B', { silentAction: true });
      for (let k = 0; k < 8; k++) {
        engine.setCrossfader(k % 2 === 0 ? 0.15 : -1, { silentAction: true });
        await abortableSleep(130, signal);
      }
      engine.setCrossfader(0, { silentAction: true });
      await abortableSleep(900, signal);
      engine.vinylSpinback('B');
      await abortableSleep(900, signal);
    }
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  } finally {
    engine.endScratch('A');
    engine.endScratch('B');
    if (engine.decks.A.loop4) engine.toggleLoop4('A', { silentAction: true });
    if (engine.decks.B.loop4) engine.toggleLoop4('B', { silentAction: true });
    engine.pause('A', { silentAction: true, instant: true });
    engine.pause('B', { silentAction: true, instant: true });
    engine.setFilter('A', 0, { silentAction: true });
    engine.setFilter('B', 0, { silentAction: true });
    engine.setEcho('A', 0);
    engine.setEcho('B', 0);
    engine.setEQ('A', 'low', 0, { silentAction: true });
    engine.setEQ('B', 'low', 0, { silentAction: true });
    engine.setCutCurve(false);
    premixController = null;
    premixBtn.textContent = '高手示范';
  }
}

premixBtn.addEventListener('click', () => {
  if (premixController) {
    premixController.abort();
    return;
  }
  premixDialog.showModal();
});

document.querySelectorAll('[data-premix-id]').forEach((btn) => {
  btn.addEventListener('click', () => {
    premixDialog.close();
    runPremixDemo(btn.dataset.premixId);
  });
});

ui.btnSimple.addEventListener('click', () => setLayoutMode(false));
ui.btnPro.addEventListener('click', () => setLayoutMode(true));

// Pro 模式专属交互：紧凑视图、波形缩放、调速范围、网格/测速、效果拍数、分轨、自动混音拍数、量化
const compactBtn = document.getElementById('btn-compact-mode');
compactBtn.addEventListener('click', () => {
  const on = document.body.classList.toggle('compact-mode');
  compactBtn.classList.toggle('active', on);
});

document.getElementById('btn-wave-zoom-out').addEventListener('click', () => engine.zoomWaveform(1.35));
document.getElementById('btn-wave-zoom-in').addEventListener('click', () => engine.zoomWaveform(1 / 1.35));

document.querySelectorAll('[data-tempo-range]').forEach((b) => {
  b.addEventListener('click', () => engine.toggleTempoRange(b.dataset.tempoRange));
});

document.querySelectorAll('[data-bpm-scale]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, factor] = b.dataset.bpmScale.split(':');
    engine.scaleTrackBpm(deck, Number(factor));
  });
});

document.querySelectorAll('[data-grid-shift]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, delta] = b.dataset.gridShift.split(':');
    engine.shiftGrid(deck, Number(delta));
  });
});

document.querySelectorAll('[data-bpm-nudge]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, delta] = b.dataset.bpmNudge.split(':');
    engine.nudgeTrackBpm(deck, Number(delta));
  });
});

document.querySelectorAll('[data-key-shift]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, delta] = b.dataset.keyShift.split(':');
    engine.setKeyShift(deck, (engine.decks[deck].keyShift || 0) + Number(delta));
  });
});

document.querySelectorAll('[data-key-reset]').forEach((b) => {
  b.addEventListener('click', () => engine.setKeyShift(b.dataset.keyReset, 0));
});

document.querySelectorAll('[data-key-match]').forEach((b) => {
  b.addEventListener('click', () => engine.matchKey(b.dataset.keyMatch));
});

document.querySelectorAll('[data-stem-split]').forEach((b) => {
  b.addEventListener('click', () => engine.toggleStemsSplit(b.dataset.stemSplit));
});

const tapTimes = { A: [], B: [] };
document.querySelectorAll('[data-tap]').forEach((b) => {
  b.addEventListener('click', () => {
    const deck = b.dataset.tap;
    const now = performance.now();
    const arr = tapTimes[deck];
    if (arr.length && now - arr[arr.length - 1] > 2000) arr.length = 0;
    arr.push(now);
    if (arr.length >= 3) {
      const avgMs = (arr[arr.length - 1] - arr[0]) / (arr.length - 1);
      const bpm = Math.round(Math.max(60, Math.min(200, 60000 / avgMs)));
      if (engine.decks[deck].track) {
        engine.decks[deck].track = { ...engine.decks[deck].track, bpm };
        syncUIWithEngine();
      }
    }
  });
});

document.querySelectorAll('[data-mode-toggle]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, key] = b.dataset.modeToggle.split(':');
    engine.decks[deck][key] = !engine.decks[deck][key];
    syncUIWithEngine();
  });
});

document.querySelectorAll('[data-fx-div]').forEach((b) => {
  b.addEventListener('click', () => engine.cycleFxBeatDiv(b.dataset.fxDiv));
});

document.querySelectorAll('[data-stem]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, stem] = b.dataset.stem.split(':');
    engine.toggleStem(deck, stem);
  });
});

document.querySelectorAll('[data-automix-beats]').forEach((b) => {
  b.addEventListener('click', () => {
    engine.autoMixBeats = Number(b.dataset.automixBeats);
    syncUIWithEngine();
  });
});

document.getElementById('btn-quantize-toggle').addEventListener('click', () => {
  engine.quantize = !engine.quantize;
  syncUIWithEngine();
});

document.getElementById('btn-load-demo-pair').addEventListener('click', async () => {
  await engine.loadTrack('A', 'sunrise-house');
  await engine.loadTrack('B', 'night-shift');
  engine.setCrossfader(-1, { silentAction: true });
});

document.getElementById('btn-rec').addEventListener('click', () => {
  engine.toggleRecording();
  engine._emitAction({ type: 'REC_TOGGLE' });
});

ui.crossfader.addEventListener('input', (e) => engine.setCrossfader(Number(e.target.value)));

for (const id of ['A', 'B']) {
  document.getElementById(`play-${id}`).addEventListener('click', () => engine.togglePlay(id));
  document.getElementById(`cue-${id}`).addEventListener('click', () => engine.cueAction(id));
  document.getElementById(`sync-${id}`).addEventListener('click', () => engine.syncDeck(id));
  document.getElementById(`loop4-${id}`).addEventListener('click', () => engine.toggleLoop4(id));
  document.getElementById(`tempo-${id}`).addEventListener('input', (e) => engine.setTempo(id, Number(e.target.value)));
}

document.querySelectorAll('[data-nudge]').forEach((b) => {
  b.addEventListener('click', () => {
    const [deck, delta] = b.dataset.nudge.split(':');
    engine.setTempo(deck, engine.decks[deck].tempoPercent + Number(delta));
  });
});

document.querySelectorAll('[data-hotcue]').forEach((btn) => {
  const [deck, idx] = btn.dataset.hotcue.split(':');
  btn.addEventListener('click', (e) => {
    if (e.shiftKey) engine.clearHotCue(deck, Number(idx));
    else engine.triggerHotCue(deck, Number(idx));
  });
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    engine.clearHotCue(deck, Number(idx));
  });
});

document.querySelectorAll('[data-vol]').forEach((input) => {
  input.addEventListener('input', () => engine.setChannelVolume(input.dataset.vol, Number(input.value)));
});

document.querySelectorAll('[data-cue-mon]').forEach((btn) => {
  btn.addEventListener('click', () => engine.toggleCueMonitor(btn.dataset.cueMon));
});

document.getElementById('btn-curve-toggle').addEventListener('click', () => engine.setCutCurve(!engine.cutCurve));

let secondOutputAudio = null;
const phonesSelect = document.getElementById('sel-headphones-mode');
if (phonesSelect) {
  phonesSelect.addEventListener('change', async () => {
    const mode = phonesSelect.value;
    if (mode === 'off') {
      engine.setSplitCue(false);
      if (secondOutputAudio) {
        secondOutputAudio.pause();
        secondOutputAudio.srcObject = null;
      }
    } else if (mode === 'split') {
      engine.setSplitCue(true);
    } else if (mode === 'second') {
      if (navigator.mediaDevices?.selectAudioOutput) {
        try {
          const device = await navigator.mediaDevices.selectAudioOutput();
          const ctx = engine.ensureContext();
          const cueDest = ctx.createMediaStreamDestination();
          engine.cueBus.connect(cueDest);
          if (!secondOutputAudio) secondOutputAudio = new Audio();
          secondOutputAudio.srcObject = cueDest.stream;
          if (typeof secondOutputAudio.setSinkId === 'function') {
            await secondOutputAudio.setSinkId(device.deviceId);
          }
          await secondOutputAudio.play();
          engine.setSplitCue(false);
        } catch (_) {
          phonesSelect.value = engine.splitCue ? 'split' : 'off';
        }
      } else {
        alert('当前浏览器暂不支持直接选择第二声卡输出，已为你切换至「分路监听（左主/右预听）」模式。');
        engine.setSplitCue(true);
        phonesSelect.value = 'split';
      }
    }
  });
}

// FX Toggle + 共享 Wet 滑块
document.querySelectorAll('[data-fx-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const [deck, mode] = btn.dataset.fxToggle.split(':');
    activeFxMode[deck] = mode;
    const current = engine.decks[deck][mode];
    const next = current > 0 ? 0 : 0.45;
    if (mode === 'echo') engine.setEcho(deck, next);
    else if (mode === 'reverb') engine.setReverb(deck, next);
    else engine.setFlanger(deck, next);
  });
});

document.querySelectorAll('[data-fx-wet]').forEach((input) => {
  input.addEventListener('input', () => {
    const deck = input.dataset.fxWet;
    const mode = activeFxMode[deck];
    const v = Number(input.value);
    if (mode === 'echo') engine.setEcho(deck, v);
    else if (mode === 'reverb') engine.setReverb(deck, v);
    else engine.setFlanger(deck, v);
  });
});

// 8 键 Sampler 点击、亮白触发态与拖放自定义音频
const PAD_DURATIONS = {
  airhorn: 1100, siren: 2000, laser: 400, rewind: 900,
  boom: 1800, riser: 2000, snareroll: 2000, aah: 600
};
const padTimers = new Map();

function triggerPad(padId) {
  const padEl = document.querySelector(`.sampler-pad[data-sampler="${padId}"]`);
  if (padEl) {
    padEl.classList.add('firing');
    clearTimeout(padTimers.get(padId));
    padTimers.set(padId, setTimeout(() => padEl.classList.remove('firing'), PAD_DURATIONS[padId] || 550));
  }
  if (customSamplerBuffers.has(padId)) {
    const ctx = engine.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = customSamplerBuffers.get(padId);
    src.connect(engine.masterGain);
    src.start();
    engine._emitAction({ type: 'SAMPLER', padId });
  } else {
    engine.triggerSampler(padId);
  }
}

document.querySelectorAll('.sampler-pad').forEach((pad) => {
  const padId = pad.dataset.sampler;
  pad.addEventListener('click', () => triggerPad(padId));
  pad.addEventListener('dragover', (e) => { e.preventDefault(); pad.classList.add('drag-over'); });
  pad.addEventListener('dragleave', () => pad.classList.remove('drag-over'));
  pad.addEventListener('drop', async (e) => {
    e.preventDefault();
    pad.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const ctx = engine.ensureContext();
      const buf = await ctx.decodeAudioData(await file.arrayBuffer());
      customSamplerBuffers.set(padId, buf);
      pad.querySelector('.pad-name').textContent = file.name.replace(/\.[^.]+$/, '');
    } catch (err) {
      console.error('采样音频解码失败:', err);
    }
  });
});

// Loop 倍数 / BeatJump / Vinyl 特技 / AutoMix
document.querySelectorAll('[data-loop-half]').forEach((b) => b.addEventListener('click', () => engine.halveLoop(b.dataset.loopHalf)));
document.querySelectorAll('[data-loop-double]').forEach((b) => b.addEventListener('click', () => engine.doubleLoop(b.dataset.loopDouble)));
document.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
  const [deck, beats] = b.dataset.jump.split(':');
  engine.beatJump(deck, Number(beats));
}));
document.querySelectorAll('[data-brake]').forEach((b) => b.addEventListener('click', () => engine.vinylBrake(b.dataset.brake)));
document.querySelectorAll('[data-spin]').forEach((b) => b.addEventListener('click', () => engine.vinylSpinback(b.dataset.spin)));
document.querySelectorAll('[data-rev]').forEach((b) => b.addEventListener('click', () => engine.toggleReverse(b.dataset.rev)));

document.getElementById('btn-automix').addEventListener('click', async () => {
  if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
  if (!engine.decks.B.track) await engine.loadTrack('B', 'night-shift', { silentAction: true });
  const fromAtoB = engine.crossfader <= 0;
  engine.syncDeck(fromAtoB ? 'B' : 'A', { silentAction: true });
  engine.play('A', { silentAction: true });
  engine.play('B', { silentAction: true });
  engine._emitAction({ type: 'AUTO_MIX', direction: fromAtoB ? 'A->B' : 'B->A' });
  const bpm = engine.getEffectiveBPM(fromAtoB ? 'A' : 'B') || 122;
  const totalMs = (engine.autoMixBeats || 16) * (60000 / bpm);
  const steps = 32;
  const stepMs = Math.max(40, totalMs / steps);
  const start = engine.crossfader;
  const end = fromAtoB ? 1 : -1;
  for (let i = 1; i <= steps; i++) {
    engine.setCrossfader(start + ((end - start) * i) / steps, { silentAction: true });
    await new Promise((r) => setTimeout(r, stepMs));
  }
});

// 记录已播放曲目
engine.onAction((action) => {
  if (action.type === 'PLAY') {
    const t = engine.decks[action.deck]?.track;
    if (t && !playedTracks.some((p) => p.id === t.id)) {
      playedTracks.push(t);
      renderCrate();
      renderSetList();
    }
  }
});

// Crate & Set 曲库管理
async function importAudioFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name));
  if (!files.length) return;
  const ctx = engine.ensureContext();
  for (const f of files) {
    try { await registerLocalAudioFile(ctx, f); } catch (err) { console.error(err); }
  }
  renderCrate();
}

document.getElementById('input-local-audio').addEventListener('change', async (e) => {
  await importAudioFiles(e.target.files);
  e.target.value = '';
});

document.getElementById('input-local-folder').addEventListener('change', async (e) => {
  await importAudioFiles(e.target.files);
  e.target.value = '';
});

document.getElementById('btn-live-input-a').addEventListener('click', async () => {
  try {
    await engine.connectLiveInput('A');
    renderCrate();
  } catch (err) {
    alert(err.message || '无法访问麦克风/线路输入');
  }
});

document.getElementById('btn-src-all').addEventListener('click', () => {
  crateSource = 'all';
  document.getElementById('btn-src-all').classList.add('active');
  document.getElementById('btn-src-local').classList.remove('active');
  renderCrate();
});

document.getElementById('btn-src-local').addEventListener('click', () => {
  crateSource = 'local';
  document.getElementById('btn-src-local').classList.add('active');
  document.getElementById('btn-src-all').classList.remove('active');
  renderCrate();
});

document.getElementById('tab-set-queue').addEventListener('click', () => {
  setTab = 'queue';
  document.getElementById('tab-set-queue').classList.add('active');
  document.getElementById('tab-set-played').classList.remove('active');
  renderSetList();
});

document.getElementById('tab-set-played').addEventListener('click', () => {
  setTab = 'played';
  document.getElementById('tab-set-played').classList.add('active');
  document.getElementById('tab-set-queue').classList.remove('active');
  renderSetList();
});

document.getElementById('mixes-well-bar').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-mix-load]');
  if (!chip) return;
  const [deck, trackId] = chip.dataset.mixLoad.split(':');
  engine.loadTrack(deck, trackId);
});

document.getElementById('crate-search').addEventListener('input', (e) => { crateFilter = e.target.value; renderCrate(); });
document.querySelectorAll('[data-sort]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const field = btn.dataset.sort;
    if (crateSort === field) crateSortAsc = !crateSortAsc;
    else { crateSort = field; crateSortAsc = true; }
    renderCrate();
  });
});

ui.crateList.addEventListener('click', (e) => {
  const loadBtn = e.target.closest('[data-load]');
  if (loadBtn) {
    const [deck, trackId] = loadBtn.dataset.load.split(':');
    engine.loadTrack(deck, trackId);
    return;
  }
  const addBtn = e.target.closest('[data-add-set]');
  if (addBtn) {
    const track = TRACK_CATALOG.find((t) => t.id === addBtn.dataset.addSet);
    if (track) {
      setQueue.push(track);
      renderSetList();
      engine._emitAction({ type: 'ADD_TO_SET', trackId: track.id });
    }
  }
});

ui.setList.addEventListener('click', (e) => {
  const upBtn = e.target.closest('[data-move-up]');
  if (upBtn) {
    const i = Number(upBtn.dataset.moveUp);
    if (i > 0) {
      [setQueue[i - 1], setQueue[i]] = [setQueue[i], setQueue[i - 1]];
      renderSetList();
    }
    return;
  }
  const downBtn = e.target.closest('[data-move-down]');
  if (downBtn) {
    const i = Number(downBtn.dataset.moveDown);
    if (i < setQueue.length - 1) {
      [setQueue[i], setQueue[i + 1]] = [setQueue[i + 1], setQueue[i]];
      renderSetList();
    }
    return;
  }
  const rmBtn = e.target.closest('[data-remove-set]');
  if (rmBtn) {
    setQueue.splice(Number(rmBtn.dataset.removeSet), 1);
    renderSetList();
    return;
  }
  const btn = e.target.closest('[data-load]');
  if (!btn) return;
  const [deck, trackId] = btn.dataset.load.split(':');
  engine.loadTrack(deck, trackId);
});

let autoDjController = null;
const autoDjBtn = document.getElementById('btn-auto-dj');
autoDjBtn.addEventListener('click', async () => {
  if (autoDjController) {
    autoDjController.abort();
    return;
  }
  const list = setQueue.length >= 2 ? [...setQueue] : TRACK_CATALOG.slice(0, 3);
  autoDjController = new AbortController();
  const { signal } = autoDjController;
  autoDjBtn.textContent = '⏹ 停止连播';

  try {
    let curDeck = 'A';
    await engine.loadTrack(curDeck, list[0].id, { silentAction: true });
    engine.setCrossfader(-1, { silentAction: true });
    engine.play(curDeck, { silentAction: true });

    for (let i = 1; i < list.length; i++) {
      await abortableSleep(5000, signal);
      const nextDeck = curDeck === 'A' ? 'B' : 'A';
      await engine.loadTrack(nextDeck, list[i].id, { silentAction: true });
      if (signal.aborted) break;
      engine.syncDeck(nextDeck, { silentAction: true });
      engine.play(nextDeck, { silentAction: true });
      const start = engine.crossfader;
      const end = nextDeck === 'B' ? 1 : -1;
      for (let s = 1; s <= 16; s++) {
        engine.setCrossfader(start + ((end - start) * s) / 16, { silentAction: true });
        await abortableSleep(160, signal);
      }
      engine.pause(curDeck, { silentAction: true, instant: true });
      curDeck = nextDeck;
    }
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  } finally {
    engine.pause('A', { silentAction: true, instant: true });
    engine.pause('B', { silentAction: true, instant: true });
    autoDjController = null;
    autoDjBtn.textContent = '▶ 自动连播';
  }
});

// 波形跳转与黑胶搓碟
document.querySelectorAll('.overview-canvas').forEach((canvas) => {
  canvas.addEventListener('click', (e) => {
    const deckId = canvas.dataset.deck;
    const deck = engine.decks[deckId];
    if (!deck.track) return;
    const rect = canvas.getBoundingClientRect();
    engine.seek(deckId, Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * deck.track.duration);
  });
});

// 黑胶唱盘 1:1 真实角度手动旋转与双向搓碟（按住停盘、顺时针正向、逆时针真实倒放搓碟）
document.querySelectorAll('.vinyl-platter').forEach((platter) => {
  const deckId = platter.dataset.deck;
  let dragging = false;
  let lastAngle = 0;
  let lastTime = 0;
  let idleTimer = null;

  const getPointerAngle = (e) => {
    const r = platter.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  };

  platter.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastAngle = getPointerAngle(e);
    lastTime = performance.now();
    platter.setPointerCapture(e.pointerId);
    engine.beginScratch(deckId);
  });

  platter.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const angle = getPointerAngle(e);
    let deltaDeg = angle - lastAngle;
    if (deltaDeg > 180) deltaDeg -= 360;
    if (deltaDeg < -180) deltaDeg += 360;
    lastAngle = angle;

    const dt = Math.max(0.008, (now - lastTime) / 1000);
    lastTime = now;

    // 1:1 跟随手指旋转黑胶盘面（33⅓ RPM = 1.8s / 360°）
    platterAngles[deckId] = (platterAngles[deckId] + deltaDeg) % 360;
    platter.style.transform = `rotate(${platterAngles[deckId]}deg)`;

    const deltaSec = (deltaDeg / 360) * 1.8;
    const speedRatio = (deltaDeg / dt) / 200; // 200 deg/s = 1.0x 原速
    engine.moveScratch(deckId, deltaSec, speedRatio);

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (dragging) engine.moveScratch(deckId, 0, 0);
    }, 65);
  });

  const finishScratch = () => {
    if (!dragging) return;
    dragging = false;
    clearTimeout(idleTimer);
    engine.endScratch(deckId);
  };
  platter.addEventListener('pointerup', finishScratch);
  platter.addEventListener('pointercancel', finishScratch);
});

// 移动端切换
const workspaceGrid = document.querySelector('.workspace-grid');
workspaceGrid.dataset.mobileView = 'A';
document.querySelectorAll('.mobile-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mobile-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    workspaceGrid.dataset.mobileView = tab.dataset.mobilePanel;
  });
});

// 教练按钮与课程弹窗
ui.btnShowMe.addEventListener('click', () => coach.runShowMe());
ui.btnPrev.addEventListener('click', () => { coach.setLessonActive(true); coach.prevStep(); });
ui.btnSkip.addEventListener('click', () => { coach.setLessonActive(true); coach.skipStep(); });
document.getElementById('btn-coach-toggle').addEventListener('click', () => coach.setLessonActive(!coach.isLessonActive));
document.getElementById('btn-coach-all').addEventListener('click', () => { renderLessonsModal(); ui.lessonsDialog.showModal(); });
document.getElementById('btn-open-lessons').addEventListener('click', () => { renderLessonsModal(); ui.lessonsDialog.showModal(); });
document.getElementById('btn-reset-progress').addEventListener('click', () => { coach.resetProgress(); renderLessonsModal(); });
document.getElementById('btn-open-shortcuts').addEventListener('click', () => ui.shortcutsDialog.showModal());

// 30 秒盲听挑战
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
  ui.challengeStats.innerHTML = `<div>Deck A：<strong>${bpmA.toFixed(1)} BPM</strong> · 你的 Deck B：<strong>${bpmB.toFixed(1)} BPM</strong></div><div>BPM 误差：<strong>${diff.toFixed(2)} BPM</strong>（用时 ${30 - blindRemaining} 秒）</div>`;
  ui.challengeResult.hidden = false;
  ui.challengeDialog.showModal();
}

document.getElementById('btn-challenge').addEventListener('click', () => { ui.challengeResult.hidden = true; ui.challengeDialog.showModal(); });
document.getElementById('btn-challenge-start').addEventListener('click', async () => {
  ui.challengeDialog.close();
  await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
  await engine.loadTrack('B', 'night-shift', { silentAction: true });
  engine.setTempo('A', 0, { silentAction: true });
  engine.setTempo('B', (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 3.5), { silentAction: true });
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
  const text = `🎧 我在 dj.ucncn.cn「30秒盲听对拍挑战」拿到 ${ui.challengeGrade.textContent} 级！${ui.challengeStats.textContent.replace(/\s+/g, ' ').trim()}`;
  try { await navigator.clipboard.writeText(text); e.target.textContent = '✓ 已复制'; setTimeout(() => { e.target.textContent = '📋 复制战绩文案'; }, 1600); } catch (_) {}
});
document.getElementById('btn-download-poster').addEventListener('click', () => {
  const c = document.createElement('canvas');
  c.width = 720; c.height = 420;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 720, 420);
  grad.addColorStop(0, '#0f1014'); grad.addColorStop(1, '#1a1d26');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 720, 420);
  ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 4; ctx.strokeRect(18, 18, 684, 384);
  ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('BACKSPIN 中文版 · dj.ucncn.cn', 44, 68);
  ctx.fillStyle = '#f3f4f6'; ctx.font = 'bold 34px sans-serif'; ctx.fillText('30 秒盲听对拍挑战 · 战绩卡', 44, 120);
  ctx.fillStyle = '#facc15'; ctx.font = 'bold 110px sans-serif'; ctx.fillText(ui.challengeGrade.textContent, 530, 260);
  ctx.fillStyle = '#d1d5db'; ctx.font = '22px sans-serif';
  ui.challengeStats.innerText.split('\n').filter(Boolean).forEach((line, idx) => ctx.fillText(line.trim(), 44, 210 + idx * 42));
  const link = document.createElement('a'); link.download = 'dj-challenge-poster.png'; link.href = c.toDataURL('image/png'); link.click();
});

// Web MIDI
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
    row.innerHTML = `<span>${t.label}</span><div style="display:flex;align-items:center;gap:8px;"><span class="crate-item-meta">${bound ? `CC/Note #${bound}` : '未绑定'}</span><button type="button" class="hw-sm" data-midi-learn="${t.id}">${learningTarget === t.id ? '等待触发…' : '学习'}</button></div>`;
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
  const key = `${status & 0xf0}:${data1}`;
  if (learningTarget) { midiBindings.set(learningTarget, key); learningTarget = null; renderMidiMappings(); return; }
  for (const [targetId, boundKey] of midiBindings.entries()) {
    if (boundKey !== key) continue;
    if (targetId === 'playA' && data2 > 0) engine.togglePlay('A');
    else if (targetId === 'playB' && data2 > 0) engine.togglePlay('B');
    else if (targetId === 'crossfader') engine.setCrossfader((data2 / 127) * 2 - 1);
    else if (targetId === 'tempoA') engine.setTempo('A', ((data2 / 127) * 2 - 1) * 8);
    else if (targetId === 'tempoB') engine.setTempo('B', ((data2 / 127) * 2 - 1) * 8);
  }
}
document.getElementById('btn-open-midi').addEventListener('click', async () => {
  renderMidiMappings();
  midiDialog.showModal();
  if (!navigator.requestMIDIAccess) { midiStatusEl.textContent = '当前浏览器不支持 Web MIDI API，请使用 Chrome 或 Edge。'; return; }
  if (midiInitialized) return;
  try {
    const access = await navigator.requestMIDIAccess();
    midiInitialized = true;
    const updateInputs = () => {
      const inputs = Array.from(access.inputs.values());
      midiStatusEl.textContent = inputs.length === 0 ? '未检测到外接 MIDI 控制器。' : `已连接：${inputs.map((i) => i.name).join('、')}`;
      inputs.forEach((input) => { input.onmidimessage = handleMidiMessage; });
    };
    updateInputs();
    access.onstatechange = updateInputs;
  } catch (_) { midiStatusEl.textContent = '未能获取 MIDI 设备权限。'; }
});

// Dialog closedby="any" 兜底
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
    dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
  }
}

// 快捷键
const SAMPLER_KEYS = ['airhorn', 'siren', 'laser', 'rewind', 'boom', 'riser', 'snareroll', 'aah'];
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); engine.togglePlay('A'); }
  else if (e.code === 'Enter' && !ui.lessonsDialog.open && !ui.shortcutsDialog.open) { e.preventDefault(); engine.togglePlay('B'); }
  else if (e.key === 's' || e.key === 'S') engine.syncDeck('B');
  else if (e.key === 'ArrowLeft') engine.setCrossfader(engine.crossfader - 0.1);
  else if (e.key === 'ArrowRight') engine.setCrossfader(engine.crossfader + 0.1);
  else if (e.code === 'Backquote') setLayoutMode(!document.body.classList.contains('pro-mode'));
  else if (e.key === '[') engine.zoomWaveform(1.35);
  else if (e.key === ']') engine.zoomWaveform(1 / 1.35);
  else if (e.key === '?') { if (ui.shortcutsDialog.open) ui.shortcutsDialog.close(); else ui.shortcutsDialog.showModal(); }
  else if (/^Digit[1-8]$/.test(e.code) && (e.shiftKey || !e.ctrlKey && !e.altKey)) {
    triggerPad(SAMPLER_KEYS[Number(e.code.replace('Digit', '')) - 1]);
  }
});

// 60fps 动画循环
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

const platterAngles = { A: 0, B: 0 };
let lastFrame = performance.now();
function animate(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  for (const id of ['A', 'B']) {
    drawScrollingWaveform(document.getElementById(`wave-scroll-${id}`), engine, id);
    drawOverviewWaveform(document.getElementById(`wave-overview-${id}`), engine, id);
    const d = engine.decks[id];
    const timeEl = document.getElementById(`time-${id}`);
    if (timeEl && d.track) {
      const cur = engine.getCurrentTime(id);
      const rem = Math.max(0, d.track.duration - cur);
      timeEl.textContent = `${fmtTime(cur)}  -${fmtTime(rem)}`;
    }
    if (d.isPlaying && !d.isScratching) {
      const dir = d.reversePlay ? -1 : 1;
      platterAngles[id] = (platterAngles[id] + dir * dt * 200 * engine.getPlaybackRate(id)) % 360;
      document.getElementById(`platter-${id}`).style.transform = `rotate(${platterAngles[id]}deg)`;
    }
    const beatInfo = engine.getBeatInfo(id);
    document.querySelectorAll(`#beats-${id} span`).forEach((dot, idx) => {
      dot.classList.toggle('on', Boolean(d.track && idx + 1 === beatInfo.beatInBar));
      dot.classList.toggle('bar-start', idx === 0);
    });
    document.querySelectorAll(`#phrase-${id} span`).forEach((barEl, idx) => {
      barEl.classList.toggle('on', Boolean(d.track && idx < beatInfo.barInPhrase));
    });
    const lvl = engine.getLevel(id);
    document.getElementById(`vu-${id}`).style.height = `${Math.round(lvl * 100)}%`;
    const clipEl = document.getElementById(`clip-${id}`);
    if (clipEl) clipEl.classList.toggle('hot', lvl > 0.92);
  }
  const phaseDot = document.getElementById('phase-dot');
  if (engine.decks.A.isPlaying && engine.decks.B.isPlaying && engine.decks.A.track && engine.decks.B.track) {
    const bA = engine.getBeatInfo('A').phase;
    const bB = engine.getBeatInfo('B').phase;
    let diff = bB - bA;
    if (diff > 0.5) diff -= 1;
    if (diff < -0.5) diff += 1;
    const ms = Math.round(diff * (60000 / engine.getEffectiveBPM('A')));
    ui.phaseMeter.textContent = Math.abs(ms) <= 22 ? '节拍已同步 ✓' : (ms > 0 ? `B 领先 ${ms} ms` : `B 落后 ${Math.abs(ms)} ms`);
    ui.phaseMeter.classList.toggle('synced', Math.abs(ms) <= 22);
    if (phaseDot) phaseDot.style.left = `${Math.max(8, Math.min(92, 50 + diff * 80))}%`;
  } else {
    ui.phaseMeter.textContent = '播放双盘可实时对比节拍';
    ui.phaseMeter.classList.remove('synced');
    if (phaseDot) phaseDot.style.left = '50%';
  }
  requestAnimationFrame(animate);
}

renderCrate();
renderSetList();
syncUIWithEngine();
coach.renderStep();
requestAnimationFrame(animate);

// 开屏自动预装两首内置练习曲，呈现饱满波形与可立即播放的桌面状态
(async () => {
  await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
  await engine.loadTrack('B', 'night-shift', { silentAction: true });
  syncUIWithEngine();
})();
