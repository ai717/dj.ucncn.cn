/**
 * 22 节全流程互动课程定义（第 0 课盘面认知 + 第 1~21 课混音实战）
 * 每一步均包含：高亮目标、Show me 自动演示脚本、语义化纠错规则
 */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const LESSONS = [
  {
    id: 'lesson-0',
    number: 0,
    title: '全面认识打碟机盘面',
    duration: '5 分钟',
    summary: '零基础小白必学：手把手认识 18 个核心盘面按钮、旋钮、推子、波形、采样器与曲库的名称、作用与操作。',
    steps: [
      {
        id: 'l0-s1',
        title: '1/18 · 顶部同步波形条',
        floatTip: '👆 点一下上方任意波形条，直接跳转进度',
        instruction: '蓝/橙波形展示双盘鼓点与白线播放头。点一下上方波形条试试！',
        highlightSelector: '.waveforms-strip',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#wave-scroll-A');
          await cursor.click();
          engine.seek('A', 2.4, { silentAction: true });
          await wait(700);
          engine.seek('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'SEEK') {
            return { pass: true, praise: '很好！点击或拖动波形条可随时精准跳转位置。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s2',
        title: '2/18 · 波形缩放（− / +）',
        floatTip: '🔍 点右上角「+」放大波形，看清每一个鼓点',
        instruction: '放大波形能更精准对齐鼓点。点一下波形右上角「+」按钮！',
        highlightSelector: '#btn-wave-zoom-in',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#btn-wave-zoom-in');
          await cursor.click();
          engine.zoomWaveform(1 / 1.35);
          await wait(700);
          engine.zoomWaveform(1.35);
        },
        validate(action) {
          if (action.type === 'WAVE_ZOOM') {
            return { pass: true, praise: '视野切换成功！放大看鼓点，缩小看段落。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s3',
        title: '3/18 · 全曲概览波形条',
        floatTip: '📊 点一下左盘歌名下方的小条波形，跳转到整首歌任意段落',
        instruction: '小条波形显示整首歌全貌（前奏到高潮）。点一下左盘小波形！',
        highlightSelector: '#wave-overview-A',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#wave-overview-A');
          await cursor.click();
          engine.seek('A', 6.0, { silentAction: true });
          await wait(700);
          engine.seek('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'SEEK') {
            return { pass: true, praise: '漂亮！点小波形能一秒跨段落预览歌曲。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s4',
        title: '4/18 · 黑胶唱盘与搓碟',
        floatTip: '💿 按住黑胶盘面画圈转动，体验搓碟音效',
        instruction: '唱盘既能走带也能手动修拍、搓碟。按住左侧黑胶盘面转一转！',
        highlightSelector: '#platter-A',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#platter-A');
          await cursor.click();
          engine.beginScratch('A');
          for (let i = 0; i < 3; i++) {
            engine.moveScratch('A', 0.08, 1.3);
            await wait(130);
            engine.moveScratch('A', -0.08, -1.3);
            await wait(130);
          }
          engine.endScratch('A');
        },
        validate(action) {
          if (action.type === 'SCRATCH') {
            return { pass: true, praise: '太棒了！你刚刚体验了真实物理角度的搓碟手势。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s5',
        title: '5/18 · 调速推子与 BPM',
        floatTip: '🎚️ 上下拖动「调速」推子，改变歌曲快慢',
        instruction: '控制播放速度（BPM），用于手动对拍。上下拖动调速推子试试！',
        highlightSelector: '#tempo-A',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#tempo-A');
          await cursor.click();
          engine.setTempo('A', 3.2, { silentAction: true });
          await wait(700);
          engine.setTempo('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'TEMPO') {
            return { pass: true, praise: '掌握了！双击推子可以一键归零恢复原速。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s6',
        title: '6/18 · 播放 / 刹车暂停（▶）',
        floatTip: '▶ 按一下绿色「播放」键，让左盘响起来',
        instruction: '控制唱盘走带与停转（带黑胶刹车尾音）。先按一下 ▶ 播放！',
        highlightSelector: '[data-control="deck-A-play"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-play"]');
          await cursor.click();
          engine.play('A', { silentAction: true });
          await wait(1400);
          engine.pause('A', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'PLAY' && action.deck === 'A') {
            return { pass: true, praise: '声音响起来了！再按一次就会刹车停转。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s7',
        title: '7/18 · CUE 定位起点键',
        floatTip: '🎯 点一下「CUE」键，记住起点或弹回起点',
        instruction: '暂停时按它定起跑线，播放时按它立即弹回起点。点一下 CUE！',
        highlightSelector: '[data-control="deck-A-cue"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-cue"]');
          await cursor.click();
          engine.cueAction('A', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'CUE') {
            return { pass: true, praise: '学会了！CUE 是 DJ 找第一拍起点最常用的键。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s8',
        title: '8/18 · SYNC 一键同步速度',
        floatTip: '⚡ 点一下右盘的「SYNC」，自动对齐左盘速度',
        instruction: '新手救星！按下 SYNC 自动把本盘 BPM 对齐另一盘。点右盘 SYNC！',
        highlightSelector: '[data-control="deck-B-sync"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-B-sync"]');
          await cursor.click();
          engine.syncDeck('B', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'SYNC') {
            return { pass: true, praise: '瞬间对齐！现在两首歌的 BPM 完全一样了。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s9',
        title: '9/18 · 热标点书签（Hot Cue）',
        floatTip: '🔖 点一下「1」号按钮，打下你的彩色书签',
        instruction: '给高潮段落做标记，随时一秒闪回（右键可删）。点一下「1」！',
        highlightSelector: '[data-control="deck-A-hotcue-0"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-hotcue-0"]');
          await cursor.click();
          engine.triggerHotCue('A', 0, { silentAction: true });
          await wait(700);
          engine.clearHotCue('A', 0);
        },
        validate(action) {
          if (action.type === 'HOT_CUE') {
            return { pass: true, praise: '书签亮起来了！以后点它就能秒跳回这个位置。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s10',
        title: '10/18 · 循环 4 拍（LOOP 4）',
        floatTip: '🔁 点一下「循环 4 拍」，锁定当前小节无限重复',
        instruction: '循环用来留出充裕接歌时间，旁边 ½ / ×2 可缩放。点「循环 4 拍」！',
        highlightSelector: '[data-control="deck-A-loop4"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-loop4"]');
          await cursor.click();
          engine.toggleLoop4('A', { silentAction: true });
          await wait(900);
          engine.toggleLoop4('A', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'LOOP4') {
            return { pass: true, praise: '干得漂亮！再点一次即可退出循环继续往下播。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s11',
        title: '11/18 · 黑胶倒转（倒转）',
        floatTip: '⏪ 点一下「倒转」，听一听经典的黑胶倒带音效',
        instruction: '「刹车」缓慢停转，「倒转」猛力倒带。点一下左盘「倒转」！',
        highlightSelector: '[data-spin="A"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-spin="A"]');
          await cursor.click();
          engine.vinylSpinback('A');
        },
        validate(action) {
          if (action.type === 'VINYL_TRICK') {
            return { pass: true, praise: '帅气！切歌收尾用一次超有现场感。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s12',
        title: '12/18 · 均衡器 EQ（低频旋钮）',
        floatTip: '🎛️ 上下拖动「低频」旋钮，感受鼓点被切掉',
        instruction: '高/中/低音分别控镲片/人声/鼓点。上下拖动「低频」旋钮试试！',
        highlightSelector: '[data-control="deck-A-eq-low"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-eq-low"]');
          await cursor.click();
          engine.setEQ('A', 'low', -16, { silentAction: true });
          await wait(700);
          engine.setEQ('A', 'low', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'EQ') {
            return { pass: true, praise: '记住口诀：接歌时两盘低频不要同时开满！' };
          }
          return null;
        }
      },
      {
        id: 'l0-s13',
        title: '13/18 · 双极扫频滤波器（滤波）',
        floatTip: '🌊 上下拖动「滤波」旋钮，向左变闷、向右变空灵',
        instruction: '淡出旧歌的神器！上下拖动左盘「滤波」旋钮听听变化！',
        highlightSelector: '[data-control="deck-A-filter"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-filter"]');
          await cursor.click();
          engine.setFilter('A', 0.6, { silentAction: true });
          await wait(700);
          engine.setFilter('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'FILTER') {
            return { pass: true, praise: '丝滑抽离！双击旋钮随时归中关闭滤波。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s14',
        title: '14/18 · 通道音量竖推 & 电平表',
        floatTip: '📊 上下拖动左侧通道音量推子，控制 A 盘输出大小',
        instruction: '控制单盘音量，左侧灯柱防止爆音红灯。上下拖一下 A 盘竖推！',
        highlightSelector: '[data-vol="A"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-vol="A"]');
          await cursor.click();
          engine.setChannelVolume('A', 0.5);
          await wait(600);
          engine.setChannelVolume('A', 1);
        },
        validate(action) {
          if (action.type === 'VOLUME') {
            return { pass: true, praise: '很好！很多专业 DJ 也喜欢直接用这两根竖推混音。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s15',
        title: '15/18 · 交叉推子（Crossfader）',
        floatTip: '🎚️ 左右拖动底部「交叉推子」，切换 A / B 盘声音',
        instruction: '左推只听 A、右推只听 B、中间融合。左右拖一下交叉推子！',
        highlightSelector: '[data-control="crossfader"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="crossfader"]');
          for (let v = -1; v <= 0.6; v += 0.4) {
            engine.setCrossfader(v, { silentAction: true });
            await wait(180);
          }
          engine.setCrossfader(-1, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'CROSSFADER') {
            return { pass: true, praise: '掌握了！它是切歌过渡最直观的开关。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s16',
        title: '16/18 · 10 键独立采样器',
        floatTip: '🥁 点任意一个采样垫（或按 Shift+1），叠加现场音效',
        instruction: '10 个独立气氛音效垫，支持拖放本地音频替换。点一个听听！',
        highlightSelector: '.sampler-pads-grid',
        async runDemo(engine, cursor) {
          await cursor.moveTo('.sampler-pad[data-sampler="airhorn"]');
          await cursor.click();
          engine.triggerSampler('airhorn');
        },
        validate(action) {
          if (action.type === 'SAMPLER') {
            return { pass: true, praise: '气氛拉满！打碟时随时叠加一声超带感。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s17',
        title: '17/18 · 曲库浏览与装盘',
        floatTip: '🎵 在下方曲库点任意歌曲的「→ B」，把歌装进右盘',
        instruction: '内置 30 首零版权舞曲，支持本地导入与推荐接歌。点任意「→ B」！',
        highlightSelector: '.crate-panel',
        async runDemo(engine, cursor) {
          const btn = document.querySelector('#crate-list [data-load^="B:"]');
          if (btn) {
            await cursor.moveTo('#crate-list [data-load^="B:"]');
            await cursor.click();
          }
          await engine.loadTrack('B', 'velvet-deep', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'LOAD_TRACK') {
            return { pass: true, praise: '新歌装盘成功！只差最后一步认识待播清单了。' };
          }
          return null;
        }
      },
      {
        id: 'l0-s18',
        title: '18/18 · 待播清单与自动连播',
        floatTip: '📋 在曲库点任意歌曲的「+ 待播」，排入右侧演出歌单',
        instruction: '把想放的歌排进「待播清单」，点「自动连播」就能连续放！点「+ 待播」！',
        highlightSelector: '#crate-list [data-add-set]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#crate-list [data-add-set]');
          await cursor.click();
        },
        validate(action) {
          if (action.type === 'ADD_TO_SET') {
            return { pass: true, praise: '恭喜毕业第 0 课！你已全面认识所有盘面功能，准备正式开混！' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-1',
    number: 1,
    title: '第一次无缝切歌',
    duration: '3 分钟',
    summary: '认识双唱机与 Crossfader，完成人生第一次从 A 盘过渡到 B 盘的混音。',
    steps: [
      {
        id: 'l1-s1',
        title: '第一步：装入两首练习曲',
        instruction: '点击下方按钮，将《晨曦 House》装入左盘（A），《夜班 Techno》装入右盘（B）。',
        highlightSelector: '#btn-load-demo-pair',
        actionButtonText: '为我装入两首练习曲',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#btn-load-demo-pair');
          await cursor.click();
          await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          await engine.loadTrack('B', 'night-shift', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
          engine.setEQ('A', 'low', 0, { silentAction: true });
          engine.setEQ('B', 'low', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.track && engine.decks.B.track) {
            return { pass: true, praise: '很好！两张黑胶已经就位，Crossfader 目前在最左侧 A 盘。' };
          }
          return null;
        }
      },
      {
        id: 'l1-s2',
        title: '第二步：按下左盘（Deck A）播放键',
        instruction: '点击左侧 Deck A 的「播放」按钮，让第一首歌响起来。',
        highlightSelector: '[data-control="deck-A-play"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-play"]');
          await cursor.click();
          engine.play('A', { silentAction: true });
          await wait(2200);
          engine.pause('A', { silentAction: true });
          engine.seek('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'PLAY' && action.deck === 'B') {
            return {
              pass: false,
              hint: '差一点！你按到右边 Deck B 的播放键了。Deck A 在左边。'
            };
          }
          if (action.type === 'PLAY' && action.deck === 'A') {
            return { pass: true, praise: '漂亮！Deck A 已经开始旋转播放。' };
          }
          return null;
        }
      },
      {
        id: 'l1-s3',
        title: '第三步：用 SYNC 自动对齐 B 盘速度',
        instruction: '两首歌速度不同（122 vs 126 BPM），点击右边 Deck B 的「SYNC」按钮让 B 盘自动跟上 A 盘节奏。',
        highlightSelector: '[data-control="deck-B-sync"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-B-sync"]');
          await cursor.click();
          engine.syncDeck('B', { silentAction: true });
        },
        validate(action) {
          if (action.type === 'SYNC' && action.deck === 'A') {
            return {
              pass: false,
              hint: '注意方向：现在要让右边的 Deck B 去匹配正在播放的 Deck A，请按 Deck B 的 SYNC。'
            };
          }
          if (action.type === 'SYNC' && action.deck === 'B') {
            return { pass: true, praise: '精准同步！现在 B 盘的速度和 A 盘完全一致了。' };
          }
          return null;
        }
      },
      {
        id: 'l1-s4',
        title: '第四步：播放 Deck B 并推 Crossfader 完成切歌',
        instruction: '先按下 Deck B 的「播放」，然后把中间底部的「Crossfader」滑块从最左慢慢推到最右（B）。',
        highlightSelector: '[data-control="crossfader"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-B-play"]');
          await cursor.click();
          engine.play('B', { silentAction: true });
          await wait(600);
          await cursor.moveTo('[data-control="crossfader"]');
          for (let v = -1; v <= 1; v += 0.25) {
            engine.setCrossfader(v, { silentAction: true });
            await wait(160);
          }
          await wait(800);
          engine.pause('B', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'CROSSFADER' && !engine.decks.B.isPlaying) {
            return {
              pass: false,
              hint: '先别急着推推子！右边的 Deck B 还没按播放，推过去会没声音。'
            };
          }
          if (engine.decks.B.isPlaying && engine.crossfader >= 0.85) {
            return { pass: true, praise: '恭喜！你刚刚完成了人生第一次无缝切歌过渡！' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-2',
    number: 2,
    title: '听拍与手动对速（Beatmatching）',
    duration: '4 分钟',
    summary: '不依赖 SYNC 按钮，学会看节拍相位条并手动推拉调速推子（Tempo）对齐两首歌的 BPM。',
    steps: [
      {
        id: 'l2-s1',
        title: '第一步：重置速度并同时播放双盘',
        instruction: '点击下方按钮初始化双盘（A: 122 BPM，B: 126 BPM），然后按播放键让两盘同时出声。',
        highlightSelector: '#btn-load-demo-pair',
        actionButtonText: '初始化双盘（重置调速）',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#btn-load-demo-pair');
          await cursor.click();
          await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          await engine.loadTrack('B', 'night-shift', { silentAction: true });
          engine.setTempo('A', 0, { silentAction: true });
          engine.setTempo('B', 0, { silentAction: true });
          engine.setCrossfader(0, { silentAction: true });
          engine.play('A', { silentAction: true });
          engine.play('B', { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.isPlaying && engine.decks.B.isPlaying) {
            return { pass: true, praise: '双盘都在运行了！能听到鼓点慢慢错开（打架）吗？' };
          }
          return null;
        }
      },
      {
        id: 'l2-s2',
        title: '第二步：手动调节 Deck B 的 TEMPO 推子',
        instruction: 'B 盘（126 BPM）比 A 盘（122 BPM）快。拖动右边 Deck B 的「TEMPO 调速」滑块，把 B 盘实际 BPM 降到 121.2 ~ 122.8 之间。',
        highlightSelector: '[data-control="deck-B-tempo"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-B-tempo"]');
          for (let p = 0; p >= -3.2; p -= 0.4) {
            engine.setTempo('B', p, { silentAction: true });
            await wait(140);
          }
          await wait(1000);
          engine.setTempo('B', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'SYNC') {
            return {
              pass: false,
              hint: '这一关要练习真本事哦！请不要按 SYNC，试着手动拖动右侧的 TEMPO 调速滑块。'
            };
          }
          if (action.type === 'TEMPO' && action.deck === 'B') {
            const bpmA = engine.getEffectiveBPM('A');
            const bpmB = engine.getEffectiveBPM('B');
            const diff = bpmB - bpmA;
            if (Math.abs(diff) <= 0.8) {
              return { pass: true, praise: `太稳了！B 盘速度（${bpmB.toFixed(1)} BPM）已和 A 盘对齐！` };
            }
            if (diff > 0.8) {
              return { pass: false, hint: `B 盘还是太快了（当前 ${bpmB.toFixed(1)} BPM），继续往下拉减速。` };
            }
            return { pass: false, hint: `拉过头啦！B 盘现在太慢了（${bpmB.toFixed(1)} BPM），往上推一点。` };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-3',
    number: 3,
    title: 'EQ 三段雕琢：不打架的混音',
    duration: '4 分钟',
    summary: '两首歌的低音（Bass）同时满格会糊成一团。学会用低音旋钮“腾位置”再互换。',
    steps: [
      {
        id: 'l3-s1',
        title: '第一步：将 B 盘低音（BASS）拧到最低',
        instruction: '在把 B 盘推入混音前，先把右边 Deck B 的「BASS」旋钮（或滑块）降到 -12 dB 以下，腾出低频空间。',
        highlightSelector: '[data-control="deck-B-eq-low"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) {
            await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
            await engine.loadTrack('B', 'night-shift', { silentAction: true });
          }
          engine.syncDeck('B', { silentAction: true });
          engine.play('A', { silentAction: true });
          engine.play('B', { silentAction: true });
          engine.setCrossfader(-0.6, { silentAction: true });
          await cursor.moveTo('[data-control="deck-B-eq-low"]');
          engine.setEQ('B', 'low', -18, { silentAction: true });
          await wait(1200);
          engine.setEQ('B', 'low', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'EQ' && action.deck === 'A' && action.band === 'low') {
            return {
              pass: false,
              hint: '你拧的是左边 A 盘的 BASS！现在正在放 A 盘，应该先拧小右边新歌（Deck B）的 BASS。'
            };
          }
          if (engine.decks.B.eq.low <= -12) {
            return { pass: true, praise: '干净利落！B 盘底鼓让位了，两首歌叠加不再浑浊。' };
          }
          return null;
        }
      },
      {
        id: 'l3-s2',
        title: '第二步：完成低频互换（Bass Swap）',
        instruction: '把 Crossfader 推到中间（0），然后把 A 盘的「BASS」降到 -12 dB 以下，同时把 B 盘「BASS」拧回 0 dB。',
        highlightSelector: '[data-control="deck-A-eq-low"]',
        async runDemo(engine, cursor) {
          engine.setCrossfader(0, { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-eq-low"]');
          engine.setEQ('A', 'low', -18, { silentAction: true });
          await cursor.moveTo('[data-control="deck-B-eq-low"]');
          engine.setEQ('B', 'low', 0, { silentAction: true });
          await wait(1200);
          engine.setEQ('A', 'low', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.eq.low <= -12 && engine.decks.B.eq.low >= -2) {
            return { pass: true, praise: '专业级 Bass Swap！低频能量无缝交接给 B 盘了。' };
          }
          if (engine.decks.A.eq.low > -3 && engine.decks.B.eq.low > -3 && action.type === 'EQ') {
            return { pass: false, hint: '两边低音现在都在满格，容易浑浊！记得把左边 A 盘的 BASS 拉下来。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-4',
    number: 4,
    title: 'Filter 扫频与氛围过渡',
    duration: '3 分钟',
    summary: '用单颗 Filter 旋钮制造“水下闷响”或“抽空升空”的经典俱乐部过渡效果。',
    steps: [
      {
        id: 'l4-s1',
        title: '第一步：对正在播放的 A 盘进行高通扫频',
        instruction: '向右拖动 Deck A 的「FILTER」旋钮（> +0.35），切掉低频只留清脆高频，然后把 Crossfader 推向 B 盘。',
        highlightSelector: '[data-control="deck-A-filter"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) {
            await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
            await engine.loadTrack('B', 'golden-hour', { silentAction: true });
          }
          engine.play('A', { silentAction: true });
          engine.syncDeck('B', { silentAction: true });
          engine.play('B', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-filter"]');
          for (let f = 0; f <= 0.65; f += 0.15) {
            engine.setFilter('A', f, { silentAction: true });
            await wait(180);
          }
          await cursor.moveTo('[data-control="crossfader"]');
          engine.setCrossfader(1, { silentAction: true });
          await wait(800);
          engine.setFilter('A', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'FILTER' && action.deck === 'A' && action.value < -0.2) {
            return {
              pass: false,
              hint: '向左拧是低通（闷响），这次我们试试向右拧（高通）把低音抽空！'
            };
          }
          if (engine.decks.A.filter >= 0.35 && engine.crossfader >= 0.7) {
            return { pass: true, praise: '氛围拉满！Filter 扫频过渡非常丝滑。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-5',
    number: 5,
    title: 'Cue 点与 4 拍循环（Loop 4）',
    duration: '3 分钟',
    summary: '音乐快放完了但还没准备好切歌？用 Loop 4 无限拖延最后 4 拍，再用 Hot Cue 瞬间跳转。',
    steps: [
      {
        id: 'l5-s1',
        title: '第一步：开启 A 盘的 4 拍循环（LOOP 4）',
        instruction: '确保 Deck A 正在播放，然后点击 Deck A 下方的「LOOP 4」按钮锁住当前小节循环。',
        highlightSelector: '[data-control="deck-A-loop4"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) {
            await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          }
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-loop4"]');
          await cursor.click();
          engine.toggleLoop4('A', { silentAction: true });
          await wait(1600);
          engine.toggleLoop4('A', { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'LOOP4' && action.deck === 'B') {
            return { pass: false, hint: '这是 Deck B 的 Loop 按钮，请按左边 Deck A 的 LOOP 4。' };
          }
          if (engine.decks.A.loop4) {
            return { pass: true, praise: '已锁定 4 拍循环！现在你有充裕的时间准备下一首歌了。' };
          }
          return null;
        }
      },
      {
        id: 'l5-s2',
        title: '第二步：用 Hot Cue 1 瞬间跳回起点',
        instruction: '点击 Deck A 的热键「1 (HOT CUE)」，感受瞬间精准回跳到第一拍。',
        highlightSelector: '[data-control="deck-A-hotcue-0"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-control="deck-A-hotcue-0"]');
          await cursor.click();
          engine.triggerHotCue('A', 0, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'HOT_CUE' && action.deck === 'A' && action.index === 0) {
            return { pass: true, praise: '干得漂亮！Hot Cue 让你随时精准回到预设进歌点。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-6',
    number: 6,
    title: '乐句对齐（Phrasing）',
    duration: '4 分钟',
    summary: '在 4 拍小节的第 1 拍切入下一首歌，让鼓点与和弦变化完美踩在一起。',
    steps: [
      {
        id: 'l6-s1',
        title: '第一步：踩准第 1 拍启动 Deck B',
        instruction: '看着 Deck A 下方 4 颗节拍灯，当第 1 颗灯亮起时（或亮起瞬间）按下 Deck B 的「PLAY」键。',
        highlightSelector: '[data-control="deck-B-play"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          if (!engine.decks.B.track) await engine.loadTrack('B', 'night-shift', { silentAction: true });
          engine.syncDeck('B', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-control="deck-B-play"]');
          await cursor.click();
          engine.play('B', { silentAction: true });
          await wait(1400);
          engine.pause('B', { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'PLAY' && action.deck === 'B') {
            const beat = engine.getBeatInfo('A');
            if (beat.beatInBar === 1 || (beat.beatInBar === 4 && beat.phase > 0.65)) {
              return { pass: true, praise: '踩拍极其精准！第 1 拍切入让两首歌结构完全同步。' };
            }
            return { pass: false, hint: `刚才是在第 ${beat.beatInBar} 拍按下的，等第 1 颗黄灯亮起时再按！` };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-7',
    number: 7,
    title: 'Baby Scratch 基础搓碟',
    duration: '3 分钟',
    summary: '用鼠标或手指按住黑胶唱盘前后推拉，制造经典的 DJ 搓碟节奏感。',
    steps: [
      {
        id: 'l7-s1',
        title: '第一步：按住左盘黑胶来回搓碟',
        instruction: '先确保 Deck A 正在播放，然后用鼠标/手指按住左边的圆形黑胶唱盘左右快速拖动一次。',
        highlightSelector: '#platter-A',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'low-tide', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('#platter-A');
          engine.setScratchDelta('A', 0.45);
          await wait(240);
          engine.setScratchDelta('A', -0.45);
          await wait(240);
          engine.setScratchDelta('A', 0);
        },
        validate(action) {
          if (action.type === 'SCRATCH' && action.deck === 'B') {
            return { pass: false, hint: '这是右边的 Deck B 黑胶，请搓左边 Deck A 的唱盘！' };
          }
          if (action.type === 'SCRATCH' && action.deck === 'A') {
            return { pass: true, praise: '有感觉了！这就是经典的 Baby Scratch 手法。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-8',
    number: 8,
    title: 'Echo-Out 经典回声收尾',
    duration: '4 分钟',
    summary: '在 Pro 模式下打开 Echo 延迟后暂停原曲，让回声飘散在空气中自然过渡。',
    steps: [
      {
        id: 'l8-s1',
        title: '第一步：调高 Deck A 的 ECHO 延迟量',
        instruction: '先切换到右上角「Pro 模式」（或直接拖动 Deck A 下方的 ECHO 滑块到 0.4 以上），然后暂停 Deck A 听回声尾音。',
        highlightSelector: '[data-control="deck-A-echo"]',
        async runDemo(engine, cursor) {
          document.body.classList.add('pro-mode');
          if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-echo"]');
          engine.setEcho('A', 0.65, { silentAction: true });
          await wait(900);
          engine.pause('A', { silentAction: true });
          await wait(1200);
          engine.setEcho('A', 0, { silentAction: true });
        },
        validate(action, engine) {
          if (action.type === 'PAUSE' && action.deck === 'A' && engine.decks.A.echo < 0.3) {
            return { pass: false, hint: '还没开回声就暂停啦！先把 Deck A 的 ECHO 推到 0.4 以上再按暂停。' };
          }
          if (action.type === 'PAUSE' && action.deck === 'A' && engine.decks.A.echo >= 0.3) {
            return { pass: true, praise: '太高级了！回声尾音让停歌变得毫无违和感。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-9',
    number: 9,
    title: '热键切片演奏（Hot Cue Play）',
    duration: '3 分钟',
    summary: '用 HC 1 / HC 2 / HC 3 在歌曲不同段落间瞬间跳跃，像鼓机一样演奏。',
    steps: [
      {
        id: 'l9-s1',
        title: '第一步：连续触发 HC 2 与 HC 3 跳段',
        instruction: '点击 Deck A 下方的「HC 2」或「HC 3」按钮，体验从副歌瞬间切到间奏的快感。',
        highlightSelector: '[data-control="deck-A-hotcue-1"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'golden-hour', { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-hotcue-1"]');
          await cursor.click();
          engine.triggerHotCue('A', 1, { silentAction: true });
          await wait(1000);
          await cursor.moveTo('[data-control="deck-A-hotcue-2"]');
          await cursor.click();
          engine.triggerHotCue('A', 2, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'HOT_CUE' && action.deck === 'A' && (action.index === 1 || action.index === 2)) {
            return { pass: true, praise: '节奏感十足！热键跳段是现场炒热气氛的利器。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-10',
    number: 10,
    title: '毕业实战：完整演出过渡',
    duration: '5 分钟',
    summary: '综合运用 SYNC 对拍、低频让位与 Crossfader 过渡，独立完成一次专业级切歌。',
    steps: [
      {
        id: 'l10-s1',
        title: '毕业考核：独立完成 A → B 混音过渡',
        instruction: '装入两首歌并播放 Deck A → 拧小 Deck B 的 BASS → 用 SYNC 对齐并播放 Deck B → 把 Crossfader 推到最右（B 盘 ≥ 0.85）！',
        highlightSelector: '[data-control="crossfader"]',
        async runDemo(engine, cursor) {
          await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          await engine.loadTrack('B', 'golden-hour', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
          engine.setEQ('B', 'low', -16, { silentAction: true });
          engine.play('A', { silentAction: true });
          engine.syncDeck('B', { silentAction: true });
          engine.play('B', { silentAction: true });
          await cursor.moveTo('[data-control="crossfader"]');
          for (let v = -1; v <= 1; v += 0.25) {
            engine.setCrossfader(v, { silentAction: true });
            await wait(160);
          }
          engine.setEQ('B', 'low', 0, { silentAction: true });
          await wait(800);
          engine.pause('A', { silentAction: true });
          engine.pause('B', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.isPlaying && engine.decks.B.isPlaying && engine.crossfader >= 0.85) {
            return { pass: true, praise: '🎉 太棒了！你已经掌握了完整的切歌过渡流程。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-11',
    number: 11,
    title: 'Filter + Loop 4 组合技',
    duration: '4 分钟',
    summary: '先用 Loop 4 锁住高潮小节，再用 Filter 高通扫频制造悬念，最后瞬间切入下一首。',
    steps: [
      {
        id: 'l11-s1',
        title: '第一步：锁定 A 盘 Loop 4 并推高 Filter',
        instruction: '开启 Deck A 的「LOOP 4」，并向右拖动 A 盘「FILTER」（≥ +0.4）拉起紧张感。',
        highlightSelector: '[data-control="deck-A-loop4"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'neon-vocal', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-loop4"]');
          await cursor.click();
          if (!engine.decks.A.loop4) engine.toggleLoop4('A', { silentAction: true });
          await cursor.moveTo('[data-control="deck-A-filter"]');
          engine.setFilter('A', 0.55, { silentAction: true });
          await wait(1200);
          engine.setFilter('A', 0, { silentAction: true });
          if (engine.decks.A.loop4) engine.toggleLoop4('A', { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.loop4 && engine.decks.A.filter >= 0.4) {
            return { pass: true, praise: '张力拉满！Loop + Filter 是舞池最常用的造浪手法。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-12',
    number: 12,
    title: '毕业演出：三首歌连续 Set 编排',
    duration: '5 分钟',
    summary: '在实战中连续完成风格切换：把《霓虹人声吉他》装入 B 盘并完成三曲连混收官！',
    steps: [
      {
        id: 'l12-s1',
        title: '终极考核：装入《霓虹人声吉他》并切入 B 盘',
        instruction: '在下方曲库找到「霓虹人声吉他 (Neon Vocal)」点击「→ B」装盘，用 SYNC 对齐并播放，最后将 Crossfader 推到最右（B ≥ 0.85）！',
        highlightSelector: '#crate-list',
        async runDemo(engine, cursor) {
          await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          await engine.loadTrack('B', 'neon-vocal', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
          engine.play('A', { silentAction: true });
          engine.syncDeck('B', { silentAction: true });
          engine.play('B', { silentAction: true });
          await cursor.moveTo('[data-control="crossfader"]');
          for (let v = -1; v <= 1; v += 0.25) {
            engine.setCrossfader(v, { silentAction: true });
            await wait(150);
          }
          await wait(1000);
          engine.pause('A', { silentAction: true });
          engine.pause('B', { silentAction: true });
          engine.setCrossfader(-1, { silentAction: true });
        },
        validate(action, engine) {
          if (
            engine.decks.B.track?.id === 'neon-vocal' &&
            engine.decks.B.isPlaying &&
            engine.crossfader >= 0.85
          ) {
            return { pass: true, praise: '第 12 课完成！接下来解锁 Part 4~6 高阶技巧课程！' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-13',
    number: 13,
    title: '黑胶刹车（Vinyl Brake）',
    duration: '3 分钟',
    summary: '模拟关闭黑胶唱机电源时转速缓缓降零的经典刹车停歌效果。',
    steps: [
      {
        id: 'l13-s1',
        title: '第一步：对正在播放的 A 盘执行 BRAKE',
        instruction: '确保 Deck A 正在播放，然后点击 Deck A 下方的「BRAKE」按钮体验唱盘减速停止。',
        highlightSelector: '[data-brake="A"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-brake="A"]');
          await cursor.click();
          engine.vinylBrake('A');
        },
        validate(action) {
          if (action.type === 'VINYL_TRICK' && action.deck === 'A' && action.trick === 'brake') {
            return { pass: true, praise: '丝滑停盘！Vinyl Brake 特别适合在落拍前制造瞬间寂静。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-14',
    number: 14,
    title: '急速倒转（Spinback）',
    duration: '3 分钟',
    summary: '快速向后拨动唱片制造急促倒带声，常用于切换完全不同 BPM 的曲风（如 House 切 DnB）。',
    steps: [
      {
        id: 'l14-s1',
        title: '第一步：触发 A 盘 SPINBACK',
        instruction: '点击 Deck A 下方的「SPIN」按钮制造倒转效果。',
        highlightSelector: '[data-spin="A"]',
        async runDemo(engine, cursor) {
          if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          engine.play('A', { silentAction: true });
          await cursor.moveTo('[data-spin="A"]');
          await cursor.click();
          engine.vinylSpinback('A');
        },
        validate(action) {
          if (action.type === 'VINYL_TRICK' && action.deck === 'A' && action.trick === 'spinback') {
            return { pass: true, praise: '炸场感十足！Spinback 后可以直接切入下一首完全不同速度的歌。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-15',
    number: 15,
    title: '搓碟切割曲线（Cut Curve）',
    duration: '4 分钟',
    summary: '在 Pro 模式下开启锐利 Cut 曲线，用 Crossfader 边缘快速开合切出节奏。',
    steps: [
      {
        id: 'l15-s1',
        title: '第一步：推动 Crossfader 完成快速切割',
        instruction: '在 Pro 模式勾选「Cut 曲线」，然后快速左右拨动 Crossfader 完成一次切割。',
        highlightSelector: '[data-control="crossfader"]',
        async runDemo(engine, cursor) {
          document.body.classList.add('pro-mode');
          engine.setCutCurve(true);
          await cursor.moveTo('[data-control="crossfader"]');
          engine.setCrossfader(0, { silentAction: true });
          await wait(200);
          engine.setCrossfader(-1, { silentAction: true });
        },
        validate(action) {
          if (action.type === 'CROSSFADER') {
            return { pass: true, praise: '清脆利落！锐利 Cut 曲线是 Hip-Hop 搓碟的核心设置。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-16',
    number: 16,
    title: '混音能量曲线与曲库管理',
    duration: '4 分钟',
    summary: '学会按 BPM 与能量值排序曲库，把《极速 DnB (174 BPM)》加入待播清单（Set）。',
    steps: [
      {
        id: 'l16-s1',
        title: '第一步：将高能量曲目加入 Set 待播清单',
        instruction: '在下方曲库找到「极速 DnB (Rush Hour)」并点击「+ Set」加入演出队列。',
        highlightSelector: '#crate-list',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#crate-list');
        },
        validate(action) {
          if (action.type === 'ADD_TO_SET') {
            return { pass: true, praise: '曲库管理满分！提前排好 Set 队列能让你在台上从容不迫。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-17',
    number: 17,
    title: '一键自动混音（Auto Mix）',
    duration: '3 分钟',
    summary: '在需要短暂离开控制台或暖场时，使用中央混音台的 AUTO MIX 自动完成平滑过渡。',
    steps: [
      {
        id: 'l17-s1',
        title: '第一步：触发 AUTO MIX A → B',
        instruction: '装入两首歌后，点击中央混音台顶部的「AUTO MIX」按钮观察自动过渡。',
        highlightSelector: '#btn-automix',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#btn-automix');
          await cursor.click();
        },
        validate(action) {
          if (action.type === 'AUTO_MIX') {
            return { pass: true, praise: '自动过渡已启动！Crossfader 正在平滑接管。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-18',
    number: 18,
    title: '录制你的第一场 Mix（REC）',
    duration: '3 分钟',
    summary: '使用顶部 REC 按钮实时录制主输出音频，停录后自动导出音频文件复盘。',
    steps: [
      {
        id: 'l18-s1',
        title: '第一步：点击顶部 REC 开始/停止录音',
        instruction: '点击顶部菜单栏的「● REC」按钮开始录制你的混音，再次点击即可保存导出。',
        highlightSelector: '#btn-rec',
        async runDemo(engine, cursor) {
          await cursor.moveTo('#btn-rec');
        },
        validate(action) {
          if (action.type === 'REC_TOGGLE') {
            return { pass: true, praise: '已开启/完成录制！听自己的录音是进步最快的方法。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-19',
    number: 19,
    title: 'Reverb + Flanger 空间感叠奏',
    duration: '4 分钟',
    summary: '在 Pro 模式下组合混响与镶边效果，为高潮段落前的过渡增加迷幻空间感。',
    steps: [
      {
        id: 'l19-s1',
        title: '第一步：开启 Pro 模式并推高 Reverb / Flanger',
        instruction: '切换到 Pro 模式，拖动 Deck A 的 REVERB 或 FLANGER 滑块聆听空间变化。',
        highlightSelector: '#btn-mode-pro',
        async runDemo(engine, cursor) {
          document.body.classList.add('pro-mode');
          if (!engine.decks.A.track) await engine.loadTrack('A', 'sunrise-house', { silentAction: true });
          engine.play('A', { silentAction: true });
          engine.setReverb('A', 0.6);
          await wait(1200);
          engine.setReverb('A', 0);
        },
        validate(action, engine) {
          if (engine.decks.A.reverb >= 0.2 || engine.decks.A.flanger >= 0.2) {
            return { pass: true, praise: '空间感出来了！注意效果器切忌一直满格，用在过渡瞬间最惊艳。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-20',
    number: 20,
    title: '情绪起伏：从暖场到高峰的编排',
    duration: '4 分钟',
    summary: '学会用 92 BPM Boom-Bap 暖场，再逐步拉升到 124 BPM Vocal House 与 174 BPM DnB。',
    steps: [
      {
        id: 'l20-s1',
        title: '第一步：用《低潮 Boom-Bap》作为暖场开篇',
        instruction: '在曲库中将「低潮 Boom-Bap (Low Tide)」装入 Deck A 并点击播放。',
        highlightSelector: '#crate-list',
        async runDemo(engine, cursor) {
          await engine.loadTrack('A', 'low-tide', { silentAction: true });
          engine.play('A', { silentAction: true });
          await wait(1000);
          engine.pause('A', { silentAction: true });
        },
        validate(action, engine) {
          if (engine.decks.A.track?.id === 'low-tide' && engine.decks.A.isPlaying) {
            return { pass: true, praise: '很好的暖场选择！留白与铺垫能让后面的高潮更有爆发力。' };
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'lesson-21',
    number: 21,
    title: '四周每日 20 分钟大师练习计划',
    duration: '3 分钟',
    summary: '第 1 周练听拍与 EQ，第 2 周练乐句与 Loop，第 3 周练搓碟与 FX，第 4 周每天录一套 15 分钟 Set。',
    steps: [
      {
        id: 'l21-s1',
        title: '毕业宣言：触发空气喇叭庆祝结业！',
        instruction: '点击下方采样垫的「空气喇叭」音效，庆祝完成全部 22 节 Backspin 中文版互动课程！',
        highlightSelector: '[data-sampler="airhorn"]',
        async runDemo(engine, cursor) {
          await cursor.moveTo('[data-sampler="airhorn"]');
          await cursor.click();
          engine.triggerSampler('airhorn');
        },
        validate(action) {
          if (action.type === 'SAMPLER' && action.padId === 'airhorn') {
            return { pass: true, praise: '🎉 恭喜完成全部 21 节课程！你已解锁浏览器 DJ 大师成就！' };
          }
          return null;
        }
      }
    ]
  }
];
