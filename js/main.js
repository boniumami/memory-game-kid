/* =========================================================
 * main.js - 事件绑定与初始化（入口）
 * ========================================================= */

function bindEvents() {
  // 首页开始
  $("#btn-start").addEventListener("click", startSession);

  // 确认按钮：根据当前关卡分发
  $("#btn-confirm").addEventListener("click", () => {
    const s = state.session;
    if (!s) return;
    const stage = s.plan[s.planIndex];
    if (stage === "recall") submitRecall();
    else if (stage === "story") submitStoryRecall();
    else if (stage === "similar") submitSimilarRecall();
  });

  // 下一轮按钮：根据当前关卡分发
  $("#btn-next").addEventListener("click", () => {
    const s = state.session;
    if (!s) return;
    const stage = s.plan[s.planIndex];
    if (stage === "recall") {
      s.recallRoundIndex++;
      nextRecallRound();
    } else if (stage === "sort") {
      s.sortRoundIndex++;
      nextSortRound();
    } else if (stage === "story") {
      s.storyRoundIndex++;
      nextStoryRound();
    } else if (stage === "similar") {
      s.similarRoundIndex++;
      nextSimilarRound();
    }
  });

  // 故事关：提交小故事（可选加分）
  $("#btn-story-submit").addEventListener("click", submitStory);

  // 结算回到首页
  $("#btn-home").addEventListener("click", () => {
    state.session = null;
    state.recallRound = null;
    state.sortRound = null;
    state.storyRound = null;
    state.similarRound = null;
    clearTimer();
    renderHomeLevel();
    updateHomeStatus();
    showScreen("screen-home");
  });

  // 语音开关
  $("#btn-sound").addEventListener("click", () => {
    CONFIG.speech.enabled = !CONFIG.speech.enabled;
    $("#btn-sound").classList.toggle("muted", !CONFIG.speech.enabled);
    $("#btn-sound").textContent = CONFIG.speech.enabled ? "🔊" : "🔇";
    if (!CONFIG.speech.enabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  // 家长面板
  $("#btn-parent").addEventListener("click", openParentPanel);
  $("#btn-parent-close").addEventListener("click", closeParentPanel);
  $("#btn-parent-unlock").addEventListener("click", unlockParent);
  $("#parent-pwd").addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlockParent();
  });
  $("#parent-modal").addEventListener("click", (e) => {
    if (e.target.id === "parent-modal") closeParentPanel();
  });

  // 清空数据
  $("#btn-reset-data").addEventListener("click", () => {
    if (window.confirm("确定要清空本机的游戏记录吗？此操作不可恢复。")) {
      Store.clear();
      state.data = Store.load();
      state.selectedAvatar = null;
      closeParentPanel();
      renderAvatars();
      renderHomeLevel();
      updateHomeStatus();
    }
  });
}

/* ---------- 初始化 ---------- */
function init() {
  // 恢复上次选择的角色
  if (state.data.avatarId) {
    state.selectedAvatar = state.data.avatarId;
  }
  renderAvatars();
  renderHomeLevel();
  updateHomeStatus();
  bindEvents();
  // 语音需在用户手势后解锁（规避微信/Safari 自动播放限制）
  bindSpeechUnlock();
  showScreen("screen-home");
}


document.addEventListener("DOMContentLoaded", init);
