import { UserDungeonStats } from "../models/UserDungeonStats.js";
import { Dungeon } from "../models/Dungeon.js";
import { Event } from "../models/Event.js";
import { Monster } from "../models/Monster.js";
import mongoose from "mongoose";
import { resolveEventEffects } from "../services/eventEngine.js";
import { executeCombat } from "../services/combatEngine.js";

function validateUserStats(stats) {
  // 验证 assignedStats
  if (stats.assignedStats) {
    for (const key in stats.assignedStats) {
      if (isNaN(stats.assignedStats[key])) {
        console.warn(`Fixing invalid ${key}: ${stats.assignedStats[key]}`);
        stats.assignedStats[key] = 0;
      }
    }
  }

  // 验证 currentExploration
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

  // 验证其他数值字段
  if (isNaN(stats.dungeonExp)) stats.dungeonExp = 0;
  if (isNaN(stats.dungeonLevel)) stats.dungeonLevel = 1;
  if (isNaN(stats.unspentStatPoints)) stats.unspentStatPoints = 0;
  if (isNaN(stats.gold)) stats.gold = 0;

  return stats;
}

// 处理进入迷宫的请求
export const enterDungeon = async (req, res) => {
  try {
    const userId = req.user._id;

    // 获取用户统计
    let stats = await UserDungeonStats.findOne({ user: userId });

    // 如果没有统计信息，提示用户选择职业
    if (!stats) {
      return res.status(400).json({
        error: "You need to select a class first",
        needsClass: true,
      });
    }
    
    // 确认职业信息
    console.log("Player class info for dungeon entry:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    // 使用默认迷宫 slug 或从数据库中获取
    const dungeonSlug = stats.dungeonSlug || "echo-labyrinth";

    // 查找迷宫
    const dungeon = await Dungeon.findOne({
      slug: dungeonSlug,
      isActive: true,
    });
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found or inactive" });
    }

    // 检查是否有职业属性
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

    // 计算最大HP
    const maxHp = stats.assignedStats.hp + (stats.statsBoost?.maxHp || 0);

    // 设置当前探索 - 确保包含 dungeonSlug
    stats.currentExploration = {
      dungeonSlug: dungeonSlug, // 明确设置 dungeonSlug
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

    // 保存更改
    stats.lastEnter = new Date();
    await stats.save();
    console.log("✅ Entered:", dungeonSlug);
    console.log("Current exploration:", stats.currentExploration); // 添加日志
    console.log("Player class for combat:", stats.classSlug || "unknown"); // 添加职业日志

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
        magicPower: stats.assignedStats?.magicPower || 0, // 添加魔法力
        level: stats.dungeonLevel,
        className: stats.className, // 添加职业名称
        classSlug: stats.classSlug // 添加职业slug
      },
      playerClass: stats.classSlug || "warrior" // 额外提供职业信息给前端
    });
  } catch (err) {
    console.error("enterDungeon error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//探索当前楼层
  export const exploreCurrentFloor = async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      console.log("Exploring floor for user:", userId);
      
      // 获取用户统计 - 确保获取完整的用户数据
      const stats = await UserDungeonStats.findOne({ user: userId })
        .populate("currentExploration.activeEvents")
        .populate("currentExploration.activeMonsters")
        .populate({
          path: "Skills",
        // 明确指定要包含的字段，确保不会遗漏
            select: "_id name description icon trigger effect effectValue cooldown once priority triggerCondition allowedClasses"
        })

      console.log("User stats found:", !!stats);
      
      // 关键：添加职业信息日志，确认是否正确获取
      if (stats) {
        console.log("Player class info:", {
          classSlug: stats.classSlug || 'not set',
          className: stats.className || 'not set',
          magicPower: stats.assignedStats?.magicPower || 0
        });
      }

      if (!stats || !stats.currentExploration) {
        return res.status(400).json({
          error: "You are not currently exploring a dungeon.",
          hint: "Use the enter dungeon API first",
        });
      }

      // 更详细地记录当前探索状态
      if (stats.currentExploration) {
        console.log("Current exploration:", {
          dungeonSlug: stats.currentExploration.dungeonSlug || "undefined",
          floorIndex: stats.currentExploration.floorIndex,
          hp: stats.currentExploration.currentHp,
        });
      }

      // 使用 currentExploration.dungeonSlug 或回退到用户统计中的 dungeonSlug
      let dungeonSlug = stats.currentExploration.dungeonSlug;

      if (!dungeonSlug) {
        console.log(
          "Missing dungeonSlug in exploration data, trying to use user stats dungeonSlug"
        );
        dungeonSlug = stats.dungeonSlug;

        if (dungeonSlug) {
          // 更新当前探索中的 dungeonSlug
          stats.currentExploration.dungeonSlug = dungeonSlug;
          await stats.save();
          console.log(
            "Updated currentExploration.dungeonSlug with:",
            dungeonSlug
          );
        } else {
          console.error("No dungeonSlug available in user stats either");
          // 使用默认迷宫
          dungeonSlug = "echo-labyrinth";
          stats.currentExploration.dungeonSlug = dungeonSlug;
          await stats.save();
          console.log("Set default dungeonSlug:", dungeonSlug);
        }
      }

      // 确保 floorIndex 是有效数字
      let floorIndex = stats.currentExploration.floorIndex;
      console.log("Raw floorIndex:", floorIndex, "type:", typeof floorIndex);

      // 尝试将 floorIndex 转换为数字
      floorIndex = parseInt(floorIndex, 10);

      if (isNaN(floorIndex) || floorIndex < 1) {
        console.error("Invalid floorIndex:", stats.currentExploration.floorIndex);
        // 重置为1
        floorIndex = 1;
        stats.currentExploration.floorIndex = 1;
        await stats.save();
        console.log("Reset floorIndex to 1");
      }

      console.log(
        `Finding dungeon with slug: ${dungeonSlug}, floor: ${floorIndex}`
      );

      // 查找迷宫
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

      // 查找当前楼层
      const floor = dungeon.floors?.find((f) => f.floorIndex === floorIndex);
      console.log("Floor found:", !!floor);

      if (!floor) {
        console.error(`Floor ${floorIndex} not found in dungeon ${dungeonSlug}`);

        if (dungeon.floors && dungeon.floors.length > 0) {
          console.log(
            "Available floor indices:",
            dungeon.floors.map((f) => f.floorIndex)
          );

          // 尝试查找第一个楼层
          const firstFloor = dungeon.floors[0];
          stats.currentExploration.floorIndex = firstFloor.floorIndex;
          await stats.save();
          console.log(`Reset to first available floor: ${firstFloor.floorIndex}`);

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

      // 1. 事件处理 - 确保事件存在
      if (Array.isArray(floor.events) && floor.events.length > 0) {
        console.log("Events to process:", floor.events.length);
        for (const event of floor.events) {
          if (!event) continue;
          try {
            console.log("Processing event:", event._id);
            const result = await resolveEventEffects(event, stats, hp);
            console.log("Event result:", result);

            if (result?.log) logs.push(result.log);

            // 确保HP不会变成NaN
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

              // 在保存之前验证所有数值
              validateUserStats(stats);

              try {
                await stats.save();
              } catch (pauseError) {
                console.error("Error saving stats during pause:", pauseError);
                // 继续返回结果，不中断流程
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

      // 2. 战斗处理 - 安全地收集怪物 ID
      const monsterIds = [];
      const monsterInfos = []; // 用于前端显示

      // 修改后的代码
      if (Array.isArray(floor.monsters)) {
        console.log("Processing monsters:", floor.monsters.length);
        for (const monsterInfo of floor.monsters) {
          if (monsterInfo?.monster?._id) {
            const count = monsterInfo.count || 1;
            console.log(
              `Adding monster ${monsterInfo.monster.name || "Unknown"} x${count}`
            );
            for (let i = 0; i < count; i++) {
              monsterIds.push(monsterInfo.monster._id);
              // 返回完整的怪物对象，而不是简化版本
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
                // 保留原有字段以兼容
                id: monsterInfo.monster._id,
                portrait: monsterInfo.monster.portrait,
              });
            }
          }
        }
      }

      // 同样修改BOSS处理
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
          // 保留原有字段
          id: floor.boss._id,
          portrait: floor.boss.portrait,
          isBoss: true,
        });
      }
      console.log("Monsters to fight:", monsterIds.length);

      // 在执行战斗前，再次确认职业信息
      console.log("Preparing for combat with class:", stats.classSlug || "unknown", "and className:", stats.className || "unknown");
      
      // 执行战斗
      let combatResult;
      try {
        combatResult = await executeCombat(monsterIds, stats, hp);
        console.log("Combat result:", {
          survived: combatResult.survived,
          remainingHp: combatResult.remainingHp,
          logCount: combatResult.logs?.length || 0,
          classUsed: combatResult.debug?.playerClass
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


      logs.push(`🔍 正在探索第 ${floorIndex} 层...`);


      // 处理战斗失败
      if (!combatResult.survived) {
        console.log("Player was defeated");
        // 清除当前探索状态
        stats.currentExploration = undefined;
        await stats.save();
        return res.json({
          logs,
          result: "defeat",
          message: "You were defeated.",
          monsters: monsterInfos,
        });
      }

      // 战斗胜利，继续探索
      console.log(`Combat victory, advancing to floor ${floorIndex + 1}`);
      stats.currentExploration.floorIndex = floorIndex + 1;
      stats.currentExploration.currentHp = combatResult.remainingHp;
      logs.push(`🚪 你进入了第 ${floorIndex + 1} 层`);
      

      // 确保 exploredFloors 是数组并添加当前楼层
      stats.exploredFloors = Array.isArray(stats.exploredFloors)
        ? stats.exploredFloors
        : [];
      if (!stats.exploredFloors.includes(floorIndex)) {
        stats.exploredFloors.push(floorIndex);
      }

      // 获取经验值
      const expGained = 10 + floorIndex * 2 + monsterIds.length * 3; // 简单经验公式
      stats.dungeonExp = (stats.dungeonExp || 0) + expGained;
      console.log(`Gained ${expGained} EXP, total EXP: ${stats.dungeonExp}`);

      // 检查是否到达迷宫终点
      const isEnd = stats.currentExploration.floorIndex > (dungeon.maxFloor || 1);

      if (isEnd) {
        console.log("Reached dungeon end");
        // 计算等级提升
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

        // 使用 Set 确保唯一性
        stats.exploredFloors = Array.from(
          new Set([...stats.exploredFloors, floorIndex])
        );

        // 清除当前探索状态
        stats.currentExploration = undefined;

        // 保存数据
        try {
          await stats.save();
        } catch (saveError) {
          console.error("Error saving completion stats:", saveError);
          return res.status(500).json({ error: "Failed to save game progress" });
        }

        return res.json({
          logs,
          monsters: monsterInfos,
          result: "completed",
          gainedExp: expGained,
          totalExp,
          levelUp: levelDiff > 0,
          newLevel,
          statPointsGained: levelDiff * 5,
          
          unspentStatPoints: stats.unspentStatPoints, // 确保包含这个值
          message: `You have completed ${dungeon.name}!`


        });
      }

      // 检查是否达到检查点
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
      }

      // 保存数据
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
      return res.status(404).json({ error: "找不到用户统计信息" });
    }

    // 获取总经验值
    const totalExp = stats.dungeonExp || 0;
    console.log("Total exp for summary:", totalExp);

    // 计算当前等级
    const prevLevel = stats.dungeonLevel || 1;
    const currentLevel = Math.floor(1 + totalExp / 100);
    const levelDiff = Math.max(0, currentLevel - prevLevel);

    // 处理等级提升
    if (levelDiff > 0) {
      stats.dungeonLevel = currentLevel;
      stats.unspentStatPoints = (stats.unspentStatPoints || 0) + levelDiff * 5;
      console.log(`Level up in summary: ${prevLevel} -> ${currentLevel}`);
    }

    // 处理探索楼层
    if (stats.currentExploration && stats.currentExploration.floorIndex) {
      stats.exploredFloors = Array.from(
        new Set([
          ...(stats.exploredFloors || []),
          stats.currentExploration.floorIndex,
        ])
      );
    }

    // 清除当前探索
    const wasExploring = !!stats.currentExploration;
    stats.currentExploration = undefined;

    // 保存更新
    try {
      await stats.save();
      console.log("Stats saved successfully after summary");
    } catch (saveError) {
      console.error("Error saving stats in summary:", saveError);
    }

    // 返回结算信息
    return res.json({
      message: wasExploring ? "探索完成" : "没有进行中的探索",
      gainedExp: totalExp, // 添加这一行，与前端对应
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
    res.status(500).json({ error: "内部错误", message: err.message });
  }
};

// 在 controllers/dungeonController.js 中修改
export const interactWithShopEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { action, itemId } = req.body;

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "Not currently in an exploration" });
    }

    // 处理购买行为
    if (action === "buy" && itemId) {
      // 查找商品
      const shopItem = await ShopInventory.findById(itemId);
      if (!shopItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      // 检查金币
      if ((stats.gold || 0) < shopItem.price) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      // 执行购买
      stats.gold -= shopItem.price;

      // 添加物品到用户背包
      // stats.inventory = stats.inventory || [];
      // stats.inventory.push({
      //   item: shopItem._id,
      //   quantity: 1
      // });

      await stats.save();

      return res.json({
        success: true,
        message: `You bought ${shopItem.name} for ${shopItem.price} gold!`,
        gold: stats.gold,
      });
    } else if (action === "leave") {
      // 我们不再需要检查inShop状态，因为schema中没有这个字段
      // 直接返回成功，允许继续探索
      return res.json({
        success: true,
        message: "You left the shop.",
        canContinue: true,
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

    // 记录是否来自商店
    const wasInShop = stats.currentExploration.status?.inShop === true;
    console.log("Was in shop:", wasInShop);

    // 重置事件状态
    if (stats.currentExploration.status) {
      stats.currentExploration.status.inShop = false;
      stats.currentExploration.status.inCombat = false;
    }

    await stats.save();

    // 如果是从商店离开，跳过事件处理直接准备战斗
    if (wasInShop) {
      // 这里可以添加从当前楼层直接获取怪物的逻辑
      return await prepareCombatAfterShop(req, res);
    }

    // 正常继续到下一层
    return await exploreCurrentFloor(req, res);
  } catch (err) {
    console.error("continueExploration error:", err);
    return res.status(500).json({ error: "Failed to continue exploration" });
  }
};

// 添加一个新函数专门处理商店后战斗
// 添加一个新函数专门处理商店后战斗
export const prepareCombatAfterShop = async (req, res) => {
  try {
    const userId = req.user._id;

    // 获取用户统计 - 确保获取完整数据
    const stats = await UserDungeonStats.findOne({ user: userId }).populate(
      "Skills"
    );

    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "No active exploration" });
    }
    
    // 确认职业信息
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

    // 查找迷宫和楼层
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

    // 直接进入战斗处理 - 跳过事件处理
    const monsterIds = [];
    const monsterInfos = [];

    // 收集怪物信息 - 修改为返回完整的怪物对象
    if (Array.isArray(floor.monsters)) {
      for (const monsterInfo of floor.monsters) {
        if (monsterInfo?.monster?._id) {
          const count = monsterInfo.count || 1;
          for (let i = 0; i < count; i++) {
            monsterIds.push(monsterInfo.monster._id);
            // 推送完整的怪物对象，包含所有字段
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
              // 保留原有的前端需要的字段
              id: monsterInfo.monster._id,
              portrait: monsterInfo.monster.portrait
            });
          }
        }
      }
    }

    // 添加BOSS (如果存在) - 同样返回完整对象
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
        // 保留原有的前端需要的字段
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

    // 如果没有怪物，继续正常探索
    if (monsterIds.length === 0) {
      console.log("No monsters after shop, continuing exploration");
      return await exploreCurrentFloor(req, res);
    }

    // 设置标志，指示这是商店后战斗
    if (!stats.currentExploration.shopCombat) {
      stats.currentExploration.shopCombat = {
        floorIndex,
        monsterCount: monsterIds.length,
        timestamp: new Date(),
      };
      await stats.save();
    }

    logs.push(`🔍 商店后继续探索第 ${floorIndex} 层...`);
    if (monsterIds.length > 0) {
      logs.push(`⚔️ 遭遇了 ${monsterIds.length} 个怪物!`);
    }
    
    // 返回怪物信息，前端将处理战斗
    return res.json({
      logs,
      monsters: monsterInfos, // 现在包含完整的怪物数据
      result: "continue",
      currentFloor: floorIndex, // 当前楼层
      nextFloor: stats.currentExploration.floorIndex,
      currentHp: hp,
      playerClass: stats.classSlug || "warrior", // 添加职业信息给前端
      totalExp: stats.dungeonExp, // 添加当前总经验
      shopTransition: true  // 标记这是从商店过来的，前端可以据此特殊处理
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

    // 获取用户统计
    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats || !stats.currentExploration) {
      return res.status(400).json({ error: "No active exploration" });
    }
    
    // 记录职业信息
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

    // 更新HP
    stats.currentExploration.currentHp = remainingHp;

    // 如果战斗成功，增加楼层
    if (survived) {
      // 获取当前探索的迷宫
      const dungeon = await Dungeon.findOne({ slug: dungeonSlug });

      // 增加楼层
      floorIndex = parseInt(floorIndex, 10);
      stats.currentExploration.floorIndex = floorIndex + 1;

      // 处理经验值等其他逻辑...
      const expGained = 10 + floorIndex * 2; // 简化的经验计算
      stats.dungeonExp = (stats.dungeonExp || 0) + expGained;

      console.log(
        `Combat result update - Floor after: ${stats.currentExploration.floorIndex}`
      );

      // 检查是否达到迷宫终点
      const isEnd =
        dungeon &&
        stats.currentExploration.floorIndex > (dungeon.maxFloor || 1);
      if (isEnd) {
        // 结束迷宫探索逻辑...
        stats.currentExploration = undefined;

        // 保存并返回结算信息
        await stats.save();
        return res.json({
          result: "completed",
          message: "Dungeon completed!",
          experienceGained: expGained,
        });
      }
    } else {
      // 战斗失败逻辑
      stats.currentExploration = undefined; // 清除探索状态

      await stats.save();
      return res.json({
        result: "defeat",
        message: "You were defeated.",
      });
    }

    // 保存更新的状态
    await stats.save();

    // 修改 updateCombatResult 函数中的返回值

    return res.json({
      result: "continue",
      currentFloor: floorIndex,
      nextFloor: stats.currentExploration.floorIndex,
      currentHp: remainingHp,
      experienceGained: expGained || 0,
      playerClass: stats.classSlug || "warrior", // 添加职业信息
      totalExp: stats.dungeonExp,
      currentLevel: stats.dungeonLevel,
      unspentStatPoints: stats.unspentStatPoints, // 添加这个值
      logs: [`🚪 你进入了第 ${stats.currentExploration.floorIndex} 层`], // 添加进入新层的日志
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

    // 获取用户状态
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
    
    // 记录职业信息
    console.log("Player class info for after combat update:", {
      classSlug: stats.classSlug || 'not set',
      className: stats.className || 'not set'
    });

    // 获取当前楼层 - 确保是数字
    let floorIndex = stats.currentExploration.floorIndex;
    if (typeof floorIndex === 'string') {
      floorIndex = parseInt(floorIndex, 10);
    }
    if (isNaN(floorIndex) || floorIndex < 1) {
      console.error('Invalid floorIndex, defaulting to 1:', floorIndex);
      floorIndex = 1;
    }
    console.log("Current floor (validated):", floorIndex);

    // 更新HP
    stats.currentExploration.currentHp = remainingHp;

    // 是否来自商店战斗
    const isShopCombat = stats.currentExploration.shopCombat && 
                         stats.currentExploration.shopCombat.floorIndex === floorIndex;
    console.log('Is shop combat:', isShopCombat);

    // 如果战斗胜利，处理层数增加
    if (result === "victory") {
      const newFloorIndex = floorIndex + 1;
      console.log('Advancing from floor', floorIndex, 'to', newFloorIndex);
      
      // 确保新楼层索引是有效数字
      if (isNaN(newFloorIndex)) {
        console.error('Invalid new floor index:', newFloorIndex);
        return res.status(500).json({ 
          error: "Invalid floor calculation",
          message: `Cannot advance from floor ${floorIndex}`
        });
      }
      
      stats.currentExploration.floorIndex = newFloorIndex;
      console.log('Advanced to floor:', stats.currentExploration.floorIndex);
      
      // 处理经验获取
      let expGained = 10 + (floorIndex * 2); // 基础经验
      
      // 如果是商店后战斗，可能有更多怪物，调整经验
      if (isShopCombat && stats.currentExploration.shopCombat.monsterCount) {
        expGained += stats.currentExploration.shopCombat.monsterCount * 3;
        // 清除商店战斗标志
        stats.currentExploration.shopCombat = undefined;
      }

      // 累加经验值
      const oldExp = stats.dungeonExp || 0;
      stats.dungeonExp = oldExp + expGained;
      console.log(`Gained ${expGained} exp. Old: ${oldExp}, New: ${stats.dungeonExp}`);

      // ❗ 这里修复 exploredFloors 处理 ❗
      // 确保exploredFloors是数组，并包含当前楼层
      if (!Array.isArray(stats.exploredFloors)) {
        console.log('Converting exploredFloors to array');
        stats.exploredFloors = [];
      }
      
      // 确保当前楼层在数组中
      if (!stats.exploredFloors.includes(floorIndex)) {
        console.log('Adding floor', floorIndex, 'to exploredFloors');
        stats.exploredFloors.push(floorIndex);
      }
      
      console.log('Updated exploredFloors:', stats.exploredFloors);
      
      // 检查等级提升
      const prevLevel = stats.dungeonLevel || 1;
      const newLevel = Math.floor(1 + stats.dungeonExp / 100);
      const levelDiff = Math.max(0, newLevel - prevLevel);

      if (levelDiff > 0) {
        console.log(`Level up! ${prevLevel} -> ${newLevel}`);
        stats.dungeonLevel = newLevel;
        stats.unspentStatPoints =
          (stats.unspentStatPoints || 0) + levelDiff * 5;
      }
      
      // 保存前验证
      console.log('Final data before save:', {
        floorIndex: stats.currentExploration.floorIndex,
        floorIndexType: typeof stats.currentExploration.floorIndex,
        exploredFloors: stats.exploredFloors,
        exploredFloorsType: typeof stats.exploredFloors,
        isArray: Array.isArray(stats.exploredFloors)
      });
      
      // 保存更新后的状态
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

      // 返回更新信息
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
        logs: [`🚪 你进入了第 ${newFloorIndex} 层`]
      });
    }

    // 如果不是胜利，只保存HP更新
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
// 在路由文件中添加
