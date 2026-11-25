/* =========================================================
 * ui.js - 通用 UI：屏幕切换、首页、星星/策略提示、计时器
 * ========================================================= */

/* ---------- 屏幕切换 ---------- */
function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

/* ---------- 首页：角色选择 ---------- */
function renderAvatars() {
  const list = $("#avatar-list");
  list.innerHTML = "";
  CONFIG.avatars.forEach((av) => {
    const item = document.createElement("button");
    item.className = "avatar-item";
    item.type = "button";
    item.dataset.id = av.id;
    item.innerHTML = `<span class="avatar-emoji">${av.emoji}</span><span class="avatar-name">${av.name}</span>`;
    if (state.data.avatarId === av.id) item.classList.add("selected");
    item.addEventListener("click", () => selectAvatar(av.id));
    list.appendChild(item);
  });
}

function selectAvatar(id) {
  state.selectedAvatar = id;
  state.data.avatarId = id;
  Store.save(state.data);
  $$(".avatar-item").forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
  updateHomeStatus();
}

/** 判断今天是否已完成主线 */
function isTodayDone() {
  return !!state.data.daily[todayStr()];
}

/** 获取今天应复习的条目 */
function getDueReviews() {
  const today = todayStr();
  return state.data.reviews.filter((r) => !r.done && r.dueDate <= today);
}

/** 更新首页状态与开始按钮 */
function updateHomeStatus() {
  const statusEl = $("#home-status");
  const startBtn = $("#btn-start");
  statusEl.innerHTML = "";

  if (!state.selectedAvatar) {
    startBtn.disabled = true;
    startBtn.textContent = "开始今天的寻宝";
    return;
  }

  const due = getDueReviews();
  const done = isTodayDone();

  if (done && due.length === 0) {
    startBtn.disabled = true;
    startBtn.textContent = "今天已经完成啦";
    statusEl.innerHTML = `<span class="review-badge">今天已经玩过一轮啦，明天再来吧 🌙</span>`;
    return;
  }

  if (due.length > 0) {
    startBtn.disabled = false;
    startBtn.textContent = "开始复习寻宝";
    statusEl.innerHTML = `<span class="review-badge">有 ${due.length} 个宝藏等你复习哦 🔁</span>`;
    return;
  }

  startBtn.disabled = false;
  startBtn.textContent = "开始今天的寻宝";
}

/* ---------- 星星 & 策略提示 ---------- */
function addStars(n) {
  if (!n || n <= 0) return;
  state.session.starsEarned += n;
  state.data.stars += n;
  $("#star-count").textContent = String(state.session.starsEarned);
  Store.save(state.data);
}

function setStrategy(text) {
  $("#strategy-text").textContent = text || "";
}

/* ---------- 计时条 ---------- */
/**
 * 计时条动画（可指定计时条元素，默认回忆关）
 * @param {number} durationMs 时长
 * @param {function} onDone 结束回调
 * @param {object} [ids] 自定义元素 id：{ timer, fill, text }
 */
function runTimer(durationMs, onDone, ids) {
  clearTimer();
  const timerId = (ids && ids.timer) || "recall-timer";
  const fillId = (ids && ids.fill) || "timer-fill";
  const textId = (ids && ids.text) || "timer-text";
  const timerEl = document.getElementById(timerId);
  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!timerEl || !fill || !text) {
    // 找不到计时元素时直接延时执行
    setTimeout(() => { if (typeof onDone === "function") onDone(); }, durationMs);
    return;
  }
  timerEl.classList.remove("hidden");
  fill.style.width = "100%";
  text.textContent = "看仔细啦…";

  const start = performance.now();
  state.timerHandle = setInterval(() => {
    const elapsed = performance.now() - start;
    const ratio = Math.max(0, 1 - elapsed / durationMs);
    fill.style.width = (ratio * 100).toFixed(1) + "%";
    if (ratio <= 0) {
      clearTimer();
      timerEl.classList.add("hidden");
      if (typeof onDone === "function") onDone();
    }
  }, 60);
}

function clearTimer() {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
}
