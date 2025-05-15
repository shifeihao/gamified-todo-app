// seedDungeon.js
import mongoose from "mongoose";
import { Dungeon } from "../../models/Dungeon.js";
import { Monster } from "../../models/Monster.js";
import { Event } from "../../models/Event.js";
import dotenv from "dotenv";

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

// 1. 预查询所需怪物和事件
const monsterMap = Object.fromEntries(
  (
    await Monster.find({
      slug: {
        $in: ["echo-bat", "sloth-slime", "hollow-child", "false-prophet"],
      },
    })
  ).map((m) => [m.slug, m])
);

const eventList = await Event.find({
  slug: {
    $in: [
      "strange-whispers",
      "golden-chest",
      "wandering-merchant",
      "spike-trap",
      "mirror-of-self",
    ],
  },
});

// 2. 构造 10 层迷宫
const getRandom = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const floors = [];
for (let i = 1; i <= 10; i++) {
  const isBossFloor = i === 10;
  const monsterChoices = ["echo-bat", "sloth-slime", "hollow-child"];
  const floorMonsters = isBossFloor
    ? []
    : getRandom(monsterChoices, 2).map((slug) => ({
        monster: monsterMap[slug]._id,
        count: Math.floor(Math.random() * 2) + 1,
      }));

  const floorEvents = getRandom(eventList, Math.random() < 0.6 ? 1 : 0).map(
    (e) => e._id
  );

  floors.push({
    floorIndex: i,
    description: `A dimly lit space filled with uncertainty. Floor ${i}.`,
    environmentTags: ["dark"],
    monsters: floorMonsters,
    boss: isBossFloor ? monsterMap["false-prophet"]._id : null,
    events: floorEvents,
    checkpoint: i === 10,
  });
}

await Promise.all([Dungeon.deleteMany({})]);

// 3. 写入迷宫数据
await Dungeon.create({
  name: "Echo Labyrinth",
  slug: "echo-labyrinth",
  icon: "dungeon-dark.png",
  description: "A shadowy maze where doubts become monsters.",
  environment: ["dark", "fog"],
  maxFloor: 10,
  floors,
  isActive: true,
});

console.log("✅ Echo Labyrinth (1–10F) seeded.");
await mongoose.disconnect();
