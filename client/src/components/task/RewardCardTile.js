import React from 'react';

export const RewardCardTile = ({ card, isSelected = false, onClick = null, readOnly = false }) => {
    return (
        <div
            className={`rounded-xl p-4 cursor-pointer border-2 transition-all
        ${isSelected
                ? 'border-purple-500 bg-purple-200'
                : 'border-transparent bg-purple-100 hover:bg-purple-200'}
      `}
            onClick={() => !readOnly && onClick?.(card)}
        >
            <h3 className="text-md font-semibold mb-1">{card.title}</h3>
            {card.description && (
                <p className="text-sm text-gray-700">{card.description}</p>
            )}
            <div className="mt-2 text-xs text-purple-700">
                Experience Multiplier: {card.bonus.experienceMultiplier}x，Coin Multiplier: {card.bonus.goldMultiplier}x
            </div>
        </div>
    );
};


