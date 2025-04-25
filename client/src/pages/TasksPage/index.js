// src/pages/TasksPage/index.js

import React, { useState, useEffect, useContext } from 'react';
import { Navbar } from '../../components';
import {CreateTaskModal} from '../../components';
import AuthContext from '../../context/AuthContext';

import DailyTaskPanel from './DailyTaskPanel';
import TimetablePanel from './TimetablePanel';
import RepositoryPanel from './RepositoryPanel';
import { getCardInventory } from '../../services/cardService'; // ✅ 卡片接口

import {
  getTasks,
  getEquippedTasks,
  getEquippedShortTasks,
  getEquippedLongTasks,
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
  const [cards, setCards] = useState([]); // ✅ 卡片 state
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // 短期任务槽
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // 长期任务槽
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState('短期'); // 默认创建任务类型

  // 当前激活的 tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState('daily');

  // 拉取任务数据
  const fetchTasks = async () => {
    try {
      setLoading(true);
        const [allTasks, equipped, shortTasks, longTasks, inventory] = await Promise.all([
        getTasks(user.token),
        getEquippedTasks(user.token),
        getEquippedShortTasks(user.token),
        getEquippedLongTasks(user.token),
        getCardInventory(user.token),
      ]);
      setTasks(allTasks);
      setEquippedTasks(equipped);
      setEquippedShortTasks(shortTasks);
      setEquippedLongTasks(longTasks);
      setCards(inventory);
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

  // 显示成功信息
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 回调函数集合

  // 编辑任务
  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  // 完成任务并卸下已完成任务
  const handleComplete = async (id) => {
    try {
      setLoading(true);
      await completeTask(id, user.token);
      // 卸下已完成的任务，防止其继续占用任务槽
      await unequipTask(id, user.token);
      showSuccess('任务已完成');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('完成任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除任务
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

  // 装备任务
  const handleEquip = async (task) => {
    // 不允许装备已完成任务
    if (task.status === '已完成') {
      setError('无法装备已完成的任务');
      return;
    }
    try {
      // 根据任务类型选择对应的任务槽
      const isLongTask = task.type === '长期';
      const targetTasks = isLongTask ? equippedLongTasks : equippedShortTasks;
      
      // 获取已占用的槽位索引
      const occupied = targetTasks.map(t => t.slotPosition);
      
      // 检查所有槽位(0-2)，找到第一个空闲的
      let freeSlot = -1;
      for (let i = 0; i < 3; i++) {
        if (!occupied.includes(i)) {
          freeSlot = i;
          break;
        }
      }
      
      if (freeSlot === -1) {
        setError(isLongTask ? '长期任务槽已满' : '短期任务槽已满');
        return;
      }
      
      setLoading(true);
      // 传递slotType参数
      const slotType = isLongTask ? 'long' : 'short';
      await equipTask(task._id, freeSlot, user.token, slotType);
      showSuccess(`已装备${isLongTask ? '长期' : '短期'}任务`);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('装备任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 卸下任务
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

  // 从槽位新建
  const handleCreateFromSlot = (slotIndex, slotType) => {
    setCreateSlotIndex(slotIndex);
    setCreateSlotType(slotType);
    setShowForm(true);
  };

  // 拖放到槽位
  const handleDropToSlot = async (taskId, slotIndex, slotType = 'short') => {
    try {
      setLoading(true);
      await equipTask(taskId, slotIndex, user.token, slotType);
      showSuccess(`已装备${slotType === 'long' ? '长期' : '短期'}任务`);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError('装备失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建 / 更新 任务
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingTask) {
        await updateTask(editingTask._id, formData, user.token);
        showSuccess('任务已更新');
      } else {
        const res = await createTask(formData, user.token);
        if (formData.fromSlot && formData.slotIndex >= 0) {
          // 根据任务类型选择对应的任务槽
          const isLongTask = formData.type === '长期';
          const slotType = isLongTask ? 'long' : 'short';
          await equipTask(res._id, formData.slotIndex, user.token, slotType);
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
        <div className="max-w-7xl mx-auto py-4 space-y-4">
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
                  defaultType={createSlotType}
                  defaultDueDateTime={
                    createSlotIndex >= 0 && createSlotType === '短期'
                      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
                          .toISOString()
                          .slice(0,19)
                      : undefined
                  }
              />

          {/* ─── 任务区域布局 ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左侧：任务槽区域 */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-1/2">
                <DailyTaskPanel
                    tasks={tasks}
                    equippedTasks={equippedShortTasks}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onUnequip={handleUnequip}
                    onDrop={(taskId, slotIndex) => handleDropToSlot(taskId, slotIndex, 'short')}
                    onCreateTask={(idx) => handleCreateFromSlot(idx, '短期')}
                    onEquip={handleEquip}
                />
              </div>
              <div className="w-full lg:w-1/2">
                <TimetablePanel
                    tasks={tasks}
                    equippedTasks={equippedLongTasks}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onDrop={(taskId, slotIndex) => handleDropToSlot(taskId, slotIndex, 'long')}
                    onCreateTask={(idx) => handleCreateFromSlot(idx, '长期')}
                />
              </div>
            </div>

            {/* 右侧：任务仓库 */}
            <div>
              <RepositoryPanel
                  tasks={tasks}
                  cards={cards} // 传入卡片数组
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onEquip={handleEquip}
              />
            </div>
          </div>
        </div>
      </div>
  );
};

export default TasksPage;
