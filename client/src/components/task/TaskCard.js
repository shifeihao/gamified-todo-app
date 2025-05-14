// client/src/components/task/TaskCard.js
import React, { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Award, Edit2, Info, Trash2, CheckSquare, Square,
  BookOpen, BookMarked, GraduationCap,
  Microscope, Users, Kanban,
  Code, Palette, Wrench,
  Dumbbell, Trophy, Heart,
  Sparkles, Gamepad2, Share2,
  FileText, Zap, CalendarDays,
  Clock, Calendar
} from "lucide-react";
import { TaskDetailModal } from "../modal";
import { tagStyleMap } from "./tagStyles";
import { useRemainingTime } from "../hooks/useRemainingTime";
import axios from "axios";
import toast from "react-hot-toast";
import AuthContext from "../../context/AuthContext";

// 图标映射，用于渲染任务分类图标
const iconComponents = {
  BookOpen, BookMarked, GraduationCap,
  Microscope, Users, Kanban,
  Code, Palette, Wrench,
  Dumbbell, Trophy, Heart,
  Sparkles, Gamepad2, Share2,
  FileText, Zap, CalendarDays
};

export const TaskCard = ({
  task,
  onComplete, onDelete, onEdit, onEquip, onUnequip,
  onDragStart, draggable = false, isEquipped = false, className = "",
}) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [completingSubtask, setCompletingSubtask] = useState(false);
  const [processingSubtaskIndex, setProcessingSubtaskIndex] = useState(null);
  const [localSubTasks, setLocalSubTasks] = useState(task.subTasks || []);
  const isExpired = isEquipped && task.expired === true;
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setLocalSubTasks(task.subTasks || []);
  }, [task.subTasks]);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  });
  const timeLeft = useRemainingTime(isEquipped, task.dueDate);

  // 计算子任务完成进度
  const progress = React.useMemo(() => {
    if (!localSubTasks.length) return 0;
    const done = localSubTasks.filter(s => s.status === "completed").length;
    return Math.round((done / localSubTasks.length) * 100);
  }, [localSubTasks]);

  // 根据分类选择颜色和图标
  const typeStyles = React.useMemo(() => {
    const key = task.category?.toLowerCase() || "others";
    return tagStyleMap[key] ?? tagStyleMap.others;
  }, [task.category]);
  const CategoryIcon = React.useMemo(() => {
    const iconName = typeStyles.iconName || 'FileText';
    return iconComponents[iconName] || FileText;
  }, [typeStyles]);

  // 根据任务状态映射 Badge 样式
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

  // 处理子任务完成逻辑
  const handleSubtaskComplete = async idx => {
    if (completingSubtask || processingSubtaskIndex === idx) return;
    setCompletingSubtask(true);
    setProcessingSubtaskIndex(idx);

    try {
      if (localSubTasks[idx].status === "completed") {
        toast.error("This subtask is already completed");
        return;
      }
      // UI 先行更新
      const updated = [...localSubTasks];
      updated[idx] = { ...updated[idx], status: "completed" };
      setLocalSubTasks(updated);

      const { data } = await axios.put(
        `/api/tasks/${task._id}`,
        { subTaskIndex: idx },
        getAuthConfig()
      );
      const { subTaskReward, task: updatedTask } = data;

      // 奖励提示
      if (subTaskReward) {
        toast.success(
          <div className="flex flex-col space-y-1">
            <span className="font-semibold text-sm">Subtask completed!</span>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">🏅</span>
              <span className="text-xs">
                Earned <span className="font-bold text-yellow-600">{subTaskReward.expGained} XP</span>
                and <span className="font-bold text-amber-500">{subTaskReward.goldGained} Gold</span>
              </span>
            </div>
          </div>,
          { duration: 5000, position: 'top-center' }
        );
      } else {
        toast.success("Subtask completed!");
      }

      // 更新任务数据
      if (onEdit && updatedTask) {
        onEdit(updatedTask);
      }

      // 触发子任务完成事件，更新等级条
      window.dispatchEvent(new CustomEvent('subtaskCompleted'));
    } catch (error) {
      console.error("Failed to complete subtask:", error);
      toast.error(error.response?.data?.message || "Failed to complete subtask");

      // 如果API调用失败，恢复本地状态
      setLocalSubTasks(task.subTasks || []);
    } finally {
      setCompletingSubtask(false);
      setProcessingSubtaskIndex(null);
    }
  };

  const DetailModal = (
    <TaskDetailModal
      isOpen={detailOpen}
      onClose={() => setDetailOpen(false)}
      taskId={task._id}
      onTaskUpdated={onEdit}
      onTaskDeleted={id => { onDelete(id); setDetailOpen(false); }}
    />
  );

  // 已过期模式
  if (isExpired) {
    return (
      <div className={`flex overflow-hidden relative rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
        {/* 左侧色条：红色表示过期 */}
        <div className="w-1.5 md:w-2 flex-shrink-0 bg-red-500" />
        <div className="relative w-full p-4 flex flex-col items-center justify-center">
          {/* 红色角标 */}
          <div className="absolute top-0 right-0 bg-red-500 px-2 py-1 text-xs font-bold text-white">
            Expired
          </div>
          <h3 className="mb-4 mt-2 text-base font-bold text-gray-800 text-center">
            {task.title}
          </h3>
          <button
            onClick={() => onDelete(task._id)}
            className="rounded bg-red-500 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // 装备中模式
  if (isEquipped) {
    return (
      <>
        <div
          className={`flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md ${task.type==='short' ? 'hover:bg-purple-50' : 'hover:bg-blue-50'} transition-all duration-300 ${className}`}
          draggable={draggable}
          onDragStart={e => onDragStart?.(e, task)}
        >
          {/* 左侧类型色条：短期/连锁 */}
          <div className={`w-1.5 md:w-2 flex-shrink-0 ${task.type==='short' ? 'bg-purple-500' : 'bg-blue-500'}`}/>

          <div className="relative w-full space-y-2 p-2">
            {/* 状态徽章 */}
            <div className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${task.status === "pending" ? "bg-blue-100 text-blue-800 border-blue-200" : statusStyles}`}>
              {task.status === "pending" ? "in-progress" : task.status}
            </div>
            {/* 标题 & 描述 */}
            <div>
              <h3 className="font-bold text-gray-900 line-clamp-1 mt-1">{task.title}</h3>
              {task.description && (
                <p className="line-clamp-2 text-xs text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
            {/* 子任务进度 & 列表 */}
            {localSubTasks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Progress</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      task.type==='short'?'bg-purple-500':'bg-blue-500'
                    } transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="space-y-1 mt-0.5">
                  {localSubTasks.slice(0, 2).map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {sub.status==="completed" ? (
                        <CheckSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <Square
                          data-testid="subtask-icon"
                          className="h-3 w-3 text-gray-400 flex-shrink-0 cursor-pointer hover:text-blue-500"
                          onClick={() => handleSubtaskComplete(idx)}
                        />
                      )}
                      <span className={`text-xs ${
                        sub.status==="completed"?"line-through text-gray-400":"text-gray-600"
                      } line-clamp-1`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                  {localSubTasks.length > 2 && (
                    <div
                      className="text-xs text-blue-500 cursor-pointer hover:text-blue-600 mt-0.5"
                      onClick={() => setDetailOpen(true)}
                    >
                      +{localSubTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* 底部时间信息 */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span data-testid="time-left">{timeLeft || "-"}</span>
              </div>
            </div>
            {/* 操作按钮区 */}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
              <div className="flex space-x-2">
                {(task.status === "in-progress" || task.status === "pending") && (
                  <button
                    onClick={() => onComplete?.(task._id)}
                    className={`rounded p-1 ${
                      task.type==='short' ? 'text-purple-600 hover:bg-purple-100' : 'text-blue-600 hover:bg-blue-100'
                    } transition-colors`}
                    title="Complete Task"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDetailOpen(true)}
                  className="rounded p-1 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="View Details"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {DetailModal}
      </>
    );
  }

  // 仓库模式（默认）
  return (
    <>
      <div
        className={`flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 task-card ${className}`}
        draggable={draggable && task.status !== "completed"}
        onDragStart={e => onDragStart?.(e, task)}
      >
        {/* 类型色条 */}
          <div className={`w-1.5 md:w-2 flex-shrink-0 ${task.type==='short'?'bg-purple-500':'bg-blue-500'}`} />
        <div className="relative w-full space-y-3 p-3">
          {/* 状态徽章 */}
          <div className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${statusStyles}`}>
            {task.status}
          </div>
          {/* 标题 & 描述 */}
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1 mt-1">{task.title}</h3>
            {task.description && (
              <p className="line-clamp-2 text-xs text-gray-600 mt-1">{task.description}</p>
            )}
          </div>
          {/* 进度条 */}
          {task.subTasks?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    task.type==='short'?'bg-purple-500':'bg-blue-500'
                  } transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {/* 操作区 */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-2">
              {task.status === "in-progress" && (
                <button
                  onClick={() => onComplete?.(task._id)}
                  className={`rounded p-1 ${
                    task.type==='short' ? 'text-purple-600 hover:bg-purple-100' : 'text-blue-600 hover:bg-blue-100'
                  } transition-colors`}
                  title="Complete Task"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setDetailOpen(true)}
                className="rounded-full border border-blue-500 w-5 h-5 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                title="View Details"
              >
                <span className="text-xs font-bold">i</span>
              </button>
              {task.status !== "completed" && (
                <>
                  <button
                    onClick={() => onEquip(task)}
                    className="rounded p-1 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Equip Task"
                  >
                    <Award className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="rounded p-1 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Edit Task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(task._id)}
                className="rounded p-1 text-red-600 hover:bg-red-100 transition-colors"
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
