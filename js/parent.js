/* =========================================================
 * parent.js - 家长面板（密码保护、今日表现、策略表现、迁移建议）
 * ========================================================= */

function openParentPanel() {
  $("#parent-modal").classList.remove("hidden");
  $("#parent-lock").classList.remove("hidden");
  $("#parent-content").classList.add("hidden");
  $("#parent-pwd").value = "";
  $("#parent-pwd-err").textContent = "";
}

function closeParentPanel() {
  $("#parent-modal").classList.add("hidden");
}

function unlockParent() {
  const pwd = $("#parent-pwd").value.trim();
  if (pwd === CONFIG.parentPassword) {
    $("#parent-lock").classList.add("hidden");
    $("#parent-content").classList.remove("hidden");
    renderParentContent();
  } else {
    $("#parent-pwd-err").textContent = "密码不对哦，请再试一次";
  }
}

/** 渲染家长面板内容 */
function renderParentContent() {
  const today = todayStr();
  const d = state.data.daily[today];

  // 今日表现
  const todayEl = $("#panel-today");
  if (!d) {
    todayEl.innerHTML = `<div class="stat-row"><span>今天还没有完成练习</span><b>—</b></div>`;
  } else {
    const recallRate = d.recallTotal > 0 ? Math.round((d.recallCorrect / d.recallTotal) * 100) : 0;
    const sortRate = d.sortTotal > 0 ? Math.round((d.sortCorrect / d.sortTotal) * 100) : 0;
    todayEl.innerHTML = `
      <div class="stat-row"><span>回忆寻宝正确率</span><b>${recallRate}%（${d.recallCorrect}/${d.recallTotal}）</b></div>
      <div class="stat-row"><span>分类小管家全对轮次</span><b>${sortRate}%（${d.sortCorrect}/${d.sortTotal}）</b></div>
      <div class="stat-row"><span>今日获得星星</span><b>⭐ ${d.stars}</b></div>
    `;
  }

  // 策略表现
  const r = state.data.recall;
  const strategyEl = $("#panel-strategy");
  const pendingReviews = state.data.reviews.filter((x) => !x.done).length;
  strategyEl.innerHTML = `
    <div class="stat-row"><span>当前回忆卡片数量</span><b>${r.level} 张</b></div>
    <div class="stat-row"><span>顺序回忆</span><b>${r.sequenceUnlocked ? "已解锁" : "未解锁"}</b></div>
    <div class="stat-row"><span>回忆小达人勋章</span><b>${state.data.badges.recallMaster ? "已获得" : "未获得"}</b></div>
    <div class="stat-row"><span>分组小能手勋章</span><b>${state.data.badges.sortMaster ? "已获得" : "未获得"}</b></div>
    <div class="stat-row"><span>待复习宝藏</span><b>${pendingReviews} 个</b></div>
  `;

  // 迁移学习建议
  const adviceEl = $("#panel-advice");
  adviceEl.innerHTML = `
    <ul>
      <li><b>背古诗：</b>先让孩子读一遍，然后合上书主动回忆下一句（检索练习），比反复朗读更有效。</li>
      <li><b>记生字：</b>把生字按偏旁或意思分组（组块），一组一组记，比零散记更牢。</li>
      <li><b>间隔复习：</b>今天学的内容，明天、第四天各回忆一次，每次先回忆再看答案。</li>
      <li><b>鼓励策略：</b>多表扬孩子「用了什么方法记住的」，而不只是「记住了没有」。</li>
    </ul>
  `;
}
