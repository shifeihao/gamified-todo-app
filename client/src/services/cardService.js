// services/cardService.js
import axios from 'axios';

// 获取卡片库存 - 返回用户所有卡片信息
export const getCardInventory = async (token) => {
    try {
        const res = await axios.get('/api/cards/inventory', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("获取到的卡片数据:", res.data);
        return res.data;
    } catch (error) {
        console.error("获取卡片失败:", error);
        throw error;
    }
};

// 获取每日卡片 - 尝试获取新的每日卡片
export const getNewDailyCards = async (token) => {
    try {
        const res = await axios.post('/api/cards/issue-daily', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("获取每日卡片成功:", res.data);
        return res.data;
    } catch (error) {
        // 如果已经获取过卡片，会返回400错误
        console.log("获取每日卡片失败:", error.response?.data?.message || error.message);
        return null;
    }
};

// 创建新的空白卡片 - 仅用于测试或新用户
export const createBlankCard = async (token) => {
    try {
        const res = await axios.post('/api/cards/issue-blank', {
            title: "新的空白卡片",
            description: "系统自动创建的卡片"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("创建空白卡片成功:", res.data);
        return res.data;
    } catch (error) {
        console.error("创建空白卡片失败:", error);
        throw error;
    }
};
