import React from 'react';
import DailyTaskSlots from '../../components/DailyTaskSlots';
import TaskRepository from '../../components/TaskRepository';

const DailyTaskPanel = ({
                            equippedTasks,
                            tasks,
                            onComplete,
                            onDelete,
                            onEdit,
                            onUnequip,
                            onDrop,
                            onCreateTask,
                            onEquip
                        }) => {
    // 仅展示未装备的任务（仓库内容）
    const unequippedTasks = tasks.filter(task => !task.equipped);

    return (
        <div className="space-y-8">
            {/* 每日任务槽 */}
            <DailyTaskSlots
                equippedTasks={equippedTasks}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onUnequip={onUnequip}
                onDrop={onDrop}
                onCreateTask={onCreateTask}
            />

            {/* 仓库任务 - 用于拖拽到槽 */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">任务仓库</h2>
                <TaskRepository
                    tasks={unequippedTasks}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onEquip={onEquip}  // 拖拽成功后调用
                />
            </div>
        </div>
    );
};

export default DailyTaskPanel;
