import React, { useState } from 'react';
import {RewardCardTile} from './RewardCardTile';


export const BlankCardRepository = ({ cards, tasks = [], onQuickCreate = null }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    // Add the isUsed value of the log monitoring card
    console.log("所有卡片数据:", cards);
    cards.forEach(card => {
        if (card.type === 'special') {
            console.log(`奖励卡片 [${card.title || '无标题'}] isUsed值:`, card.isUsed);
            console.log(`奖励卡片 [${card.title || '无标题'}] used值:`, card.used);
        }
    });
    
    // Filter: Show only cards of type special and unused
    const filtered = cards.filter(card => {
        // Only show unused cards of type special
        const isSpecialCard = card.type === 'special';
        const isUnused = !card.isUsed && !card.used; // Check two possible usage status attributes
        
        const matchesSearch =
            (card.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (card.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesType =
            selectedType === 'All' || card.taskDuration === selectedType;

        return isSpecialCard && isUnused && matchesSearch && matchesType;
    });

    console.log("Special reward cards filtered:", filtered.length);

    // Handle quick create task with the selected card
    const handleQuickCreate = (card) => {
        if (onQuickCreate) {
            onQuickCreate(card);
        }
    };

    return (
        <div className="mb-8">
            {/* Filter */}
            <div className="card mb-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Enter reward title or description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        />
                    </div>

                    {/* Type select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Applicable Quest Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        >
                            {['All', 'short', 'long'].map(t => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Show Card */}
            {filtered.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No special reward cards available.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6">
                    {filtered.map(card => (
                        <RewardCardTile 
                            key={card._id || card.id} 
                            card={card} 
                            readOnly={true}
                            onQuickCreate={onQuickCreate ? handleQuickCreate : null}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

