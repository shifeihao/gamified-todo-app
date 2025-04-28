// services/cardService.js
import axios from 'axios';

export const getCardInventory = async (token) => {
    const res = await axios.get('/api/cards/inventory', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data.inventory; // 注意后端返回结构
};
