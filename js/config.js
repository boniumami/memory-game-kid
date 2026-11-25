/* =========================================================
 * config.js - 配置区（集中在此，方便后续修改）
 * 记忆寻宝小管家
 * 科学依据：检索练习（主动回忆）+ 组块（分类记忆）+ 简易间隔复习
 * ========================================================= */
const CONFIG = {
  // 家长面板密码
  parentPassword: "1234",

  // 角色（仅收集激励，不影响难度）
  avatars: [
    { id: "rabbit", emoji: "🐰", name: "小兔" },
    { id: "bear",   emoji: "🐻", name: "小熊" },
    { id: "fox",    emoji: "🦊", name: "小狐狸" },
    { id: "panda",  emoji: "🐼", name: "熊猫" },
    { id: "cat",    emoji: "🐱", name: "小猫" },
  ],

  // 回忆寻宝：卡片池（emoji）
  recallPool: [
    "🍎", "🍌", "🍇", "🍓", "🍊", "🍉",
    "🐶", "🐱", "🐰", "🐸", "🐟", "🦋",
    "✏️", "📚", "🎈", "⭐", "🌻", "🚗",
    "🎵", "🍭", "🧸", "🌈", "⚽", "🍩",
  ],

  // 分类小管家：三类卡片
  sortCategories: [
    { id: "animal", name: "动物", emoji: "🐾", items: ["🐶", "🐱", "🐰", "🐸", "🐟", "🦋", "🐻", "🦊"] },
    { id: "fruit",  name: "水果", emoji: "🍎", items: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉", "🍑", "🍐"] },
    { id: "school", name: "文具", emoji: "✏️", items: ["✏️", "📚", "📏", "🖍️", "📐", "📎", "🖊️", "📒"] },
  ],

  // 回忆寻宝难度参数
  recall: {
    startCount: 3,          // 起始卡片数
    minCount: 2,            // 最少卡片数
    maxCount: 8,            // 最多卡片数
    baseShowMs: 2200,       // 基础展示时长（毫秒）
    perCardExtraMs: 700,    // 每多一张增加的展示时长
    maxShowMs: 8000,        // 展示时长上限
    candidateExtra: 3,      // 候选池比目标多出的干扰项数量
    upStreak: 3,            // 连续答对 N 轮 → 加一张
    downStreak: 2,          // 连续答错 N 次 → 减一张
    roundsPerSession: 4,    // 每局回忆寻宝轮数
    sequenceUnlockStreak: 3,// 自由回忆连续答对 N 轮 → 解锁顺序回忆
  },

  // 分类小管家参数
  sort: {
    roundsPerSession: 3,    // 每局分类轮数
    itemsPerRound: 6,       // 每轮卡片数
  },

  // 图像联想小故事关卡参数
  story: {
    roundsPerSession: 2,    // 每局轮数
    baseCount: 3,           // 基础卡片数
    perLevelExtra: 1,       // 每升一级增加的卡片数
    maxCount: 6,            // 卡片数上限
    baseShowMs: 3000,       // 基础展示时长
    perCardExtraMs: 800,    // 每多一张增加时长
    maxShowMs: 9000,        // 展示时长上限
    candidateExtra: 3,      // 候选池干扰项
    storyStar: 2,           // 提交小故事奖励星星
  },

  // 带相似干扰项回忆关卡参数
  similar: {
    roundsPerSession: 2,    // 每局轮数
    baseCount: 3,           // 基础目标卡片数
    perLevelExtra: 1,       // 每升一级增加目标数
    maxCount: 6,            // 目标数上限
    baseDistractors: 2,     // 基础相似干扰项数量
    perLevelExtraDistractors: 1, // 每升一级增加的干扰项
    maxDistractors: 5,      // 干扰项上限
    baseShowMs: 2600,       // 基础展示时长
    perCardExtraMs: 700,    // 每多一张增加时长
    maxShowMs: 8000,        // 展示时长上限
  },

  // 相似 emoji 分组（用于相似干扰项关卡：同组内互为相似干扰）
  similarGroups: [
    ["🍎", "🍅", "🍒", "🍓"],
    ["🐶", "🐺", "🦊", "🐱"],
    ["🐰", "🐹", "🐭", "🐿️"],
    ["🌻", "🌼", "🌸", "🌺"],
    ["🚗", "🚙", "🚕", "🚌"],
    ["⚽", "🏀", "🏈", "🎾"],
    ["🍌", "🍋", "🍍", "🥭"],
    ["🐟", "🐠", "🐡", "🦈"],
    ["📚", "📖", "📕", "📗"],
    ["⭐", "🌟", "✨", "💫"],
  ],

  // 难度分层体系
  levels: [
    {
      id: 1,
      name: "基础",
      stages: ["recall", "sort"], // 自由回忆 + 分类
      desc: "自由回忆、分类小管家",
    },
    {
      id: 2,
      name: "进阶",
      stages: ["recall", "sort", "story"], // 解锁顺序回忆 + 图像联想小故事
      desc: "顺序回忆、图像联想小故事",
    },
    {
      id: 3,
      name: "提高",
      stages: ["recall", "sort", "story", "similar"], // 解锁相似干扰项回忆
      desc: "带相似干扰项的回忆",
    },
  ],
  // 达标规则
  passRate: 0.8,            // 单关卡正确率 ≥80% 算达标
  unlockStreak: 3,          // 连续达标 N 次解锁下一级
  stagesPerDay: 2,          // 每日一局随机分配 2 个关卡

  // 星星奖励
  stars: {
    recallCorrect: 2,       // 回忆答对
    recallStrategy: 1,      // 使用策略（如顺序回忆）
    sortCorrect: 1,         // 分类正确
    sortStrategy: 1,        // 分类策略星星（整组正确）
  },

  // 间隔复习：完成后第几天推送（相对完成日）
  reviewDays: [1, 4],       // 次日、第 4 天
  consolidateStreak: 2,     // 复习连续答对 N 次 → 巩固完成

  // 语音
  speech: {
    enabled: true,
    lang: "zh-CN",
    rate: 0.95,
    pitch: 1.1,
  },

  // 存储键
  storageKey: "memoryTreasureKid_v1",
};
