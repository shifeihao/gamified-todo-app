import mongoose from 'mongoose';
import { Event } from '../../models/Event.js';

// 请替换成你已有的真实 ObjectId（可通过 MongoDB Compass 或 item 表查询）
const ITEM_ID_HEALTH_POTION = new mongoose.Types.ObjectId(); 
const SHOP_INVENTORY_ID = new mongoose.Types.ObjectId();

await mongoose.connect(
  'mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
);

const events = [
  {
    name: "Whispering Well",
    slug: "whispering-well",
    icon: "whisper-well.png",
    type: "story",
    description: "你听到井中传来低语，似乎是你童年的回声。",
    triggerCondition: "onEnter",
    chance: 1.0,
    effect: {
      statChange: { magicPower: 2 }
    }
  },
  {
    name: "Buried Parcel",
    slug: "buried-parcel",
    icon: "parcel.png",
    type: "reward",
    description: "你在地上发现一个被埋的布袋，里面似乎有金币和物品。",
    triggerCondition: "onEnter",
    chance: 0.8,
    effect: {
      gold: 80,
      itemDrop: [
        {
          item: ITEM_ID_HEALTH_POTION,
          rate: 0.5
        }
      ]
    }
  },
  {
    name: "Spiked Floor",
    slug: "spiked-floor",
    icon: "spike.png",
    type: "trap",
    description: "一阵机关声响起，地板突然升起钢刺！",
    triggerCondition: "onEnter",
    chance: 0.6,
    effect: {
      statChange: { hp: -30 }
    }
  },
  {
    name: "Wandering Merchant",
    slug: "wandering-merchant",
    icon: "merchant.png",
    type: "shop",
    description: "一位神秘的流浪商人向你招手，他的货品似乎与众不同。",
    triggerCondition: "onEnter",
    chance: 1.0,
    effect: {
      shopInventoryId: SHOP_INVENTORY_ID
    }
  },
  {
    name: "Echo Tablet",
    slug: "echo-tablet",
    icon: "tablet.png",
    type: "story",
    description: "一块布满裂痕的石碑，记载着某个已消失文明的箴言。",
    triggerCondition: "onKill",
    chance: 1.0,
    effect: {
      dungenonExp: 20
    }
  }
];

await Promise.all([
  Event.deleteMany({}),
]);

await Event.insertMany(events);

console.log('✅ Events seeded.');
await mongoose.disconnect();
