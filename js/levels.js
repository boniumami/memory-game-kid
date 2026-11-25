/* =========================================================
 * levels.js - 难度分层辅助（等级配置、解锁进度渲染）
 * ========================================================= */

/** 获取等级配置 */
function getLevelConfig(levelId) {
  return CONFIG.levels.find((l) => l.id === levelId) || CONFIG.levels[0];
}

/** 当前等级 */
function currentLevelId() {
  return state.data.progress.currentLevel || 1;
}

/** 当前等级可用的关卡类型 */
function currentLevelStages() {
  return getLevelConfig(currentLevelId()).stages.slice();
}

/** 是否已解锁某等级 */
function isLevelUnlocked(levelId) {
  return state.data.progress.unlocked.includes(levelId);
}

/** 渲染首页等级与解锁进度 */
function renderHomeLevel() {
  const el = $("#home-level");
  if (!el) return;
  const cur = currentLevelId();
  const curCfg = getLevelConfig(cur);
  const nextCfg = CONFIG.levels.find((l) => l.id === cur + 1);
  const streak = state.data.progress.unlockStreak || 0;

  let nextHtml = "";
  if (nextCfg) {
    const pct = Math.min(100, Math.round((streak / CONFIG.unlockStreak) * 100));
    nextHtml = `
      <div class="level-next">
        <span>下一级「${nextCfg.name}」解锁进度：${streak}/${CONFIG.unlockStreak}</span>
        <div class="level-progress"><div class="level-progress-fill" style="width:${pct}%"></div></div>
        <span class="level-next-desc">解锁内容：${nextCfg.desc}</span>
      </div>`;
  } else {
    nextHtml = `<div class="level-next"><span>已经是最高等级啦，继续巩固吧！</span></div>`;
  }

  el.innerHTML = `
    <div class="level-current">
      <span class="level-badge">L${cur}</span>
      <span class="level-name-text">当前等级：${curCfg.name}</span>
    </div>
    ${nextHtml}
  `;
}
