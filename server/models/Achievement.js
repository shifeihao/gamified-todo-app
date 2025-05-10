import mongoose from "mongoose";

const AchievementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    condition: { type: String, required: true }, // 仅用于展示
    points: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["Cumulative", "Continuous", "Growth", "Exploration", "Easter_Egg"],
      required: true,
    },
    isHidden: { type: Boolean, default: false },
    reward: {
      exp: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
      item: { type: String, default: null },
    },
    icon: { type: String, default: null },
    isEnabled: { type: Boolean, default: true },

    // 🧠 成就判定逻辑字段（新增）
    logic: {
      type: {
        type: String,
        default: null, // e.g. 'task_completed_total'
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        default: null, // 可以是数字、字符串、布尔
      },
      op: {
        type: String,
        default: null, // 可以是数字、字符串、布尔
      },
    },
  },
  { timestamps: true }
);

const Achievement = mongoose.model("Achievement", AchievementSchema);
export default Achievement;
