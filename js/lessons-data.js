/**
 * 5 节核心互动课程定义
 * 每一步均包含：高亮目标、Show me 自动演示脚本、语义化纠错规则
 */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const LESSONS = [
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
            return { pass: true, praise: '🎉 恭喜毕业！你已通关全部 10 节 DJ 互动课程，可以试试顶部的「🎯 盲听挑战」了！' };
          }
          return null;
        }
      }
    ]
  }
];
