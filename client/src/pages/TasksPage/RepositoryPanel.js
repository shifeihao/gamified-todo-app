import React, { useState } from 'react';
import TaskRepository from '../../components/TaskRepository';
import BlankCardRepository from '../../components/BlankCardRepository';
import TemplateList from '../../components/TemplateList';

const RepositoryPanel = ({
                             tasks,
                             cards = [], // ✅ 新增卡片数据
                             onComplete,
                             onDelete,
                             onEdit,
                             onEquip
                         }) => {
    const [activeTab, setActiveTab] = useState('store');

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">任务卡片仓库</h2>
                <div className="flex space-x-4">
                    {['store', 'blank', 'template'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 rounded ${
                                activeTab === tab
                                    ? 'text-purple-600 border-b-2 border-purple-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            {tab === 'store' ? '存储' : tab === 'blank' ? 'blank' : '模板'}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'store' ? (
                <TaskRepository
                    tasks={tasks}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onEquip={onEquip}
                />
            ) : activeTab === 'blank' ? (
                <BlankCardRepository
                    cards={cards.filter(c => c.type === 'special' && !c.used)}
                />
            ) : (
                <TemplateList />
            )}
        </div>
    );
};

export default RepositoryPanel;
