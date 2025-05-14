import { UserDungeonStats } from "../models/UserDungeonStats.js";
import { Dungeon } from "../models/Dungeon.js";
import { Event } from "../models/Event.js";
import { Monster } from "../models/Monster.js";
import mongoose from "mongoose";
import { resolveEventEffects } from "../services/eventEngine.js";
import { executeCombat } from "../services/combatEngine.js";

function validateUserStats(stats) {
  // Validate assignedStats
  if (stats.assignedStats) {
    for (const key in stats.assignedStats) {
      if (isNaN(stats.assignedStats[key])) {
        console.warn(`Fixing invalid ${key}: ${stats.assignedStats[key]}`);
        stats.assignedStats[key] = 0;
      }
    }
  }

  // Validate currentExploration
  if (stats.currentExploration) {
    if (isNaN(stats.currentExploration.currentHp)) {
      console.warn(
        `Fixing invalid currentHp: ${stats.currentExploration.currentHp}`
      );
      stats.currentExploration.currentHp = 100;
    }

    if (isNaN(stats.currentExploration.floorIndex)) {
      console.warn(
        `Fixing invalid floorIndex: ${stats.currentExploration.floorIndex}`
      );
      stats.currentExploration.floorIndex = 1;
    }
  }

  // Validate other numeric fields
  if (isNaN(stats.dungeonExp)) stats.dungeonExp = 0;
  if (isNaN(stats.dungeonLevel)) stats.dungeonLevel = 1;
  if (isNaN(stats.unspentStatPoints)) stats.unspentStatPoints = 0;
  if (isNaN(stats.gold)) stats.gold = 0;

  return stats;
}

// Handle dungeon entry request
export const enterDungeon = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user stats
    let stats = await UserDungeonStats.findOne({ user: userId });

    // If no stats found, prompt user to select a class first
    if (!stats) {
      return res.status(400).json({
        error: "You need to select a class first",
        needsClass: true,
      });
    }

    // Log current class info
    console.log("Player class info for dungeon entry:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    // Use default dungeon slug or fetch from DB
    const dungeonSlug = stats.dungeonSlug || "echo-labyrinth";

    // Look up the dungeon
    const dungeon = await Dungeon.findOne({
      slug: dungeonSlug,
      isActive: true,
    });
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found or inactive" });
    }

    // Ensure character class has valid stats
    if (
      !stats.assignedStats ||
      !stats.assignedStats.hp ||
      stats.assignedStats.hp === 0
    ) {
      return res.status(400).json({
        error: "You need to select a class first",
        needsClass: true,
      });
    }

    // Calculate max HP
    const maxHp = stats.assignedStats.hp + (stats.statsBoost?.maxHp || 0);

    // Set up current exploration (ensure dungeonSlug included)
    stats.currentExploration = {
      dungeonSlug: dungeonSlug, // Explicitly set dungeonSlug
      floorIndex: 1,
      currentHp: maxHp,
      activeMonsters: [],
      activeEvents: [],
      status: {
        inCombat: false,
        atCheckpoint: false,
      },
      startTime: new Date(),
    };

    // Save updates
    stats.lastEnter = new Date();
    await stats.save();
    console.log("✅ Entered:", dungeonSlug);
    console.log("Current exploration:", stats.currentExploration);
    console.log("Player class for combat:", stats.classSlug || "unknown");

    return res.json({
      success: true,
      message: `You have entered ${dungeon.name}`,
      dungeon: {
        name: dungeon.name,
        description: dungeon.description,
        maxFloor: dungeon.maxFloor,
        environment: dungeon.environment,
      },
      exploration: {
        dungeonSlug: dungeonSlug,
        floorIndex: 1,
        description: dungeon.description,
      },
      currentFloor: 1,
      stats: {
        hp: maxHp,
        attack: stats.assignedStats.attack + (stats.statsBoost?.attack || 0),
        defense: stats.assignedStats.defense + (stats.statsBoost?.defense || 0),
        magicPower: stats.assignedStats?.magicPower || 0, // Include magic power
        level: stats.dungeonLevel,
        className: stats.className,
        classSlug: stats.classSlug,
      },
      playerClass: stats.classSlug || "warrior", // Provide class info to frontend
    });
  } catch (err) {
    console.error("enterDungeon error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// Explore the current dungeon floor
  export const exploreCurrentFloor = async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      console.log("Exploring floor for user:", userId);

      // Fetch user stats – ensure complete data
      const stats = await UserDungeonStats.findOne({ user: userId })
        .populate("currentExploration.activeEvents")
        .populate("currentExploration.activeMonsters")
        .populate({
          path: "Skills",
          // Explicitly select fields to avoid missing data
          select:
            "_id name description icon trigger effect effectValue cooldown once priority triggerCondition allowedClasses",
        });

      console.log("User stats found:", !!stats);

      // Log player class info for debugging
      if (stats) {
        console.log("Player class info:", {
          classSlug: stats.classSlug || "not set",
          className: stats.className || "not set",
          magicPower: stats.assignedStats?.magicPower || 0,
        });
      }

      if (!stats || !stats.currentExploration) {
        return res.status(400).json({
          error: "You are not currently exploring a dungeon.",
          hint: "Use the enter dungeon API first",
        });
      }

      // Log detailed current exploration status
      if (stats.currentExploration) {
        console.log("Current exploration:", {
          dungeonSlug: stats.currentExploration.dungeonSlug || "undefined",
          floorIndex: stats.currentExploration.floorIndex,
          hp: stats.currentExploration.currentHp,
        });
      }

      // Use dungeonSlug from currentExploration or fallback to user stats
      let dungeonSlug = stats.currentExploration.dungeonSlug;

      if (!dungeonSlug) {
        console.log(
          "Missing dungeonSlug in exploration data, trying to use user stats dungeonSlug"
        );
        dungeonSlug = stats.dungeonSlug;

        if (dungeonSlug) {
          // Update dungeonSlug inside current exploration
          stats.currentExploration.dungeonSlug = dungeonSlug;
          await stats.save();
          console.log(
            "Updated currentExploration.dungeonSlug with:",
            dungeonSlug
          );
        } else {
          console.error("No dungeonSlug available in user stats either");
          // 	Fallback to default dungeon
          dungeonSlug = "echo-labyrinth";
          stats.currentExploration.dungeonSlug = dungeonSlug;
          await stats.save();
          console.log("Set default dungeonSlug:", dungeonSlug);
        }
      }

      // Ensure floorIndex is a valid number
      let floorIndex = stats.currentExploration.floorIndex;
      console.log("Raw floorIndex:", floorIndex, "type:", typeof floorIndex);

      // Parse floorIndex into an integer
      floorIndex = parseInt(floorIndex, 10);

      if (isNaN(floorIndex) || floorIndex < 1) {
        console.error(
          "Invalid floorIndex:",
          stats.currentExploration.floorIndex
        );
        // Reset to 1
        floorIndex = 1;
        stats.currentExploration.floorIndex = 1;
        await stats.save();
        console.log("Reset floorIndex to 1");
      }

      console.log(
        `Finding dungeon with slug: ${dungeonSlug}, floor: ${floorIndex}`
      );

      // Fetch the dungeon from database
      const dungeon = await Dungeon.findOne({ slug: dungeonSlug })
        .populate("floors.monsters.monster")
        .populate("floors.boss")
        .populate("floors.events");

      if (!dungeon) {
        console.error(`Dungeon not found with slug: ${dungeonSlug}`);
        return res.status(404).json({ error: "Dungeon not found." });
      }

      console.log(
        `Dungeon found: ${dungeon.name}, total floors: ${
          dungeon.floors?.length || 0
        }`
      );

      // Find the current floor in dungeon data
      const floor = dungeon.floors?.find((f) => f.floorIndex === floorIndex);
      console.log("Floor found:", !!floor);

      if (!floor) {
        console.error(
          `Floor ${floorIndex} not found in dungeon ${dungeonSlug}`
        );

        if (dungeon.floors && dungeon.floors.length > 0) {
          console.log(
            "Available floor indices:",
            dungeon.floors.map((f) => f.floorIndex)
          );

          // 	Try to use the first available floor
          const firstFloor = dungeon.floors[0];
          stats.currentExploration.floorIndex = firstFloor.floorIndex;
          await stats.save();
          console.log(
            `Reset to first available floor: ${firstFloor.floorIndex}`
          );

          return res.status(200).json({
            message: `Floor reset to ${firstFloor.floorIndex}. Please try again.`,
            nextFloor: firstFloor.floorIndex,
            result: "retry",
          });
        }

        return res.status(404).json({
          error: "Floor not found.",
          hint: `Valid floor indices for ${dungeon.name} are 1-${dungeon.maxFloor}`,
        });
      }

      const logs = [];
      let hp = stats.currentExploration.currentHp ?? 100;
      console.log("Current HP:", hp);

      // 1. 	Event handling – ensure events exist
      if (Array.isArray(floor.events) && floor.events.length > 0) {
        console.log("Events to process:", floor.events.length);
        for (const event of floor.events) {
          if (!event) continue;
          try {
            console.log("Processing event:", event._id);
            const result = await resolveEventEffects(event, stats, hp);
            console.log("Event result:", result);

            if (result?.log) logs.push(result.log);

            // Prevent HP from becoming NaN
            if (result?.hp != null && !isNaN(result.hp)) {
              hp = result.hp;
            } else {
              console.warn(
                "Invalid HP value from event, keeping current HP:",
                hp
              );
            }

            if (result?.pause) {
              stats.currentExploration.status =
                stats.currentExploration.status || {};
              stats.currentExploration.status.inCombat = false;

              // Validate all fields before saving
              validateUserStats(stats);

              try {
                await stats.save();
              } catch (pauseError) {
                console.error("Error saving stats during pause:", pauseError);
                // Continue flow even if saving fails
              }

              return res.json({
                logs,
                pause: true,
                eventType: result.eventType || event.type || "unknown",
                currentHp: hp,
              });
            }
          } catch (eventError) {
            console.error("Event processing error:", eventError);
            logs.push(`Error processing event: ${event.name || "Unknown"}`);
          }
        }
      }

      // 2. Combat handling – collect monster IDs safely
      const monsterIds = [];
      const monsterInfos = []; // 	For frontend display

      // Updated implementation
      if (Array.isArray(floor.monsters)) {
        console.log("Processing monsters:", floor.monsters.length);
        for (const monsterInfo of floor.monsters) {
          if (monsterInfo?.monster?._id) {
            const count = monsterInfo.count || 1;
            console.log(
              `Adding monster ${
                monsterInfo.monster.name || "Unknown"
              } x${count}`
            );
            for (let i = 0; i < count; i++) {
              monsterIds.push(monsterInfo.monster._id);
              // Return full monster object for frontend
              monsterInfos.push({
                _id: monsterInfo.monster._id,
                name: monsterInfo.monster.name,
                slug: monsterInfo.monster.slug,
                icon: monsterInfo.monster.icon,
                type: monsterInfo.monster.type,
                description: monsterInfo.monster.description,
                level: monsterInfo.monster.level,
                tags: monsterInfo.monster.tags,
                stats: monsterInfo.monster.stats,
                skills: monsterInfo.monster.skills,
                behavior: monsterInfo.monster.behavior,
                trueForm: monsterInfo.monster.trueForm,
                expDrop: monsterInfo.monster.expDrop,
                goldDrop: monsterInfo.monster.goldDrop,
                itemDrops: monsterInfo.monster.itemDrops,
                taskCardDrops: monsterInfo.monster.taskCardDrops,
                spawnRate: monsterInfo.monster.spawnRate,
                floors: monsterInfo.monster.floors,
                environmentTags: monsterInfo.monster.environmentTags,
                // Similarly handle boss data
                id: monsterInfo.monster._id,
                portrait: monsterInfo.monster.portrait,
              });
            }
          }
        }
      }

      // Retain original fields for compatibility
      if (floor.boss?._id) {
        console.log(`Adding boss: ${floor.boss.name || "Unknown Boss"}`);
        monsterIds.push(floor.boss._id);
        monsterInfos.push({
          _id: floor.boss._id,
          name: floor.boss.name,
          slug: floor.boss.slug,
          icon: floor.boss.icon,
          type: floor.boss.type,
          description: floor.boss.description,
          level: floor.boss.level,
          tags: floor.boss.tags,
          stats: floor.boss.stats,
          skills: floor.boss.skills,
          behavior: floor.boss.behavior,
          trueForm: floor.boss.trueForm,
          expDrop: floor.boss.expDrop,
          goldDrop: floor.boss.goldDrop,
          itemDrops: floor.boss.itemDrops,
          taskCardDrops: floor.boss.taskCardDrops,
          spawnRate: floor.boss.spawnRate,
          floors: floor.boss.floors,
          environmentTags: floor.boss.environmentTags,
          id: floor.boss._id,
          portrait: floor.boss.portrait,
          isBoss: true,
        });
      }
      console.log("Monsters to fight:", monsterIds.length);

      // 	Confirm class info before combat execution
      console.log(
        "Preparing for combat with class:",
        stats.classSlug || "unknown",
        "and className:",
        stats.className || "unknown"
      );

      let combatResult;
      try {
        combatResult = await executeCombat(monsterIds, stats, hp);
        console.log("Combat result:", {
          survived: combatResult.survived,
          remainingHp: combatResult.remainingHp,
          logCount: combatResult.logs?.length || 0,
          classUsed: combatResult.debug?.playerClass,
        });

        if (Array.isArray(combatResult.logs)) {
          logs.push(...combatResult.logs);
        }
      } catch (combatError) {
        console.error("Combat execution error:", combatError);
        combatResult = {
          survived: true,
          logs: ["An error occurred during combat"],
          remainingHp: hp,
        };
        logs.push("Combat system error");
      }

      logs.push(`🔍 Exploring floor ${floorIndex}...`);

      // Handle defeat case
      if (!combatResult.survived) {
        console.log("Player was defeated");
        // Clear exploration state
        stats.currentExploration = undefined;
        await stats.save();
        return res.json({
          logs,
          result: "defeat",
          message: "You were defeated.",
          monsters: monsterInfos,
        });
      }

      // On victory, continue exploration
      console.log(`Combat victory, advancing to floor ${floorIndex + 1}`);
      stats.currentExploration.floorIndex = floorIndex + 1;

      stats.currentExploration.currentHp = combatResult.remainingHp;
      logs.push(`🚪 You have entered floor ${floorIndex + 1}`);

      // add a check for achievements
      eventBus.emit("checkAchievements", req.user._id);

      // Ensure exploredFloors is an array and update it
      stats.exploredFloors = Array.isArray(stats.exploredFloors)
        ? stats.exploredFloors
        : [];
      if (!stats.exploredFloors.includes(floorIndex)) {
        stats.exploredFloors.push(floorIndex);
      }

      // Calculate EXP gain
      const expGained = 10 + floorIndex * 2 + monsterIds.length * 3; // Simple EXP formula
      stats.dungeonExp = (stats.dungeonExp || 0) + expGained;
      console.log(`Gained ${expGained} EXP, total EXP: ${stats.dungeonExp}`);

      // Check if dungeon is completed
      const isEnd =
        stats.currentExploration.floorIndex > (dungeon.maxFloor || 1);

      if (isEnd) {
        console.log("Reached dungeon end");
        // Compute level-up
        const totalExp = stats.dungeonExp;
        const prevLevel = stats.dungeonLevel || 1;
        const newLevel = Math.floor(1 + totalExp / 100);
        const levelDiff = Math.max(0, newLevel - prevLevel);

        if (levelDiff > 0) {
          console.log(`Level up! ${prevLevel} -> ${newLevel}`);
          stats.dungeonLevel = newLevel;
          stats.unspentStatPoints =
            (stats.unspentStatPoints || 0) + levelDiff * 5;
        }

        // 	Use Set to ensure unique floor entries
        stats.exploredFloors = Array.from(
          new Set([...stats.exploredFloors, floorIndex])
        );

        stats.currentExploration = undefined;

        try {
          await stats.save();

          // 检查成就
          const { checkAndUnlockAchievements } = await import(
            "../utils/checkAchievements.js"
          );
          const newlyUnlocked = await checkAndUnlockAchievements(userId);

          return res.json({
            logs,
            monsters: monsterInfos,
            result: "completed",
            gainedExp: expGained,
            totalExp,
            levelUp: levelDiff > 0,
            newLevel,
            statPointsGained: levelDiff * 5,
            unspentStatPoints: stats.unspentStatPoints,
            message: `You have completed ${dungeon.name}!`,
            newlyUnlockedAchievements: newlyUnlocked,
          });
        } catch (saveError) {
          console.error("Error saving completion stats:", saveError);
          return res
            .status(500)
            .json({ error: "Failed to save game progress" });
        }
      }

      // Check if checkpoint is reached
      const nextFloor = dungeon.floors?.find(
        (f) => f.floorIndex === stats.currentExploration.floorIndex
      );
      if (nextFloor?.checkpoint) {
        console.log(
          `Reached checkpoint at floor ${stats.currentExploration.floorIndex}`
        );
        stats.checkpointFloor = stats.currentExploration.floorIndex;
        stats.currentExploration.status = stats.currentExploration.status || {};
        stats.currentExploration.status.atCheckpoint = true;
        logs.push(
          `You have reached a checkpoint at floor ${stats.currentExploration.floorIndex}!`
        );

        // Check for achievements when reaching checkpoint
        const { checkAndUnlockAchievements } = await import(
          "../utils/checkAchievements.js"
        );
        const newlyUnlocked = await checkAndUnlockAchievements(userId);

        if (newlyUnlocked.length > 0) {
          return res.json({
            logs,
            monsters: monsterInfos,
            result: "continue",
            nextFloor: stats.currentExploration.floorIndex,
            gainedExp: expGained,
            currentHp: combatResult.remainingHp,
            atCheckpoint: true,
            newlyUnlockedAchievements: newlyUnlocked,
          });
        }
      }

      try {
        await stats.save();
      } catch (saveError) {
        console.error("Error saving progress stats:", saveError);
        return res
          .status(500)
          .json({ error: "Failed to save exploration progress" });
      }

      return res.json({
        logs,
        monsters: monsterInfos,
        result: "continue",
        nextFloor: stats.currentExploration.floorIndex,
        gainedExp: expGained,
        currentHp: combatResult.remainingHp,
        atCheckpoint: nextFloor?.checkpoint || false,
      });
    } catch (err) {
      console.error("exploreCurrentFloor error:", err);
      console.error("Error stack:", err.stack);
      return res.status(500).json({
        error: "Internal server error",
        message: err.message,
      });
    }
  };

export const monsterCombat = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await UserDungeonStats.findOne({ user: userId }).populate(
      "currentExploration.activeMonsters"
    );

    if (!stats?.currentExploration?.status?.inCombat) {
      return res.status(400).json({ error: "Not in combat." });
    }

    let remainingHp = stats.currentExploration.currentHp ?? 100;
    let expGain = 0;
    let goldGain = 0;

    for (const monster of stats.currentExploration.activeMonsters) {
      remainingHp -= Math.floor(monster.stats.attack * 0.6);
      expGain += monster.expDrop;
      goldGain += monster.goldDrop;
    }

    remainingHp = Math.max(remainingHp, 0);
    const isDead = remainingHp === 0;

    stats.currentExploration.currentHp = remainingHp;
    stats.currentExploration.activeMonsters = [];
    stats.currentExploration.status.inCombat = false;

    if (!isDead) {
      stats.dungeonExp += expGain;
      stats.gold = (stats.gold || 0) + goldGain;
    }

    await stats.save();
    return res.json({
      result: isDead ? "defeated" : "victory",
      hpLeft: remainingHp,
      expGain,
      goldGain,
    });
  } catch (err) {
    console.error("monsterCombat error:", err);
    return res.status(500).json({ error: "Combat resolution failed" });
  }
};

export const summarizeExploration = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await UserDungeonStats.findOne({ user: userId });

    if (!stats) {
      return res.status(404).json({ error: "User stats not found" });
    }

    const totalExp = stats.dungeonExp || 0;
    console.log("Total exp for summary:", totalExp);

    const prevLevel = stats.dungeonLevel || 1;
    const currentLevel = Math.floor(1 + totalExp / 100);
    const levelDiff = Math.max(0, currentLevel - prevLevel);

    if (levelDiff > 0) {
      stats.dungeonLevel = currentLevel;
      stats.unspentStatPoints = (stats.unspentStatPoints || 0) + levelDiff * 5;
      console.log(`Level up in summary: ${prevLevel} -> ${currentLevel}`);
    }

    // Record explored floor if applicable
    if (stats.currentExploration && stats.currentExploration.floorIndex) {
      stats.exploredFloors = Array.from(
        new Set([
          ...(stats.exploredFloors || []),
          stats.currentExploration.floorIndex,
        ])
      );
    }

    // Clear current exploration data
    const wasExploring = !!stats.currentExploration;
    stats.currentExploration = undefined;

    // Save updates
    try {
      await stats.save();
      console.log("Stats saved successfully after summary");
    } catch (saveError) {
      console.error("Error saving stats in summary:", saveError);
    }

    // Return exploration summary
    return res.json({
      message: wasExploring ? "Exploration completed" : "No active exploration",
      gainedExp: totalExp, 
      totalExp: totalExp,
      prevLevel: prevLevel,
      newLevel: stats.dungeonLevel,
      levelUp: levelDiff > 0,
      statPointsGained: levelDiff * 5,
      unspentStatPoints: stats.unspentStatPoints,
      exploredFloors: stats.exploredFloors || [],
      highestFloor: Math.max(...(stats.exploredFloors || [1])),
    });
  } catch (err) {
    console.error("summarizeExploration error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

export const interactWithShopEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { action, itemId } = req.body;

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "Not currently in an exploration" });
    }

    // Handle purchase action
    if (action === "buy" && itemId) {
      const shopItem = await ShopInventory.findById(itemId);
      if (!shopItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      if ((stats.gold || 0) < shopItem.price) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      stats.gold -= shopItem.price;

      await stats.save();

      // Check for achievements after purchase
      const { checkAndUnlockAchievements } = await import("../utils/checkAchievements.js");
      const newlyUnlocked = await checkAndUnlockAchievements(userId);

      return res.json({
        success: true,
        message: `You bought ${shopItem.name} for ${shopItem.price} gold!`,
        gold: stats.gold,
        newlyUnlockedAchievements: newlyUnlocked
      });
    } else if (action === "leave") {
      return res.json({
        success: true,
        message: "You left the shop.",
        canContinue: true
      });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("interactWithShopEvent error:", err);
    return res.status(500).json({ error: "Failed to interact with shop" });
  }
};

export const continueExploration = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res
        .status(400)
        .json({ error: "No active exploration to continue" });
    }

    const wasInShop = stats.currentExploration.status?.inShop === true;
    console.log("Was in shop:", wasInShop);

    if (stats.currentExploration.status) {
      stats.currentExploration.status.inShop = false;
      stats.currentExploration.status.inCombat = false;
    }

    await stats.save();

    if (wasInShop) {
      return await prepareCombatAfterShop(req, res);
    }

    return await exploreCurrentFloor(req, res);
  } catch (err) {
    console.error("continueExploration error:", err);
    return res.status(500).json({ error: "Failed to continue exploration" });
  }
};


export const prepareCombatAfterShop = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await UserDungeonStats.findOne({ user: userId }).populate(
      "Skills"
    );

    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "No active exploration" });
    }
    
    console.log("Player class info for shop combat:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    let dungeonSlug =
      stats.currentExploration.dungeonSlug ||
      stats.dungeonSlug ||
      "echo-labyrinth";
    let floorIndex = stats.currentExploration.floorIndex;
    floorIndex = parseInt(floorIndex, 10);

    if (isNaN(floorIndex) || floorIndex < 1) {
      floorIndex = 1;
      stats.currentExploration.floorIndex = 1;
      await stats.save();
    }

    const dungeon = await Dungeon.findOne({ slug: dungeonSlug })
      .populate("floors.monsters.monster")
      .populate("floors.boss");

    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found." });
    }

    const floor = dungeon.floors?.find((f) => f.floorIndex === floorIndex);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found." });
    }

    const logs = [];
    let hp = stats.currentExploration.currentHp ?? 100;

    const monsterIds = [];
    const monsterInfos = [];

    if (Array.isArray(floor.monsters)) {
      for (const monsterInfo of floor.monsters) {
        if (monsterInfo?.monster?._id) {
          const count = monsterInfo.count || 1;
          for (let i = 0; i < count; i++) {
            monsterIds.push(monsterInfo.monster._id);
            monsterInfos.push({
              _id: monsterInfo.monster._id,
              name: monsterInfo.monster.name,
              slug: monsterInfo.monster.slug,
              icon: monsterInfo.monster.icon,
              type: monsterInfo.monster.type,
              description: monsterInfo.monster.description,
              level: monsterInfo.monster.level,
              tags: monsterInfo.monster.tags,
              stats: monsterInfo.monster.stats,
              skills: monsterInfo.monster.skills,
              behavior: monsterInfo.monster.behavior,
              trueForm: monsterInfo.monster.trueForm,
              expDrop: monsterInfo.monster.expDrop,
              goldDrop: monsterInfo.monster.goldDrop,
              itemDrops: monsterInfo.monster.itemDrops,
              taskCardDrops: monsterInfo.monster.taskCardDrops,
              spawnRate: monsterInfo.monster.spawnRate,
              floors: monsterInfo.monster.floors,
              environmentTags: monsterInfo.monster.environmentTags,
              id: monsterInfo.monster._id,
              portrait: monsterInfo.monster.portrait
            });
          }
        }
      }
    }

    if (floor.boss?._id) {
      monsterIds.push(floor.boss._id);
      monsterInfos.push({
        _id: floor.boss._id,
        name: floor.boss.name,
        slug: floor.boss.slug,
        icon: floor.boss.icon,
        type: floor.boss.type,
        description: floor.boss.description,
        level: floor.boss.level,
        tags: floor.boss.tags,
        stats: floor.boss.stats,
        skills: floor.boss.skills,
        behavior: floor.boss.behavior,
        trueForm: floor.boss.trueForm,
        expDrop: floor.boss.expDrop,
        goldDrop: floor.boss.goldDrop,
        itemDrops: floor.boss.itemDrops,
        taskCardDrops: floor.boss.taskCardDrops,
        spawnRate: floor.boss.spawnRate,
        floors: floor.boss.floors,
        environmentTags: floor.boss.environmentTags,
        id: floor.boss._id,
        portrait: floor.boss.portrait,
        isBoss: true
      });
    }

    console.log("Monsters after shop:", monsterIds.length);
    console.log("Monster data sample:", monsterInfos[0] ? { 
      _id: monsterInfos[0]._id, 
      name: monsterInfos[0].name,
      hasItemDrops: !!monsterInfos[0].itemDrops,
      hasTaskCardDrops: !!monsterInfos[0].taskCardDrops
    } : 'No monsters');
    console.log("Using class for shop combat:", stats.classSlug || "unknown");

    if (monsterIds.length === 0) {
      console.log("No monsters after shop, continuing exploration");
      return await exploreCurrentFloor(req, res);
    }

    if (!stats.currentExploration.shopCombat) {
      stats.currentExploration.shopCombat = {
        floorIndex,
        monsterCount: monsterIds.length,
        timestamp: new Date(),
      };
      await stats.save();
    }

    logs.push(`🔍 Continuing exploration after shop on floor ${floorIndex}...`);
    if (monsterIds.length > 0) {
      logs.push(`⚔️  Encountered ${monsterIds.length} monster(s)!`);
    }
    
    return res.json({
      logs,
      monsters: monsterInfos, 
      result: "continue",
      currentFloor: floorIndex, 
      nextFloor: stats.currentExploration.floorIndex,
      currentHp: hp,
      playerClass: stats.classSlug || "warrior", 
      totalExp: stats.dungeonExp, 
      shopTransition: true  
    });
  } catch (err) {
    console.error("prepareCombatAfterShop error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

export const updateCombatResult = async (req, res) => {
  try {
    const userId = req.user._id;
    const { survived, remainingHp } = req.body;

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "No active exploration" });
    }
    
    console.log("Player class info for combat result update:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    let floorIndex = stats.currentExploration.floorIndex;
    const dungeonSlug =
      stats.currentExploration.dungeonSlug || stats.dungeonSlug;

    console.log(
      `Combat result update - Floor before: ${floorIndex}, Survived: ${survived}`
    );

    stats.currentExploration.currentHp = remainingHp;

    if (survived) {
      const dungeon = await Dungeon.findOne({ slug: dungeonSlug });

      floorIndex = parseInt(floorIndex, 10);
      stats.currentExploration.floorIndex = floorIndex + 1;

      const expGained = 10 + floorIndex * 2; 
      stats.dungeonExp = (stats.dungeonExp || 0) + expGained;

      console.log(
        `Combat result update - Floor after: ${stats.currentExploration.floorIndex}`
      );

      const isEnd =
        dungeon &&
        stats.currentExploration.floorIndex > (dungeon.maxFloor || 1);
      if (isEnd) {
        stats.currentExploration = undefined;

        await stats.save();
        return res.json({
          result: "completed",
          message: "Dungeon completed!",
          experienceGained: expGained,
        });
      }
    } else {
      stats.currentExploration = undefined; 

      await stats.save();
      return res.json({
        result: "defeat",
        message: "You were defeated.",
      });
    }

    await stats.save();


    return res.json({
      result: "continue",
      currentFloor: floorIndex,
      nextFloor: stats.currentExploration.floorIndex,
      currentHp: remainingHp,
      experienceGained: expGained || 0,
      playerClass: stats.classSlug || "warrior", 
      totalExp: stats.dungeonExp,
      currentLevel: stats.dungeonLevel,
      unspentStatPoints: stats.unspentStatPoints, 
      logs: [`🚪 You have entered floor ${stats.currentExploration.floorIndex}`], 
    });
  } catch (err) {
    console.error("Update combat result error:", err);
    return res.status(500).json({
      error: "Failed to update combat result",
      message: err.message,
    });
  }
};

export const updateAfterCombat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { result, remainingHp } = req.body;

    console.log('=== Update After Combat Debug ===');
    console.log('Request data:', { result, remainingHp, userId });

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "No active exploration" });
    }
    
    console.log('Current stats before update:', {
      exploredFloors: stats.exploredFloors,
      exploredFloorsType: typeof stats.exploredFloors,
      floorIndex: stats.currentExploration.floorIndex,
      floorIndexType: typeof stats.currentExploration.floorIndex
    });
    
    console.log("Player class info for after combat update:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    let floorIndex = stats.currentExploration.floorIndex;
    if (typeof floorIndex === 'string') {
      floorIndex = parseInt(floorIndex, 10);
    }
    if (isNaN(floorIndex) || floorIndex < 1) {
      console.error('Invalid floorIndex, defaulting to 1:', floorIndex);
      floorIndex = 1;
    }
    console.log("Current floor (validated):", floorIndex);

    stats.currentExploration.currentHp = remainingHp;

    const isShopCombat = stats.currentExploration.shopCombat && 
                         stats.currentExploration.shopCombat.floorIndex === floorIndex;
    console.log('Is shop combat:', isShopCombat);

    if (result === "victory") {
      const newFloorIndex = floorIndex + 1;
      console.log('Advancing from floor', floorIndex, 'to', newFloorIndex);
      
      if (isNaN(newFloorIndex)) {
        console.error('Invalid new floor index:', newFloorIndex);
        return res.status(500).json({ 
          error: "Invalid floor calculation",
          message: `Cannot advance from floor ${floorIndex}`
        });
      }
      
      stats.currentExploration.floorIndex = newFloorIndex;
      console.log('Advanced to floor:', stats.currentExploration.floorIndex);
      
      let expGained = 10 + (floorIndex * 2); 
      
      // Adjust EXP if shop combat with extra monsters
      if (isShopCombat && stats.currentExploration.shopCombat.monsterCount) {
        expGained += stats.currentExploration.shopCombat.monsterCount * 3;
        // Clear shop combat flag
        stats.currentExploration.shopCombat = undefined;
      }

      //  Add EXP to total
      const oldExp = stats.dungeonExp || 0;
      stats.dungeonExp = oldExp + expGained;
      console.log(`Gained ${expGained} exp. Old: ${oldExp}, New: ${stats.dungeonExp}`);

      // Fixing exploredFloors logic
      // Ensure exploredFloors is an array and includes current floor
      if (!Array.isArray(stats.exploredFloors)) {
        console.log('Converting exploredFloors to array');
        stats.exploredFloors = [];
      }
      
      // Add floor to exploredFloors if not already present
      if (!stats.exploredFloors.includes(floorIndex)) {
        console.log('Adding floor', floorIndex, 'to exploredFloors');
        stats.exploredFloors.push(floorIndex);
      }
      
      console.log('Updated exploredFloors:', stats.exploredFloors);
      
      // Check for level-up
      const prevLevel = stats.dungeonLevel || 1;
      const newLevel = Math.floor(1 + stats.dungeonExp / 100);
      const levelDiff = Math.max(0, newLevel - prevLevel);

      if (levelDiff > 0) {
        console.log(`Level up! ${prevLevel} -> ${newLevel}`);
        stats.dungeonLevel = newLevel;
        stats.unspentStatPoints =
          (stats.unspentStatPoints || 0) + levelDiff * 5;
      }
      
      // Log final data before saving
      console.log('Final data before save:', {
        floorIndex: stats.currentExploration.floorIndex,
        floorIndexType: typeof stats.currentExploration.floorIndex,
        exploredFloors: stats.exploredFloors,
        exploredFloorsType: typeof stats.exploredFloors,
        isArray: Array.isArray(stats.exploredFloors)
      });
      
      // Save updated stats
      try {
        await stats.save();
        console.log("Stats saved successfully after combat");
      } catch (saveError) {
        console.error('Error saving stats:', saveError);
        console.error('Save error details:', {
          name: saveError.name,
          message: saveError.message,
          path: saveError.path,
          value: saveError.value,
          kind: saveError.kind
        });
        return res.status(500).json({
          error: "Failed to save stats",
          message: saveError.message,
          details: saveError.path ? `Field: ${saveError.path}, Value: ${saveError.value}` : null
        });
      }

      // Return combat update result
      return res.json({
        success: true,
        message: "Combat result updated",
        currentFloor: floorIndex,
        nextFloor: newFloorIndex,
        currentHp: remainingHp,
        expGained,
        playerClass: stats.classSlug || "warrior",
        totalExp: stats.dungeonExp,
        currentLevel: stats.dungeonLevel,
        unspentStatPoints: stats.unspentStatPoints,
        levelUp: levelDiff > 0,
        statPointsGained: levelDiff > 0 ? levelDiff * 5 : 0,
        logs: [`🚪 You have entered floor ${newFloorIndex}`]
      });
    }

    // If not a victory, only update HP
    await stats.save();

    return res.json({
      success: true,
      message: "HP updated",
      currentFloor: floorIndex,
      currentHp: remainingHp,
      playerClass: stats.classSlug || "warrior",
      totalExp: stats.dungeonExp
    });
  } catch (err) {
    console.error("Update after combat error:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({
      error: "Failed to update after combat",
      message: err.message,
    });
  }
};
