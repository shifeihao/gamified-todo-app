import React, { useState, useRef, useEffect, useContext } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  X, 
  Trash2, 
  Edit2, 
  Clock,
  Calendar,
  Award,
  CreditCard,
  Hourglass,
  BookOpen,
  BarChart4,
  Trophy,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { checkAchievements } from "../../services/achievement";
import AchievementUnlockNotification from "../achievement/AchievementUnlockNotification";

// Unified status colors
const statusColor = {
  completed: 'bg-green-100 text-green-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
};

export const TaskDetailModal = ({ isOpen, onClose, taskId, onTaskUpdated, onTaskDeleted }) => {
  const closeBtnRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(null);

  // Fetch task details
  const fetchTaskDetails = async () => {
    if (!taskId || !user?.token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTask(response.data);
      
      // Fetch card details if available
      if (response.data.cardUsed) {
        try {
          const cardResponse = await axios.get(`/api/cards/${response.data.cardUsed}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setCardDetails(cardResponse.data);
        } catch (cardErr) {
          console.error('Failed to fetch card details:', cardErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch task details:', err);
      setError('Unable to load task details');
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when modal opens or taskId changes
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
    
    // Reset delete confirmation state
    if (!isOpen) {
      setConfirmDelete(false);
    }
  }, [isOpen, taskId, user?.token]);

  // Calculate time elapsed for equipped tasks
  useEffect(() => {
    if (task && task.slotEquippedAt) {
      const calculateElapsed = () => {
        const now = new Date();
        const equippedAt = new Date(task.slotEquippedAt);
        const diffMs = now - equippedAt;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        timeString += `${minutes}m`;
        
        setTimeElapsed(timeString);
      };
      
      calculateElapsed();
      const timer = setInterval(calculateElapsed, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }
  }, [task]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Complete subtask
  const handleCompleteSubtask = async (subTaskIndex) => {
    if (!task || !user?.token || loadingIdx !== null) return;
    
    setLoadingIdx(subTaskIndex);
    
    try {
      const response = await axios.put(
        `/api/tasks/${taskId}`,
        { subTaskIndex },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      const { task: updatedTask } = response.data;
      
      if (updatedTask) {
        setTask(updatedTask);
        if (onTaskUpdated) {
          // Pass additional parameter to indicate this is from subtask completion
          onTaskUpdated(updatedTask, false, true);
        }
        
        // Show reward information
        if (response.data.subTaskReward) {
          const { expGained, goldGained } = response.data.subTaskReward;
          toast.success(
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-sm">Subtask completed!</span>
              <div className="flex items-center">
                <span className="text-yellow-500 mr-1">🏅</span>
                <span className="text-xs">
                  Earned <span className="font-bold text-yellow-600">{expGained} XP</span>
                  and <span className="font-bold text-amber-500">{goldGained} Gold</span>
                </span>
              </div>
            </div>,
            { 
              duration: 3000, 
              position: 'top-center',
              id: 'subtask-completion', // 使用固定ID，确保新通知会替换旧通知
            }
          );
        } else {
          toast.success('Subtask completed!', {
            duration: 3000,
            position: 'top-center',
            id: 'subtask-completion', // 使用固定ID，确保新通知会替换旧通知
          });
        }
        
        // Trigger task completion event with detailed information
        window.dispatchEvent(new CustomEvent('subtaskCompleted', {
          detail: {
            taskId,
            updatedTask,
            subTaskIndex,
            isSubtaskCompletion: true
          }
        }));
      }
    } catch (err) {
      console.error('Failed to complete subtask:', err);
      toast.error(err.response?.data?.message || 'Failed to complete subtask');
    } finally {
      setLoadingIdx(null);
    }
  };

  // Handle complete main task
  const handleCompleteTask = async () => {
    if (!task || !user?.token || loading) return;
    
    setLoading(true);
    
    try {
      // If it is a long-term task, use a dedicated API to complete it
      if (task.type === 'long') {
        // Importing dedicated services for long-term tasks
        const { completeLongTask } = await import('../../services/taskService');
        const response = await completeLongTask(taskId, user.token);

        console.log("Long-term task completion response:", response);

        try {
          // Extract the task and reward data from the response
          const updatedTask = response.task;
          const reward = response.reward;

          console.log("Parsed long-term mission data:", updatedTask);
          console.log("Parsed long-term task reward data:", reward);

          // Update local task status
          if (updatedTask) {
            setTask(updatedTask);
            if (onTaskUpdated) {
              onTaskUpdated(updatedTask, false, true);
            }
          } else {
            // If no updated task data is obtained, the current task is also marked as completed
            const localUpdatedTask = {...task, status: 'completed', completedAt: new Date()};
            setTask(localUpdatedTask);
            if (onTaskUpdated) {
              onTaskUpdated(localUpdatedTask, false, true);
            }
            console.log("No update task data was obtained, using local update status");
          }

          // Use a dedicated long-term task completion notification component
          const { showLongTaskCompletedToast } = await import('./TaskCompletedToast');
          showLongTaskCompletedToast(response, updatedTask || task);

          // Automatically unequip completed long-term task
          try {
            const { unequipTask } = await import('../../services/taskService');
            await unequipTask(taskId, user.token);
            console.log("Successfully unequipped completed long-term task");
          } catch (unequipError) {
            console.error("Failed to unequip completed long-term task:", unequipError);
          }

          // Triggering a task completion event with detailed task data
          window.dispatchEvent(new CustomEvent('taskCompleted', {
            detail: {
              taskId,
              updatedTask: updatedTask || task,
              isLongTask: true,
              status: 'completed'
            }
          }));

          // Delay closing the details modal after the task is completed
          setTimeout(() => {
            onClose();
          }, 1000);
        } catch (parseError) {
          // Handle possible errors in parsing responses
          console.error("Error parsing long task completion response:", parseError);

          // Even if parsing errors occur, task completion information is still displayed
          toast.success("Quest Complete!");

          // Update local task status
          const localUpdatedTask = {...task, status: 'completed', completedAt: new Date()};
          setTask(localUpdatedTask);
          if (onTaskUpdated) {
            onTaskUpdated(localUpdatedTask, false, true);
          }

          // Automatically unequip completed long-term task (in error handler)
          try {
            const { unequipTask } = await import('../../services/taskService');
            await unequipTask(taskId, user.token);
            console.log("Successfully unequipped completed long-term task (error handler)");
          } catch (unequipError) {
            console.error("Failed to unequip completed long-term task (error handler):", unequipError);
          }

          // Triggering a task completion event with detailed task data
          window.dispatchEvent(new CustomEvent('taskCompleted', {
            detail: {
              taskId,
              updatedTask: localUpdatedTask,
              isLongTask: true,
              status: 'completed'
            }
          }));

          // Delay closing modal
          setTimeout(() => onClose(), 1000);
        }
      } else {
        // Normal task completion logic
        const response = await axios.put(
          `/api/tasks/${taskId}`,
          { status: 'completed' },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        
        console.log("Normal task completion response:", response);
        
        try {
          // Extract task and reward data from the response, considering multiple possible structures
          let updatedTask = null;
          let reward = null;
          
          // Try getting data from different locations
          if (response?.data?.task) updatedTask = response.data.task;
          else if (response?.task) updatedTask = response.task;
          
          if (response?.data?.reward) reward = response.data.reward;
          else if (response?.reward) reward = response.reward;
          
          console.log("Parsed common task data:", updatedTask);
          console.log("Parsed reward data for common tasks:", reward);
          
          // Update local task status (if valid update data is obtained)
          if (updatedTask) {
            setTask(updatedTask);
            if (onTaskUpdated) {
              onTaskUpdated(updatedTask, false, true);
            }
          } else {
            // Mark the current task as completed even if no updated task data is obtained
            const localUpdatedTask = {...task, status: 'completed', completedAt: new Date()};
            setTask(localUpdatedTask);
            if (onTaskUpdated) {
              onTaskUpdated(localUpdatedTask, false, true);
            }
            console.log("No update task data was obtained, using local update status");
          }
          
          // Show reward information
          if (reward) {
            const { expGained, goldGained, leveledUp, newLevel } = reward;
            
            // Make sure the reward value is valid
            if (expGained > 0 || goldGained > 0) {
              toast.success(
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-sm">Task Complete!</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">🏅</span>
                    <span className="text-xs">
                      Earned <span className="font-bold text-yellow-600">{expGained} XP</span>
                      and <span className="font-bold text-amber-500">{goldGained} Gold</span>
                    </span>
                  </div>
                  {leveledUp && (
                    <div className="flex items-center text-xs text-blue-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span>Level Up! You've reached level {newLevel}</span>
                    </div>
                  )}
                </div>,
                { duration: 5000, position: 'top-center' }
              );
            } else {
              // The reward value is 0, use the task itself or the default value
              const currentTask = updatedTask || task;
              const defaultXp = currentTask.experienceReward || (currentTask.type === 'long' ? 30 : 30);
              const defaultGold = currentTask.goldReward || (currentTask.type === 'long' ? 15 : 15);
              
              console.log(`The task is completed but the reward value is 0, use the default value: ${defaultXp} XP, ${defaultGold} Gold`);
              
              toast.success(
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-sm">Task Complete!</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">🏅</span>
                    <span className="text-xs">
                      Earned <span className="font-bold text-yellow-600">{defaultXp} XP</span>
                      and <span className="font-bold text-amber-500">{defaultGold} Gold</span>
                    </span>
                  </div>
                </div>,
                { duration: 5000, position: 'top-center' }
              );
            }
          } else {
            // No reward data, use the task itself or default value
            const currentTask = updatedTask || task;
            const defaultXp = currentTask.experienceReward || (currentTask.type === 'long' ? 30 : 10);
            const defaultGold = currentTask.goldReward || (currentTask.type === 'long' ? 15 : 5);
            
              console.log(`The task is completed but there is no reward data, use the default value: ${defaultXp} XP, ${defaultGold} Gold`);
            
            toast.success(
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm">Task Complete!</span>
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">🏅</span>
                  <span className="text-xs">
                    Earned <span className="font-bold text-yellow-600">{defaultXp} XP</span>
                    and <span className="font-bold text-amber-500">{defaultGold} Gold</span>
                  </span>
                </div>
              </div>,
              { duration: 5000, position: 'top-center' }
            );
          }
          
          // Triggering a task completion event
          window.dispatchEvent(new CustomEvent('taskCompleted', {
            detail: {
              taskId,
              updatedTask: updatedTask || (task ? {...task, status: 'completed', completedAt: new Date()} : null),
              status: 'completed'
            }
          }));
          
          // Delay closing the details modal after the task is completed
          setTimeout(() => {
            onClose();
          }, 1000);

          // Check for new achievements
          const newlyUnlocked = await checkAchievements();

          // Show achievement notifications
          newlyUnlocked.forEach(achievement => {
            toast.success(
              <AchievementUnlockNotification achievement={achievement} />,
              {
                duration: 5000,
                position: "top-right",
                style: {
                  minWidth: '320px'
                }
              }
            );
          });
        } catch (parseError) {
          // Handle possible errors in parsing responses
          console.error("Error parsing task completion response:", parseError);
          
          // Even if parsing errors occur, task completion information is still displayed
          toast.success("Quest completed successfully!");
          
          // Update local task status
          const localUpdatedTask = {...task, status: 'completed', completedAt: new Date()};
          setTask(localUpdatedTask);
          if (onTaskUpdated) {
            onTaskUpdated(localUpdatedTask, false, true);
          }
          
          // Automatically unequip completed long-term task (in error handler)
          try {
            const { unequipTask } = await import('../../services/taskService');
            await unequipTask(taskId, user.token);
            console.log("Successfully unequipped completed long-term task (error handler)");
          } catch (unequipError) {
            console.error("Failed to unequip completed long-term task (error handler):", unequipError);
          }

          // Triggering a task completion event with detailed task data
          window.dispatchEvent(new CustomEvent('taskCompleted', {
            detail: {
              taskId,
              updatedTask: localUpdatedTask,
              isLongTask: true,
              status: 'completed'
            }
          }));

          // Delay closing modal
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
      const errorMessage = err.response?.data?.message || 'Failed to complete task';
      toast.error(errorMessage);
      
      // If it is a network error or other non-server rejection error, try to update the task status locally
      if (!err.response || err.response.status >= 500) {
        console.log("Attempt to update local task status (server error condition)");
        try {
          const localUpdatedTask = {...task, status: 'completed', completedAt: new Date()};
          setTask(localUpdatedTask);
          if (onTaskUpdated) {
            onTaskUpdated(localUpdatedTask, false, true);
          }
          
          toast.success(
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-sm">Task marked as completed</span>
              <div className="text-xs text-gray-500">
                (Server connection issue - rewards may be delayed)
              </div>
            </div>,
            { duration: 5000, position: 'top-center' }
          );
          
          // Close the modal later
          setTimeout(() => onClose(), 2000);
        } catch (localError) {
          console.error("Local task status update failed:", localError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!taskId || !user?.token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (onTaskDeleted) {
        onTaskDeleted(taskId);
      }
      
      toast.success('Task deleted');

      // Check for new achievements
      const newlyUnlocked = await checkAchievements();

      // Show achievement notifications
      newlyUnlocked.forEach(achievement => {
        toast.success(
          <AchievementUnlockNotification achievement={achievement} />,
          {
            duration: 5000,
            position: "top-right",
            style: {
              minWidth: '320px'
            }
          }
        );
      });

      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error(err.response?.data?.message || 'Failed to delete task');
      setConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  // Edit task
  const handleEditTask = () => {
    if (task && onTaskUpdated) {
      onTaskUpdated(task, true); // Pass second parameter to indicate edit mode
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate progress for progress bar
  const calculateProgress = () => {
    if (!task) return 0;
    if (task.type === 'short') return task.status === 'completed' ? 100 : 0;
    if (!task.subTasks || task.subTasks.length === 0) return 0;
    
    const completedSubtasks = task.subTasks.filter(st => st.status === 'completed').length;
    return Math.round((completedSubtasks / task.subTasks.length) * 100);
  };

  return (
    <AnimatePresence>
      <Dialog
        open={isOpen}
        onClose={onClose}
        initialFocus={closeBtnRef}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            as={motion.div}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
          >
            {loading && !task ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error && !task ? (
              <div className="p-4 text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button 
                  onClick={fetchTaskDetails}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  Retry
                </button>
              </div>
            ) : task ? (
              <>
                {/* Top Bar - Title, Type, Status */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 mb-4 gap-2">
                  <div>
                    <Dialog.Title className="text-2xl font-bold mb-1">{task.title}</Dialog.Title>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.type === 'long' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {task.type === 'long' ? 'Quest Chains' : 'Daily Quest'}
                      </span>
                      {task.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[task.status?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                      {task.status === 'completed' ? 'Completed' : 
                       task.status === 'in-progress' ? 'In Progress' : 
                       task.status === 'expired' ? 'Expired' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Card and Progress Info Row */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Task Progress Card */}
                  <div className="bg-gray-50 rounded-lg p-4 flex-1">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <BarChart4 className="h-4 w-4 mr-1 text-blue-500" />
                      Task Progress
                    </h3>
                    <div className="mb-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${task.type === 'long' ? 'bg-blue-500' : 'bg-purple-500'} rounded-full transition-all`}
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{calculateProgress()}% Complete</span>
                      {task.type === 'long' && task.subTasks && (
                        <span>{task.subTasks.filter(st => st.status === 'completed').length}/{task.subTasks.length} Subtasks</span>
                      )}
                    </div>
                  </div>

                  {/* Card Used Info */}
                  {cardDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 flex-1">
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-1 text-blue-500" />
                        Card Used
                      </h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${cardDetails.type === 'blank' ? 'bg-gray-400' : 'bg-yellow-400'}`}></span>
                        <span className="text-sm font-medium">
                          {cardDetails.title || (cardDetails.type === 'blank' ? 'Blank Card' : 'Special Card')}
                        </span>
                      </div>
                      {cardDetails.description && (
                        <p className="text-xs text-gray-600 mb-1">{cardDetails.description}</p>
                      )}
                      {cardDetails.bonus && (
                        <div className="text-xs text-gray-600">
                          {cardDetails.bonus.experienceMultiplier > 1 && (
                            <span className="text-green-600 font-medium">
                              +{Math.round((cardDetails.bonus.experienceMultiplier - 1) * 100)}% XP
                            </span>
                          )}
                          {cardDetails.bonus.goldMultiplier > 1 && (
                            <span className="text-amber-600 font-medium ml-2">
                              +{Math.round((cardDetails.bonus.goldMultiplier - 1) * 100)}% Gold
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reward Info & Time Info Row */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Reward Info */}
                  <div className="bg-gray-50 rounded-lg p-4 flex-1">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                      Rewards
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded-full mr-2">
                          <span className="text-yellow-600 text-xs">XP</span>
                        </div>
                        <span className="text-sm">
                          {task.type === 'long' 
                            ? `${task.finalBonusExperience || 10} (final)`
                            : task.baseExperience || 10}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full mr-2">
                          <span className="text-amber-600 text-xs">G</span>
                        </div>
                        <span className="text-sm">
                          {task.type === 'long' 
                            ? `${task.finalBonusGold || 5} (final)`
                            : task.baseGold || 5}
                        </span>
                      </div>
                    </div>
                    {task.type === 'long' && task.subTasks?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        + {task.subTasks.length} x {task.subTasks[0]?.experience || 10} XP / {task.subTasks[0]?.gold || 5} Gold (per subtask)
                      </div>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="bg-gray-50 rounded-lg p-4 flex-1">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-blue-500" />
                      Time Info
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {task.dueDate && (
                        <div className="flex items-center text-xs">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-gray-600 mr-1">Due:</span>
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      {task.slotEquippedAt && (
                        <div className="flex items-center text-xs">
                          <Hourglass className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-gray-600 mr-1">Equipped:</span>
                          <span>{formatDate(task.slotEquippedAt)}</span>
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="flex items-center text-xs">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span className="text-gray-600 mr-1">Completed:</span>
                          <span>{formatDate(task.completedAt)}</span>
                        </div>
                      )}
                      {timeElapsed && task.status !== 'completed' && (
                        <div className="flex items-center text-xs">
                          <Hourglass className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="text-gray-600 mr-1">Time Elapsed:</span>
                          <span>{timeElapsed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-1 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                      Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap min-h-[32px] bg-gray-50 p-3 rounded-md">{task.description}</p>
                  </div>
                )}

                {/* Subtasks list */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-blue-500" />
                      Subtasks
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-2">
                      {task.subTasks.map((subTask, idx) => {
                        const isDone = subTask.status === 'completed';
                        return (
                          <div 
                            key={subTask._id || idx} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {isDone ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle 
                                  className="h-5 w-5 text-gray-400 cursor-pointer hover:text-blue-500" 
                                  onClick={() => handleCompleteSubtask(idx)}
                                />
                              )}
                              <div className="flex flex-col">
                                <span className={isDone ? 'line-through text-gray-400' : 'font-medium'}>
                                  {subTask.title}
                                </span>
                                {subTask.dueDate && (
                                  <span className="text-xs text-gray-500">
                                    Due: {formatDate(subTask.dueDate)}
                                  </span>
                                )}
                                {subTask.completedAt && (
                                  <span className="text-xs text-green-500">
                                    Completed: {formatDate(subTask.completedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isDone && (
                              <button
                                onClick={() => handleCompleteSubtask(idx)}
                                disabled={loadingIdx === idx}
                                className={`ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${loadingIdx === idx ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {loadingIdx === idx ? 'Processing...' : 'Complete'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!confirmDelete ? (
                  <div className="mt-6 flex justify-between">
                    <div>
                      {/* Complete Task Button - Only for pending or in-progress tasks */}
                      {task.status !== 'completed' && task.status !== 'expired' && (
                        <button
                          onClick={handleCompleteTask}
                          disabled={loading}
                          className={`px-4 py-2 flex items-center bg-green-500 text-white rounded hover:bg-green-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {loading ? 'Processing...' : 'Complete Task'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        ref={closeBtnRef}
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Close
                      </button>
                      
                      {task.status !== 'in-progress' && (
                        <>
                          <button
                            onClick={handleEditTask}
                            className="px-4 py-2 flex items-center bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => setConfirmDelete(true)}
                            className="px-4 py-2 flex items-center bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-700 mb-4">
                      Are you sure you want to delete this task? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteTask}
                        disabled={loading}
                        className={`px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </Dialog.Panel>
        </div>
      </Dialog>
    </AnimatePresence>
  );
};

