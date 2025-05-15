// services/cardService.js
import axios from 'axios';

// Get Card Inventory - Returns all card information of the user
export const getCardInventory = async (token) => {
    try {
        const res = await axios.get('/api/cards/inventory', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Obtained card data:", res.data);
        return res.data;
    } catch (error) {
        console.error("Failed to obtain card:", error);
        throw error;
    }
};

// Get Daily Cards - Try to get new Daily Cards
export const getNewDailyCards = async (token) => {
    try {
        const res = await axios.post('/api/cards/issue-daily', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Get daily card successfully:", res.data);
        return res.data;
    } catch (error) {
        // If the card has already been obtained, a 400 error will be returned
        console.log("Failed to get daily card:", error.response?.data?.message || error.message);
        return null;
    }
};

// Create a new blank card - only for testing or new users
export const createBlankCard = async (token) => {
    try {
        const res = await axios.post('/api/cards/issue-blank', {
            title: "New blank card",
            description: "Cards automatically created by the system"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Created a blank card successfully:", res.data);
        return res.data;
    } catch (error) {
        console.error("Failed to create blank card:", error);
        throw error;
    }
};
