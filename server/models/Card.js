import mongoose from "mongoose";

// 卡片模型架构
const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // 关联到User模型
    },
    type: {
      // 卡片类型：空白 or 特殊
      type: String,
      enum: ["blank", "special"],
      default: "blank",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide the title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // 奖励倍率等信息
    bonus: {
      //金币和经验，默认倍率都是1
      experienceMultiplier: {
        type: Number,
        default: 1.0,
      },
      goldMultiplier: {
        type: Number,
        default: 1.0,
      },
      specialEffect: {
        type: String,
        default: "",
      },
    },
    // 任务持续时长：短期、长期或通用
    taskDuration: {
      type: String,
      enum: ["short", "long", "general"],
      default: "general",
    },
    //表示是否为可重复使用的卡片
    reusable: {
      type: Boolean,
      default: false, // 默认卡片不可重复使用
    },
    //发放时间
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // 可选，卡片过期时间
    expiresAt: {
      type: Date,
    },
    // 标记卡片是否已使用
    used: {
      type: Boolean,
      default: false,
    },
    // 周期性卡片的冷却时间
    cooldownUntil: {
      type: Date,
    },
  },
  {
    timestamps: true, // 自动添加createdAt和updatedAt字段
  }
);

// 添加索引以提高查询性能
cardSchema.index({ user: 1, type: 1 });
cardSchema.index({ user: 1, used: 1 });
cardSchema.index({ user: 1, taskDuration: 1 });

const Card = mongoose.model("Card", cardSchema);

export default Card;
