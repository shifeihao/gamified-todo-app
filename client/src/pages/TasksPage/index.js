// index.js（原 TasksPage.js）

import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/Navbar';
import CreateTaskModal from '../../components/CreateTaskModal';
import AuthContext from '../../context/AuthContext';
import DailyTaskPanel from './DailyTaskPanel';
import TimetablePanel from './TimetablePanel';
import RepositoryPanel from './RepositoryPanel';
import {
  getTasks,
  getEquippedTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  equipTask,
  unequipTask
} from '../../services/taskService';

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('daily');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [allTasks, equipped] = await Promise.all([
        getTasks(user.token),
        getEquippedTasks(user.token)
      ]);
      setTasks(allTasks);
      setEquippedTasks(equipped);
      setError('');
    } catch (error) {
      setError('获取任务数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchTasks();
    }
  }, [user]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingTask) {
        await updateTask(editingTask._id, formData, user.token);
        showSuccess('任务已更新');
      } else {
        const response = await createTask(formData, user.token);
        if (formData.fromSlot && formData.slotIndex >= 0) {
          await equipTask(response._id, formData.slotIndex, user.token);
          showSuccess('任务已创建并装备到任务槽');
        } else {
          showSuccess('任务已创建并存储到仓库');
        }
      }
      await fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    } catch (error) {
      setError(editingTask ? '更新任务失败' : '创建任务失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromSlot = (slotIndex) => {
    setCreateSlotIndex(slotIndex);
    setShowForm(true);
  };

  const renderActiveTabContent = () => {
    if (loading) {
      return <p className="text-center py-8 text-gray-500">加载中...</p>;
    }
    switch (activeTab) {
      case 'daily':
        return (
            <DailyTaskPanel
                tasks={tasks}
                equippedTasks={equippedTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onUnequip={handleUnequip}
                onDrop={handleDropToSlot}
                onCreateTask={handleCreateFromSlot}
                onEquip={handleEquip}
            />
        );
      case 'timetable':
        return (
            <TimetablePanel
                tasks={tasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
            />
        );
      case 'repository':
        return (
            <RepositoryPanel
                tasks={tasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onEquip={handleEquip}
            />
        );
      default:
        return null;
    }
  };

  const handleEdit = (task) => setEditingTask(task);
  const handleComplete = async (id) => {
    try {
      setLoading(true);
      await completeTask(id, user.token);
      showSuccess('任务已完成');
      await fetchTasks();
    } catch (error) {
      setError('完成任务失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm('确定要删除任务吗？')) {
      try {
        setLoading(true);
        await deleteTask(id, user.token);
        showSuccess('任务已删除');
        await fetchTasks();
      } catch (error) {
        setError('删除任务失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };
  const handleEquip = async (task) => {
    try {
      const occupied = equippedTasks.map(t => t.slotPosition);
      let freeSlot = -1;
      for (let i = 0; i < 3; i++) {
        if (!occupied.includes(i)) {
          freeSlot = i;
          break;
        }
      }
      if (freeSlot === -1) {
        setError('任务槽已满');
        return;
      }
      setLoading(true);
      await equipTask(task._id, freeSlot, user.token);
      showSuccess('已装备');
      await fetchTasks();
    } catch (error) {
      setError('装备失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleUnequip = async (id) => {
    try {
      setLoading(true);
      await unequipTask(id, user.token);
      showSuccess('任务已卸下');
      await fetchTasks();
    } catch (error) {
      setError('卸下失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleDropToSlot = async (taskId, slotIndex) => {
    try {
      setLoading(true);
      await equipTask(taskId, slotIndex, user.token);
      showSuccess('任务已装备');
      await fetchTasks();
    } catch (error) {
      setError('装备失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">我的任务</h1>
            <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              创建新任务
            </button>
          </div>

          {error && <div className="text-red-600 mb-2">{error}</div>}
          {successMessage && <div className="text-green-600 mb-2">{successMessage}</div>}

          <CreateTaskModal
              isOpen={showForm}
              onClose={() => {
                setShowForm(false);
                setEditingTask(null);
                setCreateSlotIndex(-1);
              }}
              onSubmit={handleSubmit}
              loading={loading}
              initialData={editingTask}
              slotIndex={createSlotIndex}
          />

          <div className="border-b mb-4 flex space-x-6">
            <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}>
              每日任务
            </button>
            <button onClick={() => setActiveTab('repository')} className={activeTab === 'repository' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}>
              任务仓库
            </button>
            <button onClick={() => setActiveTab('timetable')} className={activeTab === 'timetable' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}>
              Timetable
            </button>
          </div>

          {renderActiveTabContent()}
        </div>
      </div>
  );
};

export default TasksPage;
