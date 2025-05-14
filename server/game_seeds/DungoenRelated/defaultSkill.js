// seedClasses.js
import mongoose from "mongoose";
import { Skill } from "../../models/Skill.js";
import { CharacterClass } from "../../models/CharacterClass.js";

await mongoose.connect(
  "mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

const getSkills = async (names) => {
  const skills = await Skill.find({ name: { $in: names } });
  const nameToId = Object.fromEntries(skills.map((s) => [s.name, s._id]));
  return names.map((n) => nameToId[n]);
};

const classes = [
    {
      name: 'Warrior',
      slug: 'warrior',
      fullIcon:'warrior',
      images: {
        male: {
          avatar: 'warrior-male-avatar.png',
          sprite: 'warrior-male-sprite.png'
        },
        female: {
          avatar: 'warrior-female-avatar.png',
          sprite: 'warrior-female-sprite.png'
        }
      },
      description: 'Strong melee fighters with great durability.',
      baseStats: { hp: 130, attack: 18, defense: 12, magicPower: 0, speed: 6, critRate: 3, evasion: 2 },
      weaponTypes: ['sword'],
      defaultSkillNames: ['Smash', 'Iron Defense', 'Battle Cry']
    },
  {
    name: "Mage",
    slug: "mage",
    images: {
      male: {
        avatar: 'mage-male-avatar.png',
        sprite: 'mage-male-sprite.png'
      },
      female: {
        avatar: 'mage-female-avatar.png',
        sprite: 'mage-female-sprite.png'
      }
    },
    description: "Masters of elemental and arcane power.",
    baseStats: {
      hp: 90,
      attack: 5,
      defense: 6,
      magicPower: 20,
      speed: 7,
      critRate: 2,
      evasion: 3,
    },
    weaponTypes: ["staff"],
    defaultSkillNames: ["Fireball", "Ice Shield", "Arcane Boost"],
  },
  {
    name: "Rogue",
    slug: "rogue",
    images: {
      male: {
        avatar: 'rogue-male-avatar.png',
        sprite: 'rogue-male-sprite.png'
      },
      female: {
        avatar: 'rogue-female-avatar.png',
        sprite: 'rogue-female-sprite.png'
      }
    },
    description: "Agile and deadly in close combat.",
    baseStats: {
      hp: 100,
      attack: 15,
      defense: 7,
      magicPower: 0,
      speed: 10,
      critRate: 8,
      evasion: 8,
    },
    weaponTypes: ["dagger"],
    defaultSkillNames: ["Backstab", "Quickstep", "Poison Blade"],
  },
  {
    name: "Archer",
    slug: "archer",
    images: {
      male: {
        avatar: 'archer-male-avatar.png',
        sprite: 'archer-male-sprite.png'
      },
      female: {
        avatar: 'archer-female-avatar.png',
        sprite: 'archer-female-sprite.png'
      }
    },
    description: "Skilled ranged attackers who exploit enemy weaknesses.",
    baseStats: {
      hp: 105,
      attack: 14,
      defense: 7,
      magicPower: 0,
      speed: 9,
      critRate: 6,
      evasion: 6,
    },
    weaponTypes: ["bow"],
    defaultSkillNames: ["Precise Shot", "Eagle Eye", "Rapid Fire"],
  },
];

await Promise.all([CharacterClass.deleteMany({})]);

for (const charClass of classes) {
  const skillIds = await getSkills(charClass.defaultSkillNames);
  await CharacterClass.create({
    name: charClass.name,
    slug: charClass.slug,
    images: charClass.images,
    description: charClass.description,
    baseStats: charClass.baseStats,
    weaponTypes: charClass.weaponTypes,
    defaultSkills: skillIds,
  });
}

console.log("Character classes seeded with default skills.");
await mongoose.disconnect();
