// seedClasses.js
import mongoose from 'mongoose';
import { Skill } from '../../models/Skill.js';
import { CharacterClass } from '../../models/CharacterClass.js';

await mongoose.connect(
  'mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
);

const getSkills = async (names) => {
  const skills = await Skill.find({ name: { $in: names } });
  const nameToId = Object.fromEntries(skills.map(s => [s.name, s._id]));
  return names.map(n => nameToId[n]);
};

const classes = [
    {
      name: 'Warrior',
      slug: 'warrior',
      icon: 'warrior.png',
      description: 'Strong melee fighters with great durability.',
      baseStats: { hp: 120, attack: 18, defense: 12, magicPower: 0, speed: 6, critRate: 3, evasion: 2 },
      weaponTypes: ['sword'],
      defaultSkillNames: ['Smash', 'Iron Defense', 'Battle Cry']
    },
  {
    name: 'Mage',
    slug: 'mage',
    icon: 'mage.png',
    description: 'Masters of elemental and arcane power.',
    baseStats: { hp: 80, attack: 5, defense: 6, magicPower: 20, speed: 7, critRate: 2, evasion: 3 },
    weaponTypes: ['staff'],
    defaultSkillNames: ['Fireball', 'Ice Shield', 'Arcane Boost']
  },
  {
    name: 'Rogue',
    slug: 'rogue',
    icon: 'rogue.png',
    description: 'Agile and deadly in close combat.',
    baseStats: { hp: 90, attack: 15, defense: 7, magicPower: 0, speed: 10, critRate: 8, evasion: 8 },
    weaponTypes: ['dagger'],
    defaultSkillNames: ['Backstab', 'Quickstep', 'Poison Blade']
  },
  {
    name: 'Archer',
    slug: 'archer',
    icon: 'archer.png',
    description: 'Skilled ranged attackers who exploit enemy weaknesses.',
    baseStats: { hp: 95, attack: 14, defense: 7, magicPower: 0, speed: 9, critRate: 6, evasion: 6 },
    weaponTypes: ['bow'],
    defaultSkillNames: ['Precise Shot', 'Eagle Eye', 'Rapid Fire']
  }
];


await Promise.all([
  CharacterClass.deleteMany({}),
]);

for (const charClass of classes) {
  const skillIds = await getSkills(charClass.defaultSkillNames);
  await CharacterClass.create({
    name: charClass.name,
    slug: charClass.slug,
    icon: charClass.icon,
    description: charClass.description,
    baseStats: charClass.baseStats,
    weaponTypes: charClass.weaponTypes,
    defaultSkills: skillIds
  });
}

console.log('Character classes seeded with default skills.');
await mongoose.disconnect();