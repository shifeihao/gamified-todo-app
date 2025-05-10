import mongoose from 'mongoose';
import { Event } from '../../models/Event.js';

// ✅ 请替换成你已有的真实 ObjectId（可通过 MongoDB Compass 或 item 表查询）
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
    description: "You hear a whisper coming from the well, as if it were the echo of your own childhood.",
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
    description: "You discover a buried cloth pouch on the ground; inside are what appear to be gold coins and various items.",
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
    description: "A mechanism clicks into motion, and suddenly steel spikes shoot up from the floor!",
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
    description: "A mysterious wandering merchant beckons to you, his wares seeming unlike any you’ve ever seen.",
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
    description: "A cracked stone stele bears the maxims of a vanished civilization",
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
