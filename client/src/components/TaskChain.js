import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';

// 长期任务槽组件：卡片铺满，菜单不被裁剪
const TaskChain = ({
                     tasks,
                     onComplete,
                     onDelete,
                     onEdit,
                     onCreateTask,
                     onDrop,
                   }) => {
  const longTermTasks = tasks.filter(task => task.type === '长期');
  const totalSlots = 5;
  const activeCount = 2;
  const [slots, setSlots] = useState(Array(totalSlots).fill(null));

  useEffect(() => {
    const newSlots = Array(totalSlots).fill(null);
    longTermTasks.forEach((task, idx) => {
      if (idx < activeCount) newSlots[idx] = task;
    });
    setSlots(newSlots);
  }, [longTermTasks]);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };
  const handleDragLeave = e => {
    e.currentTarget.classList.remove('bg-blue-50');
  };
  const handleDropItem = (e, idx) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    try {
      const data = JSON.parse(e.dataTransfer.getData('task'));
      if (data && onDrop) onDrop(data._id, idx);
    } catch (err) {
      console.error('拖放长期任务失败:', err);
    }
  };

  const renderSlot = (task, idx) => (
      <div
          key={idx}
          className="border-2 border-dashed border-gray-300 rounded-lg h-40 overflow-visible relative"
          onDragOver={e => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDropItem(e, idx)}
      >
        {task ? (
            <TaskCard
                className="absolute inset-0 w-full h-full"
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
            />
        ) : (
            <button
                onClick={() => onCreateTask && onCreateTask(idx)}
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
              <p>点击创建长期任务</p>
            </button>
        )}
      </div>
  );

  const renderLocked = idx => (
      <div
          key={idx}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-40 flex items-center justify-center bg-gray-50"
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
      <div className="flex flex-col space-y-4">
        {slots.map((task, idx) =>
            idx < activeCount ? renderSlot(task, idx) : renderLocked(idx)
        )}
      </div>
  );
};

export default TaskChain;
