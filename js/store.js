/* =========================================================
 * store.js - 存储层（localStorage）与全局状态
 * ========================================================= */

const Store = {
  /** 读取全部数据，带默认结构 */
  load() {
    const def = {
      avatarId: null,
      stars: 0,
      badges: { recallMaster: false, sortMaster: false },
      // 回忆寻宝自适应状态
      recall: {
        level: CONFIG.recall.startCount,
        upStreak: 0,
        downStreak: 0,
        sequenceUnlocked: false,
        freeStreak: 0,
      },
      // 每日主线记录：{ date: { recallCorrect, recallTotal, sortCorrect, sortTotal, stars } }
      daily: {},
      // 复习队列：[{ id, level, dueDate, streak, done }]
      reviews: [],
      // 最近一次完成日期
      lastPlayDate: null,
      // 难度分层体系状态
      progress: {
        currentLevel: 1,        // 当前等级 1/2/3
        unlockStreak: 0,        // 当前等级连续达标次数
        unlocked: [1],          // 已解锁等级
        history: [],            // 历史记录：[{ date, level, stages:[{type, correct, total, passed}] }]
      },
    };
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return def;
      const data = JSON.parse(raw);
      // 合并默认值，防止旧数据缺字段
      const progress = { ...def.progress, ...(data.progress || {}) };
      if (!Array.isArray(progress.unlocked) || progress.unlocked.length === 0) {
        progress.unlocked = [1];
      }
      if (!Array.isArray(progress.history)) progress.history = [];
      return {
        ...def,
        ...data,
        badges: { ...def.badges, ...(data.badges || {}) },
        recall: { ...def.recall, ...(data.recall || {}) },
        daily: data.daily || {},
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        progress,
      };
    } catch (e) {
      return def;
    }
  },

  /** 保存全部数据 */
  save(data) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch (e) {
      /* 存储失败（隐私模式等）静默处理 */
    }
  },

  /** 清空 */
  clear() {
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {}
  },
};

/* ---------- 全局状态 ---------- */
const state = {
  data: Store.load(),
  selectedAvatar: null,
  // 当前会话
  session: null,
  // 当前回忆轮次数据
  recallRound: null,
  // 当前分类轮次数据
  sortRound: null,
  // 当前故事轮次数据
  storyRound: null,
  // 当前相似干扰轮次数据
  similarRound: null,
  // 计时器句柄
  timerHandle: null,
};
