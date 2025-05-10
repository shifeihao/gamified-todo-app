import asyncHandler from "express-async-handler";
import Card from "../models/Card.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { calculateReward } from "../utils/TaskRewardCalcultor.js";
import { checkCardNumber } from "../utils/userStatsSync.js";

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
    throw new Error("Today's cards have been issued");
  }

  // 创建3张空白卡片
  const blankCards = await Promise.all(
    [...Array(3)].map(() =>
      Card.create({
        user: user._id,
        type: "blank",
        title: "Blank Cards",
        description: "Limited to short-term tasks",
        taskDuration: "Short", //  限定为短期卡片
        issuedAt: new Date(),
      })
    )
  );
  // 更新用户卡片库存
  user.cardInventory.push(...blankCards.map((card) => card._id));
  user.dailyCards.blank = 3;
  user.dailyCards.lastIssued = new Date();
  await user.save();

  //发卡片后统计卡片库存总数量，记录到userstats中
  await checkCardNumber(req.user.id);

  res.status(201).json({
      message: "Daily card distribution successful",
    cards: blankCards,
  });
});

// @desc    每周一发放长期空白卡片（仅长期类型）
// @route   POST /api/cards/issue-weekly
// @access  Private/Admin/Trigger
const issueWeeklyCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  // 只在周一发放
  const today = new Date();
  const isMonday = today.getDay() === 1;
  if (!isMonday) {
    res.status(400);
    throw new Error("Today is not the day to issue long-term cards (Monday only)");
  }
  // 检查是否本周已发放
  const lastWeek = new Date(user.weeklyCards?.lastIssued || 0);
  const startOfThisWeek = new Date();
  startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // 本周周一
  startOfThisWeek.setHours(0, 0, 0, 0);
  if (lastWeek >= startOfThisWeek) {
    res.status(400);
    throw new Error("Long-term cards have been issued this week");
  }
  // 创建3张长期空白卡片
  const blankCards = await Promise.all(
    [...Array(3)].map(() =>
      Card.create({
        user: user._id,
        type: "blank",
        title: "Long-term blank card",
        description: "Limited to long-term tasks",
        taskDuration: "Long",
        issuedAt: new Date(),
      })
    )
  );
  // 更新库存和记录发放时间
  user.cardInventory.push(...blankCards.map((card) => card._id));
  user.weeklyCards = {
    lastIssued: new Date(),
  };
  await user.save();

  //发卡片后统计卡片库存总数量，记录到userstats中
  await checkCardNumber(req.user.id);

  res.status(201).json({
    message: "Long-term blank cards were successfully issued this week",
    cards: blankCards,
  });
});

// @desc    发放奖励卡片
// @route   POST /api/cards/issue-reward
// @access  Private
const issueRewardCard = asyncHandler(async (req, res) => {
  const { type, title, description, bonus, taskDuration } = req.body;
  // 验证 taskDuration 是否有效
  if (!["Short", "Long", "Usual"].includes(taskDuration)) {
    res.status(400);
    throw new Error(
      "Invalid task duration: taskDuration must be short, long, or universal"
    );
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

  //发放奖励后，统计卡片库存，记录在userstats上面
  await checkCardNumber(req.user.id);

  res.status(201).json({
    message: "Reward card issued successfully",
    card: rewardCard,
  });
});

// @desc    发放短/长期空白卡片（用于postman测试）
// @route   POST /api/cards/issue-blank
// @access  Private
const issueBlankCard = asyncHandler(async (req, res) => {
  const { title = "Blank Cards", description = "" } = req.body;

  const blankCard = await Card.create({
    user: req.user.id,
    type: "blank",
    title,
    description,
    taskDuration: "Short", //  限定为短期卡片
    issuedAt: new Date(),
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: blankCard._id },
    $inc: { "dailyCards.blank": 1 }, //  增加每日空白卡计数
  });

  res.status(201).json({
    message: "Card issued successfully",
    card: blankCard,
  });
});

// @desc    消耗卡片创建任务
// @route   POST /api/cards/consume
// @access  Private
const consumeCard = asyncHandler(async (req, res) => {
  const { cardId, taskData } = req.body;
  const user = await User.findById(req.user.id);

  let card;

  if (cardId) {
    // ⭐ 如果是奖励卡片（由用户主动选择）
    card = await Card.findOne({
      _id: cardId,
      used: false,
      user: req.user.id,
    });

    if (!card) {
      res.status(400);
      throw new Error("Invalid card");
    }

    if (card.type !== "periodic" && card.used) {
      res.status(400);
      throw new Error("Card has been used");
    }

    // ✅ 校验任务类型是否匹配
    if (card.taskDuration !== "Usual" && card.taskDuration !== taskData.type) {
      res.status(400);
      throw new Error(
        `This card only supports ${card.taskDuration} Type tasks, cannot be used ${taskData.type} Type tasks`
      );
    }
  } else {
    // ⭐ 自动分配空白卡片（blank）
    card = await Card.findOne({
      user: req.user.id,
      used: false,
      type: "blank",
      $or: [{ taskDuration: taskData.type }, { taskDuration: "Usual" }],
    });

    if (!card) {
      res.status(400);
      throw new Error(`你没有可用于 ${taskData.type} 类型任务的空白卡片`);
    }
  }

  // ✅ 更新卡片状态
  if (card.type !== "periodic") {
    card.used = true;
    await card.save();
  } else {
    card.cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时冷却
    await card.save();
  }

  // ✅ 更新用户卡片状态（扣除空白卡库存、移出inventory）
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { "dailyCards.blank": card.type === "blank" ? -1 : 0 },
    $pull: { cardInventory: card.type !== "periodic" ? card._id : null },
  });

  // ✅ 奖励结算
  const bonus = card.bonus || {};
  const { experience, gold } = calculateReward(
    taskData.baseExperience,
    taskData.baseGold,
    bonus
  );

  res.status(200).json({
    success: true,
    processedTask: {
      ...taskData,
      experienceReward: experience,
      goldReward: gold,
      cardUsed: card._id.toString(), // ✅ 确保是字符串
    },
  });
});

export {
  consumeCard,
  getCardInventory,
  issueDailyCards,
  issueWeeklyCards,
  issueRewardCard,
  issueBlankCard,
};
