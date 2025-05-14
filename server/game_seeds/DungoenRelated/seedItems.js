import mongoose from 'mongoose';
import { ShopItem, WeaponItem, ArmorItem } from '../../models/ShopItem.js';

const MONGO_URI = 'mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function seedWarriorItems() {
  await mongoose.connect(MONGO_URI);

  const items = [
    new WeaponItem({
      name: "Steelbreaker Sword",
      type: "weapon",
      price: 200,
      description: "A heavy sword that can pierce through thick armor.",
      tradable: true,
      weaponType: "sword",
      slot: "mainHand",
      stats: {
        attack: 15,
        magicPower: 0,
        critRate: 0,
        accuracy: 10
      },
      requiredLevel: 1,
      allowedClasses: ["warrior"] // 改为字符串数组
    }),

    new ArmorItem({
      name: "Iron Visor",
      type: "armor",
      price: 120,
      description: "An iron helmet that offers head protection and focus.",
      tradable: true,
      armorType: "plate",
      slot: "head",
      stats: {
        defense: 5,
        magicResist: 0,
        evasion: 0
      },
      requiredLevel: 1,
      allowedClasses: ["warrior"] // 改为字符串数组
    }),

    new ArmorItem({
      name: "Bulwark Shield",
      type: "armor",
      price: 180,
      description: "A sturdy shield that can reflect a small portion of damage.",
      tradable: true,
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
      description: "Gauntlets with sharp studs, increasing offensive power.",
      tradable: true,
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
      description: "A well-forged chestplate that offers balanced protection.",
      tradable: true,
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
      description: "Heavy leg armor that maintains mobility.",
      tradable: true,
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
      description: "Sturdy boots with reinforced soles.",
      tradable: true,
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
      description: "A protective charm that strengthens one's will.",
      tradable: true,
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
  ];

  await ShopItem.insertMany(items);
  console.log('✅ Warrior equipment seed completed.');

  await mongoose.disconnect();
}

async function seedMageItems() {
  await mongoose.connect(MONGO_URI);

  const items = [
    new WeaponItem({
      name: "Arcane Staff",
      type: "weapon",
      price: 220,
      description: "A staff infused with arcane energy.",
      tradable: true,
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
      description: "A hat favored by apprentice mages.",
      tradable: true,
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
      description: "Light gloves that boost spellcasting.",
      tradable: true,
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
      description: "A magical orb that enhances control.",
      tradable: true,
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
      description: "A flowing robe that resists magic.",
      tradable: true,
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
      description: "Soft leggings that allow quick movement.",
      tradable: true,
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
      description: "Boots that increase your mobility.",
      tradable: true,
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
      description: "A charm that focuses the mind.",
      tradable: true,
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
  ];

  await ShopItem.insertMany(items);
  console.log('✅ Mage equipment seed completed.');

  await mongoose.disconnect();
}

async function seedRogueItems() {
  await mongoose.connect(MONGO_URI);

  const items = [
    new WeaponItem({
      name: "Twinfang Daggers",
      type: "weapon",
      price: 210,
      description: "Twin blades designed for quick, deadly strikes.",
      tradable: true,
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
      description: "A mysterious mask worn by elusive rogues.",
      tradable: true,
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
      description: "Bracers that improve movement and attack speed.",
      tradable: true,
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
      description: "A small shield used for parrying.",
      tradable: true,
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
      description: "A dark vest that enhances stealth and flexibility.",
      tradable: true,
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
      description: "Pants tailored for fast footwork.",
      tradable: true,
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
      description: "Boots that silence every footstep.",
      tradable: true,
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
      description: "A sigil awarded to elite killers.",
      tradable: true,
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
  ];

  await ShopItem.insertMany(items);
  console.log('✅ Rogue equipment seed completed.');

  await mongoose.disconnect();
}

async function seedArcherItems() {
  await mongoose.connect(MONGO_URI);

  const items = [
    new WeaponItem({
      name: "Longshot Bow",
      type: "weapon",
      price: 210,
      description: "A powerful bow designed for high precision.",
      tradable: true,
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
      description: "A lightweight cap worn by field scouts.",
      tradable: true,
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
      description: "Gloves that improve bow handling.",
      tradable: true,
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
      description: "A secondary offhand for carrying arrows.",
      tradable: true,
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
      description: "A finely crafted coat for wilderness survival.",
      tradable: true,
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
      description: "Designed to move silently across any terrain.",
      tradable: true,
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
      description: "Boots that let you move like the wind.",
      tradable: true,
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
      description: "Enhances perception and precision.",
      tradable: true,
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
  ];

  await ShopItem.insertMany(items);
  console.log('✅ Archer equipment seed completed.');

  await mongoose.disconnect();
}


async function runAllSeeds() {
  try {
    await seedWarriorItems();
    await seedMageItems();
    await seedRogueItems();
    await seedArcherItems();
    console.log('🎉 All equipment seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSeeds();
}