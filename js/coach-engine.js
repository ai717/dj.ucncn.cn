/**
 * 互动教练状态机、Show me 虚拟光标与 localStorage 进度管理
 */

import { LESSONS } from './lessons-data.js';

const STORAGE_KEY = 'ucncn_dj_progress_v1';

export class VirtualCursor {
  constructor(el) {
    this.el = el;
  }

  async moveTo(selector) {
    const target = document.querySelector(selector);
    if (!target || !this.el) return;
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width * 0.5;
    const y = rect.top + rect.height * 0.5;
    this.el.classList.add('active');
    this.el.style.transform = `translate(${x}px, ${y}px)`;
    await new Promise((r) => setTimeout(r, 420));
  }

  async click() {
    if (!this.el) return;
    this.el.classList.add('clicking');
    await new Promise((r) => setTimeout(r, 220));
    this.el.classList.remove('clicking');
  }

  hide() {
    if (!this.el) return;
    this.el.classList.remove('active', 'clicking');
  }
}

export class CoachEngine {
  constructor(audioEngine, uiCallbacks) {
    this.audio = audioEngine;
    this.ui = uiCallbacks;
    this.cursor = new VirtualCursor(document.getElementById('virtual-cursor'));

    this.state = this._loadProgress();
    this.isLessonActive = false;
    this.isDemoRunning = false;
    this.isAdvancing = false;
    this.advanceTimer = null;
    this.highlightedEl = null;

    this.audio.onAction((action) => this._handleAction(action));
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          lessonIndex: Math.min(LESSONS.length - 1, parsed.lessonIndex || 0),
          stepIndex: parsed.stepIndex || 0,
          completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : []
        };
      }
    } catch (_) {}
    return { lessonIndex: 0, stepIndex: 0, completedLessons: [] };
  }

  _saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (_) {}
  }

  getCurrentLesson() {
    return LESSONS[this.state.lessonIndex] || LESSONS[0];
  }

  getCurrentStep() {
    const lesson = this.getCurrentLesson();
    return lesson.steps[this.state.stepIndex] || lesson.steps[0];
  }

  _cancelPendingAdvance() {
    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    this.isAdvancing = false;
  }

  selectLesson(index) {
    if (index < 0 || index >= LESSONS.length) return;
    this._cancelPendingAdvance();
    this.state.lessonIndex = index;
    this.state.stepIndex = 0;
    this.isLessonActive = true;
    this._saveProgress();
    this.renderStep();
  }

  setLessonActive(active) {
    this._cancelPendingAdvance();
    this.isLessonActive = Boolean(active);
    this.renderStep();
  }

  prevStep() {
    if (this.isDemoRunning) return;
    this._cancelPendingAdvance();
    if (this.state.stepIndex > 0) {
      this.state.stepIndex -= 1;
      this._saveProgress();
      this.renderStep();
    } else if (this.state.lessonIndex > 0) {
      this.state.lessonIndex -= 1;
      this.state.stepIndex = 0;
      this._saveProgress();
      this.renderStep();
    }
  }

  skipStep() {
    if (this.isDemoRunning) return;
    this._cancelPendingAdvance();
    this._advance();
  }

  resetProgress() {
    this._cancelPendingAdvance();
    this.state = { lessonIndex: 0, stepIndex: 0, completedLessons: [] };
    this._saveProgress();
    this.renderStep();
  }

  renderStep(feedback = null) {
    const lesson = this.getCurrentLesson();
    const step = this.getCurrentStep();

    if (this.highlightedEl) {
      this.highlightedEl.classList.remove('coach-highlight');
      this.highlightedEl = null;
    }

    if (this.isLessonActive && step.highlightSelector) {
      let el = document.querySelector(step.highlightSelector);
      if (el) {
        // 若引导目标位于仅专业模式可见的区段，自动切入专业模式保证高亮与悬浮引导可见
        if (el.closest('.pro-only') && !document.body.classList.contains('pro-mode')) {
          document.body.classList.add('pro-mode');
          document.getElementById('btn-mode-simple')?.classList.remove('active');
          document.getElementById('btn-mode-pro')?.classList.add('active');
        }
        // range input 无法直接渲染 ::after 透明层，提升至包裹容器
        if (el.tagName === 'INPUT' && el.type === 'range' && el.parentElement) {
          el = el.parentElement;
        }
        el.classList.add('coach-highlight');
        this.highlightedEl = el;
      }
    }

    this.ui.updateCoachPanel({
      lesson,
      step,
      stepNumber: this.state.stepIndex + 1,
      totalSteps: lesson.steps.length,
      completedCount: this.state.completedLessons.length,
      totalLessons: LESSONS.length,
      isLessonActive: this.isLessonActive,
      isDemoRunning: this.isDemoRunning,
      feedback
    });
  }

  async runShowMe() {
    if (this.isDemoRunning) return;
    this.isLessonActive = true;
    this.audio.ensureContext();
    const step = this.getCurrentStep();
    this.isDemoRunning = true;
    this.renderStep({ type: 'info', text: '请看唱机与混音台上的自动演示…' });

    try {
      await step.runDemo(this.audio, this.cursor);
    } finally {
      this.cursor.hide();
      this.isDemoRunning = false;
      this.renderStep({ type: 'info', text: '演示完毕，轮到你动手试试！' });
    }
  }

  _handleAction(action) {
    if (!this.isLessonActive || this.isDemoRunning || this.isAdvancing) return;
    const step = this.getCurrentStep();
    const result = step.validate(action, this.audio);
    if (!result) return;

    if (result.pass) {
      this.isAdvancing = true;
      this.renderStep({ type: 'success', text: `✓ ${result.praise}` });
      this.advanceTimer = setTimeout(() => {
        this.advanceTimer = null;
        this.isAdvancing = false;
        this._advance();
      }, 1100);
    } else {
      this.renderStep({ type: 'error', text: result.hint });
    }
  }

  _advance() {
    const lesson = this.getCurrentLesson();
    if (this.state.stepIndex + 1 < lesson.steps.length) {
      this.state.stepIndex += 1;
    } else {
      if (!this.state.completedLessons.includes(lesson.id)) {
        this.state.completedLessons.push(lesson.id);
      }
      if (this.state.lessonIndex + 1 < LESSONS.length) {
        this.state.lessonIndex += 1;
        this.state.stepIndex = 0;
      } else {
        this.state.stepIndex = lesson.steps.length - 1;
      }
    }
    this._saveProgress();
    this.renderStep();
  }
}
