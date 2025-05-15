import React from "react";
import { TaskSlots } from "../../components";
import { Zap } from "lucide-react";

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
    // Show only short-term tasks
    const shortTasks = equippedTasks.filter((t) => t.type === "short");

    // 处理任务编辑，确保完成的任务不会打开编辑窗口
    const handleEdit = (task, forceEdit = false, isCompletion = false) => {
        // 如果是从任务完成触发的，不打开编辑窗口
        if (isCompletion) {
            console.log("Task completed, not opening edit window for short task");
            return;
        }
        
        // 正常传递给onEdit
        if (onEdit) {
            onEdit(task, forceEdit);
        }
    };

    return (
        <div className="bg-white/90 rounded-xl shadow-lg p-4 border border-purple-200 backdrop-blur-sm">
      {/* Fixed height title area */}
      <div className="flex items-center justify-between h-14">
        <h2 className="text-xl font-bold text-purple-900 flex items-center">
          <Zap className="h-6 w-6 mr-2" />
          Quick Quests
        </h2>
        {/* Empty div, keeping the same structure as the other panel */}
        <div className="flex space-x-2">
        </div>
      </div>

            <TaskSlots
                items={shortTasks}
                totalSlots={5}
                activeCount={user?.shortCardSlot || 2}
                slotHeight="min-h-28"
                renderCreateContent={() => (
                    <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 mb-1 text-purple-500"
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
                        <p className="text-sm text-purple-600">Click to create short term Task</p>
                    </>
                )}
                onCreate={onCreateTask}
                onDrop={(taskId, slotIdx) => onDrop(taskId, slotIdx, "short")}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={handleEdit}
                onUnequip={onUnequip}
            />
        </div>
    );
};

export default DailyTaskPanel;