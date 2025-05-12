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
  const longTasks = equippedTasks.filter((t) => t.type === "long");
  return (
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 border-2 border-blue-300 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-blue-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quest Chains
                </h2>
                <div className="flex space-x-2">
          <button
onClick={() => setActiveTab("list")}
className={`px-3 py-1 rounded text-sm transition-all duration-150 ${
    activeTab === "list"
        ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
        : "text-gray-500 hover:text-blue-500"
}`}
          >
            List
          </button>
          <button
onClick={() => setActiveTab("calendar")}
className={`px-3 py-1 rounded text-sm transition-all duration-150 ${
    activeTab === "calendar"
        ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
        : "text-gray-500 hover:text-blue-500"
}`}
          >
            Timetable
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        <TaskSlots
          items={longTasks}
          totalSlots={5}
          activeCount={user?.longCardSlot || 2}
          slotHeight="h-24"
          themeColor = 'blue'
          renderCreateContent={() => (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mb-1 text-blue-500"
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
                            <p className="text-sm text-blue-600">Click to create long term Task</p>
            </>
          )}
          onCreate={onCreateTask}
          // onDrop={onDrop}
          onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, "long")} // ✅ 明确类型
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
                <TaskCalendar tasks={equippedTasks} />
            )}
        </div>
    );
};

export default TimetablePanel;
