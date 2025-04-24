import React, { useState } from 'react';
import {RewardCardTile} from './RewardCardTile'; // ✅ 新增引用


export const BlankCardRepository = ({ cards }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('全部');

    // 过滤
    const filtered = cards.filter(card => {
        const matchesSearch =
            card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
            selectedType === '全部' || card.taskDuration === selectedType;

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
                            搜索卡片
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="输入卡片标题或描述..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        />
                    </div>

                    {/* 类型筛选 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            适用任务类型
                        </label>
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        >
                            {['全部', '短期', '长期'].map(t => (
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
                    <p className="text-gray-500">没有符合条件的奖励卡片</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filtered.map(card => (
                        <RewardCardTile key={card._id} card={card} readOnly={true} />
                    ))}
                </div>

            )}
        </div>
    );
};

