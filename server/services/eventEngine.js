// services/eventEngine.js
import { ShopInventory } from '../models/Inventory.js';

export const resolveEventEffects = async (event, stats, currentHp) => {
  try {
    console.log(`Processing event: ${event.type || 'unknown'} - ${event.name || 'unnamed'}`);
    
    const effect = event.effect || {};
    let resultHp = currentHp;
    
    // 记录基本事件信息
    const log = `[Event] ${event.name}: ${event.description}`;
    
    // 安全地应用统计数据更新
    try {
      // 奖励事件：加金币
      if (effect.gold) {
        const goldAmount = parseInt(effect.gold, 10) || 0;
        if (!isNaN(goldAmount)) {
          stats.gold = (stats.gold || 0) + goldAmount;
          console.log(`Added ${goldAmount} gold, new total: ${stats.gold}`);
        }
      }
      
      // 增加经验值
      if (effect.dungeonExp) {
        const expAmount = parseInt(effect.dungeonExp, 10) || 0;
        if (!isNaN(expAmount)) {
          stats.dungeonExp = (stats.dungeonExp || 0) + expAmount;
          console.log(`Added ${expAmount} experience, new total: ${stats.dungeonExp}`);
        }
      }
      
      // 属性变化
      if (effect.statChange) {
        for (const key in effect.statChange) {
          const changeAmount = parseInt(effect.statChange[key], 10) || 0;
          if (!isNaN(changeAmount) && stats.assignedStats) {
            const currentValue = stats.assignedStats[key] || 0;
            const newValue = currentValue + changeAmount;
            if (!isNaN(newValue)) {
              stats.assignedStats[key] = newValue;
              console.log(`Changed ${key} by ${changeAmount}, new value: ${newValue}`);
            }
          }
        }
      }
      
      // 道具掉落
      if (effect.itemDrop && Array.isArray(effect.itemDrop) && effect.itemDrop.length > 0) {
        // 可扩展：随机掉落实现
        console.log(`Item drop available: ${effect.itemDrop.length} items`);
      }
    } catch (statsError) {
      console.error('Error updating stats:', statsError);
      // 继续处理，不中断事件
    }
    
    // 处理特殊事件类型
    if (effect.shopInventoryId) {
      // 确保status对象存在
      stats.currentExploration.status = stats.currentExploration.status || {};
      // 设置inShop状态为true
      stats.currentExploration.status.inShop = true;
      
      return {
        log: `[Shop] You encountered a mysterious merchant...`,
        hp: resultHp, // 保持当前HP不变
        pause: true,
        eventType: 'shop'
      };
    }
    
    // 根据事件类型应用额外效果
    switch (event.type) {
      case 'heal':
        // 治疗事件 - 恢复一定比例的HP
        const healAmount = Math.floor(currentHp * 0.3); // 恢复30%生命值
        resultHp = Math.min(stats.assignedStats?.hp || 100, currentHp + healAmount); // 确保不超过最大生命值
        return {
          log: `[Heal] You found a healing fountain and recovered ${healAmount} HP!`,
          hp: resultHp
        };
        
      case 'trap':
        // 陷阱事件 - 造成一定伤害
        const damageAmount = Math.floor((stats.assignedStats?.hp || 100) * 0.15); // 造成15%最大生命值的伤害
        resultHp = Math.max(1, currentHp - damageAmount); // 确保不会低于1HP
        return {
          log: `[Trap] You triggered a trap and took ${damageAmount} damage!`,
          hp: resultHp
        };
        
      case 'chest':
        // 宝箱事件 - 获得随机物品
        return {
          log: `[Chest] You found a treasure chest with valuable items!`,
          hp: resultHp
        };
        
      default:
        // 默认返回基本事件信息
        return { log, hp: resultHp };
    }
  } catch (error) {
    console.error('Error in resolveEventEffects:', error);
    return {
      log: `An error occurred while processing the event.`,
      hp: currentHp // 返回原始HP，避免造成不必要的伤害
    };
  }
};