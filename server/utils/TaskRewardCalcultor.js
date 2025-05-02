// utils/rewardCalculator.js

export const calculateReward = (baseExp = 0, baseGold = 0, bonus = {}) => {
    const expMultiplier = bonus.experienceMultiplier ?? 1;
    const goldMultiplier = bonus.goldMultiplier ?? 1;

    return {
        experience: Math.round(baseExp * expMultiplier),
        gold: Math.round(baseGold * goldMultiplier),
    };
};

