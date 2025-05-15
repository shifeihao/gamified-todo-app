import mongoose from "mongoose";

// Card Model Architecture
const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Related to the User model
    },
    type: {
      // Card Type: Blank or Special
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
    // Reward rate and other information
    bonus: {
      //The default multiplier for gold and experience is 1
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
    // Mission duration: short, long, or general
    taskDuration: {
      type: String,
      enum: ["short", "long", "general"],
      default: "general",
    },
    //Indicates whether the card is reusable
    reusable: {
      type: Boolean,
      default: false, // By default, cards cannot be reused.
    },
    //Distribution time
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional, card expiration date
    expiresAt: {
      type: Date,
    },
    //Mark whether a card is used
    used: {
      type: Boolean,
      default: false,
    },
    // Cooldown time for periodic cards
    cooldownUntil: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// 添加索引以提高查询性能
cardSchema.index({ user: 1, type: 1 });
cardSchema.index({ user: 1, used: 1 });
cardSchema.index({ user: 1, taskDuration: 1 });

const Card = mongoose.model("Card", cardSchema);

export default Card;
