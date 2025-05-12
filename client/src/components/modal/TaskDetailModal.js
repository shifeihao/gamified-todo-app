// src/components/modal/TaskDetailModal.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Modal } from '../base/Modal';
import { TaskForm } from '../form/TaskForm';
import { Tooltip } from '../base/Tooltip';
import { Edit3, Trash2, CheckCircle, XCircle, Loader2, Calendar, Repeat as RepeatIcon, AlertTriangle, Info } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns'; // For date formatting
import AuthContext from '../../context/AuthContext';

const API_SIMULATION_DELAY = 500; // For simulating API calls

// Dummy API functions (replace with your actual API calls)
const fetchTaskById = async (taskId, token) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

const updateTaskAPI = async (taskId, data, token) => {
  try {
    // 确保所有状态相关的字段都是小写
    const processedData = {
      ...data,
      status: (data.status || 'pending').toLowerCase(),
      subTasks: data.subTasks?.map(st => ({
        ...st,
        status: (st.status || 'pending').toLowerCase()
      }))
    };

    console.log('Sending task update with data:', processedData);

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

const deleteTaskAPI = async (taskId, token) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

const toggleSubtaskAPI = async (taskId, subtaskId, isCompleted, token) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isCompleted }),
    });
    if (!response.ok) {
      throw new Error('Failed to toggle subtask');
    }
    return await response.json();
  } catch (error) {
    console.error('Error toggling subtask:', error);
    throw error;
  }
};
// End of dummy API functions

const formatDate = (dateString, taskType = 'short') => {
  if (!dateString) return 'Not set';
  const date = parseISO(dateString);
  if (!isValid(date)) return 'Invalid Date';

  // Check if the time is midnight (00:00:00), which might indicate a date-only "long" task
  const isDateOnly = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

  if (taskType === 'long' || isDateOnly) {
    return format(date, 'MMMM d, yyyy');
  }
  return format(date, 'MMMM d, yyyy, h:mm a');
};

const WEEK_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatRepeatInfo = (task) => {
    if (!task.isRepeating) return null;
    let info = `Repeats ${task.repeatFrequency}`;
    if (task.repeatFrequency === 'weekly' && task.repeatDaysOfWeek?.length > 0) {
        const days = task.repeatDaysOfWeek.map(d => WEEK_DAYS_SHORT[d]).join(', ');
        info += ` on ${days}`;
    } else if (task.repeatFrequency === 'monthly' && task.repeatDayOfMonth) {
        info += ` on day ${task.repeatDayOfMonth}`;
    }
    if (task.repeatEndDate) {
        info += ` until ${format(parseISO(task.repeatEndDate), 'MMM d, yyyy')}`;
    } else {
        info += ` indefinitely`;
    }
    return info;
};


export const TaskDetailModal = ({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated, // Callback after task is successfully updated
  onTaskDeleted, // Callback after task is successfully deleted
}) => {
  const { user } = useContext(AuthContext);
  const [taskData, setTaskData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // For delete confirmation

  const loadTask = useCallback(async () => {
    if (!taskId || !user?.token) {
      setTaskData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTaskById(taskId, user.token);
      if (!data) {
        throw new Error('Task not found');
      }
      setTaskData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading task:', err);
      setError(err.message || 'Failed to load task details.');
      setTaskData(null);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, user?.token]);

  useEffect(() => {
    if (isOpen) {
      loadTask();
      setIsEditing(false);
      setIsDeleting(false);
    }
  }, [isOpen, loadTask]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null); // Clear previous errors when entering edit mode
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Optionally reload task data if there's a chance it was "dirtied" by optimistic updates not yet saved
    // loadTask();
  };

  const handleSaveTask = async (formData) => {
    if (!user?.token) {
      setError('Authentication required');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 处理表单数据
      const processedFormData = {
        ...formData,
        status: (formData.status || 'pending').toLowerCase(),
        isCompleted: formData.status?.toLowerCase() === 'completed',
        subTasks: formData.subTasks?.map(st => ({
          ...st,
          status: st.isCompleted ? 'completed' : 'pending'
        }))
      };

      console.log('Saving task with data:', processedFormData);
      
      const updatedTask = await updateTaskAPI(taskId, processedFormData, user.token);
      setTaskData(updatedTask);
      setIsEditing(false);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (err) {
      console.error('Failed to save task:', err);
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = () => {
    setIsDeleting(true); // Show confirmation
  };

  const handleConfirmDelete = async () => {
    if (!user?.token) {
      setError('Authentication required');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await deleteTaskAPI(taskId, user.token);
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
      setIsDeleting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    if (!taskData || !user?.token) return;
    const originalSubTasks = [...taskData.subTasks];

    // Optimistic update
    const updatedSubTasks = taskData.subTasks.map(st =>
      st._id === subtaskId ? {
        ...st,
        isCompleted: !currentStatus,
        status: !currentStatus ? 'completed' : 'pending' // 使用小写的状态值
      } : st
    );
    setTaskData(prev => ({ ...prev, subTasks: updatedSubTasks }));

    try {
      await toggleSubtaskAPI(taskId, subtaskId, !currentStatus, user.token);
      if (onTaskUpdated) onTaskUpdated({...taskData, subTasks: updatedSubTasks});
    } catch (err) {
      setError(err.message || 'Failed to update subtask.');
      setTaskData(prev => ({ ...prev, subTasks: originalSubTasks }));
    }
  };

  const handleToggleMainTaskCompletion = async () => {
    if (!taskData || !user?.token) return;
    setIsLoading(true);
    setError(null);
    const newCompletedStatus = !taskData.isCompleted;

    try {
      // 移除可能导致问题的字段
      const { _id, createdAt, updatedAt, __v, ...cleanTaskData } = taskData;

      const updatedTaskData = {
        ...cleanTaskData,
        isCompleted: newCompletedStatus,
        status: newCompletedStatus ? 'completed' : 'pending',
        subTasks: cleanTaskData.subTasks?.map(({ _id, createdAt, updatedAt, __v, ...rest }) => ({
          ...rest,
          status: rest.isCompleted ? 'completed' : 'pending'
        }))
      };

      console.log('Updating task with data:', updatedTaskData);

      const updatedTask = await updateTaskAPI(taskId, updatedTaskData, user.token);
      setTaskData(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err.message || 'Failed to update task completion status.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // 初始加载状态
    if (isLoading && !taskData) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-500">Loading task details...</p>
        </div>
      );
    }

    // 错误状态
    if (error && !taskData && !isEditing) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-red-700 font-semibold">Error Loading Task</p>
          <p className="text-red-600 text-sm text-center mt-2">{error}</p>
          <button
            onClick={loadTask}
            className="mt-4 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-md border border-primary-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    // 无数据状态
    if (!taskData && !isEditing) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <Info className="h-12 w-12 text-yellow-500" />
          <p className="mt-4 text-yellow-700 font-semibold">No Task Data</p>
          <p className="text-yellow-600 text-sm text-center mt-2">
            The requested task could not be found or has been deleted.
          </p>
        </div>
      );
    }

    // 编辑状态
    if (isEditing && taskData) {
      return (
        <div className="space-y-4">
<div>
  {error && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
      <p className="text-sm text-red-700">{error}</p>
    </div>
  )}
  <h3 className="text-lg font-semibold mb-2">Quest Description</h3>
  <p className="text-gray-600">
    {taskData.description || 'Currently no description available'}
  </p>
</div>
        </div>
      );
    }

    // 显示状态
    if (taskData) {
      return (
        <div className="space-y-4">
          {/* 任务标题和完成状态 */}
          <div className="flex items-start justify-between">
            <h2 className={`text-2xl font-semibold ${taskData.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {taskData.title}
            </h2>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              )}
              <Tooltip content={taskData.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}>
                <button
                  onClick={handleToggleMainTaskCompletion}
                  disabled={isLoading}
                  className={`p-1.5 rounded-full hover:bg-gray-200 transition-colors ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {taskData.isCompleted ? (
                    <XCircle className="h-6 w-6 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* 描述 */}
          {taskData.description && (
            <p className="text-gray-600 whitespace-pre-wrap">{taskData.description}</p>
          )}

          {/* 元数据：截止日期和重复信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 border-t border-b border-gray-200 py-3">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-gray-500" />
              <strong>Due:</strong>&nbsp;
              <span className={new Date(taskData.dueDate) < new Date() && !taskData.isCompleted ? 'text-red-600 font-medium' : ''}>
                {formatDate(taskData.dueDate, taskData.taskType)}
              </span>
            </div>
          </div>

          {/* 子任务（任务步骤） */}
          {taskData.taskType === 'long' && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">Quest Steps:</h4>
              {taskData.subTasks && taskData.subTasks.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {taskData.subTasks.map((subtask) => (
                    <li key={subtask._id} className="flex items-center p-2.5 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        id={`subtask-${subtask._id}`}
                        checked={subtask.isCompleted}
                        onChange={() => handleToggleSubtask(subtask._id, subtask.isCompleted)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-3 cursor-pointer"
                      />
                      <label
                        htmlFor={`subtask-${subtask._id}`}
                        className={`flex-grow text-sm cursor-pointer ${subtask.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}
                      >
                        {subtask.title}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No quest steps for this task.</p>
              )}
            </div>
          )}

          {/* 错误显示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const modalTitle = isEditing
    ? `Edit Task: ${taskData?.title || ''}`
    : (taskData?.title || 'Task Details');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size={isEditing ? "2xl" : "xl"}
    >
      <div className="p-1">
        {renderContent()}

        {/* 操作按钮 */}
        {taskData && !isEditing && !isDeleting && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-md border border-primary-300 transition-colors flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Task
            </button>
            <button
              onClick={handleDeleteRequest}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md border border-red-300 transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </button>
          </div>
        )}

        {/* 删除确认对话框 */}
        {isDeleting && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-700 mb-4">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleting(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Task
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
