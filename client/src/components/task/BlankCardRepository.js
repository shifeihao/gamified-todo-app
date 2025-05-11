import React, { useState } from 'react';
import {RewardCardTile} from './RewardCardTile'; // ✅ 新增引用


export const BlankCardRepository = ({ cards }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    // 过滤
    const filtered = cards.filter(card => {
        const matchesSearch =
            card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
            selectedType === 'All' || card.taskDuration === selectedType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="mb-8">
            {/* 过滤器 */}
            <div className="card mb-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 搜索 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Enter quest title or description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        />
                    </div>

                    {/* 类型筛选 */}
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

            {/* 展示卡片 */}
            {filtered.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No reward cards match the criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6">
                    {filtered.map(card => (
                        <RewardCardTile key={card._id} card={card} readOnly={true} />
                    ))}
                </div>

            )}
        </div>
    );
};

