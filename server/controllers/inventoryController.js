
import {
    ShopInventory,
    UserInventory,
    UserEquipment
} from '../models/Inventory.js';
  



export const getUserInventory = async (req, res) => {
    try {
      const inventory = await UserInventory
        .find({ userId: req.user._id })
        .populate('item');
  
      res.json(inventory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '服务器错误' });
    }
};


