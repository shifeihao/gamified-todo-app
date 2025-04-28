// components/TaskSlots.js
import React, { useMemo } from 'react';
import { TaskCard } from './TaskCard';

export const TaskSlots = ({
                            items = [],             // 待填充的任务列表
                            totalSlots = 5,         // 总槽位数
                            activeCount = 2,        // 前 N 个可用，其余锁定
                            renderCreateContent,    // 渲染“新建”按钮内部结构
                            onCreate,               // 点击新建回调 (index -> slot)
                            onDrop,                 // 拖放到槽位回调 (taskId, index)
                            onComplete,
                            onDelete,
                            onEdit,
                            onUnequip,
                            slotHeight = 'h-28'     // 每个槽位的高度，可由父组件控制
                          }) => {
  // 根据 items 的 slotPosition 填充对应槽位；如果没有 slotPosition，则按顺序填充前 activeCount
  const slots = useMemo(() => {
    const arr = Array(totalSlots).fill(null);
    if (items.length && items[0].slotPosition != null) {
      items.forEach(task => {
        const pos = task.slotPosition;
        if (pos >= 0 && pos < totalSlots) arr[pos] = task;
      });
    } else {
      items.slice(0, activeCount).forEach((task, idx) => {
        arr[idx] = task;
      });
    }
    return arr;
  }, [items, totalSlots, activeCount]);

  const handleDragOver = e => {
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
      onDrop?.(data._id, idx);
    } catch {}
  };

  return (
      <div className="flex flex-col space-y-4">
        {slots.map((task, idx) =>
            idx < activeCount ? (
                <div
                    key={idx}
                    className={`border-2 border-dashed border-gray-300 rounded-lg ${slotHeight} relative w-full`}
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
                          onClick={() => onCreate?.(idx)}
                          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        {renderCreateContent?.()}
                      </button>
                  )}
                </div>
            ) : (
                <div
                    key={idx}
                    className={`border-2 border-dashed border-gray-300 rounded-lg ${slotHeight} flex items-center justify-center bg-gray-50 w-full`}
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                  <p className="ml-2 text-gray-400">锁定</p>
                </div>
            )
        )}
      </div>
  );
};
