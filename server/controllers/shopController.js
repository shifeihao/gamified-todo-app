import {
  ShopItem,
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  MaterialItem,
} from "../models/ShopItem.js";

import {
  ShopInventory,
  UserInventory,
  UserEquipment,
} from "../models/Inventory.js";

export const getShopItems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const items = await ShopInventory.find({ shopId: "default" })
      .populate("item")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ShopInventory.countDocuments({ shopId: "default" });

    res.json({
      data: items,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const buyItem = async (req, res) => {
  try {
    const { itemId } = req.body;

    const shopEntry = await ShopInventory.findOne({ item: itemId });
    if (!shopEntry || shopEntry.quantity <= 0) {
      return res.status(400).json({ message: "Item is sold out or does not exist" });
    }

    const user = req.user;
    if (user.gold < shopEntry.price) {
      return res.status(400).json({ message: "Not enough gold" });
    }

    // deduct gold
    user.gold -= shopEntry.price;
    await user.save();

    // deduct inventory
    shopEntry.quantity -= 1;
    await shopEntry.save();

    // add to user's bag（if exist then adding the number）
    await UserInventory.updateOne(
      { userId: user._id, item: itemId },
      { $inc: { quantity: 1 } },
      { upsert: true }
    );

    res.json({ message: "Item purchased successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    desc Get item by name (internal use)
// @route   GET /api/shop/item/:name
// @access  Internal / Admin
export const getItemByName = async (req, res) => {
  try {
    const name = req.params.name;
    const item = await ShopItem.findOne({ name });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("❌ getItemByName error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const sellItem = async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.body;

    const inventoryEntry = await UserInventory.findOne({
      userId: user._id,
      item: itemId,
    });

    if (!inventoryEntry || inventoryEntry.quantity <= 0) {
      return res.status(400).json({ message: "Item not found in inventory" });
    }

    const shopItem = await ShopItem.findById(itemId);
    if (!shopItem) {
      return res.status(404).json({ message: "Item does not exist" });
    }

    const sellPrice = Math.floor(shopItem.price / 2);

    user.gold += sellPrice;
    await user.save();

    if (inventoryEntry.quantity > 1) {
      inventoryEntry.quantity -= 1;
      await inventoryEntry.save();
    } else {
      await inventoryEntry.deleteOne();
    }

    res.json({ message: `Item sold successfully. You received ${sellPrice} gold.` });
  } catch (error) {
    console.error("❌ sellItem error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
