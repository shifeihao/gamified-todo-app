// controllers/characterController.js
import { CharacterClass } from "../models/CharacterClass.js";
import { UserDungeonStats } from "../models/UserDungeonStats.js";
import { Skill } from "../models/Skill.js";

export const selectClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classSlug } = req.body;

    if (!classSlug) {
      return res.status(400).json({ error: "Class slug is required" });
    }

    // 获取选择的职业
    const characterClass = await CharacterClass.findOne({
      slug: classSlug,
    }).populate("defaultSkills");

    if (!characterClass) {
      return res.status(404).json({ error: "Character class not found" });
    }

    // 查找或创建用户统计信息
    let stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      stats = new UserDungeonStats({
        user: userId,
        dungeonSlug: "echo-labyrinth", // 默认迷宫
        baseTaskLevel: 1,
        dungeonLevel: 1,
        dungeonExp: 0,
        unspentStatPoints: 0,
        exploredFloors: [],
        checkpointFloor: 0,
      });
    }

    // 应用职业基础属性
    stats.assignedStats = { ...characterClass.baseStats };

    // 保存职业名称和slug - 关键修改点
    stats.className = characterClass.name;
    stats.classSlug = classSlug; // 添加职业slug保存

    // 分配职业默认技能
    if (
      characterClass.defaultSkills &&
      characterClass.defaultSkills.length > 0
    ) {
      stats.Skills = characterClass.defaultSkills.map((skill) => skill._id);
    }

    // 添加调试日志
    console.log("正在保存职业选择:", {
      userId,
      className: stats.className,
      classSlug: stats.classSlug,
    });

    await stats.save();

    // 确认保存后的数据
    const savedStats = await UserDungeonStats.findOne({ user: userId });
    console.log("已保存的职业信息:", {
      className: savedStats.className,
      classSlug: savedStats.classSlug,
    });

    return res.json({
      success: true,
      message: `You have selected the ${characterClass.name} class`,
      class: {
        name: characterClass.name,
        slug: classSlug, // 添加slug到返回值
        description: characterClass.description,
        baseStats: characterClass.baseStats,
        skills: characterClass.defaultSkills.map((skill) => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
        })),
      },
    });
  } catch (err) {
    console.error("selectClass error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// controllers/characterController.js
export const getAvailableClasses = async (req, res) => {
  try {
    const classes = await CharacterClass.find({}).populate("defaultSkills");

    const classData = classes.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      baseStats: c.baseStats,
      skills: c.defaultSkills.map((skill) => ({
        id: skill._id,
        name: skill.name,
        description: skill.description,
        type: skill.type,
      })),
    }));

    return res.json({
      classes: classData,
    });
  } catch (err) {
    console.error("getAvailableClasses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// controllers/characterController.js
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 获取用户统计信息
    const stats = await UserDungeonStats.findOne({ user: userId }).populate(
      "Skills"
    );

    console.log("getUserStats found stats:", !!stats);

    // 如果没有统计或职业属性不完整
    if (!stats || !stats.assignedStats || !stats.assignedStats.hp) {
      console.log("User needs to select a class");
      return res.status(200).json({
        hasClass: false,
        message: "User needs to select a class",
      });
    }

    // 记录详细信息
    console.log("User has class with stats:", {
      hp: stats.assignedStats.hp,
      attack: stats.assignedStats.attack,
      defense: stats.assignedStats.defense,
    });

    // 获取用户的技能信息
    const skills =
      stats.Skills && stats.Skills.length > 0
        ? await Skill.find({ _id: { $in: stats.Skills } })
        : [];

    return res.json({
      hasClass: true,
      name: stats.className || "Unknown Class", // 你可能需要存储职业名称
      level: stats.dungeonLevel,
      exp: stats.dungeonExp,
      unspentPoints: stats.unspentStatPoints,
      baseStats: stats.assignedStats, // 使用 baseStats 而不是 stats
      skills: skills.map((s) => ({
        id: s._id,
        name: s.name,
        description: s.description,
        type: s.type,
      })),
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const STAT_MULTIPLIERS = {
  hp: 15, // 1点 = 15点HP
  attack: 1, // 1点 = 1点攻击
  defense: 1, // 1点 = 1点防御
  magicPower: 1, // 1点 = 1点魔法
  speed: 0.5, // 1点 = 0.5点速度
  critRate: 0.2, // 1点 = 0.2%暴击率
  evasion: 0.2, // 1点 = 0.2%闪避率
};

// 分配属性点
export const allocateStatPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const { allocation } = req.body;

    // 验证输入
    if (!allocation || typeof allocation !== "object") {
      return res.status(400).json({ error: "无效的属性分配" });
    }

    // 获取用户统计信息
    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      return res.status(404).json({ error: "未找到用户数据" });
    }

    // 验证用户有足够的未分配点数
    const totalAllocated = Object.values(allocation).reduce(
      (sum, value) => sum + value,
      0
    );
    if (totalAllocated <= 0) {
      return res.status(400).json({ error: "没有分配任何属性点" });
    }

    if (totalAllocated > stats.unspentStatPoints) {
      return res.status(400).json({ error: "未分配属性点不足" });
    }

    // 确保assignedStats存在
    if (!stats.assignedStats) {
      stats.assignedStats = {};
    }

    // 应用属性点分配
    Object.entries(allocation).forEach(([stat, points]) => {
      if (points > 0 && STAT_MULTIPLIERS[stat] !== undefined) {
        // 初始化属性如果不存在
        stats.assignedStats[stat] = stats.assignedStats[stat] || 0;

        // 根据乘数应用属性点
        stats.assignedStats[stat] += points * STAT_MULTIPLIERS[stat];
      }
    });

    // 减少未分配点数
    stats.unspentStatPoints -= totalAllocated;

    // 保存更改
    await stats.save();

    // 返回更新后的统计数据
    return res.json({
      success: true,
      message: "属性点分配成功",
      assignedStats: stats.assignedStats,
      unspentPoints: stats.unspentStatPoints,
    });
  } catch (err) {
    console.error("allocateStatPoints error:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
};

// 获取当前属性点分配情况
export const getStatAllocation = async (req, res) => {
  try {
    const userId = req.user._id;

    // 获取用户统计信息
    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      return res.status(404).json({ error: "未找到用户数据" });
    }

    return res.json({
      assignedStats: stats.assignedStats || {},
      unspentPoints: stats.unspentStatPoints || 0,
      statMultipliers: STAT_MULTIPLIERS, // 返回乘数，前端可以显示加点效果
    });
  } catch (err) {
    console.error("getStatAllocation error:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
};
// 在路由中添加
// routes/characterRoutes.js
