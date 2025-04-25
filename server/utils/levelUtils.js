import Level from '../models/Level.js';

/**
 * 根据当前经验值，查表计算当前等级
 * @param {number} exp - 当前经验值
 * @returns {object} 当前等级对象 { level, expRequired, expToNext, ... }
 */
export const getLevelFromExp = async (exp) => {
  // 查找 expRequired 小于等于当前 exp 的所有等级，按等级降序，取第一个
  const matchedLevel = await Level.findOne({ expRequired: { $lte: exp } })
    .sort({ level: -1 })
    .lean();

  return matchedLevel; // 如果为 null 表示未匹配任何等级（exp=0）
};
