// 📦 api/inventoryShopService.js
import axios from 'axios';


const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export const getShopItems = async (token, page = 1, limit = 10) => {
    console.log("🧪 正在调用 getShopItems");
    try {
      const res = await axios.get(`/api/shop/items?page=${page}&limit=${limit}`, getConfig(token));
      console.log("shop data",res.data.data);
      return res.data.data; // ✅ 返回真正的数组
      
    } catch (error) {
      throw new Error(
        error.response?.data?.message || '获取商店物品失败'
      );
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
    throw new Error(
      error.response?.data?.message || '购买失败'
    );
  }
};


export const getUserInventory = async (token) => {
  try {
    const { data } = await axios.get(`/api/users/inventory`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || '获取背包失败'
    );
  }
};
