// client/src/components/task/TaskCard.js
import React, { useState } from "react";
import PropTypes from "prop-types";
import { 
  Award, Edit2, Info, Trash2, 
  // 导入所有可能用到的图标
  BookOpen, BookMarked, GraduationCap,
  Microscope, Users, Kanban,
  Code, Palette, Wrench,
  Dumbbell, Trophy, Heart,
  Sparkles, Gamepad2, Share2,
  FileText, Zap, CalendarDays 
} from "lucide-react";
import { TaskDetailModal } from "../modal";
import { tagStyleMap } from "./tagStyles";
import { useRemainingTime } from "../hooks/useRemainingTime";

// 图标映射对象，将图标名映射到图标组件
const iconComponents = {
  BookOpen, BookMarked, GraduationCap,
  Microscope, Users, Kanban,
  Code, Palette, Wrench,
  Dumbbell, Trophy, Heart,
  Sparkles, Gamepad2, Share2,
  FileText, Zap, CalendarDays
};

/**
 * TaskCard component renders a task card in three modes:
 * 1. Repository mode (inventory) - default
 * 2. Equipped mode (active slot)
 * 3. Expired mode (for equipped tasks that are past due)
 */
export const TaskCard = ({
  task,
  // actions
  onComplete,
  onDelete,
  onEdit,
  onEquip,
  onUnequip,
  // misc
  onDragStart,
  draggable = false,
  isEquipped = false,
  className = "",
}) => {
  /* ------------------------------------------------------------------ */
  /*  Local state                                                        */
  /* ------------------------------------------------------------------ */
  const [detailOpen, setDetailOpen] = useState(false);
  const isExpired = isEquipped && task.expired === true;

  // Custom hook for calculating remaining time
  const timeLeft = useRemainingTime(isEquipped, task.dueDate);

  /* ------------------------------------------------------------------ */
  /*  Memoized values                                                    */
  /* ------------------------------------------------------------------ */
  /** % progress of completed subtasks */
  const progress = React.useMemo(() => {
    if (!task.subTasks?.length) return 0;
    const done = task.subTasks.filter((s) => s.status === "completed").length;
    return Math.round((done / task.subTasks.length) * 100);
  }, [task.subTasks]);

  /** Color scheme derived from task.category */
  const typeStyles = React.useMemo(() => {
    const key = task.category?.toLowerCase() || "others";
    return tagStyleMap[key] ?? tagStyleMap.others;
  }, [task.category]);

  // 获取对应的图标组件
  const CategoryIcon = React.useMemo(() => {
    const iconName = typeStyles.iconName || 'FileText';
    return iconComponents[iconName] || FileText;
  }, [typeStyles]);

  /** Badge styles based on task.status */
  const statusStyles = React.useMemo(() => {
    switch (task.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, [task.status]);

  /* ------------------------------------------------------------------ */
  /*  UI Components                                                      */
  /* ------------------------------------------------------------------ */
  // Detail modal - shared across all renderings
  const DetailModal = (
    <TaskDetailModal
      isOpen={detailOpen}
      onClose={() => setDetailOpen(false)}
      taskId={task._id}
      onTaskUpdated={(updatedTask) => {
        // 如果有onEdit回调，则调用它
        if (onEdit) {
          onEdit(updatedTask);
        }
      }}
      onTaskDeleted={(deletedTaskId) => {
        // 如果有onDelete回调，则调用它
        if (onDelete) {
          onDelete(deletedTaskId);
        }
        setDetailOpen(false);
      }}
    />
  );

  // 首字母大写的辅助函数
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Category indicator - left side of the card
  const LeftTag = (
    <div
      className="w-1/6 bg-gray-100 bg-opacity-50 flex items-center justify-center"
    >
      <span
        className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1"
      >
        <CategoryIcon size={16} className={typeStyles.textColor} />
        <span className={typeStyles.textColor}>{capitalizeFirstLetter(task.category) || "Task"}</span>
      </span>
    </div>
  );

  // Subtasks list
  const SubTasks =
    task.subTasks?.length > 0 ? (
      <div className="mb-4">
        <div className="mb-2 font-semibold text-gray-800">Subtasks</div>
        <ul>
          {task.subTasks.map((sub, idx) => (
            <li key={idx} className="mb-1 flex items-center">
              <input
                type="checkbox"
                checked={sub.status === "completed"}
                readOnly
                className="mr-2"
              />
              <span
                className={
                  sub.status === "completed" ? "line-through text-gray-400" : ""
                }
              >
                {sub.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  /* ------------------------------------------------------------------ */
  /*  Render Branches                                                    */
  /* ------------------------------------------------------------------ */

  // EXPIRED MODE
  if (isExpired) {
    return (
      <div
        className={`card expires relative flex h-40 flex-col items-center justify-center p-4 text-sm transition-shadow hover:shadow-lg ${className}`}
      >
        <div className="absolute top-0 right-0 rounded-bl bg-red-600 px-3 py-1 text-sm font-bold text-white">
          Expired
        </div>

        <h3 className="mb-4 truncate text-center text-base font-bold">
          {task.title}
        </h3>

        <button
          onClick={() => onDelete(task._id)}
          className="rounded bg-red-500 px-4 py-2 font-semibold text-white shadow hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    );
  }

  // EQUIPPED MODE (active slot)
  if (isEquipped) {
    return (
      <>
        <div
          className={`flex h-full overflow-hidden rounded-lg border border-gray-300 bg-white bg-opacity-40 shadow-lg transition-all duration-300 ${className}`}
          draggable={draggable}
          onDragStart={(e) => onDragStart?.(e, task)}
        >
          {LeftTag}

          <div className="relative w-5/6 space-y-4 p-4">
            {/* title & description */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-700">{task.description}</p>
              )}
            </div>

            {/* subtasks (if any) */}
            {SubTasks}

            {/* footer */}
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}
              </span>
              <span>Remain: {timeLeft || "-"}</span>
            </div>

            {/* status badge */}
            <div className="select-none absolute top-2 right-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {task.status}
            </div>

            {/* actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => onComplete(task._id)}
                className="btn-primary px-2 py-1 text-xs"
              >
                Complete
              </button>
              <button
                onClick={() => setDetailOpen(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Check
              </button>
              <button
                onClick={() => onUnequip(task._id)}
                className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                title="Unequip Task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {DetailModal}
      </>
    );
  }

  // REPOSITORY MODE (default)
  return (
    <>
      <div
        className={`flex overflow-hidden rounded-lg border border-gray-300 bg-white bg-opacity-40 shadow-lg transition-all duration-300 task-card ${className}`}
        draggable={draggable && task.status !== "completed"}
        onDragStart={(e) => onDragStart?.(e, task)}
      >
        {LeftTag}

        <div className="relative w-5/6 space-y-4 p-4">
          {/* status badge */}
          <div
            className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${statusStyles}`}
          >
            {task.status}
          </div>

          {/* title & description */}
          <div>
            <h3 className="mb-2 font-bold text-gray-900">{task.title}</h3>
            {task.description && (
              <p className="line-clamp-2 text-sm text-gray-600">
                {task.description}
              </p>
            )}
          </div>

          {/* progress bar (if subtasks) */}
          {task.subTasks?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setDetailOpen(true)}
              className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
              title="View Details"
            >
              <Info className="h-4 w-4" />
            </button>
            <div className="flex space-x-2">
              {task.status !== "completed" && (
                <>
                  <button
                    onClick={() => onEquip(task)}
                    className="rounded p-1 text-purple-600 transition-colors hover:bg-purple-100"
                    title="Equip Task"
                  >
                    <Award className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
                    title="Edit Task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}

              <button
                onClick={() => onDelete(task._id)}
                className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                title="Delete Task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {DetailModal}
    </>
  );
};

// PropTypes for better type safety and documentation
TaskCard.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    expired: PropTypes.bool,
    subTasks: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        status: PropTypes.string
      })
    )
  }).isRequired,
  onComplete: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onEquip: PropTypes.func,
  onUnequip: PropTypes.func,
  onDragStart: PropTypes.func,
  draggable: PropTypes.bool,
  isEquipped: PropTypes.bool,
  className: PropTypes.string
};
