/* =========================================================
 * sort.js - 分类小管家关卡（组块训练）
 * ========================================================= */

function startSortSession() {
  const s = state.session;
  s.sortRoundIndex = 0;
  hideAllStages();
  $("#game-level-name").textContent = "分类小管家";
  $("#sort-stage").classList.remove("hidden");
  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.add("hidden");
  nextSortRound();
}

function nextSortRound() {
  const s = state.session;
  const total = CONFIG.sort.roundsPerSession;
  if (s.sortRoundIndex >= total) {
    s.planIndex++;
    runNextStage();
    return;
  }
  $("#game-round").textContent = `第 ${s.sortRoundIndex + 1} / ${total} 轮`;

  // 每类取若干张，混合
  const perCat = Math.max(1, Math.floor(CONFIG.sort.itemsPerRound / CONFIG.sortCategories.length));
  let items = [];
  CONFIG.sortCategories.forEach((cat) => {
    sample(cat.items, perCat).forEach((emoji) => {
      items.push({ emoji, catId: cat.id });
    });
  });
  items = shuffle(items);

  state.sortRound = {
    items,
    placed: 0,
    correct: 0,
    wrong: 0,
    phase: "sort",
  };

  const strategyText = "小妙招：先看看它属于哪一类，再放进对应的筐里～";
  setStrategy(strategyText);
  speak(strategyText);

  renderSortStage();
}

function renderSortStage() {
  const round = state.sortRound;
  const pool = $("#sort-pool");
  const baskets = $("#sort-baskets");
  pool.innerHTML = "";
  baskets.innerHTML = "";
  $("#sort-hint").textContent = "把卡片拖到对应的筐里（也可以先点卡片，再点筐）";

  // 卡片池
  round.items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "sort-item";
    el.textContent = item.emoji;
    el.draggable = true;
    el.dataset.idx = idx;
    el.dataset.catId = item.catId;

    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(idx));
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));

    // 点击选中（移动端友好）
    el.addEventListener("click", () => {
      if (el.classList.contains("placed")) return;
      $$("#sort-pool .sort-item").forEach((x) => x.classList.remove("selected"));
      el.classList.add("selected");
    });

    pool.appendChild(el);
  });

  // 分类筐
  CONFIG.sortCategories.forEach((cat) => {
    const basket = document.createElement("div");
    basket.className = "basket";
    basket.dataset.catId = cat.id;
    basket.innerHTML = `
      <div class="basket-title">${cat.emoji} ${cat.name}</div>
      <div class="basket-items"></div>
    `;

    basket.addEventListener("dragover", (e) => {
      e.preventDefault();
      basket.classList.add("drag-over");
    });
    basket.addEventListener("dragleave", () => basket.classList.remove("drag-over"));
    basket.addEventListener("drop", (e) => {
      e.preventDefault();
      basket.classList.remove("drag-over");
      const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      handleDrop(idx, cat.id);
    });
    // 点击筐：放入当前选中的卡片
    basket.addEventListener("click", () => {
      const sel = $("#sort-pool .sort-item.selected");
      if (sel) handleDrop(parseInt(sel.dataset.idx, 10), cat.id);
    });

    baskets.appendChild(basket);
  });
}

/** 处理卡片放入分类筐 */
function handleDrop(idx, catId) {
  const round = state.sortRound;
  if (!round || round.phase !== "sort") return;
  if (isNaN(idx)) return;

  const item = round.items[idx];
  if (!item || item.placed) return;

  const poolEl = $(`#sort-pool .sort-item[data-idx="${idx}"]`);
  if (!poolEl) return;

  const basket = $(`.basket[data-cat-id="${catId}"]`);
  const itemsBox = basket ? basket.querySelector(".basket-items") : null;
  if (!itemsBox) return;

  if (item.catId === catId) {
    // 正确
    item.placed = true;
    round.placed++;
    round.correct++;
    poolEl.remove();
    const placed = document.createElement("div");
    placed.className = "sort-item placed";
    placed.textContent = item.emoji;
    itemsBox.appendChild(placed);
    addStars(CONFIG.stars.sortCorrect);
    $("#sort-hint").textContent = "放对啦！继续加油～";
  } else {
    // 错误：弱提示，不移动
    round.wrong++;
    poolEl.classList.add("wrong-flash");
    setTimeout(() => poolEl.classList.remove("wrong-flash"), 400);
    const catName = (CONFIG.sortCategories.find((c) => c.id === item.catId) || {}).name || "";
    $("#sort-hint").textContent = `再想想～它好像不是这一类哦（提示：它属于「${catName}」吗？）`;
    speak("再想想，它属于哪一类呢？");
  }

  // 全部放完
  if (round.placed >= round.items.length) {
    finishSortRound();
  }
}

function finishSortRound() {
  const round = state.sortRound;
  const s = state.session;
  round.phase = "done";
  s.sortTotal++;
  const perfect = round.wrong === 0;
  recordStageStat("sort", perfect);
  if (perfect) {
    s.sortCorrect++;
    // 整组正确 → 策略星星
    addStars(CONFIG.stars.sortStrategy);
    s.sortStrategyStars++;
    const msg = "全部分对啦！你把它们分成了小组合，这样记得更牢！";
    setStrategy(msg);
    speak(msg);
  } else {
    const msg = "分类完成！分组记忆是个好办法，下次试试先想类别再放～";
    setStrategy(msg);
    speak(msg);
  }

  $("#sort-hint").textContent = perfect
    ? "完美分组！⭐ 策略星星 +1"
    : "完成啦，分组记忆会越来越熟练～";

  $("#btn-next").classList.remove("hidden");
  $("#btn-next").textContent =
    s.sortRoundIndex + 1 >= CONFIG.sort.roundsPerSession ? "完成分类关" : "下一轮";
}
