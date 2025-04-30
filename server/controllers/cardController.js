import asyncHandler from "express-async-handler";
import Card from "../models/Card.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    获取用户卡片库存
// @route   GET /api/cards/inventory
// @access  Private
const getCardInventory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("cardInventory");

  // 检查并重置每日卡片配额
  const today = new Date().setHours(0, 0, 0, 0);
  const lastIssued = user.dailyCards.lastIssued
    ? new Date(user.dailyCards.lastIssued).setHours(0, 0, 0, 0)
    : null;

  if (lastIssued !== today) {
    user.dailyCards.blank = 3; // 重置为每日3张空白卡
    user.dailyCards.lastIssued = new Date();
    await user.save();
  }

  // 检查周期性卡片冷却
  const periodicCards = user.cardInventory.filter(
    (card) =>
      card.type === "periodic" &&
      card.cooldownUntil &&
      card.cooldownUntil < new Date()
  );

  for (const card of periodicCards) {
    card.cooldownUntil = null;
    await card.save();
  }

  res.json({
    dailyCards: user.dailyCards,
    inventory: user.cardInventory,
  });
});

// @desc    定时发放每日卡片
// @route   POST /api/cards/issue-daily
// @access  Private
const issueDailyCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // 检查是否已发放
  const today = new Date().setHours(0, 0, 0, 0);
  const lastIssued = user.dailyCards.lastIssued
    ? new Date(user.dailyCards.lastIssued).setHours(0, 0, 0, 0)
    : null;

  if (lastIssued === today) {
    res.status(400);
    throw new Error("今日卡片已发放");
  }

  // 创建3张空白卡片
  const blankCards = await Promise.all(
    [...Array(3)].map(() =>
      Card.create({
        user: user._id,
        type: "blank",
        title: "空白卡片",
        description: "限定为短期类型的任务",
        taskDuration: "短期", //  限定为短期卡片
        issuedAt: new Date(),
      })
    )
  );

  // 更新用户卡片库存
  user.cardInventory.push(...blankCards.map((card) => card._id));
  user.dailyCards.blank = 3;
  user.dailyCards.lastIssued = new Date();
  await user.save();

  res.status(201).json({
    message: "每日卡片发放成功",
    cards: blankCards,
  });
});

// @desc    发放奖励卡片
// @route   POST /api/cards/issue-reward
// @access  Private
const issueRewardCard = asyncHandler(async (req, res) => {
  const { type, title, description, bonus, taskDuration } = req.body;
  // 验证 taskDuration 是否有效
  if (!['短期','长期','通用'].includes(taskDuration)) {
    res.status(400);
    throw new Error('无效的任务持续时长：taskDuration 必须为 短期、长期 或 通用');
  }

  // 创建奖励卡片
  const rewardCard = await Card.create({
    user: req.user.id,
    type: "special",
    title,
    description,
    bonus,
    taskDuration,
    issuedAt: new Date(),
  });

  // 更新用户卡片库存
  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: rewardCard._id },
  });

  res.status(201).json({
    message: "奖励卡片发放成功",
    card: rewardCard,
  });
});


// @desc    发放短期空白卡片（用于postman测试）
// @route   POST /api/cards/issue-blank
// @access  Private
const issueBlankCard = asyncHandler(async (req, res) => {
  const { title = "空白卡片", description = "" } = req.body;

  const blankCard = await Card.create({
    user: req.user.id,
    type: "blank",
    title,
    description,
    taskDuration: "短期", //  限定为短期卡片
    issuedAt: new Date(),
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: blankCard._id },
    $inc: { "dailyCards.blank": 1 }  //  增加每日空白卡计数
  });

  res.status(201).json({
    message: "短期空白卡片发放成功",
    card: blankCard,
  });
});



// @desc    消耗卡片创建任务
// @route   POST /api/cards/consume
// @access  Private
const consumeCard = asyncHandler(async (req, res) => {
  const { cardId, taskData } = req.body;

  // 校验 cardId 是否有效
  if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
    res.status(400);
    throw new Error("无效的卡片ID");
  }

  const user = await User.findById(req.user.id);

  // 1. 验证卡片
  const card = await Card.findOne({
    _id: cardId,
    used: false,
    user: req.user.id,
  });
  // console.log("Card: ", card);

  if (!card) {
    res.status(400);
    throw new Error("无效的卡片");
  }

  // 检查卡片是否已使用
  if (card.type !== "periodic" && card.used) {
    res.status(400);
    throw new Error("卡片已被使用");
  }

  // 2. 处理不同类型卡片
  let remainingCards = user.dailyCards.blank;

  if (card.type === "blank") {
    // 检查每日配额
    if (remainingCards < 1) {
      res.status(400);
      throw new Error("今日空白卡片配额已用完");
    }
    remainingCards--;
  }

  // 3. 更新卡片状态
  if (card.type !== "periodic") {
    card.used = true;
    await card.save();
  } else {
    // 处理周期性卡片冷却
    card.cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时冷却
    await card.save();
  }

  // 4. 更新用户数据
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { "dailyCards.blank": card.type === "blank" ? -1 : 0 },
    $pull: { cardInventory: card.type !== "periodic" ? cardId : null },
  });
  // if (card.type === "periodic") {
  //   // 周期性卡片只更新冷却时间，不从库存中移除
  //   await User.findByIdAndUpdate(req.user.id, {
  //     $inc: { "dailyCards.blank": 0 },
  //   });
  // } else {
  //   // 非周期性卡片从库存中移除
  //   await User.findByIdAndUpdate(req.user.id, {
  //     $inc: { "dailyCards.blank": card.type === "blank" ? -1 : 0 },
  //     $pull: { cardInventory: cardId },
  //   });
  // }

  // ✅ 5. 安全访问加成信息（避免空白卡报错）
  const bonus = card.bonus || { experienceMultiplier: 1, goldMultiplier: 1 };

  // 6. 返回处理后的任务数据（包含加成）
  res.status(200).json({
    success: true,
    processedTask: {
      ...taskData,
      experienceReward:
        taskData.baseExperience * card.bonus.experienceMultiplier,
      goldReward: taskData.baseGold * card.bonus.goldMultiplier,
      cardUsed: cardId,
    },
    remainingCards,
  });

  // 卡片和任务类型匹配性校验
  if (card.taskDuration !== '通用' && card.taskDuration !== taskData.type) {
    res.status(400);
    throw new Error(`该卡片仅支持${card.taskDuration}任务，无法用于${taskData.type}任务`);
  }

});

export { consumeCard, getCardInventory, issueDailyCards, issueRewardCard,issueBlankCard };
