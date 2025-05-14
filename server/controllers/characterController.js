// controllers/characterController.js
import { CharacterClass } from "../models/CharacterClass.js";
import { UserDungeonStats } from "../models/UserDungeonStats.js";
import { Skill } from "../models/Skill.js";



export const selectClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classSlug, gender = 'male' } = req.body; 

    if (!classSlug) {
      return res.status(400).json({ error: "Class slug is required" });
    }

    // Get the selected character class
    const characterClass = await CharacterClass.findOne({
      slug: classSlug,
    }).populate("defaultSkills");

    if (!characterClass) {
      return res.status(404).json({ error: "Character class not found" });
    }

    // Find or create user dungeon stats
    let stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      stats = new UserDungeonStats({
        user: userId,
        dungeonSlug: "echo-labyrinth", // Default dungeon
        baseTaskLevel: 1,
        dungeonLevel: 1,
        dungeonExp: 0,
        unspentStatPoints: 0,
        exploredFloors: [],
        checkpointFloor: 0,
      });
    }

    // Apply base stats from class
    stats.assignedStats = { ...characterClass.baseStats };

    // Save class name, slug and gender
    stats.className = characterClass.name;
    stats.classSlug = classSlug;
    stats.gender = gender; 

    // Assign default skills
    if (
      characterClass.defaultSkills &&
      characterClass.defaultSkills.length > 0
    ) {
      stats.Skills = characterClass.defaultSkills.map((skill) => skill._id);
    }

    // Debug log
    console.log("Saving class selection:", {
      userId,
      className: stats.className,
      classSlug: stats.classSlug,
      gender: stats.gender,
    });

    await stats.save();

    // Confirm saved data
    const savedStats = await UserDungeonStats.findOne({ user: userId });
    console.log("Saved class info:", {
      className: savedStats.className,
      classSlug: savedStats.classSlug,
      gender: savedStats.gender,
    });

    return res.json({
      success: true,
      message: `You have selected the ${characterClass.name} class`,
      class: {
        name: characterClass.name,
        slug: classSlug,
        gender: gender, 
        description: characterClass.description,
        baseStats: characterClass.baseStats,
        avatar: characterClass.images?.[gender]?.avatar,
        sprite: characterClass.images?.[gender]?.sprite,
        skills: characterClass.defaultSkills.map((skill) => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          icon: skill.icon,
        })),
      },
    });
  } catch (err) {
    console.error("selectClass error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAvailableClasses = async (req, res) => {
  try {
    const classes = await CharacterClass.find({}).populate("defaultSkills");

    const classData = classes.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      images: c.images, 
      description: c.description,
      baseStats: c.baseStats,
      skills: c.defaultSkills.map((skill) => ({
        id: skill._id,
        name: skill.name,
        description: skill.description,
        icon: skill.icon,
        trigger: skill.trigger,
        effect: skill.effect,
        effectValue: skill.effectValue,
        triggerCondition: skill.triggerCondition,
        cooldown: skill.cooldown,
        priority: skill.priority,
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

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user stats
    const stats = await UserDungeonStats.findOne({ user: userId })
      .populate({
        path: "Skills",
        select:
          "_id name description icon trigger effect effectValue cooldown once priority triggerCondition allowedClasses",
      });

    console.log("getUserStats found stats:", !!stats);

    // If stats are missing or class not selected
    if (!stats || !stats.assignedStats || !stats.assignedStats.hp) {
      console.log("User needs to select a class");
      return res.status(200).json({
        hasClass: false,
        message: "User needs to select a class",
      });
    }

    console.log("User has class with stats:", {
      hp: stats.assignedStats.hp,
      attack: stats.assignedStats.attack,
      defense: stats.assignedStats.defense,
    });

    const skills =
      stats.Skills && stats.Skills.length > 0
        ? await Skill.find({ _id: { $in: stats.Skills } })
        : [];

  
    let classImages = null;
    if (stats.classSlug) {
      const characterClass = await CharacterClass.findOne({ slug: stats.classSlug });
      if (characterClass && characterClass.images) {
        classImages = characterClass.images;
      }
    }

    return res.json({
      hasClass: true,
      name: stats.className || "Unknown Class",
      classSlug: stats.classSlug,
      className: stats.className,
      gender: stats.gender || 'male',
      images: classImages, 
      level: stats.dungeonLevel,
      exp: stats.dungeonExp,
      unspentPoints: stats.unspentStatPoints,
      baseStats: stats.assignedStats,
      skills: skills.map((s) => ({
        id: s._id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        trigger: s.trigger,
        effect: s.effect,
        effectValue: s.effectValue,
        cooldown: s.cooldown,
        once: s.once || false,
        priority: s.priority || 0,
        triggerCondition: s.triggerCondition,
        allowedClasses: s.allowedClasses,
      })),
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const STAT_MULTIPLIERS = {
  hp: 15, // 1 point = 15 HP
  attack: 1, // 1 point = 1 Attack
  defense: 1, // 1 point = 1 Defense
  magicPower: 1, // 1 point = 1 Magic Power
  speed: 0.5, // 1 point = 0.5 Speed
  critRate: 0.2, // 1 point = 0.2% Critical Rate
  evasion: 0.2, // 1 point = 0.2% Evasion Rate
};

// Allocate stat points
export const allocateStatPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const { allocation } = req.body;

    // Validate input
    if (!allocation || typeof allocation !== "object") {
      return res.status(400).json({ error: "Invalid stat allocation" });
    }

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      return res.status(404).json({ error: "User data not found" });
    }

    const totalAllocated = Object.values(allocation).reduce(
      (sum, value) => sum + value,
      0
    );
    if (totalAllocated <= 0) {
      return res.status(400).json({ error: "No stat points allocated" });
    }

    if (totalAllocated > stats.unspentStatPoints) {
      return res.status(400).json({ error: "Not enough unspent stat points" });
    }

    if (!stats.assignedStats) {
      stats.assignedStats = {};
    }

    Object.entries(allocation).forEach(([stat, points]) => {
      if (points > 0 && STAT_MULTIPLIERS[stat] !== undefined) {
        stats.assignedStats[stat] = stats.assignedStats[stat] || 0;
        stats.assignedStats[stat] += points * STAT_MULTIPLIERS[stat];
      }
    });

    stats.unspentStatPoints -= totalAllocated;

    await stats.save();

    return res.json({
      success: true,
      message: "Stat points allocated successfully",
      assignedStats: stats.assignedStats,
      unspentPoints: stats.unspentStatPoints,
    });
  } catch (err) {
    console.error("allocateStatPoints error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get current stat allocation
export const getStatAllocation = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      return res.status(404).json({ error: "User data not found" });
    }

    return res.json({
      assignedStats: stats.assignedStats || {},
      unspentPoints: stats.unspentStatPoints || 0,
      statMultipliers: STAT_MULTIPLIERS, // Return multipliers for front-end display
    });
  } catch (err) {
    console.error("getStatAllocation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


