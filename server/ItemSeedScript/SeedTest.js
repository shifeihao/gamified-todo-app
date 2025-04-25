// 📦 Task Master Seeder Script: Initialize Items, Shop, User, Inventory

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import {
  ShopItem,
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  MaterialItem
} from '../models/ShopItem.js';

import {
  ShopInventory,
  UserInventory,
  UserEquipment
} from '../models/Inventory.js';

import User from '../models/User.js';

await mongoose.connect(`mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);

await Promise.all([
  ShopItem.deleteMany({}),
  ShopInventory.deleteMany({}),
  UserInventory.deleteMany({}),
  UserEquipment.deleteMany({}),
  User.deleteMany({ username: 'testuser' })
]);

const items = await ShopItem.insertMany([
  new WeaponItem({
    name: 'Iron Sword',
    type: 'weapon',
    price: 120,
    icon: 'sword',
    description: 'A basic iron sword for novice warriors.',
    weaponType: 'sword',
    stats: { attack: 12 },
    slot: 'mainHand',
    allowedClasses: ['warrior']
  }),
  new WeaponItem({
    name: 'Apprentice Staff',
    type: 'weapon',
    price: 140,
    icon: 'staff',
    description: 'A simple magic staff for beginners.',
    weaponType: 'staff',
    stats: { magicPower: 15 },
    slot: 'mainHand',
    allowedClasses: ['mage']
  }),
  new WeaponItem({
    name: 'Precision Bow',
    type: 'weapon',
    price: 135,
    icon: 'bow',
    description: 'A lightweight bow that improves accuracy and critical hits.',
    weaponType: 'bow',
    stats: { attack: 9 },
    slot: 'mainHand',
    allowedClasses: ['archer']
  }),
  new ArmorItem({
    name: 'Apprentice Robe',
    type: 'armor',
    price: 100,
    icon: 'armor',
    description: 'A robe designed for beginner mages.',
    armorType: 'cloth',
    stats: { magicResist: 5 },
    slot: 'chest',
    allowedClasses: ['mage']
  }),
  new ConsumableItem({
    name: 'Attack Booster',
    type: 'consumable',
    price: 65,
    icon: 'drug',
    description: 'Boosts attack by 10% during exploration.',
    effect: 'buff-attack',
    potency: 0.10,
    trigger: 'onBattleStart'
  })
]);

const shopItemNames = ['Iron Sword', 'Apprentice Staff', 'Apprentice Robe', 'Precision Bow', 'Attack Booster'];
const shopItems = items.filter(item => shopItemNames.includes(item.name));

await ShopInventory.insertMany(shopItems.map(item => ({
  item: item._id,
  quantity: 999,
  price: item.price,
  shopId: 'default'
})));

const user = await User.create({
  username: 'testuser',
  password: '123456',
  email: 'testShop@example.com',
  gold: 9999
});

await UserInventory.deleteMany({ userId: user._id });
await UserEquipment.create({
  userId: user._id,
  slots: {},
  explorationConsumables: []
});

console.log('✅ All seed data initialized successfully.');
await mongoose.disconnect();
