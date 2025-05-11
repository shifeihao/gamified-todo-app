import React, { useState } from 'react';
import {TaskRepository} from '../../components';
import {TemplateList} from '../../components';
import {BlankCardRepository} from '../../components';

const RepositoryPanel = ({
    tasks,
    cards = [],
    onComplete,
    onDelete,
    onEdit,
    onEquip,
    onExpand,
    isExpanded
}) => {
    const [activeTab, setActiveTab] = useState('store');

    return (
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 border-2 border-amber-300 backdrop-blur-sm h-full relative">
            {/* 展开/收起按钮 */}
            <button
                onClick={() => onExpand(!isExpanded)}
                className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-amber-500 text-white rounded-full p-1 shadow-lg hover:bg-amber-600 transition-colors duration-200 z-10"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isExpanded ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                    />
                </svg>
            </button>

            {/* 标题与标签同一行 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-amber-900 flex items-center truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="truncate">任务卡片仓库</span>
                </h2>
                <div className="flex space-x-2 flex-shrink-0">
                    {['store', 'blank', 'template'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2 py-1 rounded text-sm transition-colors duration-200 ${
                                activeTab === tab
                                    ? 'text-amber-600 border-b-2 border-amber-600 font-semibold'
                                    : 'text-gray-500 hover:text-amber-500'
                            }`}
                        >
                            {tab === 'store' ? '存储' : tab === 'blank' ? 'blank' : '模板'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="mt-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {activeTab === 'store' && (
                    <TaskRepository
                        tasks={tasks}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onEquip={onEquip}
                    />
                )}
                {activeTab === 'blank' && (
                    <BlankCardRepository cards={cards} />
                )}
                {activeTab === 'template' && (
                    <TemplateList />
                )}
            </div>
        </div>
    );
};

export default RepositoryPanel;
