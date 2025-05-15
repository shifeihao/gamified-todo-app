import asyncHandler from "express-async-handler";
import Card from "../models/Card.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { calculateReward } from "../utils/TaskRewardCalculator.js";
import { checkCardNumber } from "../utils/userStatsSync.js";
import { calculateAndProcessDrops } from '../services/dropService.js';
import { Monster } from '../models/Monster.js';

// @desc    Get user card inventory
// @route   GET /api/cards/inventory
// @access  Private
const getCardInventory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("cardInventory");
  
  // Check whether the flag for automatically issuing cards is prohibited
  const noAutoIssue = req.query.noAutoIssue === "true";
  
  // Check if it is a new user flag
  const isNewUser = req.query.isNewUser === "true";

  // Calculate the current number of short-term and long-term cards
  const currentShortCards = user.cardInventory.filter(
    card => card.type === "blank" && card.taskDuration === "short" && !card.used
  ).length;
  
  const currentLongCards = user.cardInventory.filter(
    card => card.type === "blank" && card.taskDuration === "long" && !card.used
  ).length;

  // Check and reset daily card quota (short-term cards)
  const today = new Date().setHours(0, 0, 0, 0);
  const lastIssued = user.dailyCards.lastIssued
    ? new Date(user.dailyCards.lastIssued).setHours(0, 0, 0, 0)
    : null;

  // If no card has been issued today and automatic issuance is not prohibited, issue a new short-term card
   // For non-new users, do not consider the number of existing cards; for new users, ensure that there are exactly 3 cards
  if (lastIssued !== today && !noAutoIssue && (!isNewUser || currentShortCards < 3)) {
    console.log("No short-term cards were issued today. We are preparing to clear out old cards and issue new ones.");

    // Only clear old cards for new users, making sure the number is exactly 3
    if (isNewUser && currentShortCards > 0) {
      // 1. Delete all existing short-term cards (if any)
      // Find all card IDs that belong to the user, have a type of blank, and a duration of short
      const shortCardIds = user.cardInventory
        .filter((card) => card.type === "blank" && card.taskDuration === "short")
        .map((card) => card._id);

      if (shortCardIds.length > 0) {
        // Remove these short-lived cards from the user's inventory
        user.cardInventory = user.cardInventory.filter(
          (card) => !shortCardIds.includes(card._id)
        );

        // Delete these cards from the database
        await Card.deleteMany({
          _id: { $in: shortCardIds },
          user: user._id,
        });

        console.log(`Deleted ${shortCardIds.length} old short-term cards`);
      }
    }

    // 2. Create 3 new short-term cards
    const shortCards = await Promise.all(
      [...Array(3)].map(() =>
        Card.create({
          user: user._id,
          type: "blank",
          title: "Blank Short-Term Cards",
          description: "Short-term cards automatically issued daily",
          taskDuration: "short", // Limited to short-term cards
          issuedAt: new Date(),
        })
      )
    );

    // 3. Adds a new card to the user's inventory
    user.cardInventory.push(...shortCards.map((card) => card._id));
    user.dailyCards.blank = 3;
    user.dailyCards.lastIssued = new Date();

    console.log("Successfully issued 3 new short-term cards");
  }

  // Check and reset weekly card quota (long-term cards)
  const today2 = new Date();
  const dayOfWeek = today2.getDay(); // 0 is Sunday, 1 is Monday
  const isWeeklyRefreshDay = dayOfWeek === 1; // Set Monday as refresh day

  // Get the date when the last weekly card was issued
  const lastWeeklyIssued = user.weeklyCards?.lastIssued
    ? new Date(user.weeklyCards.lastIssued)
    : null;

// Determine whether to refresh the weekly card
// Refresh only in the following cases:
// 1. It is Monday and
// 2. (Not a new user or a new user but has less than 3 long-term cards) and
// 3. The last card issuance time was not this week and
// 4. Automatic issuance is not prohibited
  const needWeeklyRefresh =
    isWeeklyRefreshDay &&
    (!isNewUser || currentLongCards < 3) &&
    (!lastWeeklyIssued ||
      lastWeeklyIssued.getDay() !== dayOfWeek ||
      today2 - lastWeeklyIssued > 7 * 24 * 60 * 60 * 1000) &&
    !noAutoIssue;

  // If you need to refresh your weekly card, issue a new long-term card
  if (needWeeklyRefresh) {
    console.log("No long-term cards were issued this week. We are preparing to clean up old cards and issue new ones.");

    // Only clear old cards for new users, making sure the number is exactly 3
    if (isNewUser && currentLongCards > 0) {
      // 1. Delete all existing long-term cards (type is blank, duration is long)
      const longCardIds = user.cardInventory
        .filter((card) => card.type === "blank" && card.taskDuration === "long")
        .map((card) => card._id);

      if (longCardIds.length > 0) {
        // Remove these long-lived cards from the user's inventory
        user.cardInventory = user.cardInventory.filter(
          (card) => !longCardIds.includes(card._id)
        );

        // Delete these cards from the database
        await Card.deleteMany({
          _id: { $in: longCardIds },
          user: user._id,
        });

        console.log(`Deleted ${longCardIds.length} old long-term cards`);
      }
    }

    // 2. Create 3 new long-term cards
    const longCards = await Promise.all(
      [...Array(3)].map(() =>
        Card.create({
          user: user._id,
          type: "blank",
          title: "Blank long-term card",
          description: "Long-term cards automatically issued every week",
          taskDuration: "long", // Limited to long-term cards
          issuedAt: new Date(),
        })
      )
    );

    // 3. Adds a new card to the user's inventory
    user.cardInventory.push(...longCards.map((card) => card._id));

    // 4. Update the user's weekly card issuance time
    if (!user.weeklyCards) {
      user.weeklyCards = {};
    }
    user.weeklyCards.lastIssued = new Date();

    console.log("Successfully issued 3 new long-term cards");
  }

  // Save user information
  await user.save();

  // Update user card statistics
  await checkCardNumber(req.user.id);

  // Check periodic card cooling
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

// @desc    Daily cards are distributed regularly
// @route   POST /api/cards/issue-daily
// @access  Private
const issueDailyCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const isNewRegistration = req.query.isNewRegistration === "true";

  // Check whether it has been issued
  const today = new Date().setHours(0, 0, 0, 0);
  const lastIssued = user.dailyCards.lastIssued
    ? new Date(user.dailyCards.lastIssued).setHours(0, 0, 0, 0)
    : null;

  if (lastIssued === today && !isNewRegistration) {
    res.status(400);
    throw new Error("Today's cards have been issued");
  }

  // If it is a request from a newly registered user, first delete all existing short-term cards
  if (isNewRegistration) {
    console.log("New user registration initializes short-term card");
    // Find all card IDs that belong to the user, have a type of blank, and a duration of short
    const existingShortCards = await Card.find({
      user: user._id,
      type: "blank",
      taskDuration: "short"
    });

    if (existingShortCards.length > 0) {
      const shortCardIds = existingShortCards.map(card => card._id);
      
      // Remove these short-lived cards from the user's inventory
      user.cardInventory = user.cardInventory.filter(
        (cardId) => !shortCardIds.includes(cardId.toString())
      );
      
      // Delete these cards from the database
      await Card.deleteMany({
        _id: { $in: shortCardIds },
        user: user._id
      });
      
      console.log(`Deleted ${shortCardIds.length} old short-term cards`);
    }
  }

  // Create 3 blank cards
  const blankCards = await Promise.all(
    [...Array(3)].map(() =>
      Card.create({
        user: user._id,
        type: "blank",
        title: "Blank Cards",
        description: "This card limited to short-term type",
        taskDuration: "short", //  Limited to short-term cards
        issuedAt: new Date(),
      })
    )
  );
  // Update user card inventory
  user.cardInventory.push(...blankCards.map((card) => card._id));
  user.dailyCards.blank = 3;
  user.dailyCards.lastIssued = new Date();
  await user.save();

  res.status(201).json({
    message: "Daily card distribution successful",
    cards: blankCards,
  });
});

// @desc    Long-term blank cards are issued every Monday (long-term type only)
// @route   POST /api/cards/issue-weekly
// @access  Private/Admin/Trigger
const issueWeeklyCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  // Only available on Mondays
  const today = new Date();
  const isMonday = today.getDay() === 1;
  if (!isMonday) {
    res.status(400);
    throw new Error(
      "Today is not the time to send Long-term cards (Monday only)."
    );
  }
  // Check if it has been issued this week
  const lastWeek = new Date(user.weeklyCards?.lastIssued || 0);
  const startOfThisWeek = new Date();
  startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // 本周周一
  startOfThisWeek.setHours(0, 0, 0, 0);
  if (lastWeek >= startOfThisWeek) {
    res.status(400);
    throw new Error("Long-term cards have been sent this week");
  }
  // Create 3 long-term blank cards
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
  // Update inventory and record release time
  user.cardInventory.push(...blankCards.map((card) => card._id));
  user.weeklyCards = {
    lastIssued: new Date(),
  };
  await user.save();

  res.status(201).json({
    message: "Long-term blank cards were successfully issued this week",
    cards: blankCards,
  });
});

// @desc    Issue reward cards
// @route   POST /api/cards/issue-reward
// @access  Private
const issueRewardCard = asyncHandler(async (req, res) => {
  const { type, title, description, bonus, taskDuration } = req.body;
  // Verify that taskDuration is valid
  if (!["short", "long", "general"].includes(taskDuration)) {
    res.status(400);
    throw new Error(
      "Invalid task duration: taskDuration must be Short, Long, or general"
    );
  }

  // Create a Reward Card
  const rewardCard = await Card.create({
    user: req.user.id,
    type: "special",
    title,
    description,
    bonus,
    taskDuration,
    issuedAt: new Date(),
  });

  // Update user card inventory
  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: rewardCard._id },
  });

  res.status(201).json({
    message: "Reward card issued successfully",
    card: rewardCard,
  });
});

// @desc    Issue short/long term blank cards (for postman testing)
// @route   POST /api/cards/issue-blank
// @access  Private
const issueBlankCard = asyncHandler(async (req, res) => {
  const { title = "blank", description = "", taskDuration = "long" } = req.body;

  // Verify that taskDuration is valid
  if (!["short", "long", "general"].includes(taskDuration)) {
    res.status(400);
    throw new Error(
      "Invalid task duration: taskDuration must be short, long or general"
    );
  }

  // Remove the limit on the number of cards, users can have any number of cards
  // // Note: The initial number of cards for new users is still limited to 3 in the initializeUserCards function in AuthContext.js

  const blankCard = await Card.create({
    user: req.user.id,
    type: "blank",
    title,
    description,
    taskDuration, // Using the parameters passed in the request
    issuedAt: new Date(),
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { cardInventory: blankCard._id },
    $inc: { "dailyCards.blank": taskDuration === "short" ? 1 : 0 }, // Only short-lived cards are counted in dailyCards.blank
  });

  res.status(201).json({
    message: `${taskDuration === "short" ? "short" : "long"}Blank card issued successfully`,
    card: blankCard,
  });
});

// @desc    Consume cards to create tasks
// @route   POST /api/cards/consume
// @access  Private
const consumeCard = asyncHandler(async (req, res) => {
  const { cardId, taskData } = req.body;
  const user = await User.findById(req.user.id);

  let card;

  if (cardId) {
    // ⭐ If it is a reward card (selected by the user)
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

    // ✅ Check whether the task type matches
    if (
      card.taskDuration !== "general" &&
      card.taskDuration !== taskData.type
    ) {
      res.status(400);
      throw new Error(
        `This card only supports ${card.taskDuration} type tasks and cannot be used for ${taskData.type} type tasks`
      );
    }
  } else {
    // ⭐ Automatically assign blank cards (blank)
    card = await Card.findOne({
      user: req.user.id,
      used: false,
      type: "blank",
      $or: [{ taskDuration: taskData.type }, { taskDuration: "general" }],
    });

    if (!card) {
      res.status(400);
      throw new Error(`You have no blank cards available for tasks of type ${taskData.type}`);
    }
  }

  // ✅ Update card status
  if (card.type !== "periodic") {
    card.used = true;
    await card.save();
  } else {
    card.cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await card.save();
  }

  // ✅ Update user card status (deduct blank card inventory and remove it from inventory)
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { "dailyCards.blank": card.type === "blank" ? -1 : 0 },
    $pull: { cardInventory: card.type !== "periodic" ? card._id : null },
  });

  // ✅ Rewards
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
      cardUsed: card._id.toString(), 
    },
  });
});

const processDrops = asyncHandler(async (req, res) => {
  console.log('=== Process Drops Route Hit ===');
  
  const { monsterIds } = req.body;
  const user = req.user;
  
  if (!monsterIds || !Array.isArray(monsterIds)) {
    res.status(400);
    throw new Error('Monster ID array is required');
  }
  
  console.log('Received monster IDs:', monsterIds);
  
  try {
    //  Retrieve monster data
    const monsters = await Monster.find({ _id: { $in: monsterIds } });
    console.log('Found monsters count:', monsters.length);
    
    // Fix comparison logic: ensure uniqueness of IDs
    const uniqueRequestedIds = [...new Set(monsterIds)];
    const foundIds = monsters.map(m => m._id.toString());
    const uniqueFoundIds = [...new Set(foundIds)];
    
    console.log('Unique requested IDs:', uniqueRequestedIds);
    console.log('Unique found IDs:', uniqueFoundIds);
    
    // Check if all unique requested IDs are found
    const missingIds = uniqueRequestedIds.filter(id => !uniqueFoundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.error('Missing IDs:', missingIds);
      res.status(400);
      throw new Error('Some monster IDs are invalid');
    }
    
    // Ensure duplicates are handled correctly by preserving request order
    // Construct ordered array of monsters with possible duplicates
    const orderedMonsters = [];
    for (const requestedId of monsterIds) {
      const monster = monsters.find(m => m._id.toString() === requestedId);
      if (monster) {
        orderedMonsters.push(monster);
      }
    }
    
    console.log('Ordered monsters count:', orderedMonsters.length);
    console.log('Expected monsters count:', monsterIds.length);
    
    // Construct player object
    const player = {
      userId: user._id,
      level: user.level || 1,
      classSlug: user.classSlug || 'warrior'
    };
    
    // Process drops using ordered monster list
    const dropResults = await calculateAndProcessDrops(orderedMonsters, player);
    
    // Refresh user card inventory statistics
    if (dropResults.cards.length > 0) {
      await checkCardNumber(user._id);
    }
    
    // Return drop results
    res.json({
      success: true,
      data: {
        gold: dropResults.gold,
        exp: dropResults.exp,
        items: dropResults.items,
        cards: dropResults.cards
      },
      message: 'Drop processing completed'
    });
    
  } catch (error) {
    console.error('Process drops error:', error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

const getCardById = asyncHandler(async (req, res) => {
  try {
    const cardId = req.params.id;

    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: "Invalid card ID format" });
    }

    // Find a card
    const card = await Card.findById(cardId);

    // Check if the card exists
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Check if the card belongs to the current user
    if (card.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this card" });
    }

    res.json(card);
  } catch (error) {
    console.error("Error fetching card details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Delete the card with the specified ID
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = asyncHandler(async (req, res) => {
  const cardId = req.params.id;

  // Verify ID format
  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return res.status(400).json({ message: "Invalid card ID format" });
  }

  // Find a card
  const card = await Card.findById(cardId);

  // Check if the card exists
  if (!card) {
    return res.status(404).json({ message: "Card does not exist" });
  }

  // Check if the card belongs to the current user
  if (card.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "You do not have permission to delete this card" });
  }

  // Delete a card
  await Card.findByIdAndDelete(cardId);

  // Remove this card from the user's card inventory
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { cardInventory: cardId }
  });

  res.json({ message: "Card deleted successfully" });
});

export {
  consumeCard,
  getCardInventory,
  issueDailyCards,
  issueWeeklyCards,
  issueRewardCard,
  issueBlankCard,
  getCardById,
  processDrops,
  deleteCard
};
