import mongoose from 'mongoose';


const shopInventorySchema = new mongoose.Schema({
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopItem',
      required: true
    },
    quantity: { type: Number, default: 999 },
    price: { type: Number }, 
    shopId: { type: String, default: 'default' } 
  });
  
export const ShopInventory = mongoose.model('ShopInventory', shopInventorySchema);
  



const userInventorySchema = new mongoose.Schema({
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
},
quantity: { type: Number, default: 1 },
equipped: { type: Boolean, default: false }, 
acquiredAt: { type: Date, default: Date.now }
});

export const UserInventory = mongoose.model('UserInventory', userInventorySchema);




const userEquipmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slots: {
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    chest: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    legs: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    hands: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    feet: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    mainHand: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    offHand: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null },
    accessory: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory', default: null }
  },
  explorationConsumables: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'UserInventory' }
  ]
}, { timestamps: true });

export const UserEquipment = mongoose.model('UserEquipment', userEquipmentSchema);
