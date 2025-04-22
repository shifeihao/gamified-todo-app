import React from 'react';
import DailyTaskSlots from '../../components/DailyTaskSlots';

const DailyTaskPanel = ({
                            equippedTasks,
                            onComplete,
                            onDelete,
                            onEdit,
                            onUnequip,
                            onDrop,
                            onCreateTask
                        }) => {
    return (
        <DailyTaskSlots
            equippedTasks={equippedTasks}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onUnequip={onUnequip}
            onDrop={onDrop}
            onCreateTask={onCreateTask}
            totalSlots={5}     // 总共显示 5 个
            activeCount={2}    // 其中前 2 个可用，后面显示 “锁定”
        />
    );
};

export default DailyTaskPanel;
