// tools/fixLevelTypes.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Level from "../models/Level.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const levels = await Level.find();

for (const level of levels) {
  const updated = {
    level: Number(level.level),
    expRequired: Number(level.expRequired),
    expToNext: Number(level.expToNext),
    expSegment: Number(level.expSegment),
  };

  await Level.updateOne({ _id: level._id }, { $set: updated });
  console.log(`✅ 修复等级 ${level.level}`);
}

console.log("✨ 所有等级字段类型已修复完毕");
process.exit();
