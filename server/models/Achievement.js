import mongoose from "mongoose";

const AchievementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    condition: { type: String, required: true }, 
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
      task_short_slot: { type: Number, default: 0 },
      task_long_slot: { type: Number, default: 0 },
    },
    icon: { type: String, default: null },
    isEnabled: { type: Boolean, default: true },


    logic: {
      type: {
        type: String,
        default: null, // e.g. 'task_completed_total'
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        default: null, 
      },
      op: {
        type: String,
        default: null, 
      },
    },
  },
  { timestamps: true }
);

const Achievement = mongoose.model("Achievement", AchievementSchema);
export default Achievement;
