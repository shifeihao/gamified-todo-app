// 📦 api/inventoryShopService.js
import axios from "axios";

const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getShopItems = async (token, page = 1, limit = 10) => {
  console.log("🧪 正在调用 getShopItems");
  try {
    const res = await axios.get(
      `/api/shop/items?page=${page}&limit=${limit}`,
      getConfig(token)
    );
    console.log("shop data", res.data.data);
    return res.data.data; // ✅ 返回真正的数组
  } catch (error) {
    throw new Error(error.response?.data?.message || "获取商店物品失败");
  }
};

export const buyItem = async (itemId, token) => {
  try {
    const { data } = await axios.post(
      `/api/shop/buy`,
      { itemId },
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "购买失败");
  }
};

export const getUserInventory = async (token) => {
  try {
    const { data } = await axios.get(`/api/users/inventory`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "获取背包失败");
  }
};


/**
 * 获取当前用户的装备栏信息
 * @param {string} token - 用户登录 token
 * @returns {Promise<Object>} 装备栏对象（含8个槽位）
 */
export const getUserEquipment = async (token) => {
  try {
    const { data } = await axios.get('/api/inventory/equipment', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '获取装备失败');
  }
};

/**
 * 装备指定的物品
 * @param {string} inventoryItemId - 用户背包中物品的 _id
 * @param {string} token - 用户 token
 * @returns {Promise<Object>} 服务器返回的装备结果
 */
export const equipItem = async (inventoryItemId, token) => {
  try {
    const { data } = await axios.post(
      '/api/inventory/equip',
      { inventoryItemId },
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '装备失败');
  }
};

/**
 * 卸下指定槽位的装备
 * @param {string} slot - 槽位名（如 'mainHand', 'head'）
 * @param {string} token - 用户 token
 * @returns {Promise<Object>} 服务器返回的卸下结果
 */
export const unequipItem = async (slot, token) => {
  try {
    const { data } = await axios.post(
      '/api/inventory/unequip',
      { slot },
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '卸下失败');
  }
};

