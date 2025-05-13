import mongoose from 'mongoose';


const monsterSchema = new mongoose.Schema({
    name: { type:String, required:true},
    slug: { type: String, unique: true },
    icon: String,
    type: { type: String, enum: ['normal', 'boss'], default: 'normal' },
    description: String,
    level: Number,
    tags: [String],
  
    stats: {
      hp: Number,
      attack: Number,
      defense: Number,
      magicPower: Number,
      magicResist: Number,
      critRate: Number,
      evasion: Number,
      speed: Number
    },
  
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    behavior: { type: String, default: 'basic' },
    trueForm: { type: Boolean, default: false },
  
    expDrop: Number,
    goldDrop: Number,
    itemDrops: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        rate: { type: Number, default: 10 }
      }
    ],

    taskCardDrops: [
      {
        rate: { type: Number, default: 3 }
      }
    ],
  
    spawnRate: { type: Number, default: 1 },
    floors: [Number],
    environmentTags: [String],
  });

  export const Monster = mongoose.model('Monster', monsterSchema);