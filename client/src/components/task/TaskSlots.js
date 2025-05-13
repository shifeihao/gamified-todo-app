// components/TaskSlots.js
import React, { useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Plus, Lock } from 'lucide-react';

export const TaskSlots = ({
                            items = [],             // 待填充的任务列表
                            totalSlots = 5,         // 总槽位数
                            activeCount,        // 前 N 个可用，其余锁定
                            renderCreateContent,    // 渲染"新建"按钮内部结构
                            onCreate,               // 点击新建回调 (index -> slot)
                            onDrop,                 // 拖放到槽位回调 (taskId, index)
                              onComplete,
                              onDelete,
                              onEdit,
                              onUnequip,
                              slotHeight = 'min-h-28',  // 已修改为min-height而不是height
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
            primary: 'purple',
            gradientFrom: 'from-purple-400',
            gradientTo: 'to-indigo-600',
            border: 'border-purple-200',
            borderActive: 'border-purple-300',
            ringColor: 'ring-purple-200',
            text: 'text-purple-500',
            textHover: 'hover:text-purple-600',
            bg: 'bg-purple-50',
            bgHover: 'hover:bg-purple-100',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            shadowColor: 'shadow-purple-100'
        },
        blue: {
            primary: 'blue',
            gradientFrom: 'from-blue-400',
            gradientTo: 'to-indigo-600',
            border: 'border-blue-200',
            borderActive: 'border-blue-300',
            ringColor: 'ring-blue-200',
            text: 'text-blue-500',
            textHover: 'hover:text-blue-600',
            bg: 'bg-blue-50',
            bgHover: 'hover:bg-blue-100',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            shadowColor: 'shadow-blue-100'
        }
    };
    const theme = colorMap[themeColor] || colorMap.purple;

    const handleDragOver = e => {
        e.preventDefault();
        // 拖拽悬停时添加更明显的视觉反馈
        e.currentTarget.classList.add(theme.bg, theme.borderActive, 'ring-2', theme.ringColor);
    };

    const handleDragLeave = e => {
        e.currentTarget.classList.remove(theme.bg, theme.borderActive, 'ring-2', theme.ringColor);
    };

    const handleDrop = (e, idx) => {
        e.preventDefault();
        e.currentTarget.classList.remove(theme.bg, theme.borderActive, 'ring-2', theme.ringColor);
        try {
            const data = JSON.parse(e.dataTransfer.getData('task'));
            if (data.status === 'completed') return;
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
                          ${task
                            ? 'bg-white shadow-md'
                            : `
                              border border-dashed ${theme.border} bg-white/80 backdrop-blur-sm
                              hover:${theme.bg}
                              hover:shadow-lg hover:${theme.shadowColor}
                              hover:-translate-y-[2px]
                              shadow-sm
                            `}
                        `}
                    >
                        {task ? (
                            <TaskCard
                                className="w-full h-full"
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
                                className={`group absolute inset-0 w-full h-full flex flex-col items-center justify-center
                                ${theme.text} transition-all`}
                            >
                                <div className={`${theme.iconBg} ${theme.iconColor} w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                    <Plus className="w-5 h-5" />
                                </div>
                                <p className={`text-sm ${theme.text} group-hover:${theme.textHover}`}>Create New Task</p>
                                <p className="text-xs text-gray-400 mt-1">Slot {idx + 1}</p>
                            </button>
                        )}
                        
                        {/* 添加槽位序号指示器 */}
                        {task && (
                            <div className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full ${theme.iconBg} ${theme.iconColor} text-xs flex items-center justify-center shadow-sm`}>
                                {idx + 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        key={idx}
                        className={`
                          ${slotHeight} w-full rounded-xl bg-gray-50
                          border border-gray-200
                          flex flex-col items-center justify-center
                          shadow-sm
                          relative
                        `}
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="bg-gray-100 rounded-full p-2.5 border border-gray-200">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Slot Locked</p>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
