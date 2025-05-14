import Level from '../models/Level.js';

export const getLevelFromExp = async (exp) => {
  // find the level with the highest expRequired that is less than or equal to the given exp
  const matchedLevel = await Level.findOne({ expRequired: { $lte: exp } })
    .sort({ level: -1 })
    .lean();

  return matchedLevel; 
};
