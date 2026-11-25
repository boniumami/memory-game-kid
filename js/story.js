/* =========================================================
 * story.js - 图像联想小故事关卡（精加工记忆策略）
 * ========================================================= */

function startStorySession() {
  const s = state.session;
  s.storyRoundIndex = 0;
  hideAllStages();
  $("#story-stage").classList.remove("hidden");
  $("#game-level-name").textContent = "图像联想小故事";
  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.add("hidden");
  nextStoryRound();
}

function nextStoryRound() {
  const s = state.session;
  const total = CONFIG.story.roundsPerSession;
  if (s.storyRoundIndex >= total) {
    s.planIndex++;
    runNextStage();
    return;
  }
  $("#game-round").textContent = `第 ${s.storyRoundIndex + 1} / ${total} 轮`;

  // 卡片数量随等级增加
  const lv = currentLevelId();
  let count = CONFIG.story.baseCount + (lv - 1) * CONFIG.story.perLevelExtra;
  count = Math.max(CONFIG.story.baseCount, Math.min(CONFIG.story.maxCount, count));

  const targets = sample(CONFIG.recallPool, count);
  const distractors = sample(
    CONFIG.recallPool.filter((x) => !targets.includes(x)),
    CONFIG.story.candidateExtra
  );
  const candidates = shuffle(targets.concat(distractors));

  state.storyRound = {
    targets,
    candidates,
    selected: [],
    phase: "show",
    storySubmitted: false,
  };

  const strategyText = "试着把这几个东西编一个小故事，把它们串起来记住～";
  setStrategy(strategyText);
  speak(strategyText);

  // 展示阶段
  const grid = $("#story-grid");
  grid.innerHTML = "";
  $("#story-hint").textContent = "观察这些卡片，想想怎么编个小故事";
  $("#story-input-wrap").classList.add("hidden");
  $("#story-input").value = "";

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
    CONFIG.story.maxShowMs,
    CONFIG.story.baseShowMs + (targets.length - 1) * CONFIG.story.perCardExtraMs
  );
  runTimer(showMs, hideStoryCards, {
    timer: "story-timer",
    fill: "story-timer-fill",
    text: "story-timer-text",
  });
}

function hideStoryCards() {
  const round = state.storyRound;
  if (!round) return;
  round.phase = "select";
  $("#story-hint").textContent = "刚才看到了哪些？点一点把它们找出来吧";
  renderSelectableGrid("story-grid", round.candidates, round, (card) =>
    toggleSelectable(card, round)
  );
  $("#btn-confirm").classList.remove("hidden");
  $("#btn-next").classList.add("hidden");
}

/** 提交小故事（可选加分） */
function submitStory() {
  const round = state.storyRound;
  const s = state.session;
  if (!round || round.storySubmitted) return;
  const text = ($("#story-input").value || "").trim();
  if (!text) {
    $("#story-hint").textContent = "先写一句小故事再提交吧～";
    return;
  }
  round.storySubmitted = true;
  addStars(CONFIG.story.storyStar);
  s.storyStrategyStars = (s.storyStrategyStars || 0) + 1;
  const msg = "好棒！你把它们编成了故事，这样更容易记住！";
  setStrategy(msg);
  speak(msg);
  $("#story-hint").textContent = `小故事收到啦！⭐ 策略星星 +${CONFIG.story.storyStar}`;
  $("#btn-story-submit").disabled = true;
}

/** 提交故事关的回忆答案 */
function submitStoryRecall() {
  const round = state.storyRound;
  const s = state.session;
  if (!round || round.phase !== "select") return;
  round.phase = "result";

  const targets = round.targets;
  const selected = round.selected;
  const wrongSet = selected.filter((x) => !targets.includes(x));
  const missed = targets.filter((x) => !selected.includes(x));
  const isCorrect = wrongSet.length === 0 && missed.length === 0;

  revealSelectableGrid("story-grid", targets, selected);

  // 统计（计入回忆类正确率）
  s.recallTotal++;
  if (isCorrect) {
    s.recallCorrect++;
    addStars(CONFIG.stars.recallCorrect);
  }
  recordStageStat("story", isCorrect);

  // 反馈
  if (isCorrect) {
    const msg = "找对啦！编故事的方法很管用吧～";
    setStrategy(msg);
    speak(msg);
  } else {
    const clue = wrongSet.length > 0
      ? "有几个不是刚才的哦，想想你的小故事里有没有它们～"
      : "还有宝藏没找到呢，回忆一下小故事里的角色～";
    setStrategy(clue);
    speak(clue);
  }

  // 显示故事输入（可选加分）
  $("#story-input-wrap").classList.remove("hidden");
  $("#btn-story-submit").disabled = false;

  $("#btn-confirm").classList.add("hidden");
  $("#btn-next").classList.remove("hidden");
  $("#btn-next").textContent =
    s.storyRoundIndex + 1 >= CONFIG.story.roundsPerSession ? "完成故事关" : "下一轮";
}
