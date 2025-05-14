// services/eventEngine.js
import { ShopInventory } from '../models/Inventory.js';

export const resolveEventEffects = async (event, stats, currentHp) => {
  try {
    console.log(`Processing event: ${event.type || 'unknown'} - ${event.name || 'unnamed'}`);
    
    const effect = event.effect || {};
    let resultHp = currentHp;
    
    // Record basic event information
    const log = `[Event] ${event.name}: ${event.description}`;
    
    // Safely apply stats updates
    try {
      // Reward event: add gold
      if (effect.gold) {
        const goldAmount = parseInt(effect.gold, 10) || 0;
        if (!isNaN(goldAmount)) {
          stats.gold = (stats.gold || 0) + goldAmount;
          console.log(`Added ${goldAmount} gold, new total: ${stats.gold}`);
        }
      }
      
      // Add experience
      if (effect.dungeonExp) {
        const expAmount = parseInt(effect.dungeonExp, 10) || 0;
        if (!isNaN(expAmount)) {
          stats.dungeonExp = (stats.dungeonExp || 0) + expAmount;
          console.log(`Added ${expAmount} experience, new total: ${stats.dungeonExp}`);
        }
      }
      
      // Stat changes
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
      
      // Item drops
      if (effect.itemDrop && Array.isArray(effect.itemDrop) && effect.itemDrop.length > 0) {
        // Expandable: random drop implementation
        console.log(`Item drop available: ${effect.itemDrop.length} items`);
      }
    } catch (statsError) {
      console.error('Error updating stats:', statsError);
      // Continue processing, don't interrupt event
    }
    
    // Handle special event types
    if (effect.shopInventoryId) {
      // Ensure status object exists
      stats.currentExploration.status = stats.currentExploration.status || {};
      // Set inShop status to true
      stats.currentExploration.status.inShop = true;
      
      return {
        log: `[Shop] You encountered a mysterious merchant...`,
        hp: resultHp, // Keep current HP unchanged
        pause: true,
        eventType: 'shop'
      };
    }
    
    // Apply additional effects based on event type
    switch (event.type) {
      case 'heal':
        // Healing event - restore a percentage of HP
        const healAmount = Math.floor(currentHp * 0.3); // Restore 30% HP
        resultHp = Math.min(stats.assignedStats?.hp || 100, currentHp + healAmount); // Ensure doesn't exceed max HP
        return {
          log: `[Heal] You found a healing fountain and recovered ${healAmount} HP!`,
          hp: resultHp
        };
        
      case 'trap':
        // Trap event - deal damage
        const damageAmount = Math.floor((stats.assignedStats?.hp || 100) * 0.15); // Deal 15% of max HP damage
        resultHp = Math.max(1, currentHp - damageAmount); // Ensure doesn't go below 1 HP
        return {
          log: `[Trap] You triggered a trap and took ${damageAmount} damage!`,
          hp: resultHp
        };
        
      case 'chest':
        // Treasure chest event - get random items
        return {
          log: `[Chest] You found a treasure chest with valuable items!`,
          hp: resultHp
        };
        
      default:
        // Default return basic event information
        return { log, hp: resultHp };
    }
  } catch (error) {
    console.error('Error in resolveEventEffects:', error);
    return {
      log: `An error occurred while processing the event.`,
      hp: currentHp // Return original HP to avoid unnecessary damage
    };
  }
};