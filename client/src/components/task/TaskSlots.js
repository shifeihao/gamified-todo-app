// components/TaskSlots.js
import React, { useMemo } from 'react';
import { TaskCard } from './TaskCard';

export const TaskSlots = ({
                              items = [],
                              totalSlots = 5,
                              activeCount,
                              renderCreateContent,
                              onCreate,
                              onDrop,
                              onComplete,
                              onDelete,
                              onEdit,
                              onUnequip,
                              slotHeight = 'h-28',
                              themeColor = 'purple'  // 新增主题色参数
                          }) => {
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

    // 动态构建颜色类（text, bg, border）
    const colorMap = {
        purple: {
            border: 'border-purple-500',
            borderLite: 'border-purple-400',
            text: 'text-purple-500',
            textHover: 'hover:text-purple-600',
            bg: 'bg-purple-50',
            bgHover: 'hover:bg-purple-100',
        },
        blue: {
            border: 'border-blue-500',
            borderLite: 'border-blue-400',
            text: 'text-blue-500',
            textHover: 'hover:text-blue-600',
            bg: 'bg-blue-50',
            bgHover: 'hover:bg-blue-100',
        }
    };
    const theme = colorMap[themeColor] || colorMap.purple;

    const handleDragOver = e => {
        e.preventDefault();
        e.currentTarget.classList.add(theme.bg);
    };

    const handleDragLeave = e => {
        e.currentTarget.classList.remove(theme.bg);
    };

    const handleDrop = (e, idx) => {
        e.preventDefault();
        e.currentTarget.classList.remove(theme.bg);
        try {
            const data = JSON.parse(e.dataTransfer.getData('task'));
            if (data.status === 'Completed') return;
            onDrop?.(data._id, idx);
        } catch {}
    };

    return (
        <div className="flex flex-col space-y-4">
            {slots.map((task, idx) =>
                idx < activeCount ? (
                    <div
                        key={idx}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, idx)}
                        className={`
    relative ${slotHeight} w-full rounded-xl transition-all duration-300
    border-l-4
    ${task
                            ? `${theme.border} shadow-[0_6px_10px_rgba(0,0,0,0.06)] bg-white`
                            : `
        ${theme.borderLite} bg-white
        hover:${theme.bg}
        hover:shadow-lg hover:shadow-${themeColor}-200
        hover:-translate-y-[2px]
        shadow-sm
      `
                        }
  `}
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
                                className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center
                            ${theme.text} ${theme.textHover} transition-all`}
                            >
                                {renderCreateContent?.()}
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        key={idx}
                        className={`
              ${slotHeight} w-full rounded-xl  bg-gray-100
              flex items-center justify-center text-gray-400
              shadow-inner
            `}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                        <p className="ml-2">locked</p>
                    </div>
                )
            )}
        </div>
    );
};
