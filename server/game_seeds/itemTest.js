// 📦 Task Master Seeder Script: Initialize Items, Shop, User, Inventory
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
]);

const shopItemNames = [
  "Iron Sword",
  "Apprentice Staff",
  "Apprentice Robe",
  "Precision Bow",
  "Attack Booster",
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

console.log("✅ All seed data initialized successfully.");
await mongoose.disconnect();

// {
//   name: "Codex of Clarity",
//   slug: "codex-of-clarity",
//   icon: "codex-of-clarity.png",
//   description: "Reveals the true nature of the Whisper. Cancels its defensive veil.",
//   type: "consumable",
//   trigger: "onBossEncounter",
//   useEffect: {
//     target: "boss",
//     removeStatus: ["invincible", "resistBuff"]
//   },
//   requiredMaterials: ["echo-fragment", "old-ink", "doubt-crystal"], // 可作为另一个种子数据扩展
//   price: 500
// }