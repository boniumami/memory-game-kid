/* =========================================================
 * session.js - 会话启动、关卡调度、结算、间隔复习、等级进度
 * ========================================================= */

/* ---------- 会话启动 ---------- */
function startSession() {
  if (!state.selectedAvatar) return;

  const due = getDueReviews();
  const isReview = due.length > 0;

  state.session = {
    isReview,
    reviewItems: isReview ? due : [],
    starsEarned: 0,
    recallCorrect: 0,
    recallTotal: 0,
    sortCorrect: 0,
    sortTotal: 0,
    usedSequence: false,
    sortStrategyStars: 0,
    // 各关卡本轮统计（用于达标判定）
    stageStats: {},
    // 本轮要跑的关卡顺序
    plan: [],
    planIndex: 0,
  };

  // 复习模式：只跑回忆寻宝（隐藏→主动回忆）
  if (isReview) {
    state.session.plan = ["recall"];
  } else {
    // 每日一局：从当前等级可用关卡中随机分配 2 个
    const available = currentLevelStages();
    state.session.plan = sample(available, Math.min(CONFIG.stagesPerDay, available.length));
  }

  showScreen("screen-game");
  $("#star-count").textContent = "0";
  runNextStage();
}

/** 执行计划中的下一关 */
function runNextStage() {
  const s = state.session;
  if (!s) return;
  if (s.planIndex >= s.plan.length) {
    finishSession();
    return;
  }
  const stage = s.plan[s.planIndex];
  if (stage === "recall") {
    startRecallSession();
  } else if (stage === "sort") {
    startSortSession();
  } else if (stage === "story") {
    startStorySession();
  } else if (stage === "similar") {
    startSimilarSession();
  } else {
    // 未知关卡，跳过
    s.planIndex++;
    runNextStage();
  }
}

/** 隐藏所有关卡舞台 */
function hideAllStages() {
  ["recall-stage", "sort-stage", "story-stage", "similar-stage"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

/* ---------- 关卡达标统计 ---------- */
/** 记录某关卡本轮的一次答题结果 */
function recordStageStat(type, isCorrect) {
  const s = state.session;
  if (!s) return;
  if (!s.stageStats[type]) s.stageStats[type] = { correct: 0, total: 0 };
  s.stageStats[type].total++;
  if (isCorrect) s.stageStats[type].correct++;
}

/* ---------- 结算 ---------- */
function finishSession() {
  const s = state.session;
  clearTimer();

  // 记录今日数据
  const today = todayStr();
  const prev = state.data.daily[today] || {
    recallCorrect: 0,
    recallTotal: 0,
    sortCorrect: 0,
    sortTotal: 0,
    stars: 0,
  };
  state.data.daily[today] = {
    recallCorrect: prev.recallCorrect + s.recallCorrect,
    recallTotal: prev.recallTotal + s.recallTotal,
    sortCorrect: prev.sortCorrect + s.sortCorrect,
    sortTotal: prev.sortTotal + s.sortTotal,
    stars: prev.stars + s.starsEarned,
  };

  // 勋章判定
  if (s.recallCorrect >= Math.ceil(s.recallTotal * 0.75) && s.recallTotal > 0) {
    state.data.badges.recallMaster = true;
  }
  if (s.sortStrategyStars > 0) {
    state.data.badges.sortMaster = true;
  }

  // 主线完成 → 安排间隔复习
  if (!s.isReview) {
    state.data.lastPlayDate = today;
    scheduleReviews(today);
    // 难度分层：计算达标与解锁
    updateLevelProgress(s, today);
  }

  Store.save(state.data);

  // 渲染结算
  renderResult(s);
  showScreen("screen-result");
}

/**
 * 计算本局各关卡达标情况，更新连续达标次数与解锁状态
 * 达标规则：单关卡正确率 ≥ passRate 算达标
 */
function updateLevelProgress(s, today) {
  const prog = state.data.progress;
  const stageRecords = [];
  let allPassed = true;
  let anyStage = false;

  Object.keys(s.stageStats).forEach((type) => {
    const st = s.stageStats[type];
    if (!st || st.total === 0) return;
    anyStage = true;
    const rate = st.correct / st.total;
    const passed = rate >= CONFIG.passRate;
    if (!passed) allPassed = false;
    stageRecords.push({ type, correct: st.correct, total: st.total, passed });
  });

  // 记录历史
  prog.history.push({
    date: today,
    level: currentLevelId(),
    stages: stageRecords,
  });
  // 只保留最近 30 条历史
  if (prog.history.length > 30) prog.history = prog.history.slice(-30);

  // 连续达标：本局所有关卡都达标才算一次达标
  if (anyStage && allPassed) {
    prog.unlockStreak = (prog.unlockStreak || 0) + 1;
  } else {
    prog.unlockStreak = 0;
  }

  // 达到连续达标次数 → 解锁下一级
  const nextLevel = currentLevelId() + 1;
  const nextCfg = CONFIG.levels.find((l) => l.id === nextLevel);
  if (nextCfg && prog.unlockStreak >= CONFIG.unlockStreak && !prog.unlocked.includes(nextLevel)) {
    prog.unlocked.push(nextLevel);
    prog.currentLevel = nextLevel;
    prog.unlockStreak = 0; // 进入新等级，重新计数
    s.justUnlockedLevel = nextLevel;
  }
}

/** 安排间隔复习（次日、第 4 天） */
function scheduleReviews(fromDate) {
  const level = state.data.recall.level;
  CONFIG.reviewDays.forEach((offset) => {
    const due = new Date(fromDate + "T00:00:00");
    due.setDate(due.getDate() + offset);
    state.data.reviews.push({
      id: `rv_${fromDate}_${offset}_${Math.random().toString(36).slice(2, 7)}`,
      level,
      dueDate: todayStr(due),
      streak: 0,
      done: false,
    });
  });
  // 清理已完成的旧复习，避免无限增长
  state.data.reviews = state.data.reviews.filter((r) => !r.done).slice(-20);
}

/* ---------- 结算渲染 ---------- */
function renderResult(s) {
  const av = CONFIG.avatars.find((a) => a.id === state.selectedAvatar) || CONFIG.avatars[0];
  $("#result-avatar").textContent = av.emoji;
  $("#result-title").textContent = s.isReview ? "复习完成啦！" : "今天的寻宝完成啦！";
  $("#result-star-count").textContent = String(s.starsEarned);

  // 勋章
  const badgesEl = $("#result-badges");
  badgesEl.innerHTML = "";
  const badgeDefs = [
    { key: "recallMaster", emoji: "🧠", name: "回忆小达人", got: state.data.badges.recallMaster },
    { key: "sortMaster", emoji: "🧺", name: "分组小能手", got: state.data.badges.sortMaster },
  ];
  badgeDefs.forEach((b) => {
    const el = document.createElement("div");
    el.className = "badge" + (b.got ? "" : " locked");
    el.innerHTML = `<span class="badge-emoji">${b.emoji}</span><span class="badge-name">${b.name}</span>`;
    badgesEl.appendChild(el);
  });

  // 等级进度与解锁状态
  renderResultLevel(s);

  // 鼓励话术（正向、不夸大）
  const encourage = pickEncourage(s);
  $("#result-encourage").textContent = encourage;
  speak(encourage);

  // 复习提示
  const reviewEl = $("#result-review");
  if (s.isReview) {
    const remaining = getDueReviews().length;
    reviewEl.textContent = remaining > 0
      ? `还有 ${remaining} 个宝藏需要复习，明天再来吧～`
      : "复习都完成啦，这些宝藏你已经记得很牢了！";
  } else {
    reviewEl.textContent = "明天和后天会提醒你复习今天的内容，记得回来哦～";
  }
}

function pickEncourage(s) {
  const pool = [];
  if (s.recallTotal > 0) {
    pool.push("你主动回忆的样子真棒，这就是让记忆变牢的好方法！");
  }
  if (s.sortStrategyStars > 0) {
    pool.push("你会把东西分组来记，这个办法很聪明！");
  }
  if (s.usedSequence) {
    pool.push("按顺序记忆是个好习惯，继续保持！");
  }
  if (pool.length === 0) {
    pool.push("今天也认真练习啦，休息一下，明天会记得更好～");
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 渲染结算页的等级进度与解锁状态 */
function renderResultLevel(s) {
  const el = $("#result-level");
  if (!el) return;
  if (s.isReview) {
    el.innerHTML = "";
    return;
  }
  const cur = currentLevelId();
  const curCfg = getLevelConfig(cur);
  const nextCfg = CONFIG.levels.find((l) => l.id === cur + 1);
  const streak = state.data.progress.unlockStreak || 0;

  let html = `<div class="result-level-row"><span class="level-badge">L${cur}</span> 当前等级：${curCfg.name}</div>`;

  if (s.justUnlockedLevel) {
    const unlockedCfg = getLevelConfig(s.justUnlockedLevel);
    html += `<div class="result-unlock">🎉 恭喜解锁新等级「${unlockedCfg.name}」！</div>`;
  }

  if (nextCfg) {
    const pct = Math.min(100, Math.round((streak / CONFIG.unlockStreak) * 100));
    html += `
      <div class="result-level-row">下一级「${nextCfg.name}」进度：${streak}/${CONFIG.unlockStreak}</div>
      <div class="level-progress"><div class="level-progress-fill" style="width:${pct}%"></div></div>
    `;
  } else {
    html += `<div class="result-level-row">已经是最高等级啦，继续巩固吧！</div>`;
  }

  el.innerHTML = html;
}
