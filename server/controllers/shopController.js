import {
    ShopItem,
    WeaponItem,
    ArmorItem,
    ConsumableItem,
    MaterialItem
} from '../models/ShopItem.js';


import {
    ShopInventory,
    UserInventory,
    UserEquipment
} from '../models/Inventory.js';
  



export const getShopItems = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
  
      const items = await ShopInventory
        .find({ shopId: 'default' })
        .populate('item')
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await ShopInventory.countDocuments({ shopId: 'default' });
  
      res.json({
        data: items,
        pagination: { total, page: Number(page), limit: Number(limit) }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '服务器错误' });
    }
};

export const buyItem = async (req, res) => {
    try {
      const { itemId } = req.body;
  
      const shopEntry = await ShopInventory.findOne({ item: itemId });
      if (!shopEntry || shopEntry.quantity <= 0) {
        return res.status(400).json({ message: '商品已售罄或不存在' });
      }
  
      const user = req.user;
      if (user.gold < shopEntry.price) {
        return res.status(400).json({ message: '金币不足' });
      }
  
      // 扣金币
      user.gold -= shopEntry.price;
      
      // 根据user对象是否有save方法选择保存方式
      if (typeof user.save === 'function') {
        await user.save();
      } else {
        // 在测试环境中，user可能只是普通对象，使用findByIdAndUpdate
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(user._id, { gold: user.gold });
      }
  
      // 减库存
      shopEntry.quantity -= 1;
      await shopEntry.save();
  
      // 加入用户背包（存在则加数量）
      await UserInventory.updateOne(
        { userId: user._id, item: itemId },
        { $inc: { quantity: 1 } },
        { upsert: true }
      );
  
      res.json({ message: '购买成功' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '服务器错误' });
    }
};



// @desc    通过物品名称获取物品（内部用途）
// @route   GET /api/shop/item/:name
// @access  Internal / Admin
export const getItemByName = async (req, res) => {
  try {
    const name = req.params.name;
    const item = await ShopItem.findOne({ name });

    if (!item) {
      return res.status(404).json({ message: '物品未找到' });
    }

    res.json(item);
  } catch (error) {
    console.error('❌ getItemByName error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};


export const sellItem = async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.body;

    const inventoryEntry = await UserInventory.findOne({
      userId: user._id,
      item: itemId
    });

    if (!inventoryEntry || inventoryEntry.quantity <= 0) {
      return res.status(400).json({ message: '背包中没有该物品' });
    }

    // 获取价格（卖出价格为原价一半）
    const shopItem = await ShopItem.findById(itemId);
    if (!shopItem) {
      return res.status(404).json({ message: '物品不存在' });
    }

    const sellPrice = Math.floor(shopItem.price / 2);

    // 1. 增加用户金币
    user.gold += sellPrice;
    
    // 根据user对象是否有save方法选择保存方式
    if (typeof user.save === 'function') {
      await user.save();
    } else {
      // 在测试环境中，user可能只是普通对象，使用findByIdAndUpdate
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(user._id, { gold: user.gold });
    }

    // 2. 减少用户物品数量
    if (inventoryEntry.quantity > 1) {
      inventoryEntry.quantity -= 1;
      await inventoryEntry.save();
    } else {
      await inventoryEntry.deleteOne();
    }

    res.json({ message: `成功售出，获得 ${sellPrice} 金币` });
  } catch (error) {
    console.error('❌ sellItem error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};