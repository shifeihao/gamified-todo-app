// src/pages/TasksPage/index.js
import React, { useState, useEffect, useContext } from "react";
import { Navbar } from "../../components";
import { CreateTaskModal } from "../../components";
import AuthContext from "../../context/AuthContext";
import { NewTaskCard } from "../../components/task/NewTaskCard";
import { useToast } from "../../context/ToastContext";
import toast from "react-hot-toast";
import {
  TASK_COMPLETED_EVENT,
  SUBTASK_COMPLETED_EVENT,
} from "../../components/navbar/Navbar";

import DailyTaskPanel from "./DailyTaskPanel";
import TimetablePanel from "./TimetablePanel";
import RepositoryPanel from "./RepositoryPanel";
import {
  getCardInventory,
  getNewDailyCards,
  createBlankCard,
} from "../../services/cardService";
import axios from "axios";

// Only used for reading data, not included in useApiAction
import {
  getTasks,
  getEquippedTasks,
  getEquippedShortTasks,
  getEquippedLongTasks,
} from "../../services/taskService";

// The following functions with the Service suffix are handed over to useApiAction to manage loading / error / callback
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
import {
  showTaskCompletedToast,
  showLongTaskCompletedToast,
} from "../../components/modal/TaskCompletedToast";

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // Short-term task slot
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // Long-term task slot
  const [rewardInfo, setRewardInfo] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState("short");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Currently active tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState("daily");

  // Add a status to record whether the task has been completed recently
  const [recentlyCompletedTask, setRecentlyCompletedTask] = useState(false);

  // Marks the task as recently completed and resets after 5 seconds
  const markTaskAsRecentlyCompleted = () => {
    setRecentlyCompletedTask(true);
    setTimeout(() => setRecentlyCompletedTask(false), 5000);
  };

  // Pull tasks and card inventory
  const fetchTasks = async () => {
    if (!user?.token) {
      console.log("The user is not logged in, skip the acquisition task");
      return;
    }

    try {
      // First try to get the current card inventory
      let cardData = { inventory: [] };
      try {
        cardData = await getCardInventory(user.token);
        console.log("Obtained card inventory data:", cardData);
      } catch (err) {
        console.error("Failed to obtain card inventory:", err);
      }

      // If the card inventory is empty or has less than 5 cards, try to initialize a new user card
      if (!cardData.inventory || cardData.inventory.length < 5) {
        console.log("Low card stock, try to get daily cards and replenishment cards...");

        try {
          await getNewDailyCards(user.token);
          console.log("Successfully obtained the daily card");
        } catch (err) {
          console.log("An attempt to obtain a daily card failed. You may have already obtained it.", err);
        }

        if (!cardData.inventory || cardData.inventory.length < 2) {
          console.log("New users may need to initialize their cards, try creating additional blank cards...");

          try {
            await createBlankCard(user.token);
            console.log("Supplemental blank card created successfully");
          } catch (err) {
            console.log("Failed to create blank card", err);
          }
        }

        try {
          cardData = await getCardInventory(user.token);
          console.log("Updated card inventory:", cardData);
        } catch (err) {
          console.error("Failed to retrieve card inventory:", err);
        }
      }

      // Use Promise.allSettled instead of Promise.all so that even if some requests fail, it will not affect other requests.
      const results = await Promise.allSettled([
        getTasks(user.token),
        getEquippedTasks(user.token),
        getEquippedShortTasks(user.token),
        getEquippedLongTasks(user.token),
        axios.get("/api/levels/userLevelBar", {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // Process the results of each request
      const [
        tasksResult,
        equippedResult,
        shortTasksResult,
        longTasksResult,
        levelInfoResult,
      ] = results;

      // Update status, only update successfully acquired data
      if (tasksResult.status === "fulfilled" && tasksResult.value) {
        setTasks(tasksResult.value);
      }

      if (shortTasksResult.status === "fulfilled" && shortTasksResult.value) {
        setEquippedShortTasks(shortTasksResult.value);
      }

      if (longTasksResult.status === "fulfilled" && longTasksResult.value) {
        setEquippedLongTasks(longTasksResult.value);
      }

      if (
        levelInfoResult.status === "fulfilled" &&
        levelInfoResult.value?.data
      ) {
        setRewardInfo(levelInfoResult.value.data);
      }

      // Update Card Inventory
      if (cardData.inventory) {
        setCards(cardData.inventory);
      }

      // Check if all requests failed
      const allFailed = results.every((result) => result.status === "rejected");
      if (allFailed && !recentlyCompletedTask) {
        console.error("Failed to obtain all task data");
        showError("Failed to obtain task data, please try refreshing the page");
      }
    } catch (err) {
      console.error("Error in getting task data:", err);
      // Show error only if no task has been completed recently
      if (!recentlyCompletedTask) {
        showError("Failed to obtain task data, please try refreshing the page");
      }
    }
  };

  // Add automatic retry mechanism
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
          console.log(`NO. ${retryCount} retry to get task data...`);
          setTimeout(tryFetchTasks, retryDelay);
        }
      }
    };

    if (user?.token) {
      tryFetchTasks();
    }
  }, [user]);

  // Monitor task and subtask completion events and refresh task data
  useEffect(() => {
    // Creating an event handler
    const handleTaskOrSubtaskCompleted = (event) => {
      console.log("Task or subtask completion event triggered", event.type, event.detail);

      // If we have detailed task information in the event, update state directly
      if (event.detail && event.detail.taskId && event.detail.updatedTask) {
        const { taskId, updatedTask, isLongTask, status } = event.detail;
        console.log("Updating task state with data from event:", updatedTask);

        // Update tasks in repository
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId ? updatedTask : task
          )
        );

        // Update equipped short tasks
        setEquippedShortTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId ? updatedTask : task
          ).filter(task => task.status !== 'completed')
        );

        // Update equipped long tasks
        setEquippedLongTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId ? updatedTask : task
          ).filter(task => task.status !== 'completed')
        );

        // If task is completed, ensure it's unequipped
        if (updatedTask.status === 'completed') {
          try {
            console.log("Automatically unequipping completed task:", taskId);
            unequipTaskService(taskId, user?.token);
          } catch (err) {
            console.error("Failed to unequip task from event handler:", err);
          }
        }
      }

      // Always fetch tasks to ensure we have the latest data
      fetchTasks();
    };

    // Adding event listeners
    window.addEventListener(
      SUBTASK_COMPLETED_EVENT,
      handleTaskOrSubtaskCompleted
    );
    window.addEventListener(TASK_COMPLETED_EVENT, handleTaskOrSubtaskCompleted);

    // Cleanup Function
    return () => {
      window.removeEventListener(
        SUBTASK_COMPLETED_EVENT,
        handleTaskOrSubtaskCompleted
      );
      window.removeEventListener(
        TASK_COMPLETED_EVENT,
        handleTaskOrSubtaskCompleted
      );
    };
  }, [user?.token]); // Add user token as dependency to ensure we have it available

  // Display success information
  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // -----------------------------
  // 1. Deleting a task
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
  // 2. Complete the task (and remove the completed task)
  // -----------------------------
  const {
    execute: doCompleteTask,
    isLoading: completing,
    error: completeError,
  } = useApiAction(completeTaskService, {
    onSuccess: async (response) => {
      console.log("Task completion response:", response);

      // Mark the task as recently completed to avoid displaying warnings about data acquisition failures
      markTaskAsRecentlyCompleted();

      // Clear the edit task status to ensure that it will not be carried over to the new task
      setEditingTask(null);

      try {
        // More tolerant success judgment conditions
        // It is considered a failure only when an error flag is clearly received and there is no valid data
        if (response?.success === false && !response.task && !response.reward) {
          showError(response?.message || "Task completion failed");
          console.error("Task completed with clear failure:", response);
          return;
        }

        // From here on, we try to extract the task information and reward, regardless of the response format
        let task = response?.task;
        let reward = response?.reward;

        // If getting it directly from the response fails, try other possible locations
        if (!task && response?.data?.task) task = response.data.task;
        if (!reward && response?.data?.reward) reward = response.data.reward;

        console.log("Extracted task data:", task);
        console.log("Reward data after extraction:", reward);

        // Display more detailed completion information and reward notifications
        if (reward) {
          const xp = reward.expGained || 0;
          const gold = reward.goldGained || 0;

          // Use the new component to display task completion notifications
          showTaskCompletedToast(task?.title || "task", xp, gold, false, task);
        } else {
          // Special handling: If you have not received reward information but have task information
          if (task) {
            // Use the task's own reward value or a default value
            const defaultXp =
              task.experienceReward || (task.type === "long" ? 30 : 30);
            const defaultGold =
              task.goldReward || (task.type === "long" ? 15 : 15);

            console.log(
              `No reward information received, use the task itself or the default value: ${defaultXp} XP, ${defaultGold} Gold`
            );
            showTaskCompletedToast(
              task.title || "task",
              defaultXp,
              defaultGold,
              false,
              task
            );
          } else {
            // There is no task or reward information at all
            showSuccess("Task Completed");
            console.log("The task may be completed, but no task or reward data is received");
          }
        }

        // Trigger level update event
        window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT));

        // Ensure that the task is automatically removed after completion
        if (task && task._id) {
          try {
            await unequipTaskService(task._id, user.token);
            console.log("Successfully unequipped task after completion");
          } catch (err) {
            console.error("Failed to unequip completed task:", err);
          }
        }
      } catch (error) {
        // Handle any errors that may occur while parsing the response
        console.error("Error processing task completion response:", error);
        showSuccess(
          "Task may have been completed, but there was an issue displaying rewards"
        );
      } finally {
        // In any case, refresh the task list to get the latest status
        fetchTasks();
      }
    },
    onError: (err) => {
      console.error("Task completion request error:", err);
      showError(err?.response?.data?.message || "Failed to complete the task");
      // Also need to clear the editing task status
      setEditingTask(null);
      // Try to retrieve the task list
      fetchTasks();
    },
  });

  const handleComplete = async (id) => {
    try {
      // Find the corresponding task
      let taskToComplete =
        tasks.find((t) => t._id === id) ||
        equippedShortTasks.find((t) => t._id === id) ||
        equippedLongTasks.find((t) => t._id === id);

      // If the task does not exist, try to retrieve the task list and then search again.
      if (!taskToComplete) {
        console.log(`Unable to find task with ID ${id}, trying to retrieve task list...`);

        try {
          // Try getting a single task directly
          const result = await axios.get(`/api/tasks/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });

          if (result.data) {
            taskToComplete = result.data;
            console.log("Successfully obtained a single task:", taskToComplete);
          }
        } catch (err) {
          console.error("Failed to obtain a single task:", err);
          // Try refreshing all tasks
          try {
            await fetchTasks();
            taskToComplete =
              tasks.find((t) => t._id === id) ||
              equippedShortTasks.find((t) => t._id === id) ||
              equippedLongTasks.find((t) => t._id === id);
          } catch (fetchErr) {
            console.error("Failed to refresh task list:", fetchErr);
          }
        }

        if (!taskToComplete) {
          console.error(`Unable to find task with ID ${id}`);
          showError("The task to be completed cannot be found. Please refresh the page and try again.");
          return;
        }
      }

      console.log(
        `Prepare to complete the task: ${taskToComplete.title} (ID: ${id}, type: ${taskToComplete.type})`
      );

      // If it is a long-term task, use a dedicated completion method
      if (taskToComplete.type === "long") {
        await doCompleteLongTask(id, user.token);
      } else {
        // Otherwise use normal completion method
        await doCompleteTask(id, user.token);
      }

      // Once the task is completed, make sure we have an up-to-date task list
      setTimeout(() => fetchTasks(), 500);
    } catch (err) {
      console.error("Error in completing task:", err);
      showError("Failed to complete the task, please try again later");
    }
  };

  // -----------------------------
  // 2.1. Completing long-term tasks (dedicated methods)
  // -----------------------------
  const {
    execute: doCompleteLongTask,
    isLoading: completingLong,
    error: completeLongError,
  } = useApiAction(completeLongTaskService, {
    onSuccess: async (response) => {
      console.log("Long-term task completion response:", response);

      // Mark the task as recently completed to avoid displaying warnings about data acquisition failures
      markTaskAsRecentlyCompleted();

      // Clear the edit task status to ensure that it will not be carried over to the new task
      setEditingTask(null);

      try {
        // More tolerant success judgment conditions
       // It is considered a failure only when an error flag is clearly received and there is no valid data
        if (response?.success === false && !response.task && !response.reward) {
          showError(response?.message || "Failed to complete long-term task");
          console.error("Long-term task completion clearly failed:", response);
          return;
        }

        // From here on down, we try to extract the task information and rewards, regardless of the response format
        let task = response?.task;
        let reward = response?.reward;

        // If getting it directly from the response fails, try other possible locations
        if (!task && response?.data?.task) task = response.data.task;
        if (!reward && response?.data?.reward) reward = response.data.reward;

        console.log("Extracted long-term task data:", task);
        console.log("Extracted long-term task reward data:", reward);

        // Use a dedicated long-term task completion notification component
        showLongTaskCompletedToast(response, task);

        // Trigger level update event
        window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT));

        // Ensure that the task is automatically removed after completion
        if (task && task._id) {
          try {
            await unequipTaskService(task._id, user.token);
            console.log("Successfully unequipped long task after completion");
          } catch (err) {
            console.error("Failed to unequip completed long task:", err);
          }
        }
      } catch (error) {
        // Handle any errors that may occur while parsing the response
        console.error("Error processing long task completion response:", error);
        showSuccess(
          "Long task may have been completed, but there was an issue displaying rewards"
        );
      } finally {
        // In any case, refresh the task list to get the latest status
        fetchTasks();
      }
    },
    onError: (err) => {
      console.error("Error in long task completion request:", err);
      showError(
        err?.response?.data?.message || "Failed to complete the long task"
      );

      // Get task data to display rewards
      const taskId = err?.config?.url?.split("/").pop();
      if (taskId) {
        const task =
          tasks.find((t) => t._id === taskId) ||
          equippedLongTasks.find((t) => t._id === taskId);

        if (task) {
          // Display default reward value even if failed
          const defaultXp = task.experienceReward || 30;
          const defaultGold = task.goldReward || 15;
          console.log(
            `Task completion request failed, using default reward: ${defaultXp} XP, ${defaultGold} Gold`
          );
          showTaskCompletedToast(
            task.title || "Long-term tasks",
            defaultXp,
            defaultGold,
            false,
            task
          );
        }
      }

      // You also need to clear the editing task status
      setEditingTask(null);
      // Try to retrieve the task list again
      fetchTasks();
    },
  });

  // -----------------------------
  // 3. Create a task
  // -----------------------------
  const {
    execute: doCreateTask,
    isLoading: creating,
    error: createError,
  } = useApiAction(createTaskService, {
    onSuccess: async (res, input) => {
      // Check if the returned result is an error object
      if (res && res.success === false) {
        // If the error is already displayed via toast, there is no need to display the error message here
        console.error("Failed to create task:", res.message);
        return;
      }

      showSuccess("Task created");
      if (input?.fromSlot && input?.slotIndex >= 0) {
        const isLong = input.type === "long";
        const slotType = isLong ? "long" : "short";
        await equipTaskService(res._id, input.slotIndex, user.token, slotType);
        showSuccess(`Equipped ${isLong ? "long" : "short"} task`);
      }
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    },
    onError: (err) => {
      console.error(err);
      // The error has been handled by taskService and does not need to be displayed again
     // But we still keep this callback in case there is an uncaught error
    },
  });

  // -----------------------------
  // 4. Update Tasks
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
  // 5. Equipment Task
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
      showError("Equipment task failed");
    },
  });

  const handleEquip = (task) => {
    if (task.status === "Completed") {
      showError("Cannot equip completed tasks");
      return;
    }
    // Select short/long slot
    const isLong = task.type === "long";
    const occupied = (isLong ? equippedLongTasks : equippedShortTasks).map(
      (t) => t.slotPosition
    );
    let freeSlot = [...Array(3).keys()].find((i) => !occupied.includes(i));
    if (freeSlot == null) {
      showError(
        isLong
          ? "The long-term task slot is full"
          : "The short-term task slot is full"
      );
      return;
    }
    const slotType = isLong ? "long" : "short";
    doEquipTask(task._id, freeSlot, user.token, slotType);
  };

  // Drag and drop equipment
  const handleDropToSlot = (taskId, slotIndex, slotType = "short") => {
    // 检Check if the task type matches the slot type
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
      showError("任务不存在");
      return;
    }

    // Check if the task type matches the slot type
    const expectedType = slotType === "long" ? "long" : "short";
    if (task.type !== expectedType) {
      showError(
        `Only can put ${
          expectedType === "long" ? "long-term" : "short-term"
        } task into this slot`
      );
      return;
    }

    // Type matches, continue to equip
    doEquipTask(taskId, slotIndex, user.token, slotType);
  };

  // -----------------------------
  // 6. Unload Task
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

  // 7.Create from Slot
  const handleCreateFromSlot = (slotIndex, slotType) => {
    setCreateSlotIndex(slotIndex);
    setCreateSlotType(slotType);
    setShowForm(true);
  };

  // 8. Submit a form (create or update)
  const handleSubmit = (formData) => {
    console.log("[TasksPage] handleSubmit receive data：", formData);
    if (editingTask && editingTask._id) {
      doUpdateTask(editingTask._id, formData, user.token);
    } else {
      doCreateTask(formData, user.token);
    }
  };

  // Merge all loading / errors
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
  console.log(" the shortslot of user is", user?.shortCardSlot);
  console.log(" the longslot of user is", user?.longCardSlot);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundColor: "#fff",
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='%238b5cf6' fill-opacity='0.15'%3E%3Ccircle cx='100' cy='100' r='1.5'/%3E%3Ccircle cx='200' cy='150' r='1.5'/%3E%3Ccircle cx='150' cy='250' r='1.5'/%3E%3Ccircle cx='280' cy='210' r='1.5'/%3E%3Ccircle cx='300' cy='100' r='1.5'/%3E%3Cpath d='M100 100L200 150L150 250L280 210L300 100' stroke='%238b5cf6' stroke-width='0.5' stroke-opacity='0.1' fill='none'/%3E%3C/g%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath d='M30 10.9L0 38.1V76.5L30 103.7L60 76.5V38.1L30 10.9zM30 0L60 17.3V52L30 69.3L0 52V17.3L30 0z' fill='none' stroke='%238b5cf6' stroke-opacity='0.15' stroke-width='1.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: "400px 400px, 60px 104px",
        backgroundPosition: "center center, center center",
      }}
    >
      <Navbar />
      <div className="max-w-[95%] mx-auto py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>

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

        {errorAny && (
          <div className="text-red-400 bg-black bg-opacity-50 p-2 rounded">
            {errorAny}
          </div>
        )}
        {loadingAny && (
          <div className="text-gray-200 bg-black bg-opacity-50 p-2 rounded">
            Loading...
          </div>
        )}
        {successMessage && (
          <div className="text-green-400 bg-black bg-opacity-50 p-2 rounded">
            {successMessage}
          </div>
        )}

        {/* Add NewTaskCard as a featured task display */}
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
            setCreateSlotType("short"); // Reset task type every time you close it，确保下次能准确控制
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
          {/* Left: Task slot area */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded ? "w-1/2" : "w-3/4"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {" "}
              {/* Change back to grid-cols-2 to achieve horizontal arrangement */}
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
                  // When the task has the isFromSubtaskComplete flag and is not forced to edit, only update the task without opening the edit window
                  if (!forceEdit && task.isFromSubtaskComplete) {
                    // Only update the task data, do not open the edit window
                    console.log("Update long-term task data without opening the edit window");
                    return;
                  }

                  // Normal editing process
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

          {/* Right: Task warehouse with adjustable width */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded ? "w-1/2" : "w-1/4"
            }`}
          >
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
