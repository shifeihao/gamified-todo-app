import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 如 "Mage"
  slug: { type: String, unique: true }, // 如 "mage"
  icon: String,
  description: String,

  baseStats: {
    hp: Number,
    attack: Number,
    defense: Number,
    magicPower: Number,
    speed: Number,
    critRate: Number,
    evasion: Number,
  },

  defaultSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  weaponTypes: [{ type: String, enum: ["sword", "bow", "staff", "dagger"] }],
});

export const CharacterClass = mongoose.model("CharacterClass", classSchema);
