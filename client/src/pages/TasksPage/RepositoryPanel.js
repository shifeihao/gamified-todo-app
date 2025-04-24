import React, { useState } from 'react';
import {TaskRepository} from '../../components';
import {TemplateList} from '../../components'; // 后续实现

const RepositoryPanel = ({
                             tasks,
                             onComplete,
                             onDelete,
                             onEdit,
                             onEquip
                         }) => {
    const [activeTab, setActiveTab] = useState('store');

    return (
        <div className="mb-8">
            {/* 标题与标签同一行 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">任务卡片仓库</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-3 py-1 rounded ${
                            activeTab === 'store'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                        }`}
                    >
                        存储
                    </button>
                    <button
                        onClick={() => setActiveTab('template')}
                        className={`px-3 py-1 rounded ${
                            activeTab === 'template'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                        }`}
                    >
                        模板
                    </button>
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
            ) : (
                <TemplateList />
            )}
        </div>
    );
};

export default RepositoryPanel;
