import React from 'react';

export const RewardCardTile = ({ card, isSelected = false, onClick = null, readOnly = false }) => {
    return (
        <div
            className={`rounded-xl p-4 cursor-pointer border-2 transition-all relative
                ${isSelected
                    ? 'border-purple-500 bg-purple-200'
                    : 'border-transparent bg-purple-100 hover:bg-purple-200'}
            `}
            onClick={() => !readOnly && onClick?.(card)}
        >
            {/* Task type badge - top right corner */}
            {card.taskDuration && (
                <div className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold text-white rounded-bl-lg rounded-tr-lg
                    ${card.taskDuration === 'short' ? 'bg-blue-500' : 'bg-indigo-700'}`}>
                    {card.taskDuration === 'short' ? 'Short Task' : 'Long Task'}
                </div>
            )}
            
            <h3 className="text-md font-semibold mb-1 pr-16">{card.title}</h3>
            
            {card.description && (
                <p className="text-sm text-gray-700 mb-3">{card.description}</p>
            )}
            
            {/* Bonus section with icons */}
            <div className="mt-3 flex flex-col gap-1 border-t pt-2 border-purple-200">
                {/* Experience multiplier */}
                <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-purple-200 rounded-full mr-2">
                        <span role="img" aria-label="experience" className="text-purple-700">✨</span>
                    </div>
                    <span className="text-sm text-purple-800 font-medium">
                        Experience <span className="font-bold">{card.bonus?.experienceMultiplier || 1}x</span>
                    </span>
                </div>
                
                {/* Coins multiplier */}
                <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-yellow-200 rounded-full mr-2">
                        <span role="img" aria-label="coins" className="text-yellow-700">🪙</span>
                    </div>
                    <span className="text-sm text-yellow-800 font-medium">
                        Coins <span className="font-bold">{card.bonus?.goldMultiplier || 1}x</span>
                    </span>
                </div>
                
                {/* If card has an extra special bonus */}
                {card.bonus?.specialBonus && (
                    <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-green-200 rounded-full mr-2">
                            <span role="img" aria-label="special" className="text-green-700">🎁</span>
                        </div>
                        <span className="text-sm text-green-800 font-medium">
                            {card.bonus.specialBonus}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Status indicator */}
            {card.isUsed && (
                <div className="absolute bottom-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                    Used
                </div>
            )}
        </div>
    );
};


