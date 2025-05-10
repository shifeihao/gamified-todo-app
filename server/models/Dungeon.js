// models/Dungeon.js
import mongoose from "mongoose";

const floorSchema = new mongoose.Schema(
  {
    floorIndex: { type: Number, required: true },
    description: String,
    environmentTags: [String], // 如 ["dark", "toxic"]
    monsters: [
      {
        monster: { type: mongoose.Schema.Types.ObjectId, ref: "Monster" },
        count: { type: Number, default: 1 },
      },
    ],
    boss: { type: mongoose.Schema.Types.ObjectId, ref: "Monster" }, // 可空
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    checkpoint: { type: Boolean, default: false },
  },
  { _id: false }
);

const dungeonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    icon: String,
    description: String,
    environment: [String], // 全局标签
    maxFloor: Number,
    floors: [floorSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Dungeon = mongoose.model("Dungeon", dungeonSchema);
