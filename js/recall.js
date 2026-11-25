/* =========================================================
 * recall.js - 回忆寻宝关卡（检索练习）
 * ========================================================= */

function startRecallSession() {
  const s = state.session;
  s.recallRoundIndex = 0;
  hideAllStages();
  $("#game-level-name").textContent = s.isReview ? "复习寻宝" : "回忆寻宝";
  $("#recall-stage").classList.remove("hidden");
  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.add("hidden");
  nextRecallRound();
}

function nextRecallRound() {
  const s = state.session;
  const total = s.isReview
    ? s.reviewItems.length
    : CONFIG.recall.roundsPerSession;

  if (s.recallRoundIndex >= total) {
    // 回忆关结束
    s.planIndex++;
    runNextStage();
    return;
  }

  $("#game-round").textContent = `第 ${s.recallRoundIndex + 1} / ${total} 轮`;

  // 决定本轮卡片数量
  let count;
  if (s.isReview) {
    const item = s.reviewItems[s.recallRoundIndex];
    count = item ? item.level : CONFIG.recall.startCount;
  } else {
    count = state.data.recall.level;
  }
  count = Math.max(CONFIG.recall.minCount, Math.min(CONFIG.recall.maxCount, count));

  // 是否使用顺序回忆
  const useSequence = !s.isReview && state.data.recall.sequenceUnlocked && Math.random() < 0.5;

  // 选取目标卡片
  const targets = sample(CONFIG.recallPool, count);
  // 候选池：目标 + 干扰项
  const distractors = sample(
    CONFIG.recallPool.filter((x) => !targets.includes(x)),
    CONFIG.recall.candidateExtra
  );
  const candidates = shuffle(targets.concat(distractors));

  state.recallRound = {
    targets,
    candidates,
    useSequence,
    selected: [],
    phase: "show",
  };

  // 策略提示
  const strategyText = useSequence
    ? "试试按顺序记：先记第一个，再记第二个，像排队一样～"
    : "小妙招：把卡片分成小组合来记，比如「水果一组、动物一组」～";
  setStrategy(strategyText);
  speak(strategyText);

  // 展示阶段
  showRecallCards(targets, useSequence);
}

/** 展示卡片（正面）并计时 */
function showRecallCards(targets, useSequence) {
  const grid = $("#recall-grid");
  grid.innerHTML = "";
  $("#recall-hint").textContent = useSequence
    ? "按顺序看一遍，记住它们的先后哦"
    : "仔细看看这些卡片，记住它们";

  targets.forEach((emoji, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    // 用独立 span 承载 emoji，避免被 face-down 的 font-size:0 影响
    const face = document.createElement("span");
    face.className = "card-emoji";
    face.textContent = emoji;
    card.appendChild(face);
    if (useSequence) {
      const badge = document.createElement("span");
      badge.className = "card-order";
      badge.textContent = idx + 1;
      card.appendChild(badge);
    }
    grid.appendChild(card);
  });

  // 计时
  const showMs = Math.min(
    CONFIG.recall.maxShowMs,
    CONFIG.recall.baseShowMs + (targets.length - 1) * CONFIG.recall.perCardExtraMs
  );
  runTimer(showMs, () => {
    hideRecallCards();
  });
}

/** 卡片翻面隐藏，进入候选选择 */
function hideRecallCards() {
  const round = state.recallRound;
  if (!round) return;
  round.phase = "select";

  const grid = $("#recall-grid");
  grid.innerHTML = "";
  $("#recall-hint").textContent = "刚才看到了哪些？点一点把它们找出来吧";

  // 候选池：正面显示 emoji，让孩子从中挑出刚才见过的（隐藏的是"哪些是答案"，不是图案本身）
  round.candidates.forEach((emoji) => {
    const card = document.createElement("div");
    card.className = "card selectable";
    card.dataset.emoji = emoji;
    const face = document.createElement("span");
    face.className = "card-emoji";
    face.textContent = emoji;
    card.appendChild(face);
    card.addEventListener("click", () => toggleCandidate(card));
    grid.appendChild(card);
  });

  $("#btn-confirm").classList.remove("hidden");
  $("#btn-next").classList.add("hidden");
}

/** 选择/取消候选卡片 */
function toggleCandidate(card) {
  const round = state.recallRound;
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

/** 提交回忆答案 */
function submitRecall() {
  const round = state.recallRound;
  const s = state.session;
  if (!round || round.phase !== "select") return;
  round.phase = "result";

  const targets = round.targets;
  const selected = round.selected;

  // 判定：选中的都在目标里，且数量一致（自由回忆）
  const wrongSet = selected.filter((x) => !targets.includes(x));
  const missed = targets.filter((x) => !selected.includes(x));
  const isCorrect = wrongSet.length === 0 && missed.length === 0;

  // 更新卡片显示：把 emoji 放进 .card-emoji 子元素，避免被 face-down 样式影响
  $$("#recall-grid .card").forEach((card) => {
    const emoji = card.dataset.emoji;
    card.classList.remove("selectable", "selected");
    card.classList.add("disabled");
    const reveal = (cls) => {
      card.classList.remove("face-down");
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

  // 统计
  s.recallTotal++;
  if (isCorrect) s.recallCorrect++;
  recordStageStat("recall", isCorrect);

  // 星星
  if (isCorrect) {
    addStars(CONFIG.stars.recallCorrect);
    if (round.useSequence) {
      addStars(CONFIG.stars.recallStrategy);
      s.usedSequence = true;
    }
  }

  // 自适应难度（仅主线，非复习）
  if (!s.isReview) {
    updateRecallDifficulty(isCorrect);
  }

  // 复习条目更新
  if (s.isReview) {
    updateReviewItem(s.recallRoundIndex, isCorrect);
  }

  // 反馈
  if (isCorrect) {
    const msg = round.useSequence
      ? "太棒了！你按顺序记住了它们，这是很棒的策略！"
      : "找对啦！你把卡片记在心里了，真厉害！";
    setStrategy(msg);
    speak(msg);
  } else {
    // 弱线索，不公布答案
    let clue = "差一点点～再想想：它们是不是可以分成小组合？";
    if (wrongSet.length > 0) {
      clue = "有几个不是刚才的哦，试着回忆它们的样子～";
    } else if (missed.length > 0) {
      clue = "还有宝藏没找到呢，想想刚才有没有漏掉的～";
    }
    setStrategy(clue);
    speak(clue);
  }

  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.remove("hidden");
  $("#btn-next").textContent =
    s.recallRoundIndex + 1 >= (s.isReview ? s.reviewItems.length : CONFIG.recall.roundsPerSession)
      ? "完成回忆关"
      : "下一轮";
}

/** 自适应难度调整 */
function updateRecallDifficulty(isCorrect) {
  const r = state.data.recall;
  if (isCorrect) {
    r.upStreak++;
    r.downStreak = 0;
    if (r.upStreak >= CONFIG.recall.upStreak) {
      r.level = Math.min(CONFIG.recall.maxCount, r.level + 1);
      r.upStreak = 0;
    }
    // 自由回忆稳定 → 解锁顺序回忆
    if (!r.sequenceUnlocked) {
      r.freeStreak = (r.freeStreak || 0) + 1;
      if (r.freeStreak >= CONFIG.recall.sequenceUnlockStreak) {
        r.sequenceUnlocked = true;
      }
    }
  } else {
    r.downStreak++;
    r.upStreak = 0;
    r.freeStreak = 0;
    if (r.downStreak >= CONFIG.recall.downStreak) {
      r.level = Math.max(CONFIG.recall.minCount, r.level - 1);
      r.downStreak = 0;
    }
  }
  Store.save(state.data);
}

/** 更新复习条目（连续答对两次 → 巩固完成） */
function updateReviewItem(index, isCorrect) {
  const s = state.session;
  const item = s.reviewItems[index];
  if (!item) return;
  const real = state.data.reviews.find((r) => r.id === item.id);
  if (!real) return;
  if (isCorrect) {
    real.streak = (real.streak || 0) + 1;
    if (real.streak >= CONFIG.consolidateStreak) {
      real.done = true;
    }
  } else {
    real.streak = 0;
  }
  Store.save(state.data);
}
