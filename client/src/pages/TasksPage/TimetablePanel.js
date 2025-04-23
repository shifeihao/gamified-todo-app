import React, { useState } from 'react';
import TaskChain from '../../components/TaskChain';

const TimetablePanel = ({ tasks, onComplete, onDelete, onEdit, onCreateTask, onDrop }) => {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div className="mb-8">
            {/* 标题与二级标签同一行 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">长期任务槽</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-3 py-1 rounded ${
                            activeTab === 'list'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                        }`}
                    >
                        任务列表
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`px-3 py-1 rounded ${
                            activeTab === 'calendar'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                        }`}
                    >
                        时刻表
                    </button>
                </div>
            </div>

            {activeTab === 'list' ? (
                <TaskChain
                    tasks={tasks}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onCreateTask={onCreateTask}
                    onDrop={onDrop}
                />
            ) : (
                <p className="text-gray-500">日历视图待开发……</p>
            )}
        </div>
    );
};

export default TimetablePanel;
