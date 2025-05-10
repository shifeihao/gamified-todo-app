// src/pages/TasksPage/TimetablePanel.js
import React, { useState } from "react";
import { TaskSlots } from "../../components";
import { TaskCalendar } from "../../components";
import "react-calendar/dist/Calendar.css";

const TimetablePanel = ({
  equippedTasks,
  onComplete,
  onDelete,
  onEdit,
  onCreateTask,
  onDrop,
  user,
}) => {
  const [activeTab, setActiveTab] = useState("list");
  const longTasks = equippedTasks.filter((t) => t.type === "长期");

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Quest Chains</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1 rounded transition-all duration-150 ${
              activeTab === "list"
                ? "text-purple-600 border-b-2 border-purple-600 font-semibold"
                : "text-gray-500"
            }`}
          >
            任务列表
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1 rounded transition-all duration-150 ${
              activeTab === "calendar"
                ? "text-purple-600 border-b-2 border-purple-600 font-semibold"
                : "text-gray-500"
            }`}
          >
            时刻表
          </button>
        </div>
      </div>

      {/* 卡片槽部分 */}
      {activeTab === "list" ? (
        <TaskSlots
          items={longTasks}
          totalSlots={5}
          activeCount={user?.longCardSlot || 2}
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
              <p>点击创建长期任务</p>
            </>
          )}
          onCreate={onCreateTask}
          onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, "长期")} // ✅ 明确类型
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <TaskCalendar tasks={equippedTasks} /> // ✅ 替换为真正的日历视图
      )}
    </div>
  );
};

export default TimetablePanel;
