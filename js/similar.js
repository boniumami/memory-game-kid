/* =========================================================
 * similar.js - 带相似干扰项回忆关卡
 * ========================================================= */

function startSimilarSession() {
  const s = state.session;
  s.similarRoundIndex = 0;
  hideAllStages();
  $("#similar-stage").classList.remove("hidden");
  $("#game-level-name").textContent = "相似干扰回忆";
  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.add("hidden");
  nextSimilarRound();
}

function nextSimilarRound() {
  const s = state.session;
  const total = CONFIG.similar.roundsPerSession;
  if (s.similarRoundIndex >= total) {
    s.planIndex++;
    runNextStage();
    return;
  }
  $("#game-round").textContent = `第 ${s.similarRoundIndex + 1} / ${total} 轮`;

  const lv = currentLevelId();
  let count = CONFIG.similar.baseCount + (lv - 1) * CONFIG.similar.perLevelExtra;
  count = Math.max(CONFIG.similar.baseCount, Math.min(CONFIG.similar.maxCount, count));
  let distractorCount = CONFIG.similar.baseDistractors + (lv - 1) * CONFIG.similar.perLevelExtraDistractors;
  distractorCount = Math.max(CONFIG.similar.baseDistractors, Math.min(CONFIG.similar.maxDistractors, distractorCount));

  // 从相似分组中挑选目标，并生成相似干扰项
  const groups = shuffle(CONFIG.similarGroups);
  const targets = [];
  const similarDistractors = [];
  for (const group of groups) {
    if (targets.length >= count) break;
    const pick = sample(group, 1)[0];
    if (pick && !targets.includes(pick)) {
      targets.push(pick);
      // 同组其他元素作为相似干扰
      group.forEach((g) => {
        if (g !== pick && !similarDistractors.includes(g)) similarDistractors.push(g);
      });
    }
  }
  // 若目标不足（分组不够），用普通池补齐
  if (targets.length < count) {
    const extra = sample(
      CONFIG.recallPool.filter((x) => !targets.includes(x)),
      count - targets.length
    );
    targets.push(...extra);
  }

  const distractors = sample(similarDistractors, distractorCount);
  const candidates = shuffle(targets.concat(distractors));

  state.similarRound = {
    targets,
    candidates,
    selected: [],
    phase: "show",
  };

  const strategyText = "小心哦，有些卡片长得很像，仔细看清楚再记～";
  setStrategy(strategyText);
  speak(strategyText);

  // 展示阶段
  const grid = $("#similar-grid");
  grid.innerHTML = "";
  $("#similar-hint").textContent = "仔细看看这些卡片，注意区分相似的图案";
  targets.forEach((emoji) => {
    const card = document.createElement("div");
    card.className = "card";
    const face = document.createElement("span");
    face.className = "card-emoji";
    face.textContent = emoji;
    card.appendChild(face);
    grid.appendChild(card);
  });

  const showMs = Math.min(
    CONFIG.similar.maxShowMs,
    CONFIG.similar.baseShowMs + (targets.length - 1) * CONFIG.similar.perCardExtraMs
  );
  runTimer(showMs, hideSimilarCards, {
    timer: "similar-timer",
    fill: "similar-timer-fill",
    text: "similar-timer-text",
  });
}

function hideSimilarCards() {
  const round = state.similarRound;
  if (!round) return;
  round.phase = "select";
  $("#similar-hint").textContent = "刚才看到了哪些？小心相似的干扰项哦";
  renderSelectableGrid("similar-grid", round.candidates, round, (card) =>
    toggleSelectable(card, round)
  );
  $("#btn-confirm").classList.remove("hidden");
  $("#btn-next").classList.add("hidden");
}

function submitSimilarRecall() {
  const round = state.similarRound;
  const s = state.session;
  if (!round || round.phase !== "select") return;
  round.phase = "result";

  const targets = round.targets;
  const selected = round.selected;
  const wrongSet = selected.filter((x) => !targets.includes(x));
  const missed = targets.filter((x) => !selected.includes(x));
  const isCorrect = wrongSet.length === 0 && missed.length === 0;

  revealSelectableGrid("similar-grid", targets, selected);

  s.recallTotal++;
  if (isCorrect) {
    s.recallCorrect++;
    addStars(CONFIG.stars.recallCorrect);
  }
  recordStageStat("similar", isCorrect);

  if (isCorrect) {
    const msg = "太厉害了！相似的卡片也没骗到你！";
    setStrategy(msg);
    speak(msg);
  } else {
    const clue = wrongSet.length > 0
      ? "有几个长得很像但不是刚才的哦，再仔细分辨一下～"
      : "还有宝藏没找到呢，想想那些相似的图案～";
    setStrategy(clue);
    speak(clue);
  }

  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.remove("hidden");
  $("#btn-next").textContent =
    s.similarRoundIndex + 1 >= CONFIG.similar.roundsPerSession ? "完成本关" : "下一轮";
}
