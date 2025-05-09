// controllers/characterController.js
import { CharacterClass } from '../models/CharacterClass.js';
import { UserDungeonStats } from '../models/UserDungeonStats.js';
import { Skill } from '../models/Skill.js';

export const selectClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classSlug } = req.body;
    
    if (!classSlug) {
      return res.status(400).json({ error: 'Class slug is required' });
    }
    
    // 获取选择的职业
    const characterClass = await CharacterClass.findOne({ slug: classSlug })
      .populate('defaultSkills');
    
    if (!characterClass) {
      return res.status(404).json({ error: 'Character class not found' });
    }
    
    // 查找或创建用户统计信息
    let stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) {
      stats = new UserDungeonStats({
        user: userId,
        dungeonSlug: 'echo-labyrinth', // 默认迷宫
        baseTaskLevel: 1,
        dungeonLevel: 1,
        dungeonExp: 0,
        unspentStatPoints: 0,
        exploredFloors: [],
        checkpointFloor: 0
      });
    }
    
    // 应用职业基础属性
    stats.assignedStats = { ...characterClass.baseStats };
    
    // 保存职业名称
    stats.className = characterClass.name;
    
    // 分配职业默认技能
    if (characterClass.defaultSkills && characterClass.defaultSkills.length > 0) {
      stats.Skills = characterClass.defaultSkills.map(skill => skill._id);
    }
    
    await stats.save();
    
    return res.json({
      success: true,
      message: `You have selected the ${characterClass.name} class`,
      class: {
        name: characterClass.name,
        description: characterClass.description,
        baseStats: characterClass.baseStats,
        skills: characterClass.defaultSkills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description
        }))
      }
    });
  } catch (err) {
    console.error('selectClass error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// controllers/characterController.js
export const getAvailableClasses = async (req, res) => {
    try {
      const classes = await CharacterClass.find({}).populate('defaultSkills');
      
      const classData = classes.map(c => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        baseStats: c.baseStats,
        skills: c.defaultSkills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          type: skill.type
        }))
      }));
      
      return res.json({
        classes: classData
      });
    } catch (err) {
      console.error('getAvailableClasses error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };


// controllers/characterController.js
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 获取用户统计信息
    const stats = await UserDungeonStats.findOne({ user: userId })
      .populate('Skills');
    
    console.log('getUserStats found stats:', !!stats);
    
    // 如果没有统计或职业属性不完整
    if (!stats || !stats.assignedStats || !stats.assignedStats.hp) {
      console.log('User needs to select a class');
      return res.status(200).json({ 
        hasClass: false,
        message: 'User needs to select a class'
      });
    }
    
    // 记录详细信息
    console.log('User has class with stats:', {
      hp: stats.assignedStats.hp,
      attack: stats.assignedStats.attack,
      defense: stats.assignedStats.defense
    });
    
    // 获取用户的技能信息
    const skills = stats.Skills && stats.Skills.length > 0 
      ? await Skill.find({ _id: { $in: stats.Skills } })
      : [];
    
    return res.json({
      hasClass: true,
      name: stats.className || 'Unknown Class', // 你可能需要存储职业名称
      level: stats.dungeonLevel,
      exp: stats.dungeonExp,
      unspentPoints: stats.unspentStatPoints,
      baseStats: stats.assignedStats, // 使用 baseStats 而不是 stats
      skills: skills.map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        type: s.type
      }))
    });
  } catch (err) {
    console.error('getUserStats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
  // 在路由中添加
  // routes/characterRoutes.js
