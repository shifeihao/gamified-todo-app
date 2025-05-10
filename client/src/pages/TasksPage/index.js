// src/pages/TasksPage/index.js
import React, { useState, useEffect, useContext } from "react";
import { Navbar } from "../../components";
import { CreateTaskModal } from "../../components";
import AuthContext from "../../context/AuthContext";

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
import UserLevelBar from "../../components/base/UserLevelBar";

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // 短期任务槽
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // 长期任务槽

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState("Short"); // 默认创建任务类型

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 当前激活的 tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState("daily");

  // 拉取任务与卡片库存
  const fetchTasks = async () => {
    try {
      const [allTasks, equipped, shortTasks, longTasks, inventory] =
        await Promise.all([
          getTasks(user.token),
          getEquippedTasks(user.token),
          getEquippedShortTasks(user.token),
          getEquippedLongTasks(user.token),
          getCardInventory(user.token),
        ]);
      setTasks(allTasks);
      setEquippedShortTasks(shortTasks);
      setEquippedLongTasks(longTasks);
      setCards(inventory);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to obtain task data");
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTasks();
      fetchLevelInfo(); // ✅ 新增调用
    }
  }, [user]);

  useEffect(() => {
    console.log("当前 rewardInfo:", rewardInfo);
  }, [rewardInfo]);

  const fetchLevelInfo = async () => {
    try {
      const res = await axios.get("/api/levels/userLevelBar", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setRewardInfo(res.data); // ✅ 存入状态，供 UserLevelBar 使用
    } catch (err) {
      console.error("获取等级信息失败:", err);
    }
  };

  // 显示成功信息
  const showSuccess = (msg) => {
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
      setError("Failed to delete task");
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

      // ✅ 提取 reward 数据并存入状态
      if (task.reward) {
        setRewardInfo(task.reward);
      }

      await unequipTaskService(task.task._id, user.token);
      fetchTasks();
    },

    onError: (err) => {
      console.error(err);
      setError("Failed to complete the task");
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
        const isLong = input.type === "Long";
        const slotType = isLong ? "long" : "short";
        await equipTaskService(res._id, input.slotIndex, user.token, slotType);
        showSuccess(`Equipped${isLong ? ' long term ' : ' short term '}Task`);
      }
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    },
    onError: (err) => {
      console.error(err);
      setError("Failed to create task");
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
      showSuccess("Task updated");
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
    },
    onError: (err) => {
      console.error(err);
      setError("Update task failed");
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
      setError("Task mission failed");
    },
  });

  const handleEquip = (task) => {
    if (task.status === "Finished") {
      setError("Cannot equip completed task");
      return;
    }
    // 选择短期/长期槽
    const isLong = task.type === "Long";
    const occupied = (isLong ? equippedLongTasks : equippedShortTasks).map(
      (t) => t.slotPosition
    );
    let freeSlot = [...Array(3).keys()].find((i) => !occupied.includes(i));
    if (freeSlot == null) {
      setError(isLong ? "The long-term task slot is full" : "The short-term task slot is full");
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
    console.log("[TasksPage] handleSubmit Receive data：", formData);
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

  return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto py-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">My Tasks</h1>

          <button
            onClick={() => {
              setCreateSlotType("Short");
              setCreateSlotIndex(-1);
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            disabled={loadingAny}
          >
              Create a new task
          </button>
        </div>
        {rewardInfo && (
          <div className="mt-2">
            <UserLevelBar data={rewardInfo} />
          </div>
        )}

        {errorAny && <div className="text-red-600">{errorAny}</div>}
        {loadingAny && <div className="text-gray-600">Loading...</div>}
        {successMessage && (
          <div className="text-green-600">{successMessage}</div>
        )}

        <CreateTaskModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setCreateSlotIndex(-1);
            setCreateSlotType("Short"); // 每次关闭时都重置任务类型，确保下次能准确控制
          }}
          onSubmit={handleSubmit}
          loading={editingTask ? updating : creating}
          initialData={editingTask}
          slotIndex={createSlotIndex}
          defaultType={createSlotType}
          defaultDueDateTime={
            createSlotType === "Short"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 19)
              : undefined
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-1/2">
              <DailyTaskPanel
                tasks={tasks}
                user={user}
                equippedTasks={equippedShortTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onUnequip={handleUnequip}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "short")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "Short")}
                onEquip={handleEquip}
              />
            </div>
            <div className="w-full lg:w-1/2">
              <TimetablePanel
                tasks={tasks}
                user={user}
                equippedTasks={equippedLongTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "long")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "Long")}
              />
            </div>
          </div>
          <div>
            <RepositoryPanel
              tasks={tasks}
              cards={cards}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={setEditingTask}
              onEquip={handleEquip}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
