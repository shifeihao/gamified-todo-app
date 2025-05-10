import React from 'react';

/**
 * 用户等级显示组件
 * @param {Object} data - 等级数据对象
 * @param {number} data.level - 当前等级
 * @param {number} data.experience - 当前总经验
 * @param {number} data.nextLevelExp - 升到下一级所需经验
 * @param {number} data.expProgress - 当前等级内获得的经验
 * @param {number} data.expRemaining - 距离下一级还需经验
 * @param {number} data.progressRate - 当前升级进度（0 ~ 1）
 * @param {boolean} data.leveledUp - 是否升级
 * @param {number} data.coins - 当前金币数量
 * @param {boolean} isNavbar - 是否在导航栏中使用
 */
const UserLevelBar = ({ data, isNavbar = false }) => {
    if (!data) return null;

    const {
        level,
        experience,
        nextLevelExp,
        expProgress,
        expRemaining,
        progressRate,
        leveledUp,
        coins = 0
    } = data;

    if (isNavbar) {
        return (
            <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-white">Level {level}</span>
                        <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">🪙</span>
                            <span className="text-sm text-white">{coins}</span>
                        </div>
                    </div>
                    <span className="text-sm text-primary-200">
                        {expProgress} / {expProgress/progressRate} XP
                    </span>
                </div>

                <div className="w-full bg-primary-700 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${(progressRate * 100).toFixed(1)}%` }}
                    />
                </div>

                {leveledUp && (
                    <p className="text-yellow-400 text-xs font-semibold mt-1 animate-pulse">
                        🎉 Congratulations on upgrading！
                    </p>
                )}
            </div>
        );
    }

    // 如果不是在導航欄中，則不顯示任何內容
    return null;
};

export default UserLevelBar;