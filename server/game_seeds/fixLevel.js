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
  console.log(`✅ Repair level ${level.level}`);
}

console.log("✨ All level field types have been fixed");
process.exit();
