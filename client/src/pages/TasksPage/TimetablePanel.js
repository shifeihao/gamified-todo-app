import React, { useState } from 'react';
import {TaskSlots} from '../../components';

const TimetablePanel = ({ tasks, onComplete, onDelete, onEdit, onCreateTask, onDrop }) => {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Quest Chains</h2>
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
                <TaskSlots
                    items={tasks.filter(task => task.type === '长期')}
                    totalSlots={5}
                    activeCount={2}
                    slotHeight="h-40"
                    renderCreateContent={() => (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <p>点击创建长期任务</p>
                        </>
                    )}
                    onCreate={onCreateTask}
                    onDrop={onDrop}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            ) : (
                <p className="text-gray-500">日历视图待开发……</p>
            )}
        </div>
    );
};

export default TimetablePanel;
