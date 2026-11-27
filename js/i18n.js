/**
 * 中 / 英双语无缝切换模块（持久化至 localStorage）
 */

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
}
