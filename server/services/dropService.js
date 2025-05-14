// services/dropService.js
import { ShopItem } from "../models/ShopItem.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import { UserInventory } from "../models/Inventory.js";
import mongoose from "mongoose";

// Predefined task card templates
const TASK_CARD_TEMPLATES = {
  // Cards dropped by common monsters
  common: [
    {
      title: "Combat Reward Card",
      description: "Reward card obtained from defeating monsters",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.1,
        goldMultiplier: 1.1,
        specialEffect: "",
      },
    },
    {
      title: "Monster Drop Card",
      description: "Can be used to craft simple tasks",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.2,
        goldMultiplier: 1.0,
        specialEffect: "quick_exp",
      },
    },
  ],
  
  // Cards dropped by elite monsters
  elite: [
    {
      title: "Elite Loot Card",
      description: "Premium reward card obtained from defeating elite monsters",
      type: "special",
      taskDuration: "short",
      bonus: {
        experienceMultiplier: 1.3,
        goldMultiplier: 1.2,
        specialEffect: "combat_skill",
      },
    },
    {
      title: "Rare Drop Card",
      description: "Precious card from powerful monsters",
      type: "special",
      taskDuration: "general",
      bonus: {
        experienceMultiplier: 1.2,
        goldMultiplier: 1.3,
        specialEffect: "rare_materials",
      },
    },
  ],
  
  // Cards dropped by bosses
  boss: [
    {
      title: "Boss Loot Card",
      description: "Precious reward card obtained after defeating a powerful boss",
      type: "special",
      taskDuration: "long",
      bonus: {
        experienceMultiplier: 1.5,
        goldMultiplier: 1.5,
        specialEffect: "boss_blessing",
      },
    },
    {
      title: "Legendary Drop Card",
      description: "Precious card guarded by boss, greatly enhances task rewards",
      type: "special",
      taskDuration: "general",
      bonus: {
        experienceMultiplier: 1.4,
        goldMultiplier: 1.4,
        specialEffect: "legendary_power",
      },
    },
  ],
};

/**
 * Calculate and process drops
 * @param {Array} monsters - Array of defeated monsters
 * @param {Object} player - Player info {userId, level, classSlug}
 * @returns {Promise<Object>} Drop results
 */
export const calculateAndProcessDrops = async (monsters, player) => {
  const dropResults = {
    items: [],
    cards: [],
    gold: 0,
    exp: 0,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    for (const monster of monsters) {
      // Accumulate base rewards
      dropResults.gold += monster.goldDrop || 0;
      dropResults.exp += monster.expDrop || 0;
      
      // Determine monster type
      const monsterType = monster.type === 'boss' ? 'boss' : 
                         (monster.tags && monster.tags.includes('elite') ? 'elite' : 'common');
      
      // Process item drops
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
              // Get item info for return results
              const item = await ShopItem.findById(itemDrop.item).session(session);
              if (item) {
                dropResults.items.push({
                  _id: item._id,
                  name: item.name,
                  itemType: item.itemType,
                  rarity: item.rarity,
                });
              }
            }
          }
        }
      }
      
      // Process task card drops
      if (monster.taskCardDrops && Array.isArray(monster.taskCardDrops)) {
        for (const cardDrop of monster.taskCardDrops) {
          if (Math.random() * 100 < (cardDrop.rate || 0)) {
            const card = await createTaskCard(
              player.userId,
              monsterType,
              monster.name,
              session
            );
            if (card) {
              dropResults.cards.push(card);
            }
          }
        }
      }
      
      // Boss guaranteed to drop one card
      if (monster.type === 'boss' && dropResults.cards.length === 0) {
        const card = await createTaskCard(player.userId, 'boss', monster.name, session);
        if (card) {
          dropResults.cards.push(card);
        }
      }
    }
    
    // Update player's gold and experience
    if (dropResults.gold > 0 || dropResults.exp > 0) {
      await User.findByIdAndUpdate(
        player.userId,
        {
          $inc: {
            gold: dropResults.gold,
            experience: dropResults.exp,
          },
        },
        { session }
      );
    }

    await session.commitTransaction();
    return dropResults;
  } catch (error) {
    await session.abortTransaction();
    console.error("Drop processing error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Add item to user inventory
 * @param {String} userId - User ID
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity
 * @param {mongoose.ClientSession} session - Transaction session
 * @returns {Promise<Boolean>} Whether successful
 */
const addItemToUserInventory = async (userId, itemId, quantity, session) => {
  try {
    // Check if item exists
    const item = await ShopItem.findById(itemId).session(session);
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return false;
    }
    
    // Update or create user inventory entry
    await UserInventory.updateOne(
      { userId, item: itemId },
      { $inc: { quantity } },
      { upsert: true, session }
    );

    return true;
  } catch (error) {
    console.error("Error adding item to inventory:", error);
    return false;
  }
};

/**
 * Create task card
 * @param {String} userId - User ID
 * @param {String} monsterType - Monster type
 * @param {String} monsterName - Monster name
 * @param {mongoose.ClientSession} session - Transaction session
 * @returns {Promise<Object>} Created card
 */
const createTaskCard = async (userId, monsterType, monsterName, session) => {
  try {
    const templates =
      TASK_CARD_TEMPLATES[monsterType] || TASK_CARD_TEMPLATES.common;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Build card data
    const cardData = {
      user: userId,
      type: template.type,
      title: template.title,
      description: `${template.description} (from ${monsterName})`,
      taskDuration: template.taskDuration,
      bonus: {
        experienceMultiplier: template.bonus.experienceMultiplier,
        goldMultiplier: template.bonus.goldMultiplier,
        specialEffect: template.bonus.specialEffect,
      },
      reusable: false,
      issuedAt: new Date(),
    };
    
    // Create card
    const [card] = await Card.create([cardData], { session });
    
    // Add to user card inventory (Note: it's cardInventory not inventory)
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
      bonus: card.bonus,
    };
  } catch (error) {
    console.error("Error creating task card:", error);
    return null;
  }
};

export default {
  calculateAndProcessDrops,
};
