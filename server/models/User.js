import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// User Model Architecture
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false, // The default query does not return passwords
    },

    shortCardSlot: {
      type: Number,
      default: 2,
      set: (v) => Math.min(v, 5), // Automatically crop to no more than 5
    },
    longCardSlot: {
      type: Number,
      default: 2,
      set: (v) => Math.min(v, 5), // Automatically crop to no more than 5
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    experience: {
      type: Number,
      default: 0,
    },
    gold: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      required: true,
      default: 1, // Current Level
    },
    nextLevelExp: {
      type: Number,
      required: true,
      default: 155, // Experience threshold from LV1 to LV2
    },
    // Daily card quota
    dailyCards: {
      blank: {
        type: Number,
        default: 3, // Default is 3 blank cards per day
      },
      lastIssued: {
        type: Date,
        default: null, // Last payment date
      },
    },
    // Weekly standing card quota
    weeklyCards: {
      lastIssued: {
        type: Date,
        default: null, // Last payment date
      },
    },
    // Points to all cards owned by the user
    cardInventory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card",
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

    // Encrypt password before saving
userSchema.pre("save", async function (next) {
  // Re-encrypt only when the password is changed
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
