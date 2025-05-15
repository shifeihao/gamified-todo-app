// src/pages/TasksPage/TimetablePanel.js
import React, { useState } from "react";
import { TaskSlots } from "../../components";
import { TaskCalendar } from "../../components";
import { Clipboard, Calendar, LayoutList } from "lucide-react";
import "react-calendar/dist/Calendar.css";

const TimetablePanel = ({
  equippedTasks,
  onComplete,
  onDelete,
  onEdit,
  onCreateTask,
  onDrop,
  onUnequip,
  user,
}) => {
  const [activeTab, setActiveTab] = useState("list");
  const longTasks = equippedTasks.filter((t) => t.type === "long");
  
  // 处理任务编辑，确保完成的任务不会打开编辑窗口
  const handleEdit = (task, forceEdit = false, isCompletion = false) => {
    // 如果是从任务完成触发的，不打开编辑窗口
    if (isCompletion) {
      console.log("Task completed, not opening edit window for long task");
      return;
    }
    
    // 正常传递给onEdit
    if (onEdit) {
      onEdit(task, forceEdit);
    }
  };
  
  return (
    <div className="bg-white/90 rounded-xl shadow-lg p-4 border border-blue-200 backdrop-blur-sm">
      {/* Fixed height title area */}
      <div className="flex items-center justify-between h-14">
        <h2 className="text-xl font-bold text-blue-900 flex items-center">
          <Clipboard className="h-6 w-6 mr-2" />
          Quest Chains
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1.5 rounded-md flex flex-col items-center transition-colors duration-200 ${
              activeTab === "list"
                ? "text-blue-600 bg-blue-50 font-semibold"
                : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
            }`}
            title="List"
          >
            <LayoutList size={18} />
            <span className="text-xs mt-1">List</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1.5 rounded-md flex flex-col items-center transition-colors duration-200 ${
              activeTab === "calendar"
                ? "text-blue-600 bg-blue-50 font-semibold"
                : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
            }`}
            title="Timetable"
          >
            <Calendar size={18} />
            <span className="text-xs mt-1">Timetable</span>
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        <TaskSlots
          items={longTasks}
          totalSlots={5}
          activeCount={user?.longCardSlot || 2}
          slotHeight="min-h-28"
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
          onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, "long")}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={handleEdit}
          onUnequip={onUnequip}
        />
      ) : (
                <TaskCalendar tasks={equippedTasks} />
            )}
    </div>
  );
};

export default TimetablePanel;
