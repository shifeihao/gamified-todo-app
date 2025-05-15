// 📦 api/DungeonTestService.js
import axios from 'axios';

const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export const enterDungeon = async (token) => {
    try {
      const res = await axios.post('/api/dungeon/enter', {}, getConfig(token));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Enter dungeon failed');
    }
  };

export const exploreCurrentFloor = async (token) => {
  try {
    const res = await axios.post('/api/dungeon/explore', {}, getConfig(token));
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Explore failed');
  }
};

export const summarizeExploration = async (token) => {
  try {
    const res = await axios.post('/api/dungeon/summarize', {}, getConfig(token));
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Summarize failed');
  }
};


