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

  // 检查并重置每日卡片配额（短期卡片）
  const today = new Date().setHours(0, 0, 0, 0);
  const lastIssued = user.dailyCards.lastIssued
    ? new Date(user.dailyCards.lastIssued).setHours(0, 0, 0, 0)
    : null;

  // 如果今天还没发放过卡片，发放新的短期卡片
  if (lastIssued !== today) {
    console.log("今日未发放短期卡片，准备清理旧卡片并发放新卡片");
    
    // 1. 删除所有已有的短期卡片（如果有）
    // 找出所有属于该用户、类型为blank、持续时间为short的卡片ID
    const shortCardIds = user.cardInventory
      .filter(card => card.type === 'blank' && card.taskDuration === 'short')
      .map(card => card._id);
    
    if (shortCardIds.length > 0) {
      // 从用户的库存中移除这些短期卡片
      user.cardInventory = user.cardInventory.filter(card => 
        !shortCardIds.includes(card._id)
      );
      
      // 从数据库中删除这些卡片
      await Card.deleteMany({
        _id: { $in: shortCardIds },
        user: user._id
      });
      
      console.log(`删除了${shortCardIds.length}张旧的短期卡片`);
    }
    
    // 2. 创建3张新的短期卡片
    const shortCards = await Promise.all(
      [...Array(3)].map(() =>
        Card.create({
          user: user._id,
          type: "blank",
          title: "空白短期卡片",
          description: "每日自动发放的短期卡片",
          taskDuration: "short", // 限定为短期卡片
          issuedAt: new Date(),
        })
      )
    );
    
    // 3. 将新卡片添加到用户的库存中
    user.cardInventory.push(...shortCards.map((card) => card._id));
    user.dailyCards.blank = 3;
    user.dailyCards.lastIssued = new Date();
    
    console.log("成功发放3张新的短期卡片");
  }
  
  // 检查并重置每周卡片配额（长期卡片）
  const today2 = new Date();
  const dayOfWeek = today2.getDay(); // 0是周日，1是周一
  const isWeeklyRefreshDay = dayOfWeek === 1; // 设定周一为刷新日
  
  // 获取上次发放周卡的日期
  const lastWeeklyIssued = user.weeklyCards?.lastIssued
    ? new Date(user.weeklyCards.lastIssued)
    : null;
  
  // 判断是否需要刷新周卡
  const needWeeklyRefresh = isWeeklyRefreshDay && (
    !lastWeeklyIssued || 
    lastWeeklyIssued.getDay() !== dayOfWeek || 
    (today2 - lastWeeklyIssued) > 7 * 24 * 60 * 60 * 1000
  );
  
  if (needWeeklyRefresh) {
    console.log("本周未发放长期卡片，准备清理旧卡片并发放新卡片");
    
    // 1. 删除所有已有的长期卡片（类型为blank，持续时间为long）
    const longCardIds = user.cardInventory
      .filter(card => card.type === 'blank' && card.taskDuration === 'long')
      .map(card => card._id);
    
    if (longCardIds.length > 0) {
      // 从用户的库存中移除这些长期卡片
      user.cardInventory = user.cardInventory.filter(card => 
        !longCardIds.includes(card._id)
      );
      
      // 从数据库中删除这些卡片
      await Card.deleteMany({
        _id: { $in: longCardIds },
        user: user._id
      });
      
      console.log(`删除了${longCardIds.length}张旧的长期卡片`);
    }
    
    // 2. 创建2张新的长期卡片
    const longCards = await Promise.all(
      [...Array(2)].map(() =>
        Card.create({
          user: user._id,
          type: "blank",
          title: "空白长期卡片",
          description: "每周自动发放的长期卡片",
          taskDuration: "long", // 限定为长期卡片
          issuedAt: new Date(),
        })
      )
    );
    
    // 3. 将新卡片添加到用户的库存中
    user.cardInventory.push(...longCards.map((card) => card._id));
    
    // 4. 更新用户的周卡发放时间
    if (!user.weeklyCards) {
      user.weeklyCards = {};
    }
    user.weeklyCards.lastIssued = new Date();
    
    console.log("成功发放2张新的长期卡片");
  }
  
  // 保存用户信息
  await user.save();
  
  // 更新用户卡片统计
  await checkCardNumber(req.user.id);

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
    weeklyCards: user.weeklyCards || {},
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
        description: "This card limited to short-term type",
        taskDuration: "short", //  限定为短期卡片
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
  const isMonday = today.getDay() === 1;
  if (!isMonday) {
    res.status(400);
    throw new Error("Today is not the time to send Long-term cards (Monday only).");
  }
  // 检查是否本周已发放
  const lastWeek = new Date(user.weeklyCards?.lastIssued || 0);
  const startOfThisWeek = new Date();
  startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // 本周周一
  startOfThisWeek.setHours(0, 0, 0, 0);
  if (lastWeek >= startOfThisWeek) {
    res.status(400);
    throw new Error("Long-term cards have been sent this week");
  }
  // 创建3张长期空白卡片
  const blankCards = await Promise.all(
    [...Array(3)].map(() =>
      Card.create({
        user: user._id,
        type: "blank",
        title: "Long-term blank card",
        description: "Tasks limited to the long-term type",
        taskDuration: "long",
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
  if (!["short", "long", "general"].includes(taskDuration)) {
    res.status(400);
    throw new Error(
      "无效的任务持续时长：taskDuration 必须为 Short、Long 或 general"
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
    taskDuration: "short", //  限定为short卡片
    issuedAt: new Date(),
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: blankCard._id },
    $inc: { "dailyCards.blank": 1 }, //  增加每日空白卡计数
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
    if (card.taskDuration !== "general" && card.taskDuration !== taskData.type) {
      res.status(400);
      throw new Error(
        `该卡片仅支持 ${card.taskDuration} 类型任务，无法用于 ${taskData.type} 类型任务`
      );
    }
  } else {
    // ⭐ 自动分配空白卡片（blank）
    card = await Card.findOne({
      user: req.user.id,
      used: false,
      type: "blank",
      $or: [{ taskDuration: taskData.type }, { taskDuration: "general" }],
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

// @desc    获取单张卡片详情
// @route   GET /api/cards/:id
// @access  Private
const getCardById = asyncHandler(async (req, res) => {
  try {
    const cardId = req.params.id;
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'Invalid card ID format' });
    }
    
    // 查找卡片
    const card = await Card.findById(cardId);
    
    // 检查卡片是否存在
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // 检查卡片是否属于当前用户
    if (card.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this card' });
    }
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching card details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export {
  consumeCard,
  getCardInventory,
  issueDailyCards,
  issueWeeklyCards,
  issueRewardCard,
  issueBlankCard,
  getCardById,
};
