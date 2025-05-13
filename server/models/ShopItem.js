import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const shopItemSchema = new mongoose.Schema({
  name: String,
  type: { type: String, required: true },
  price: Number,
  icon: { type: String, default: 'default-icon' }, 
  description: { type: String, default: '' },
  tradable: { type: Boolean, default: true }
}, { discriminatorKey: 'type', collection: 'shopitems' });

const ShopItem = mongoose.model('ShopItem', shopItemSchema);




const WeaponItem = ShopItem.discriminator('weapon', new mongoose.Schema({
  weaponType: {
    type: String,
    enum: ['sword', 'bow', 'staff', 'dagger'],
    required: true
  },
  stats: {
    attack: { type: Number, default: 0 },
    magicPower: { type: Number, default: 0 },
    critRate: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }
  },
  slot: { type: String, enum: ['mainHand', 'offHand'], required: true },
  allowedClasses: {
    type: [String],
    default: ['all']  // 与 ArmorItem 保持一致
  },
  isEquipped: {type:Boolean,default:false},
  requiredLevel: {
    type: Number,
    default: 1
  }
}));




const ArmorItem = ShopItem.discriminator('armor', new mongoose.Schema({
  armorType: {
    type: String,
    enum: ['cloth', 'leather', 'plate', 'shield'],
    required: true
  },
  stats: {
    defense: { type: Number, default: 0 },
    magicResist: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 }
  },
 
  slot: {
    type: String,
    enum: ['head', 'chest', 'legs', 'hands', 'feet', 'accessory', 'offHand'],
    required: true
  },
  allowedClasses: {
    type: [String],
    default: ['all']
  },
  isEquipped: {type:Boolean,default:false},
  requiredLevel: {
    type: Number,
    default: 1
  }
}));


const ConsumableItem = ShopItem.discriminator('consumable', new mongoose.Schema({
  effect: {
    type: String, // 比如 'heal', 'buff-crit', 'restore-energy'
    required: true
  },
  potency: {
    type: Number, 
    default: 0
  },
  duration: {
    type: String,
    enum: ['until-end-of-exploration', 'permanent'],
    default: 'until-end-of-exploration'
  },
  trigger: {
    type: String,
    enum: ['onLowHp', 'onBattleStart', 'manual'],
    default: 'manual'
  },
  stackable: {
    type: Boolean,
    default: true
  }
}));
// revised version

const MaterialItem = ShopItem.discriminator('material', new mongoose.Schema({
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'legendary'],
      default: 'common'
    },
    source: {
      type: String,
      default: ''  
    }
  }));


  export {
    ShopItem,
    WeaponItem,
    ArmorItem,
    ConsumableItem,
    MaterialItem
  };
