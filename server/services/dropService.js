// services/dropService.js
import { ShopItem } from '../models/ShopItem.js';
import Card from '../models/Card.js';
import User from '../models/User.js';
import { UserInventory } from '../models/Inventory.js';
import mongoose from 'mongoose';

// 预定义的任务卡片模板
const TASK_CARD_TEMPLATES = {
  // 普通怪物掉落的卡片
  common: [
    {
      title: "战斗奖励卡",
      description: "击败怪物获得的奖励卡片",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.1,
        goldMultiplier: 1.1,
        specialEffect: ""
      }
    },
    {
      title: "怪物掉落卡",
      description: "可用于制作简单任务",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.2,
        goldMultiplier: 1.0,
        specialEffect: "quick_exp"
      }
    }
  ],
  
  // 精英怪物掉落的卡片
  elite: [
    {
      title: "精英战利品卡",
      description: "击败精英怪物获得的高级奖励卡",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.3,
        goldMultiplier: 1.2,
        specialEffect: "combat_skill"
      }
    },
    {
      title: "稀有掉落卡",
      description: "来自强大怪物的珍贵卡片",
      type: "special",
      taskDuration: "general",
      bonus: {
        experienceMultiplier: 1.2,
        goldMultiplier: 1.3,
        specialEffect: "rare_materials"
      }
    }
  ],
  
  // BOSS掉落的卡片
  boss: [
    {
      title: "BOSS战利品卡",
      description: "击败强大BOSS后获得的珍贵奖励卡",
      type: "special",
      taskDuration: "long",
      bonus: {
        experienceMultiplier: 1.5,
        goldMultiplier: 1.5,
        specialEffect: "boss_blessing"
      }
    },
    {
      title: "传说掉落卡",
      description: "BOSS守护的珍贵卡片，可大幅提升任务收益",
      type: "special",
      taskDuration: "general",
      bonus: {
        experienceMultiplier: 1.4,
        goldMultiplier: 1.4,
        specialEffect: "legendary_power"
      }
    }
  ]
};

/**
 * 计算并处理掉落
 * @param {Array} monsters - 被击败的怪物数组
 * @param {Object} player - 玩家信息 {userId, level, classSlug}
 * @returns {Promise<Object>} 掉落结果
 */
export const calculateAndProcessDrops = async (monsters, player) => {
  const dropResults = {
    items: [],
    cards: [],
    gold: 0,
    exp: 0
  };
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    for (const monster of monsters) {
      // 累加基础奖励
      dropResults.gold += monster.goldDrop || 0;
      dropResults.exp += monster.expDrop || 0;
      
      // 确定怪物类型
      const monsterType = monster.type === 'boss' ? 'boss' : 
                         (monster.tags && monster.tags.includes('elite') ? 'elite' : 'common');
      
      // 处理物品掉落
      if (monster.itemDrops && Array.isArray(monster.itemDrops)) {
        for (const itemDrop of monster.itemDrops) {
          if (Math.random() * 100 < (itemDrop.rate || 0)) {
            const success = await addItemToUserInventory(
              player.userId, 
              itemDrop.item, 
              1, 
              session
            );
            
            if (success) {
              // 获取物品信息用于返回结果
              const item = await ShopItem.findById(itemDrop.item).session(session);
              if (item) {
                dropResults.items.push({
                  _id: item._id,
                  name: item.name,
                  itemType: item.itemType,
                  rarity: item.rarity
                });
              }
            }
          }
        }
      }
      
      // 处理任务卡片掉落
      if (monster.taskCardDrops && Array.isArray(monster.taskCardDrops)) {
        for (const cardDrop of monster.taskCardDrops) {
          if (Math.random() * 100 < (cardDrop.rate || 0)) {
            const card = await createTaskCard(player.userId, monsterType, monster.name, session);
            if (card) {
              dropResults.cards.push(card);
            }
          }
        }
      }
      
      // BOSS保证掉落一张卡片
      if (monster.type === 'boss' && dropResults.cards.length === 0) {
        const card = await createTaskCard(player.userId, 'boss', monster.name, session);
        if (card) {
          dropResults.cards.push(card);
        }
      }
    }
    
    // 更新玩家的金币和经验
    if (dropResults.gold > 0 || dropResults.exp > 0) {
      await User.findByIdAndUpdate(
        player.userId,
        {
          $inc: {
            gold: dropResults.gold,
            experience: dropResults.exp
          }
        },
        { session }
      );
    }
    
    await session.commitTransaction();
    return dropResults;
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Drop processing error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * 添加物品到用户背包
 * @param {String} userId - 用户ID
 * @param {String} itemId - 物品ID
 * @param {Number} quantity - 数量
 * @param {mongoose.ClientSession} session - 事务会话
 * @returns {Promise<Boolean>} 是否成功
 */
const addItemToUserInventory = async (userId, itemId, quantity, session) => {
  try {
    // 检查物品是否存在
    const item = await ShopItem.findById(itemId).session(session);
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return false;
    }
    
    // 更新或创建用户背包条目
    await UserInventory.updateOne(
      { userId, item: itemId },
      { $inc: { quantity } },
      { upsert: true, session }
    );
    
    return true;
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    return false;
  }
};

/**
 * 创建任务卡片
 * @param {String} userId - 用户ID
 * @param {String} monsterType - 怪物类型
 * @param {String} monsterName - 怪物名称
 * @param {mongoose.ClientSession} session - 事务会话
 * @returns {Promise<Object>} 创建的卡片
 */
const createTaskCard = async (userId, monsterType, monsterName, session) => {
  try {
    const templates = TASK_CARD_TEMPLATES[monsterType] || TASK_CARD_TEMPLATES.common;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 构建卡片数据
    const cardData = {
      user: userId,
      type: template.type,
      title: template.title,
      description: `${template.description} (来自${monsterName})`,
      taskDuration: template.taskDuration,
      bonus: {
        experienceMultiplier: template.bonus.experienceMultiplier,
        goldMultiplier: template.bonus.goldMultiplier,
        specialEffect: template.bonus.specialEffect,
      },
      reusable: false,
      issuedAt: new Date()
    };
    
    // 创建卡片
    const [card] = await Card.create([cardData], { session });
    
    // 添加到用户卡片库存（注意：是 cardInventory 而不是 inventory）
    await User.findByIdAndUpdate(
      userId,
      { $push: { cardInventory: card._id } },
      { session }
    );
    
    return {
      _id: card._id,
      title: card.title,
      description: card.description,
      type: card.type,
      taskDuration: card.taskDuration,
      bonus: card.bonus
    };
    
  } catch (error) {
    console.error('Error creating task card:', error);
    return null;
  }
};

export default {
  calculateAndProcessDrops
};