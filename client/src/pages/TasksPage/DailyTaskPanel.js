// src/pages/TasksPage/DailyTaskPanel.js
import React from "react";
import { TaskSlots } from "../../components";

const DailyTaskPanel = ({
  equippedTasks,
  onComplete,
  onDelete,
  onEdit,
  onUnequip,
  onDrop,
  onCreateTask,
  user,
}) => {
  // 只展示短期任务
  const shortTasks = equippedTasks.filter((t) => t.type === "短期");

  return (
    <div className="mb-8 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Quick Quests</h2>
      <TaskSlots
        items={shortTasks}
        totalSlots={5}
        activeCount={user?.shortCardSlot || 2}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p>点击创建短期任务</p>
          </>
        )}
        onCreate={onCreateTask}
        onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, "短期")}
        onComplete={onComplete}
        onDelete={onDelete}
        onEdit={onEdit}
        onUnequip={onUnequip}
      />
    </div>
  );
};

export default DailyTaskPanel;
