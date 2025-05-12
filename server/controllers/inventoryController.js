import { UserInventory, UserEquipment } from "../models/Inventory.js";
import { ShopItem } from "../models/ShopItem.js"; // 物品模型
import { UserDungeonStats } from "../models/UserDungeonStats.js"; // 如果你要做职业/等级判断
// 装备逻辑
export const equipItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { inventoryItemId } = req.body;

    console.log("✅ 开始执行装备逻辑");

    // 🧠 使用 lean + populate 确保 discriminator 字段被完整取出
    const userItem = await UserInventory.findById(inventoryItemId)
      .populate({ path: "item", model: "ShopItem" })
      .lean();

    if (!userItem) return res.status(404).json({ error: "物品不存在" });
    if (!userItem.userId.equals(userId))
      return res.status(403).json({ error: "你不能装备别人的物品" });
    if (userItem.equipped)
      return res.status(400).json({ error: "该物品已装备" });

    const shopItem = userItem.item;
    console.log("🔍 shopItem:", shopItem);

    if (!["weapon", "armor"].includes(shopItem.type)) {
      return res.status(400).json({ error: "该物品类型不可装备" });
    }

    const stats = await UserDungeonStats.findOne({ user: userId });
    if (!stats) return res.status(400).json({ error: "请先选择职业" });

    // ✅ 调试信息
    console.log("🔍 shopItem.type:", shopItem.type);
    console.log(
      "🔍 allowedClasses 是数组吗？",
      Array.isArray(shopItem.allowedClasses)
    );
    console.log("🔍 allowedClasses 内容：", shopItem.allowedClasses);

    if (
      shopItem.type === "weapon" &&
      Array.isArray(shopItem.allowedClasses) &&
      shopItem.allowedClasses.length > 0
    ) {
      const matched = shopItem.allowedClasses.includes(stats.classSlug);
      console.log("✅ 用户当前职业 slug:", stats.classSlug);
      console.log("✅ 武器允许的职业列表:", shopItem.allowedClasses);
      if (!matched) {
        return res.status(400).json({ error: "该职业无法使用该武器" });
      }
    }

    const slot = shopItem.slot;
    if (!slot) return res.status(400).json({ error: "装备槽位未指定" });

    // 获取或创建 UserEquipment 表
    let equipment = await UserEquipment.findOne({ userId });
    if (!equipment) {
      equipment = new UserEquipment({ userId });
    }

    // 如原槽位已有装备，卸下
    const oldEquippedItemId = equipment.slots[slot];
    if (oldEquippedItemId) {
      await UserInventory.findByIdAndUpdate(oldEquippedItemId, {
        equipped: false,
      });
    }

    // 设置新装备
    equipment.slots[slot] = userItem._id;
    await equipment.save();

    // 更新背包状态
    await UserInventory.findByIdAndUpdate(userItem._id, {
      equipped: true,
    });

    res.status(200).json({ message: "装备成功", slot, item: shopItem.name });
  } catch (err) {
    console.error("装备错误：", err);
    res.status(500).json({ error: "装备失败" });
  }
};

// 卸下装备逻辑
export const unequipItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { slot } = req.body;
    const equipment = await UserEquipment.findOne({ userId });
    if (!equipment || !equipment.slots[slot]) {
      return res.status(400).json({ error: "该槽位没有装备" });
    }
    const itemId = equipment.slots[slot];

    // 解除装备状态
    await UserInventory.findByIdAndUpdate(itemId, { equipped: false });
    // 清空槽位
    equipment.slots[slot] = null;
    await equipment.save();
    res.status(200).json({ message: "卸下成功", slot });
  } catch (err) {
    console.error("卸下错误：", err);
    res.status(500).json({ error: "卸下失败" });
  }
};

// 可选：查询当前装备
export const getUserEquipment = async (req, res) => {
  try {
    const userId = req.user._id;
    const equipment = await UserEquipment.findOne({ userId }).populate({
      path: "slots.head slots.chest slots.legs slots.hands slots.feet slots.mainHand slots.offHand slots.accessory",
      populate: { path: "item" }, // ✅ 进一步填充 ShopItem 数据
    });

    res.status(200).json(equipment);
  } catch (err) {
    console.error("❌ 获取装备失败:", err);
    res.status(500).json({ error: "获取装备失败" });
  }
};

// 获取背包物品
export const getBackpack = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await UserInventory.find({ userId }).populate("item"); // 自动拉取 ShopItem 的数据（例如名字、类型、图标等）

    res.status(200).json(items);
  } catch (err) {
    console.error("获取背包失败：", err);
    res.status(500).json({ error: "获取背包失败" });
  }
};

// 获取背包物品
export const getUserInventory = async (req, res) => {
  try {
    const inventory = await UserInventory.find({
      userId: req.user._id,
    }).populate("item");

    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};
