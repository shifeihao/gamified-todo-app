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
  return (
    <div className="mb-8 flex flex-col h-screen">
      <h2 className="text-xl font-bold mb-4">Quick Quests</h2>
      <TaskSlots
        items={equippedTasks}
        totalSlots={5}
        activeCount={2}
        slotHeight="h-28"
        renderCreateContent={() => (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p>点击创建短期任务</p>
          </>
        )}
        onCreate={onCreateTask}
        onDrop={onDrop}
        onComplete={onComplete}
        onDelete={onDelete}
        onEdit={onEdit}
        onUnequip={onUnequip}
      />
    </div>
  );
};

export default DailyTaskPanel;
