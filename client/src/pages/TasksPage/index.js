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

import { getCardInventory } from '../../services/cardService'; // ✅ 卡片接口

const TasksPage = () => {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]); // ✅ 卡片 state
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('daily');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [allTasks, equipped, inventory] = await Promise.all([
        getTasks(user.token),
        getEquippedTasks(user.token),
        getCardInventory(user.token) // ✅ 获取卡片数据
      ]);
      setTasks(allTasks);
      setEquippedTasks(equipped);
      setCards(inventory); // ✅ 赋值卡片数组
      setError('');
    } catch (err) {
      console.error(err);
      setError('获取任务数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTasks();
    }
  }, [user]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleComplete = async (id) => {
    try {
      setLoading(true);
      await completeTask(id, user.token);
      showSuccess('任务已完成');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('完成任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除任务吗？')) return;
    try {
      setLoading(true);
      await deleteTask(id, user.token);
      showSuccess('任务已删除');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('删除任务失败');
    } finally {
      setLoading(false);
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
      showSuccess('已装备任务');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('装备任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnequip = async (id) => {
    try {
      setLoading(true);
      await unequipTask(id, user.token);
      showSuccess('已卸下任务');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('卸下任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromSlot = (slotIndex) => {
    setCreateSlotIndex(slotIndex);
    setShowForm(true);
  };

  const handleDropToSlot = async (taskId, slotIndex) => {
    try {
      setLoading(true);
      await equipTask(taskId, slotIndex, user.token);
      showSuccess('任务已装备');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('装备失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingTask) {
        await updateTask(editingTask._id, formData, user.token);
        showSuccess('任务已更新');
      } else {
        const res = await createTask(formData, user.token);
        if (formData.fromSlot && formData.slotIndex >= 0) {
          await equipTask(res._id, formData.slotIndex, user.token);
        }
        showSuccess('任务已创建');
      }
      await fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    } catch (err) {
      console.error(err);
      setError(editingTask ? '更新任务失败' : '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">我的任务</h1>
            <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              创建新任务
            </button>
          </div>

          {error && <div className="text-red-600">{error}</div>}
          {successMessage && <div className="text-green-600">{successMessage}</div>}

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <TimetablePanel
                tasks={tasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
            />

            <RepositoryPanel
                tasks={tasks}
                cards={cards} // ✅ 传入卡片数组
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onEquip={handleEquip}
            />
          </div>
        </div>
      </div>
  );
};

export default TasksPage;
