/* =========================================================
 * utils.js - 通用工具函数
 * ========================================================= */

/** 选择单个元素 */
const $ = (sel) => document.querySelector(sel);
/** 选择多个元素（返回数组） */
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/** 洗牌（Fisher-Yates），返回新数组 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 从数组中随机取 n 个不重复元素 */
function sample(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

/** 返回 YYYY-MM-DD 格式的本地日期字符串 */
function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 计算两个日期字符串相差的天数（b - a） */
function daysBetween(aStr, bStr) {
  const a = new Date(aStr + "T00:00:00");
  const b = new Date(bStr + "T00:00:00");
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/* ---------- 语音朗读 ----------
 * 浏览器（尤其微信内置浏览器 / iOS Safari）会拦截"非用户手势"触发的语音。
 * 策略：
 *  1) 首次用户交互（点击/触摸/按键）时解锁语音，并播放一段静音"预热"，
 *     让后续 speak 在已解锁的上下文中生效；
 *  2) 未解锁前调用 speak 时，把文案暂存，解锁后补播最近一条；
 *  3) 所有 speak 调用都发生在点击回调或点击后的同步流程中，避免自动播放限制。
 */
const Speech = {
  unlocked: false,
  pending: null,
  /** 在用户手势中调用：解锁并预热语音引擎 */
  unlock() {
    if (this.unlocked) return;
    if (!("speechSynthesis" in window)) return;
    this.unlocked = true;
    try {
      // 播放一段极短静音，激活语音引擎（iOS/微信需要）
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      warm.lang = CONFIG.speech.lang;
      window.speechSynthesis.speak(warm);
    } catch (e) {
      /* 忽略 */
    }
    // 补播解锁前暂存的文案
    if (this.pending) {
      const t = this.pending;
      this.pending = null;
      speak(t);
    }
  },
};

/** 语音朗读（带开关与兼容判断；未解锁时暂存） */
function speak(text) {
  if (!CONFIG.speech.enabled || !text) return;
  if (!("speechSynthesis" in window)) return;
  // 尚未经过用户手势解锁：暂存，等解锁后补播
  if (!Speech.unlocked) {
    Speech.pending = text;
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = CONFIG.speech.lang;
    u.rate = CONFIG.speech.rate;
    u.pitch = CONFIG.speech.pitch;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* 忽略语音错误，不影响游戏 */
  }
}

/** 绑定一次性用户手势解锁（在 main.js 初始化时调用） */
function bindSpeechUnlock() {
  const handler = () => {
    Speech.unlock();
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("touchstart", handler, true);
    document.removeEventListener("click", handler, true);
    document.removeEventListener("keydown", handler, true);
  };
  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("touchstart", handler, true);
  document.addEventListener("click", handler, true);
  document.addEventListener("keydown", handler, true);
}


