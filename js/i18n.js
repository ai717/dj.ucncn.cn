/**
 * 中 / 英双语无缝切换模块（持久化至 localStorage）
 */

import { TRACK_EN, LESSON_EN, STEP_EN, PREMIX_EN, EXPLAIN_EN } from './i18n-en.js';

const LANG_KEY = 'ucncn_dj_lang_v1';
let currentLang = 'zh';
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'en' || saved === 'zh') currentLang = saved;
} catch (_) {}

export function getLang() {
  return currentLang;
}

export function isEn() {
  return currentLang === 'en';
}

export function t(zh, en) {
  return currentLang === 'en' ? en : zh;
}

export function setLang(lang) {
  currentLang = lang === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (_) {}
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
  document.title = currentLang === 'en'
    ? 'Backspin — Learn to DJ in Your Browser'
    : 'Backspin — 浏览器里学 DJ';
}

const SELECTOR_TEXT_MAP = [
  ['.brand-sub', '浏览器里学 DJ', 'Learn to DJ in your browser'],
  ['#btn-premix-demo', '高手示范', 'Premixes'],
  ['#btn-load-demo-pair', '重置曲目', 'Reset tracks'],
  ['#btn-mode-simple', '新手', 'Simple'],
  ['#btn-mode-pro', '专业', 'Pro'],
  ['#btn-open-midi', 'MIDI 映射', 'MIDI'],
  ['#btn-compact-mode', '紧凑视图', 'Compact'],
  ['.master-knob-unit .knob-label', '主音量', 'MASTER'],
  ['#btn-open-shortcuts', '快捷键', 'Shortcuts'],
  ['#btn-coach-prev', '上一步', 'Back'],
  ['#btn-coach-skip', '跳过', 'Skip'],
  ['#btn-coach-all', '全部课程', 'All Lessons'],
  ['#btn-show-me', '▶ 演示给我看', '▶ Show me'],
  ['.mobile-tab[data-mobile-panel="A"]', '左盘 Deck A', 'Deck A'],
  ['.mobile-tab[data-mobile-panel="mixer"]', '混音台', 'Mixer'],
  ['.mobile-tab[data-mobile-panel="B"]', '右盘 Deck B', 'Deck B'],
  ['.sampler-title', '采样器', 'Sampler'],
  ['.sampler-hint', '拖放音频文件到采样垫可自定义音效', 'Drop a sound file on a pad to make it yours.'],
  ['.sampler-pad[data-sampler="airhorn"] .pad-name', '空气喇叭', 'Air horn'],
  ['.sampler-pad[data-sampler="siren"] .pad-name', '警笛音效', 'Siren'],
  ['.sampler-pad[data-sampler="laser"] .pad-name', '激光射线', 'Laser'],
  ['.sampler-pad[data-sampler="rewind"] .pad-name', '黑胶倒带', 'Rewind'],
  ['.sampler-pad[data-sampler="boom"] .pad-name', '重低音炮', 'Boom'],
  ['.sampler-pad[data-sampler="riser"] .pad-name', '情绪上升', 'Riser'],
  ['.sampler-pad[data-sampler="snareroll"] .pad-name', '军鼓滚奏', 'Snare roll'],
  ['.sampler-pad[data-sampler="aah"] .pad-name', '现场欢呼', 'Aah'],
  ['.sampler-pad[data-sampler="crash"] .pad-name', '镲片重击', 'Crash'],
  ['.sampler-pad[data-sampler="clap"] .pad-name', '拍手齐鸣', 'Clap'],
  ['.crate-title-group h2', '曲库', 'Crate'],
  ['#btn-src-all', '全部曲库', 'All'],
  ['#btn-src-local', '本地导入', 'Local'],
  ['#btn-live-input-a', '实时输入 → A', 'Live Input → A'],
  ['.crate-hint', '内置 30 首零版权教学与经典舞曲，随时可导入本地音乐或文件夹：所有音频仅留在你的设备上。', '30 built-in royalty-free tracks. Add local audio files or folders anytime — all audio stays on your device.'],
  ['.sort-head[data-sort="title"]', '曲目', 'TRACK'],
  ['.sort-head[data-sort="key"]', '调性', 'KEY'],
  ['.sort-head[data-sort="bpm"]', '速度', 'BPM'],
  ['.sort-head[data-sort="energy"]', '能量', 'NRG'],
  ['.sort-head.static', '时长', 'TIME'],
  ['#tab-set-queue', '待播清单', 'Up Next'],
  ['#btn-auto-dj', '▶ 自动连播', '▶ Auto DJ'],
  ['#btn-automix', '▶ 自动混音 A → B', '▶ AUTO MIX A → B'],
  ['#btn-quantize-toggle', '节拍量化', 'QUANTIZE'],
  ['[data-knob="cuemix"] .knob-label', '预听混合', 'CUE MIX'],
  ['[data-knob="phones"] .knob-label', '耳机音量', 'PHONES'],
  ['#lessons-dialog-title', '选择互动课程（共 22 节）', 'Interactive Lessons (22)'],
  ['#btn-reset-progress', '重置学习进度', 'Reset Progress'],
  ['#premix-dialog-title', '高手示范', 'Premixes'],
  ['#midi-dialog-title', 'Web MIDI 控制器映射', 'Web MIDI Mapping'],
  ['#shortcuts-dialog-title', '键盘快捷键 · 全键盘打碟', 'Keyboard Shortcuts'],
  ['#btn-float-demo', '▶ 演示一下', '▶ Show me'],
  ['#btn-float-skip', '跳过此步', 'Skip'],
  ['#btn-explain-exit', '退出说明 ×', 'Exit ×']
];

const MULTI_TEXT_MAP = [
  ['.mini-label', '调速', 'TEMPO'],
  ['.loop-btn', '循环 4 拍', 'LOOP 4'],
  ['[data-brake]', '刹车', 'BRAKE'],
  ['[data-spin]', '倒转', 'SPIN'],
  ['[data-rev]', '反向', 'REV'],
  ['[data-tap]', '测速', 'TAP'],
  ['[data-key-match]', '匹配', 'MATCH'],
  ['[data-fx-toggle$=":echo"]', '回声', 'ECHO'],
  ['[data-fx-toggle$=":reverb"]', '混响', 'REVERB'],
  ['[data-fx-toggle$=":flanger"]', '镶边', 'FLANGE'],
  ['[data-mode-toggle$=":keyLock"]', '锁调', 'KEY LOCK'],
  ['[data-mode-toggle$=":slipMode"]', '滑移', 'SLIP'],
  ['.tagged-row > [data-stem-split]', '拆分分轨', 'SPLIT INTO STEMS'],
  ['[data-stem$=":vocal"]', '人声', 'VOCAL'],
  ['[data-stem$=":drums"]', '鼓组', 'DRUMS'],
  ['[data-stem$=":bass"]', '贝斯', 'BASS'],
  ['[data-stem$=":other"]', '旋律', 'OTHER'],
  ['[data-knob^="gain:"] .knob-label', '增益', 'GAIN'],
  ['[data-knob*=":high"] .knob-label', '高频', 'HIGH'],
  ['[data-knob*=":mid"] .knob-label', '中频', 'MID'],
  ['[data-knob*=":low"] .knob-label', '低频', 'BASS'],
  ['[data-knob^="filter:"] .knob-label', '滤波', 'FILTER'],
  ['.cue-mon-btn', '🎧 监听', '🎧 CUE'],
  ['[data-automix-beats="8"]', '8 拍', '8 beats'],
  ['[data-automix-beats="16"]', '16 拍', '16 beats'],
  ['[data-automix-beats="32"]', '32 拍', '32 beats'],
  ['dialog form[method="dialog"] button', '关闭', 'Close']
];

export function getTrackTitle(track) {
  if (!track) return t('未装盘', 'Unloaded');
  if (isEn() && TRACK_EN[track.id]) return TRACK_EN[track.id].title;
  return track.title;
}

export function getTrackGenre(track) {
  if (!track) return '';
  if (isEn() && TRACK_EN[track.id]) return TRACK_EN[track.id].genre;
  return track.genre;
}

export function getLessonText(lesson) {
  if (!lesson) return { title: '', duration: '', summary: '' };
  if (isEn() && LESSON_EN[lesson.id]) return LESSON_EN[lesson.id];
  return lesson;
}

export function getStepText(step) {
  if (!step) return { title: '', floatTip: '', instruction: '' };
  if (isEn() && STEP_EN[step.id]) return { ...step, ...STEP_EN[step.id] };
  return step;
}

export function getStepPraise(step, zhPraise) {
  if (isEn() && step && STEP_EN[step.id]?.praise) return STEP_EN[step.id].praise;
  return zhPraise;
}

export function getExplainEntryText(entry) {
  if (!entry) return entry;
  if (isEn() && EXPLAIN_EN[entry.match]) return { ...entry, ...EXPLAIN_EN[entry.match] };
  if (isEn() && entry.match.startsWith('.sampler-pad')) {
    return {
      name: entry.name.replace('采样垫 ', 'Sampler Pad ').replace(/· .+$/, ''),
      role: 'One-shot FX sampler pad ready to fire anytime over your mix.',
      how: 'Click or press the Shift+Number key, or drag any local MP3/WAV file onto the pad to replace it.'
    };
  }
  return entry;
}

export function applyStaticI18n() {
  for (const [sel, zh, en] of SELECTOR_TEXT_MAP) {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(zh, en);
  }
  for (const [sel, zh, en] of MULTI_TEXT_MAP) {
    document.querySelectorAll(sel).forEach((el) => {
      el.textContent = t(zh, en);
    });
  }

  // 带英文/中文前缀的动态微调元素
  document.querySelectorAll('.row-label').forEach((el) => {
    const map = {
      '循环': 'LOOP', 'LOOP': '循环',
      '黑胶': 'VINYL', 'VINYL': '黑胶',
      '网格': 'GRID', 'GRID': '网格',
      '调性': 'KEY', 'KEY': '调性',
      '效果': 'FX', 'FX': '效果',
      '模式': 'MODE', 'MODE': '模式',
      '分轨': 'STEMS', 'STEMS': '分轨'
    };
    const txt = el.textContent.trim();
    if (isEn() && ['循环', '黑胶', '网格', '调性', '效果', '模式', '分轨'].includes(txt)) {
      el.textContent = map[txt];
    } else if (!isEn() && ['LOOP', 'VINYL', 'GRID', 'KEY', 'FX', 'MODE', 'STEMS'].includes(txt)) {
      el.textContent = map[txt];
    }
  });

  const searchEl = document.getElementById('crate-search');
  if (searchEl) searchEl.placeholder = t('搜索曲库…', 'Search crate…');

  const langBtn = document.getElementById('btn-lang-toggle');
  if (langBtn) langBtn.textContent = isEn() ? '中文' : 'EN';

  const creditBadge = document.getElementById('credit-badge');
  if (creditBadge) {
    const score = document.getElementById('credit-score')?.textContent || '0';
    creditBadge.innerHTML = `${t('学分', 'Credits')} <strong id="credit-score">${score}</strong>`;
  }

  const phonesSel = document.getElementById('sel-headphones-mode');
  if (phonesSel && phonesSel.options.length >= 3) {
    phonesSel.options[0].textContent = t('耳机：关闭', 'Headphones: off');
    phonesSel.options[1].textContent = t('分路监听（左主/右预听）', 'Split cable (master left, cue right)');
    phonesSel.options[2].textContent = t('使用独立第二声卡…', 'Use a second sound device…');
  }

  // Premixes 弹窗
  const premixIntro = document.querySelector('#premix-dialog .coach-desc');
  if (premixIntro) {
    premixIntro.textContent = t(
      '基于内置曲目的精选示范演出。系统会在真实双唱机上自动执行每一步推子、EQ、循环与搓碟操作，让你直观看到每个混音手法。',
      'Short performances on the built-in songs. Backspin plays them on the real decks, so you can see every move.'
    );
  }
  const PREMIX_ZH = {
    'sunset-to-skyline': {
      title: '▶ 落日到天际线',
      dur: '45 秒',
      desc: '三首相邻调性舞曲串联：从落日迪斯科平滑过渡到晨曦浩室，再切入深夜铁克诺，演示两段经典低音置换长混音。'
    },
    'all-the-tricks': {
      title: '▶ 全套花式连招',
      dur: '35 秒',
      desc: '滤波铺垫、双盘同步切歌、4→2→1 拍递减循环加速、实时搓碟、回声淡出与黑胶急刹，一口气演示全套主流技巧。'
    },
    'scratch-session': {
      title: '▶ 嘻哈搓碟秀',
      dur: '25 秒',
      desc: '以低潮律动鼓点伴奏，在 B 盘霓虹人声吉他上演示基础婴儿搓（Baby Scratch）、前推切音与横推截断搓碟组合。'
    }
  };
  document.querySelectorAll('[data-premix-id]').forEach((card) => {
    const id = card.dataset.premixId;
    const data = isEn() ? PREMIX_EN[id] : PREMIX_ZH[id];
    if (!data) return;
    const tEl = card.querySelector('.premix-card-title');
    const dEl = card.querySelector('.premix-card-dur');
    const pEl = card.querySelector('.premix-card-desc');
    if (tEl) tEl.textContent = data.title;
    if (dEl) dEl.textContent = data.dur;
    if (pEl) pEl.textContent = data.desc;
  });

  // 快捷键弹窗分组标题与提示
  const scHeads = document.querySelectorAll('#shortcuts-dialog .shortcuts-sec h2');
  const scHeadsEn = ['DECK A / DECK B', 'HOLD SHIFT: SECOND JOBS', 'HOLD ALT: THE MIXER', 'SONG PREP & GLOBAL'];
  const scHeadsZh = ['A / B 唱盘主控（左手 A · 右手 B）', '按住 Shift：第二功能', '按住 Alt：混音台与分轨', '曲目准备与全局控制'];
  scHeads.forEach((h, i) => {
    if (scHeadsEn[i]) h.textContent = t(scHeadsZh[i], scHeadsEn[i]);
  });
  const scNote = document.querySelector('#shortcuts-dialog .dialog-note');
  if (scNote) {
    scNote.textContent = t(
      '提示：左手控制 A 盘，右手控制 B 盘；按住 Shift 切换第二功能，按住 Alt 化身混音台。双击任意旋钮或推子可快速归中复位。',
      'Left hand runs Deck A, right hand runs Deck B. Hold Shift for second jobs, hold Alt for the mixer. Double-click or double-tap any knob or fader to reset.'
    );
  }

  // 说明模式弹窗与曲库导入按钮
  const exBadge = document.querySelector('.explain-pop-badge');
  if (exBadge) exBadge.textContent = t('说明模式 · 点击任意控件查看', 'Explain Mode · Click any control');
  const exHeads = document.querySelectorAll('.explain-pop-section strong');
  if (exHeads[0]) exHeads[0].textContent = t('核心作用', 'What it does');
  if (exHeads[1]) exHeads[1].textContent = t('怎么操作 & 技巧', 'How to use & Tips');

  const addMusicLabel = document.querySelector('#input-local-audio')?.parentElement;
  if (addMusicLabel && addMusicLabel.firstChild) {
    addMusicLabel.firstChild.textContent = `${t('+ 添加音乐', '+ Add Music')} `;
  }
  const addFolderLabel = document.querySelector('#input-local-folder')?.parentElement;
  if (addFolderLabel && addFolderLabel.firstChild) {
    addFolderLabel.firstChild.textContent = `${t('+ 添加文件夹', '+ Add Folder')} `;
  }
}
