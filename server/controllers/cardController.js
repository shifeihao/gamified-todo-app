import asyncHandler from "express-async-handler";
import Card from "../models/Card.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { calculateReward } from '../utils/TaskRewardCalcultor.js';

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

// @desc    每周一发放长期空白卡片（仅长期类型）
// @route   POST /api/cards/issue-weekly
// @access  Private/Admin/Trigger
const issueWeeklyCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  // 只在周一发放
  const today = new Date();
  const isMonday = today.getDay() === 5;
  if (!isMonday) {
    res.status(400);
    throw new Error("今天不是发放长期卡片的时间（仅限周一）");
  }
  // 检查是否本周已发放
  const lastWeek = new Date(user.weeklyCards?.lastIssued || 0);
  const startOfThisWeek = new Date();
  startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // 本周周一
  startOfThisWeek.setHours(0, 0, 0, 0);
  if (lastWeek >= startOfThisWeek) {
    res.status(400);
    throw new Error("本周长期卡片已发放");
  }
  // 创建3张长期空白卡片
  const blankCards = await Promise.all(
      [...Array(3)].map(() =>
          Card.create({
            user: user._id,
            type: "blank",
            title: "长期空白卡片",
            description: "限定为长期类型的任务",
            taskDuration: "长期",
            issuedAt: new Date(),
          })
      )
  );
  // 更新库存和记录发放时间
  user.cardInventory.push(...blankCards.map(card => card._id));
  user.weeklyCards = {
    lastIssued: new Date()
  };
  await user.save();

  res.status(201).json({
    message: "本周长期空白卡片发放成功",
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
    $push: { cardInventory: rewardCard._id }
  });

  res.status(201).json({
    message: "奖励卡片发放成功",
    card: rewardCard,
  });
});


// @desc    发放短/长期空白卡片（用于postman测试）
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
    message: "卡片发放成功",
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
      throw new Error("无效的卡片");
    }

    if (card.type !== "periodic" && card.used) {
      res.status(400);
      throw new Error("卡片已被使用");
    }

    // ✅ 校验任务类型是否匹配
    if (card.taskDuration !== '通用' && card.taskDuration !== taskData.type) {
      res.status(400);
      throw new Error(`该卡片仅支持 ${card.taskDuration} 类型任务，无法用于 ${taskData.type} 类型任务`);
    }
  } else {
    // ⭐ 自动分配空白卡片（blank）
    card = await Card.findOne({
      user: req.user.id,
      used: false,
      type: "blank",
      $or: [
        { taskDuration: taskData.type },
        { taskDuration: "通用" },
      ],
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
  const { experience, gold } = calculateReward(taskData.baseExperience, taskData.baseGold, bonus);

  res.status(200).json({
    success: true,
    processedTask: {
      ...taskData,
      experienceReward: experience,
      goldReward: gold,
      cardUsed: card._id,
    },
  });
});



export { consumeCard, getCardInventory, issueDailyCards, issueWeeklyCards, issueRewardCard,issueBlankCard };
