// 📦 Task Master Seeder Script: Initialize ALL Items, Shop, User, Inventory
import mongoose from "mongoose";
import { generateTestUser } from "./generateTestUser.js";

import {
  ShopItem,
  WeaponItem,
  ArmorItem,
  ConsumableItem,
} from "../models/ShopItem.js";

import {
  ShopInventory,
  UserInventory,
  UserEquipment,
} from "../models/Inventory.js";

import User from "../models/User.js";

// 连接到 MongoDB 数据库
await mongoose.connect(
  `mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

await generateTestUser();
const user = await User.findOne({ username: "testuser" });
const userId = user._id;

await Promise.all([
  ShopItem.deleteMany({}),
  ShopInventory.deleteMany({}),
  UserInventory.deleteMany({}),
  UserEquipment.deleteMany({}),
]);

const items = await ShopItem.insertMany([
  // 基础物品（原有的）
  new WeaponItem({
    name: "Iron Sword",
    type: "weapon",
    price: 120,
    icon: "sword",
    description: "A basic iron sword for novice warriors.",
    weaponType: "sword",
    stats: { attack: 12 },
    slot: "mainHand",
    allowedClasses: ["warrior"],
  }),
  new WeaponItem({
    name: "Apprentice Staff",
    type: "weapon",
    price: 140,
    icon: "staff",
    description: "A simple magic staff for beginners.",
    weaponType: "staff",
    stats: { magicPower: 15 },
    slot: "mainHand",
    allowedClasses: ["mage"],
  }),
  new WeaponItem({
    name: "Precision Bow",
    type: "weapon",
    price: 135,
    icon: "bow",
    description: "A lightweight bow that improves accuracy and critical hits.",
    weaponType: "bow",
    stats: { attack: 9 },
    slot: "mainHand",
    allowedClasses: ["archer"],
  }),
  new ArmorItem({
    name: "Apprentice Robe",
    type: "armor",
    price: 100,
    icon: "armor",
    description: "A robe designed for beginner mages.",
    armorType: "cloth",
    stats: { magicResist: 5 },
    slot: "chest",
    allowedClasses: ["mage"],
  }),
  new ConsumableItem({
    name: "Attack Booster",
    type: "consumable",
    price: 65,
    icon: "drug",
    description: "Boosts attack by 10% during exploration.",
    effect: "buff-attack",
    potency: 0.1,
    trigger: "onBattleStart",
  }),

  // Warrior 装备
  new WeaponItem({
    name: "Steelbreaker Sword",
    type: "weapon",
    price: 200,
    icon: "Steelbreaker_Sword.png",
    description: "A heavy sword that can pierce through thick armor.",
    weaponType: "sword",
    slot: "mainHand",
    stats: {
      attack: 15,
      magicPower: 0,
      critRate: 0,
      accuracy: 10
    },
    requiredLevel: 1,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Iron Visor",
    type: "armor",
    price: 120,
    icon: "Iron_Visor.png",
    description: "An iron helmet that offers head protection and focus.",
    armorType: "plate",
    slot: "head",
    stats: {
      defense: 5,
      magicResist: 0,
      evasion: 0
    },
    requiredLevel: 1,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Bulwark Shield",
    type: "armor",
    price: 180,
    icon: "Bulwark_Shield.png",
    description: "A sturdy shield that can reflect a small portion of damage.",
    armorType: "shield",
    slot: "offHand",
    stats: {
      defense: 8,
      magicResist: 4,
      evasion: 0
    },
    requiredLevel: 2,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Spiked Gauntlets",
    type: "armor",
    price: 130,
    icon: "Spiked_Gauntlets.png",
    description: "Gauntlets with sharp studs, increasing offensive power.",
    armorType: "plate",
    slot: "hands",
    stats: {
      defense: 2,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 2,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Tempered Chestplate",
    type: "armor",
    price: 220,
    icon: "Tempered_Chestplate.png",
    description: "A well-forged chestplate that offers balanced protection.",
    armorType: "plate",
    slot: "chest",
    stats: {
      defense: 12,
      magicResist: 2,
      evasion: 0
    },
    requiredLevel: 3,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Plated Greaves",
    type: "armor",
    price: 150,
    icon: "Plated_Greaves.png",
    description: "Heavy leg armor that maintains mobility.",
    armorType: "plate",
    slot: "legs",
    stats: {
      defense: 7,
      magicResist: 1,
      evasion: 1
    },
    requiredLevel: 3,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Warboots",
    type: "armor",
    price: 140,
    icon: "Warboots.png",
    description: "Sturdy boots with reinforced soles.",
    armorType: "plate",
    slot: "feet",
    stats: {
      defense: 4,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 4,
    allowedClasses: ["warrior"]
  }),
  new ArmorItem({
    name: "Amulet of Resolve",
    type: "armor",
    price: 160,
    icon: "Amulet_of_Resolve.png",
    description: "A protective charm that strengthens one's will.",
    armorType: "plate",
    slot: "accessory",
    stats: {
      defense: 2,
      magicResist: 5,
      evasion: 0
    },
    requiredLevel: 5,
    allowedClasses: ["warrior"]
  }),

  // Mage 装备
  new WeaponItem({
    name: "Arcane Staff",
    type: "weapon",
    price: 220,
    icon: "Arcane_Staff.png",
    description: "A staff infused with arcane energy.",
    weaponType: "staff",
    slot: "mainHand",
    stats: {
      attack: 0,
      magicPower: 18,
      critRate: 0,
      accuracy: 6
    },
    requiredLevel: 1,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Mystic Hat",
    type: "armor",
    price: 110,
    icon: "Mystic_Hat.png",
    description: "A hat favored by apprentice mages.",
    armorType: "cloth",
    slot: "head",
    stats: {
      defense: 0,
      magicResist: 3,
      evasion: 0
    },
    requiredLevel: 1,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Enchanter Gloves",
    type: "armor",
    price: 130,
    icon: "Enchanter_Gloves.png",
    description: "Light gloves that boost spellcasting.",
    armorType: "cloth",
    slot: "hands",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 2,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Focus Crystal",
    type: "armor",
    price: 150,
    icon: "Focus_Crystal.png",
    description: "A magical orb that enhances control.",
    armorType: "cloth",
    slot: "offHand",
    stats: {
      defense: 0,
      magicResist: 3,
      evasion: 0
    },
    requiredLevel: 2,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Robe of Focus",
    type: "armor",
    price: 200,
    icon: "Robe_of_Focus.png",
    description: "A flowing robe that resists magic.",
    armorType: "cloth",
    slot: "chest",
    stats: {
      defense: 0,
      magicResist: 6,
      evasion: 2
    },
    requiredLevel: 3,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Silk Trousers",
    type: "armor",
    price: 140,
    icon: "Silk_Trousers.png",
    description: "Soft leggings that allow quick movement.",
    armorType: "cloth",
    slot: "legs",
    stats: {
      defense: 0,
      magicResist: 2,
      evasion: 1
    },
    requiredLevel: 3,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Light Boots",
    type: "armor",
    price: 130,
    icon: "Light_Boots.png",
    description: "Boots that increase your mobility.",
    armorType: "cloth",
    slot: "feet",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 4,
    allowedClasses: ["mage"]
  }),
  new ArmorItem({
    name: "Amulet of Clarity",
    type: "armor",
    price: 180,
    icon: "Amulet_of_Clarity.png",
    description: "A charm that focuses the mind.",
    armorType: "cloth",
    slot: "accessory",
    stats: {
      defense: 0,
      magicResist: 2,
      evasion: 0
    },
    requiredLevel: 5,
    allowedClasses: ["mage"]
  }),

  // Rogue 装备
  new WeaponItem({
    name: "Twinfang Daggers",
    type: "weapon",
    price: 210,
    icon: "Twinfang_Daggers.png",
    description: "Twin blades designed for quick, deadly strikes.",
    weaponType: "dagger",
    slot: "mainHand",
    stats: {
      attack: 13,
      magicPower: 0,
      critRate: 6,
      accuracy: 4
    },
    requiredLevel: 1,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Mask of Trickery",
    type: "armor",
    price: 100,
    icon: "Mask_of_Trickery.png",
    description: "A mysterious mask worn by elusive rogues.",
    armorType: "leather",
    slot: "head",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 1,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Agile Bracers",
    type: "armor",
    price: 130,
    icon: "Agile_Bracers.png",
    description: "Bracers that improve movement and attack speed.",
    armorType: "leather",
    slot: "hands",
    stats: {
      defense: 1,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 2,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Thief's Buckler",
    type: "armor",
    price: 140,
    icon: "Thief's_Buckler.png",
    description: "A small shield used for parrying.",
    armorType: "leather",
    slot: "offHand",
    stats: {
      defense: 3,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 2,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Shadow Vest",
    type: "armor",
    price: 190,
    icon: "Shadow_Vest.png",
    description: "A dark vest that enhances stealth and flexibility.",
    armorType: "leather",
    slot: "chest",
    stats: {
      defense: 2,
      magicResist: 0,
      evasion: 4
    },
    requiredLevel: 3,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Quickstep Pants",
    type: "armor",
    price: 150,
    icon: "Quickstep_Pants.png",
    description: "Pants tailored for fast footwork.",
    armorType: "leather",
    slot: "legs",
    stats: {
      defense: 1,
      magicResist: 0,
      evasion: 3
    },
    requiredLevel: 3,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Silent Treads",
    type: "armor",
    price: 140,
    icon: "Silent_Treads.png",
    description: "Boots that silence every footstep.",
    armorType: "leather",
    slot: "feet",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 3
    },
    requiredLevel: 4,
    allowedClasses: ["rogue"]
  }),
  new ArmorItem({
    name: "Mark of Assassins",
    type: "armor",
    price: 170,
    icon: "Mark_of_Assassins.png",
    description: "A sigil awarded to elite killers.",
    armorType: "leather",
    slot: "accessory",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 5,
    allowedClasses: ["rogue"]
  }),

  // Archer 装备
  new WeaponItem({
    name: "Longshot Bow",
    type: "weapon",
    price: 210,
    icon: "Longshot_Bow.png",
    description: "A powerful bow designed for high precision.",
    weaponType: "bow",
    slot: "mainHand",
    stats: {
      attack: 14,
      magicPower: 0,
      critRate: 0,
      accuracy: 12
    },
    requiredLevel: 1,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Scout Cap",
    type: "armor",
    price: 100,
    icon: "Scout_Cap.png",
    description: "A lightweight cap worn by field scouts.",
    armorType: "leather",
    slot: "head",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 1,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Marksman Gloves",
    type: "armor",
    price: 130,
    icon: "Marksman_Gloves.png",
    description: "Gloves that improve bow handling.",
    armorType: "leather",
    slot: "hands",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 1
    },
    requiredLevel: 2,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Arrow Pouch",
    type: "armor",
    price: 140,
    icon: "Arrow_Pouch.png",
    description: "A secondary offhand for carrying arrows.",
    armorType: "leather",
    slot: "offHand",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 2,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Ranger's Jacket",
    type: "armor",
    price: 200,
    icon: "Ranger's_Jacket.png",
    description: "A finely crafted coat for wilderness survival.",
    armorType: "leather",
    slot: "chest",
    stats: {
      defense: 3,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 3,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Tracker Leggings",
    type: "armor",
    price: 150,
    icon: "Tracker_Leggings.png",
    description: "Designed to move silently across any terrain.",
    armorType: "leather",
    slot: "legs",
    stats: {
      defense: 1,
      magicResist: 0,
      evasion: 3
    },
    requiredLevel: 3,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Windstep Boots",
    type: "armor",
    price: 140,
    icon: "Windstep_Boots.png",
    description: "Boots that let you move like the wind.",
    armorType: "leather",
    slot: "feet",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 2
    },
    requiredLevel: 4,
    allowedClasses: ["archer"]
  }),
  new ArmorItem({
    name: "Eagle Eye Pendant",
    type: "armor",
    price: 170,
    icon: "Eagle_Eye_Pendant.png",
    description: "Enhances perception and precision.",
    armorType: "leather",
    slot: "accessory",
    stats: {
      defense: 0,
      magicResist: 0,
      evasion: 0
    },
    requiredLevel: 5,
    allowedClasses: ["archer"]
  }),
]);

// 更新商店库存设置，为每个职业添加1-2件装备
const shopItemNames = [
  // 基础物品（原有的）
  "Iron Sword",
  "Apprentice Staff",
  "Apprentice Robe",
  "Precision Bow",
  "Attack Booster",
  
  // Warrior 装备（2件）
  "Steelbreaker Sword",    // 武器，价格200
  "Tempered Chestplate",   // 护甲，价格220
  
  // Mage 装备（2件）
  "Arcane Staff",          // 武器，价格220
  "Robe of Focus",         // 护甲，价格200
  
  // Rogue 装备（2件）
  "Twinfang Daggers",      // 武器，价格210
  "Shadow Vest",           // 护甲，价格190
  
  // Archer 装备（2件）
  "Longshot Bow",          // 武器，价格210
  "Ranger's Jacket",       // 护甲，价格200
];
const shopItems = items.filter((item) => shopItemNames.includes(item.name));

await ShopInventory.insertMany(
  shopItems.map((item) => ({
    item: item._id,
    quantity: 999,
    price: item.price,
    shopId: "default",
  }))
);

await UserInventory.deleteMany({ userId: userId });
await UserEquipment.create({
  userId: userId,
  slots: {},
  explorationConsumables: [],
});

console.log("✅ All items (basic + equipment) seeded successfully.");
console.log(`Total items created: ${items.length}`);
console.log(`Items added to shop: ${shopItems.length}`);
console.log("Shop inventory includes:");
console.log("- Basic items: Iron Sword, Apprentice Staff, Precision Bow, Apprentice Robe, Attack Booster");
console.log("- Warrior: Steelbreaker Sword (200g), Tempered Chestplate (220g)");
console.log("- Mage: Arcane Staff (220g), Robe of Focus (200g)");
console.log("- Rogue: Twinfang Daggers (210g), Shadow Vest (190g)");
console.log("- Archer: Longshot Bow (210g), Ranger's Jacket (200g)");
await mongoose.disconnect();