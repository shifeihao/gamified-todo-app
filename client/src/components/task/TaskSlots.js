import React, { useMemo } from 'react';
import {TaskCard} from './TaskCard';

export const TaskSlots = ({
  items = [],
  totalSlots = 5,
  activeCount = 2,
  slotHeight = 'h-28',
  renderCreateContent,
  onCreate,
  onDrop,
  onComplete,
  onDelete,
  onEdit,
  onUnequip,
}) => {
  // 生成插槽数组：如果 items 包含 slotPosition，则按 slotPosition 填充；否则按顺序填充前 activeCount 个
  const slots = useMemo(() => {
    const arr = Array(totalSlots).fill(null);
    if (items.length > 0 && items[0].slotPosition != null) {
      items.forEach(task => {
        const pos = task.slotPosition;
        if (pos >= 0 && pos < totalSlots) {
          arr[pos] = task;
        }
      });
    } else {
      items.slice(0, activeCount).forEach((task, idx) => {
        arr[idx] = task;
      });
    }
    return arr;
  }, [items, totalSlots, activeCount]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    if (onDrop) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('task'));
        onDrop(data._id, idx);
      } catch (err) {
        console.error('拖放任务时出错:', err);
      }
    }
  };

  const renderSlot = (task, idx) => (
    <div
      key={idx}
      className={`border-2 border-dashed border-gray-300 rounded-lg ${slotHeight} overflow-visible relative`}
      onDragOver={handleDragOver}
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
          onClick={() => onCreate && onCreate(idx)}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
        >
          {renderCreateContent(idx)}
        </button>
      )}
    </div>
  );

  const renderLocked = (idx) => (
    <div
      key={idx}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 ${slotHeight} flex items-center justify-center bg-gray-50`}
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
      <span className="ml-2 text-gray-400">锁定</span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto space-y-4">
      {slots.map((task, idx) =>
        idx < activeCount ? renderSlot(task, idx) : renderLocked(idx)
      )}
    </div>
  );
};