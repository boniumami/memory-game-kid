/* =========================================================
 * cards.js - 通用卡片网格辅助（供故事关、相似干扰关复用）
 * ========================================================= */

/**
 * 在指定网格中渲染候选卡片
 * @param {string} gridId 网格元素 id
 * @param {string[]} emojis 候选 emoji
 * @param {object} round 当前轮次对象（含 selected 数组）
 * @param {function} onToggle 点击回调
 */
function renderSelectableGrid(gridId, emojis, round, onToggle) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = "";
  emojis.forEach((emoji) => {
    const card = document.createElement("div");
    card.className = "card selectable";
    card.dataset.emoji = emoji;
    const face = document.createElement("span");
    face.className = "card-emoji";
    face.textContent = emoji;
    card.appendChild(face);
    card.addEventListener("click", () => onToggle(card));
    grid.appendChild(card);
  });
}

/** 通用：切换候选卡片选中状态 */
function toggleSelectable(card, round) {
  if (!round || round.phase !== "select") return;
  const emoji = card.dataset.emoji;
  const idx = round.selected.indexOf(emoji);
  if (idx >= 0) {
    round.selected.splice(idx, 1);
    card.classList.remove("selected");
  } else {
    round.selected.push(emoji);
    card.classList.add("selected");
  }
}

/** 通用：揭晓候选卡片对错 */
function revealSelectableGrid(gridId, targets, selected) {
  $$(`#${gridId} .card`).forEach((card) => {
    const emoji = card.dataset.emoji;
    card.classList.remove("selectable", "selected");
    card.classList.add("disabled");
    const reveal = (cls) => {
      card.classList.add(cls);
      const face = document.createElement("span");
      face.className = "card-emoji";
      face.textContent = emoji;
      card.appendChild(face);
    };
    if (targets.includes(emoji)) {
      reveal("correct");
    } else if (selected.includes(emoji)) {
      reveal("wrong");
    }
  });
}
