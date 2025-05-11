// src/pages/TasksPage/DailyTaskPanel.js
import React from 'react';
import {TaskSlots} from '../../components';

const DailyTaskPanel = ({
                            equippedTasks,
                            onComplete,
                            onDelete,
                            onEdit,
                            onUnequip,
                            onDrop,
                            onCreateTask
                        }) => {
    // 只展示短期任务
    const shortTasks = equippedTasks.filter(t => t.type === '短期');

    return (
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 border-2 border-purple-300 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Quests
            </h2>
            <TaskSlots
                items={shortTasks}
                totalSlots={5}
                activeCount={2}
                slotHeight="h-24"
                renderCreateContent={() => (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-purple-500"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-sm text-purple-600">点击创建短期任务</p>
                    </>
                )}
                onCreate={onCreateTask}
                onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, '短期')}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onUnequip={onUnequip}
            />
        </div>
    );
};

export default DailyTaskPanel;
