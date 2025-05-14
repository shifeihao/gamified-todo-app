// src/pages/TasksPage/index.js
import React, { useState, useEffect, useContext } from "react";
import { Navbar } from "../../components";
import { CreateTaskModal } from "../../components";
import AuthContext from "../../context/AuthContext";
import { NewTaskCard } from '../../components/task/NewTaskCard';
import { useToast } from '../../context/ToastContext';
import toast from 'react-hot-toast';
import { TASK_COMPLETED_EVENT, SUBTASK_COMPLETED_EVENT } from "../../components/navbar/Navbar";

import DailyTaskPanel from "./DailyTaskPanel";
import TimetablePanel from "./TimetablePanel";
import RepositoryPanel from "./RepositoryPanel";
import { getCardInventory, getNewDailyCards, createBlankCard } from "../../services/cardService";
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
  completeLongTask as completeLongTaskService,
  equipTask as equipTaskService,
  unequipTask as unequipTaskService,
} from "../../services/taskService";

import { useApiAction } from "../../components/hooks";
import { showTaskCompletedToast, showLongTaskCompletedToast } from "../../components/modal/TaskCompletedToast";

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // short任务槽
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // 长期任务槽
  const [rewardInfo, setRewardInfo] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState("short"); // 默认创建任务类型

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 当前激活的 tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState("daily");

  // 添加一个状态，用于记录最近是否有任务完成
  const [recentlyCompletedTask, setRecentlyCompletedTask] = useState(false);

  // 标记任务最近完成，并在5秒后重置
  const markTaskAsRecentlyCompleted = () => {
    setRecentlyCompletedTask(true);
    setTimeout(() => setRecentlyCompletedTask(false), 5000);
  };

  // 拉取任务与卡片库存
  const fetchTasks = async () => {
    if (!user?.token) {
      console.log("用户未登录，跳过获取任务");
      return;
    }

    try {
      // 优先尝试获取当前卡片库存
      let cardData = { inventory: [] };
      try {
        cardData = await getCardInventory(user.token);
        console.log("获取到的卡片库存数据:", cardData);
      } catch (err) {
        console.error("获取卡片库存失败:", err);
      }
      
      // 如果卡片库存为空或少于5张，尝试初始化新用户卡片
      if (!cardData.inventory || cardData.inventory.length < 5) {
        console.log("卡片库存不足，尝试获取每日卡片和补充卡片...");
        
        try {
          await getNewDailyCards(user.token);
          console.log("成功获取每日卡片");
        } catch (err) {
          console.log("尝试获取每日卡片失败，可能已经获取过", err);
        }
        
        if (!cardData.inventory || cardData.inventory.length < 2) {
          console.log("新用户可能需要初始化卡片，尝试创建额外的空白卡片...");
          
          try {
            await createBlankCard(user.token);
            console.log("成功创建补充空白卡片");
          } catch (err) {
            console.log("创建空白卡片失败", err);
          }
        }
        
        try {
          cardData = await getCardInventory(user.token);
          console.log("更新后的卡片库存:", cardData);
        } catch (err) {
          console.error("重新获取卡片库存失败:", err);
        }
      }

      // 使用 Promise.allSettled 替代 Promise.all，这样即使某些请求失败也不会影响其他请求
      const results = await Promise.allSettled([
        getTasks(user.token),
        getEquippedTasks(user.token),
        getEquippedShortTasks(user.token),
        getEquippedLongTasks(user.token),
        axios.get("/api/levels/userLevelBar", {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // 处理每个请求的结果
      const [tasksResult, equippedResult, shortTasksResult, longTasksResult, levelInfoResult] = results;

      // 更新状态，只更新成功获取的数据
      if (tasksResult.status === 'fulfilled' && tasksResult.value) {
        setTasks(tasksResult.value);
      }
      
      if (shortTasksResult.status === 'fulfilled' && shortTasksResult.value) {
        setEquippedShortTasks(shortTasksResult.value);
      }
      
      if (longTasksResult.status === 'fulfilled' && longTasksResult.value) {
        setEquippedLongTasks(longTasksResult.value);
      }
      
      if (levelInfoResult.status === 'fulfilled' && levelInfoResult.value?.data) {
        setRewardInfo(levelInfoResult.value.data);
      }

      // 更新卡片库存
      if (cardData.inventory) {
        setCards(cardData.inventory);
      }

      // 检查是否所有请求都失败了
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed && !recentlyCompletedTask) {
        console.error("所有任务数据获取失败");
        showError("获取任务数据失败，请尝试刷新页面");
      }

    } catch (err) {
      console.error("获取任务数据出错:", err);
      // 只有在最近没有任务完成时才显示错误
      if (!recentlyCompletedTask) {
        showError("获取任务数据失败，请尝试刷新页面");
      }
    }
  };

  // 添加自动重试机制
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒

    const tryFetchTasks = async () => {
      try {
        await fetchTasks();
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`第 ${retryCount} 次重试获取任务数据...`);
          setTimeout(tryFetchTasks, retryDelay);
        }
      }
    };

    if (user?.token) {
      tryFetchTasks();
    }
  }, [user]);

  // 监听任务和子任务完成事件，刷新任务数据
  useEffect(() => {
    // 创建事件处理函数
    const handleTaskOrSubtaskCompleted = () => {
      fetchTasks();
    };

    // 添加事件监听器
    window.addEventListener(SUBTASK_COMPLETED_EVENT, handleTaskOrSubtaskCompleted);
    window.addEventListener(TASK_COMPLETED_EVENT, handleTaskOrSubtaskCompleted);

    // 清理函数
    return () => {
      window.removeEventListener(SUBTASK_COMPLETED_EVENT, handleTaskOrSubtaskCompleted);
      window.removeEventListener(TASK_COMPLETED_EVENT, handleTaskOrSubtaskCompleted);
    };
  }, []);

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
    onSuccess: async (response) => {
      console.log("任务完成响应:", response);
      
      // 标记任务最近完成，避免显示数据获取失败的警告
      markTaskAsRecentlyCompleted();
      
      // 清除编辑任务状态，确保不会带入到新建任务中
      setEditingTask(null);
      
      try {
        // 更宽容的成功判断条件
        // 只有在明确收到错误标识并且没有有效数据时才认为是失败
        if (response?.success === false && !response.task && !response.reward) {
          showError(response?.message || "任务完成失败");
          console.error("任务完成明确失败:", response);
          return;
        }
        
        // 从这里往下，我们尝试提取任务信息和奖励，无论响应格式如何
        let task = response?.task;
        let reward = response?.reward;
        
        // 如果直接从response中获取失败，尝试其他可能的位置
        if (!task && response?.data?.task) task = response.data.task;
        if (!reward && response?.data?.reward) reward = response.data.reward;
        
        console.log("提取后的任务数据:", task);
        console.log("提取后的奖励数据:", reward);
        
        // 显示更详细的完成信息和奖励通知
        if (reward) {
          const xp = reward.expGained || 0;
          const gold = reward.goldGained || 0;
          
          // 使用新的组件显示任务完成通知
          showTaskCompletedToast(task?.title || "任务", xp, gold, false, task);
        } else {
          // 特殊处理：如果没有收到奖励信息但有任务信息
          if (task) {
            // 使用任务自身的奖励值或默认值
            const defaultXp = task.experienceReward || (task.type === 'long' ? 30 : 10);
            const defaultGold = task.goldReward || (task.type === 'long' ? 15 : 5);
            
            console.log(`未收到奖励信息，使用任务自身或默认值: ${defaultXp} XP, ${defaultGold} Gold`);
            showTaskCompletedToast(task.title || "任务", defaultXp, defaultGold, false, task);
          } else {
            // 完全没有任务和奖励信息的情况
            showSuccess("任务已完成");
            console.log("任务可能已完成，但未收到任务或奖励数据");
          }
        }

        // 触发等级更新事件
        window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT));

        // 确保任务完成后自动卸下任务
        if (task && task._id) {
          try {
            await unequipTaskService(task._id, user.token);
            console.log("Successfully unequipped task after completion");
          } catch (err) {
            console.error("Failed to unequip completed task:", err);
          }
        }
      } catch (error) {
        // 处理解析响应时可能出现的任何错误
        console.error("处理任务完成响应时出错:", error);
        showSuccess("Task may have been completed, but there was an issue displaying rewards");
      } finally {
        // 无论如何，刷新任务列表以获取最新状态
        fetchTasks();
      }
    },
    onError: (err) => {
      console.error("任务完成请求出错:", err);
      showError(err?.response?.data?.message || "Failed to complete the task");
      // 也需要清除编辑任务状态
      setEditingTask(null);
      // 尝试重新获取任务列表
      fetchTasks();
    },
  });

  const handleComplete = async (id) => {
    try {
      // 找到对应的任务
      let taskToComplete = tasks.find(t => t._id === id) || 
                          equippedShortTasks.find(t => t._id === id) ||
                          equippedLongTasks.find(t => t._id === id);

      // 如果任务不存在，尝试重新获取任务列表后再查找
      if (!taskToComplete) {
        console.log(`找不到ID为 ${id} 的任务，尝试重新获取任务列表...`);
        
        try {
          // 尝试直接获取单个任务
          const result = await axios.get(`/api/tasks/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          
          if (result.data) {
            taskToComplete = result.data;
            console.log("成功获取单个任务:", taskToComplete);
          }
        } catch (err) {
          console.error("获取单个任务失败:", err);
          // 尝试刷新所有任务
          try {
            await fetchTasks();
            taskToComplete = tasks.find(t => t._id === id) || 
                            equippedShortTasks.find(t => t._id === id) ||
                            equippedLongTasks.find(t => t._id === id);
          } catch (fetchErr) {
            console.error("刷新任务列表失败:", fetchErr);
          }
        }
        
        if (!taskToComplete) {
          console.error(`无法找到ID为 ${id} 的任务`);
          showError("找不到要完成的任务，请刷新页面后再试");
          return;
        }
      }

      console.log(`准备完成任务: ${taskToComplete.title} (ID: ${id}, 类型: ${taskToComplete.type})`);
      
      // 如果是长期任务，使用专用的完成方法
      if (taskToComplete.type === 'long') {
        await doCompleteLongTask(id, user.token);
      } else {
        // 否则使用普通完成方法
        await doCompleteTask(id, user.token);
      }
      
      // 任务完成后，确保我们有最新的任务列表
      setTimeout(() => fetchTasks(), 500);
      
    } catch (err) {
      console.error("完成任务过程出错:", err);
      showError("完成任务失败，请稍后再试");
    }
  };

  // -----------------------------
  // 2.1. 完成长期任务（专用方法）
  // -----------------------------
  const {
    execute: doCompleteLongTask,
    isLoading: completingLong,
    error: completeLongError,
  } = useApiAction(completeLongTaskService, {
    onSuccess: async (response) => {
      console.log("长期任务完成响应:", response); // 添加日志来调试
      
      // 标记任务最近完成，避免显示数据获取失败的警告
      markTaskAsRecentlyCompleted();
      
      // 清除编辑任务状态，确保不会带入到新建任务中
      setEditingTask(null);
      
      try {
        // 更宽容的成功判断条件
        // 只有在明确收到错误标识并且没有有效数据时才认为是失败
        if (response?.success === false && !response.task && !response.reward) {
          showError(response?.message || "完成长期任务失败");
          console.error("长期任务完成明确失败:", response);
          return;
        }
        
        // 从这里往下，我们尝试提取任务信息和奖励，无论响应格式如何
        let task = response?.task;
        let reward = response?.reward;
        
        // 如果直接从response中获取失败，尝试其他可能的位置
        if (!task && response?.data?.task) task = response.data.task;
        if (!reward && response?.data?.reward) reward = response.data.reward;
        
        console.log("提取后的长期任务数据:", task);
        console.log("提取后的长期任务奖励数据:", reward);
        
        // 使用专门的长期任务完成通知组件
        showLongTaskCompletedToast(response, task);

        // 触发等级更新事件
        window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT));

        // 确保任务完成后自动卸下任务
        if (task && task._id) {
          try {
            await unequipTaskService(task._id, user.token);
            console.log("Successfully unequipped long task after completion");
          } catch (err) {
            console.error("Failed to unequip completed long task:", err);
          }
        }
      } catch (error) {
        // 处理解析响应时可能出现的任何错误
        console.error("处理长期任务完成响应时出错:", error);
        showSuccess("Long task may have been completed, but there was an issue displaying rewards");
      } finally {
        // 无论如何，刷新任务列表以获取最新状态
        fetchTasks();
      }
    },
    onError: (err) => {
      console.error("长期任务完成请求出错:", err);
      showError(err?.response?.data?.message || "Failed to complete the long task");
      
      // 获取任务数据以便显示奖励
      const taskId = err?.config?.url?.split('/').pop();
      if (taskId) {
        const task = tasks.find(t => t._id === taskId) || 
                    equippedLongTasks.find(t => t._id === taskId);
        
        if (task) {
          // 即使失败也显示默认奖励值
          const defaultXp = task.experienceReward || 30;
          const defaultGold = task.goldReward || 15;
          console.log(`任务完成请求失败，使用默认奖励: ${defaultXp} XP, ${defaultGold} Gold`);
          showTaskCompletedToast(task.title || "长期任务", defaultXp, defaultGold, false, task);
        }
      }
      
      // 也需要清除编辑任务状态
      setEditingTask(null);
      // 尝试重新获取任务列表
      fetchTasks();
    },
  });

  // -----------------------------
  // 3. 创建任务
  // -----------------------------
  const {
    execute: doCreateTask,
    isLoading: creating,
    error: createError,
  } = useApiAction(createTaskService, {
    onSuccess: async (res, input) => {
      // 检查返回的结果是否为错误对象
      if (res && res.success === false) {
        // 如果已经通过 toast 显示了错误，这里就不需要再显示错误消息
        console.error("创建任务失败:", res.message);
        return;
      }
      
      showSuccess("Task created");
      if (input?.fromSlot && input?.slotIndex >= 0) {
        const isLong = input.type === "long";
        const slotType = isLong ? "long" : "short";
        await equipTaskService(res._id, input.slotIndex, user.token, slotType);
        showSuccess(`已装备${isLong ? "long" : "short"}任务`);
      }
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    },
    onError: (err) => {
      console.error(err);
      // 错误已经由 taskService 中处理，不需要再次显示
      // 但我们仍然保留这个回调以防有未捕获的错误
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
    if (task.status === "Completed") {
      showError("Cannot equip completed quests");
      return;
    }
    // 选择short/长期槽
    const isLong = task.type === "long";
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
    // 检查任务类型是否与槽位类型匹配
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
      showError("任务不存在");
      return;
    }
    
    // 检查任务类型是否与槽位类型匹配
    const expectedType = slotType === "long" ? "long" : "short";
    if (task.type !== expectedType) {
      showError(`Only can put ${expectedType === "long" ? "long-term" : "short-term"} task into this slot`);
      return;
    }
    
    // 类型匹配，继续装备
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
    if (editingTask && editingTask._id) {
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
              setCreateSlotType("short");
              setCreateSlotIndex(-1);
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors duration-200"
            disabled={loadingAny}
          >
            Create Task
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
            setCreateSlotType("short"); // 每次关闭时都重置任务类型，确保下次能准确控制
          }}
          onSubmit={handleSubmit}
          loading={editingTask ? updating : creating}
          initialData={editingTask}
          slotIndex={createSlotIndex}
          defaultType={createSlotType}
          defaultDueDateTime={
            createSlotType === "short"
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
                onEdit={(task) => {
                  setEditingTask(task);
                  setShowForm(true);
                  if (task.type) {
                    setCreateSlotType(task.type);
                  }
                }}
                onUnequip={handleUnequip}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "short")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "short")}
                onEquip={handleEquip}
              />
              <TimetablePanel
                tasks={tasks}
                user={user}
                equippedTasks={equippedLongTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={(task, forceEdit = false) => {
                  // 当任务有isFromSubtaskComplete标记且不是强制编辑时，只更新任务而不打开编辑窗口
                  if (!forceEdit && task.isFromSubtaskComplete) {
                    // 只更新任务数据，不打开编辑窗口
                    console.log("更新长期任务数据，不打开编辑窗口");
                    return;
                  }
                  
                  // 正常编辑流程
                  setEditingTask(task);
                  setShowForm(true);
                  if (task.type) {
                    setCreateSlotType(task.type);
                  }
                }}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, "long")}
                onCreateTask={(idx) => handleCreateFromSlot(idx, "long")}
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
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
                if (task.type) {
                  setCreateSlotType(task.type);
                }
              }}
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
