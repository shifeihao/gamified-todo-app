import { UserInventory, UserEquipment } from "../models/Inventory.js";
import { ShopItem } from "../models/ShopItem.js"; 
import { UserDungeonStats } from "../models/UserDungeonStats.js"; 
export const equipItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { inventoryItemId } = req.body;

    console.log("✅ Starting equip logic");

    const userItem = await UserInventory.findById(inventoryItemId)
      .populate({ path: "item", model: "ShopItem" })
      .lean();

    if (!userItem) return res.status(404).json({ error: "Item not found" });
    if (!userItem.userId.equals(userId))
     return res.status(403).json({ error: "You can't equip someone else's item" });
    if (userItem.equipped)
     return res.status(400).json({ error: "Item is already equipped" });

    const shopItem = userItem.item;
    console.log("🔍 shopItem:", shopItem);

    if (!["weapon", "armor"].includes(shopItem.type)) {
      return res.status(400).json({ error: "This item type cannot be equipped" });
    }

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) return res.status(400).json({ error: "Please select a class first" });

    //  Debug info
    console.log("🔍 shopItem.type:", shopItem.type);
    console.log(
      "Is allowedClasses array？",
      Array.isArray(shopItem.allowedClasses)
    );
    console.log("🔍 allowedClasses content：", shopItem.allowedClasses);

    if (
      shopItem.type === "weapon" &&
      Array.isArray(shopItem.allowedClasses) &&
      shopItem.allowedClasses.length > 0
    ) {
      const matched = shopItem.allowedClasses.includes(stats.classSlug);
      console.log("✅ Current user class slug:", stats.classSlug);
      console.log("✅ Allowed classes for this weapon:", shopItem.allowedClasses);
      if (!matched) {
       	return res.status(400).json({ error: "This class cannot equip this weapon" });
      }
    }

    const slot = shopItem.slot;
    if (!slot) return res.status(400).json({ error: "Equipment slot is not specified" });

    let equipment = await UserEquipment.findOne({ userId });
    if (!equipment) {
      equipment = new UserEquipment({ userId });
    }

    const oldEquippedItemId = equipment.slots[slot];
    if (oldEquippedItemId) {
      await UserInventory.findByIdAndUpdate(oldEquippedItemId, {
        equipped: false,
      });
    }

    equipment.slots[slot] = userItem._id;
    await equipment.save();

    await UserInventory.findByIdAndUpdate(userItem._id, {
      equipped: true,
    });

    res.status(200).json({ message: "Item equipped successfully", slot, item: shopItem.name });
  } catch (err) {
    console.error("Equip error:", err);
    res.status(500).json({ error: "Failed to equip item" });
  }
};

export const unequipItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { slot } = req.body;
    const equipment = await UserEquipment.findOne({ userId });
    if (!equipment || !equipment.slots[slot]) {
      return res.status(400).json({ error: "No equipment in this slot" });
    }
    const itemId = equipment.slots[slot];

    await UserInventory.findByIdAndUpdate(itemId, { equipped: false });
    equipment.slots[slot] = null;
    await equipment.save();
    res.status(200).json({ message: "Item unequipped", slot });
  } catch (err) {
    console.error("Unequip error:", err);
    res.status(500).json({ error: "Failed to unequip item" })
  }
};

export const getUserEquipment = async (req, res) => {
  try {
    const userId = req.user._id;
    const equipment = await UserEquipment.findOne({ userId }).populate({
      path: "slots.head slots.chest slots.legs slots.hands slots.feet slots.mainHand slots.offHand slots.accessory",
      populate: { path: "item" },  
    });

    res.status(200).json(equipment);
  } catch (err) {
    console.error("❌ Failed to retrieve equipment:", err);
   res.status(500).json({ error: "Failed to retrieve equipment" });
  }
};

export const getBackpack = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await UserInventory.find({ userId }).populate("item"); 

    res.status(200).json(items);
  } catch (err) {
    console.error("Failed to retrieve backpack:", err);
    res.status(500).json({ error: "Failed to retrieve backpack items" });
  }
};

export const getUserInventory = async (req, res) => {
  try {
    const inventory = await UserInventory.find({
      userId: req.user._id,
    }).populate("item");

    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
