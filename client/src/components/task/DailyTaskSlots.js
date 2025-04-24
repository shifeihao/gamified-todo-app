import React, { useState, useEffect } from 'react';
import {TaskCard} from './TaskCard';

// 每日任务槽组件：卡片铺满槽位，菜单不被裁剪
export const DailyTaskSlots = ({
                          equippedTasks,
                          onComplete,
                          onDelete,
                          onEdit,
                          onUnequip,
                          onDrop,
                          onCreateTask,
                          totalSlots = 5,
                          activeCount = 2,
                        }) => {
  const [slots, setSlots] = useState(() => Array(totalSlots).fill(null));

  useEffect(() => {
    const newSlots = Array(totalSlots).fill(null);
    equippedTasks.forEach(task => {
      if (task.slotPosition >= 0 && task.slotPosition < totalSlots) {
        newSlots[task.slotPosition] = task;
      }
    });
    setSlots(newSlots);
  }, [equippedTasks, totalSlots]);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };
  const handleDragLeave = e => {
    e.currentTarget.classList.remove('bg-blue-50');
  };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    try {
      const data = JSON.parse(e.dataTransfer.getData('task'));
      if (data && onDrop) onDrop(data._id, idx);
    } catch (err) {
      console.error('拖放任务时出错:', err);
    }
  };

  // 渲染可用槽
  const renderSlot = (task, idx) => (
      <div
          key={idx}
className="border-2 border-dashed border-gray-300 rounded-lg h-28 overflow-visible relative"
          onDragOver={e => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, idx)}
      >
        {task ? (
            <TaskCard
                className="absolute inset-0 w-full h-full"
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onUnequip={onUnequip}
                isEquipped
            />
        ) : (
            <button
                onClick={() => onCreateTask(idx)}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p>点击创建新任务</p>
            </button>
        )}
      </div>
  );

  // 渲染锁定槽
  const renderLocked = idx => (
      <div
          key={idx}
className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-28 flex items-center justify-center bg-gray-50"
      >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
          <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z"
          />
          <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"
          />
        </svg>
        <p className="ml-2 text-gray-400">锁定</p>
      </div>
  );

  return (
      <div className="flex flex-col h-screen mb-8">
        <h2 className="text-xl font-bold mb-4">短期任务槽 Quick Quests</h2>
        <div className="flex flex-col flex-1 overflow-y-auto space-y-4">
          {slots.map((task, idx) =>
              idx < activeCount ? renderSlot(task, idx) : renderLocked(idx)
          )}
        </div>
      </div>
  );
};