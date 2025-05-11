// src/pages/TasksPage/index.js
import React, { useState, useEffect, useContext } from "react";
import { Navbar } from "../../components";
import { CreateTaskModal } from "../../components";
import AuthContext from "../../context/AuthContext";
import { NewTaskCard } from '../../components/task/NewTaskCard';
import { useToast } from '../../contexts/ToastContext';

import DailyTaskPanel from "./DailyTaskPanel";
import TimetablePanel from "./TimetablePanel";
import RepositoryPanel from "./RepositoryPanel";
import { getCardInventory } from "../../services/cardService";
import axios from "axios";

// 仅用于读数据，不纳入 useApiAction
import {
  getTasks,
  getEquippedTasks,
  getEquippedShortTasks,
  getEquippedLongTasks,
} from "../../services/taskService";

// 下面这些带 Service 后缀的函数，交给 useApiAction 管理 loading / error / 回调
import {
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  completeTask as completeTaskService,
  equipTask as equipTaskService,
  unequipTask as unequipTaskService,
} from "../../services/taskService";

import { useApiAction } from "../../components/hooks";

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // 短期任务槽
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // 长期任务槽
  const [rewardInfo, setRewardInfo] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState("短期"); // 默认创建任务类型

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 当前激活的 tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState("daily");

  // 拉取任务与卡片库存
  const fetchTasks = async () => {
    try {
      const [allTasks, equipped, shortTasks, longTasks, inventory, levelInfo] =
        await Promise.all([
          getTasks(user.token),
          getEquippedTasks(user.token),
          getEquippedShortTasks(user.token),
          getEquippedLongTasks(user.token),
          getCardInventory(user.token),
          axios.get("/api/levels/userLevelBar", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
      setTasks(allTasks);
      setEquippedShortTasks(shortTasks);
      setEquippedLongTasks(longTasks);
      setCards(inventory);
      setRewardInfo(levelInfo.data);
      setError("");
    } catch (err) {
      console.error(err);
      showError("Failed to obtain task data");
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTasks();
    }
  }, [user]);

  // 显示成功信息
  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // -----------------------------
  // 1. 删除任务
  // -----------------------------
  const {
    execute: doDeleteTask,
    isLoading: deleting,
    error: deleteError,
  } = useApiAction(deleteTaskService, {
    onSuccess: () => {
      showSuccess("Task deleted");
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      showError("Failed to delete task");
    },
  });

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete the task?")) return;
    doDeleteTask(id, user.token);
  };

  // -----------------------------
  // 2. 完成任务（并卸下已完成的任务）
  // -----------------------------
  const {
    execute: doCompleteTask,
    isLoading: completing,
    error: completeError,
  } = useApiAction(completeTaskService, {
    onSuccess: async (task) => {
      showSuccess("Task Completed");

      // 触发等级更新事件
      window.dispatchEvent(new CustomEvent('taskCompleted'));

      await unequipTaskService(task.task._id, user.token);
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      showError("Failed to complete the task");
    },
  });

  const handleComplete = (id) => {
    doCompleteTask(id, user.token);
  };

  // -----------------------------
  // 3. 创建任务
  // -----------------------------
  const {
    execute: doCreateTask,
    isLoading: creating,
    error: createError,
  } = useApiAction(createTaskService, {
    onSuccess: async (res, input) => {
      showSuccess("Task created");
      if (input?.fromSlot && input?.slotIndex >= 0) {
        const isLong = input.type === "长期";
        const slotType = isLong ? "long" : "short";
        await equipTaskService(res._id, input.slotIndex, user.token, slotType);
        showSuccess(`已装备${isLong ? "长期" : "短期"}任务`);
      }
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    },
    onError: (err) => {
      console.error(err);
      showError("Failed to create task");
    },
  });

  // -----------------------------
  // 4. 更新任务
  // -----------------------------
  const {
    execute: doUpdateTask,
    isLoading: updating,
    error: updateError,
  } = useApiAction(updateTaskService, {
    onSuccess: () => {
      showSuccess("Mission updated");
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
    },
    onError: (err) => {
      console.error(err);
      showError("Update task failed");
    },
  });

  // -----------------------------
  // 5. 装备任务
  // -----------------------------
  const {
    execute: doEquipTask,
    isLoading: equipping,
    error: equipError,
  } = useApiAction(equipTaskService, {
    onSuccess: () => {
      showSuccess("Task Equipped");
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      showError("Equipment mission failed");
    },
  });

  const handleEquip = (task) => {
    if (task.status === "已完成") {
      showError("Cannot equip completed quests");
      return;
    }
    // 选择短期/长期槽
    const isLong = task.type === "长期";
    const occupied = (isLong ? equippedLongTasks : equippedShortTasks).map(
      (t) => t.slotPosition
    );
    let freeSlot = [...Array(3).keys()].find((i) => !occupied.includes(i));
    if (freeSlot == null) {
      showError(isLong ? "The long-term task slot is full" : "The short-term task slot is full");
      return;
    }
    const slotType = isLong ? "long" : "short";
    doEquipTask(task._id, freeSlot, user.token, slotType);
  };

  // 拖放装备
  const handleDropToSlot = (taskId, slotIndex, slotType = "short") => {
    doEquipTask(taskId, slotIndex, user.token, slotType);
  };

  // -----------------------------
  // 6. 卸下任务
  // -----------------------------
  const {
    execute: doUnequipTask,
    isLoading: unequipping,
    error: unequipError,
  } = useApiAction(unequipTaskService, {
    onSuccess: () => {
      showSuccess("Task removed");
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      setError("Uninstall task failed");
    },
  });

  const handleUnequip = (id) => {
    doUnequipTask(id, user.token);
  };

  // 7. 从槽位新建
  const handleCreateFromSlot = (slotIndex, slotType) => {
    setCreateSlotIndex(slotIndex);
    setCreateSlotType(slotType);
    setShowForm(true);
  };

  // 8. 提交表单（新建或更新）
  const handleSubmit = (formData) => {
    console.log("[TasksPage] handleSubmit 收到数据：", formData);
    if (editingTask) {
      doUpdateTask(editingTask._id, formData, user.token);
    } else {
      doCreateTask(formData, user.token);
    }
  };

  // 合并所有 loading / error
  const loadingAny =
    deleting || completing || creating || updating || equipping || unequipping;
  const errorAny =
    deleteError ||
    completeError ||
    createError ||
    updateError ||
    equipError ||
    unequipError ||
    error;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{
      // backgroundImage: "url('/rpg-background.png')",
      backgroundColor: "rgba(191, 191, 191, 0.6)", // 暗色背景作为备用
      // backgroundBlendMode: "overlay" // 使背景图片变暗，提高内容可读性
    }}>
      <Navbar />
      <div className="max-w-[95%] mx-auto py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">My  Tasks</h1>

          <button
            onClick={() => {
              setCreateSlotType("短期");
              setCreateSlotIndex(-1);
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors duration-200"
            disabled={loadingAny}
          >
            创建新任务
          </button>
        </div>


        {errorAny && <div className="text-red-400 bg-black bg-opacity-50 p-2 rounded">{errorAny}</div>}
        {loadingAny && <div className="text-gray-200 bg-black bg-opacity-50 p-2 rounded">Loading...</div>}
        {successMessage && (
          <div className="text-green-400 bg-black bg-opacity-50 p-2 rounded">{successMessage}</div>
        )}

        {/* 添加 NewTaskCard 作为特色任务展示 */}
        {/* <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">特色任务</h2>
          <NewTaskCard />
        </div> */}

        <CreateTaskModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setCreateSlotIndex(-1);
            setCreateSlotType("短期"); // 每次关闭时都重置任务类型，确保下次能准确控制
          }}
          onSubmit={handleSubmit}
          loading={editingTask ? updating : creating}
          initialData={editingTask}
          slotIndex={createSlotIndex}
          defaultType={createSlotType}
          defaultDueDateTime={
            createSlotType === "短期"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 19)
              : undefined
          }
        />

        <div className="flex gap-4 relative">
          {/* 左侧：任务槽区域 */}
          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-1/2' : 'w-3/4'}`}>
            <div className="grid grid-cols-2 gap-4">  {/* 改回 grid-cols-2 实现水平排列 */}
              <DailyTaskPanel
                tasks={tasks}
                user={user}
                equippedTasks={equippedShortTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onUnequip={handleUnequip}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "short")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "短期")}
                onEquip={handleEquip}
              />
              <TimetablePanel
                tasks={tasks}
                user={user}
                equippedTasks={equippedLongTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "long")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "长期")}
              />
            </div>
          </div>

          {/* 右侧：可调整宽度的任务仓库 */}
          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-1/2' : 'w-1/4'}`}>
            <RepositoryPanel
              tasks={tasks}
              cards={cards}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={setEditingTask}
              onEquip={handleEquip}
              onExpand={setIsExpanded}
              isExpanded={isExpanded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
