// src/pages/TasksPage/index.js
import React, { useState, useEffect, useContext } from 'react';
import { Navbar } from '../../components';
import {CreateTaskModal} from '../../components';
import AuthContext from '../../context/AuthContext';

import DailyTaskPanel from './DailyTaskPanel';
import TimetablePanel from './TimetablePanel';
import RepositoryPanel from './RepositoryPanel';
import { getCardInventory } from '../../services/cardService';

// 仅用于读数据，不纳入 useApiAction
import {
  getTasks,
  getEquippedTasks,
  getEquippedShortTasks,
  getEquippedLongTasks,
} from '../../services/taskService';

// 下面这些带 Service 后缀的函数，交给 useApiAction 管理 loading / error / 回调
import {
  createTask   as createTaskService,
  updateTask   as updateTaskService,
  deleteTask   as deleteTaskService,
  completeTask as completeTaskService,
  equipTask    as equipTaskService,
  unequipTask  as unequipTaskService,
} from '../../services/taskService';

import { useApiAction } from '../../components/hooks';

const TasksPage = () => {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [equippedTasks, setEquippedTasks] = useState([]);
  const [equippedShortTasks, setEquippedShortTasks] = useState([]); // 短期任务槽
  const [equippedLongTasks, setEquippedLongTasks] = useState([]); // 长期任务槽

  // const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createSlotIndex, setCreateSlotIndex] = useState(-1);
  const [createSlotType, setCreateSlotType] = useState('短期'); // 默认创建任务类型

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 当前激活的 tab: 'daily' | 'repository' | 'timetable'
  const [activeTab, setActiveTab] = useState('daily');

  // // 拉取任务数据
  // const fetchTasks = async () => {
  //   try {
  //     setLoading(true);
  //       const [allTasks, equipped, shortTasks, longTasks, inventory] = await Promise.all([
  //       getTasks(user.token),
  //       getEquippedTasks(user.token),
  //       getEquippedShortTasks(user.token),
  //       getEquippedLongTasks(user.token),
  //       getCardInventory(user.token),
  //     ]);
  //     setTasks(allTasks);
  //     setEquippedTasks(equipped);
  //     setEquippedShortTasks(shortTasks);
  //     setEquippedLongTasks(longTasks);
  //     setCards(inventory);
  //     setError('');
  //   } catch (err) {
  //     console.error(err);
  //     setError('获取任务数据失败');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 拉取任务与卡片库存
  const fetchTasks = async () => {
    try {
      const [
        allTasks,
        equipped,
        shortTasks,
        longTasks,
        inventory
      ] = await Promise.all([
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
      setError('');
    } catch (err) {
      console.error(err);
      setError('获取任务数据失败');
    }
  };

  useEffect(() => {
    if (user?.token) fetchTasks();
  }, [user]);

  // 显示成功信息
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };


  // -----------------------------
  // 1. 删除任务
  // -----------------------------
  const {
    execute: doDeleteTask,
    isLoading: deleting,
    error: deleteError
  } = useApiAction(deleteTaskService, {
    onSuccess: () => {
      showSuccess('任务已删除');
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      setError('删除任务失败');
    }
  });

  const handleDelete = (id) => {
    if (!window.confirm('确定要删除任务吗？')) return;
    doDeleteTask(id, user.token);
  };

  // -----------------------------
  // 2. 完成任务（并卸下已完成的任务）
  // -----------------------------
  const {
    execute: doCompleteTask,
    isLoading: completing,
    error: completeError
  } = useApiAction(completeTaskService, {
    onSuccess: async (taskId) => {
      // 卸下已完成的任务，防止继续占用槽位
      await unequipTaskService(taskId, user.token);
      showSuccess('任务已完成');
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      setError('完成任务失败');
    }
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
    error: createError
  } = useApiAction(createTaskService, {
    onSuccess: async (res) => {
      showSuccess('任务已创建');
      // 如果是从槽位新建，自动装备
      if (res.fromSlot && res.slotIndex >= 0) {
        const isLong = res.type === '长期';
        const slotType = isLong ? 'long' : 'short';
        await equipTaskService(res._id, res.slotIndex, user.token, slotType);
        showSuccess(`已装备${isLong ? '长期' : '短期'}任务`);
      }
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
      setCreateSlotIndex(-1);
    },
    onError: (err) => {
      console.error(err);
      setError('创建任务失败');
    }
  });

  // -----------------------------
  // 4. 更新任务
  // -----------------------------
  const {
    execute: doUpdateTask,
    isLoading: updating,
    error: updateError
  } = useApiAction(updateTaskService, {
    onSuccess: () => {
      showSuccess('任务已更新');
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
    },
    onError: (err) => {
      console.error(err);
      setError('更新任务失败');
    }
  });

  // -----------------------------
  // 5. 装备任务
  // -----------------------------
  const {
    execute: doEquipTask,
    isLoading: equipping,
    error: equipError
  } = useApiAction(equipTaskService, {
    onSuccess: () => {
      showSuccess('任务已装备');
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      setError('装备任务失败');
    }
  });

  const handleEquip = (task) => {
    if (task.status === '已完成') {
      setError('无法装备已完成的任务');
      return;
    }
    // 选择短期/长期槽
    const isLong = task.type === '长期';
    const occupied = (isLong ? equippedLongTasks : equippedShortTasks)
      .map(t => t.slotPosition);
    let freeSlot = [...Array(3).keys()].find(i => !occupied.includes(i));
    if (freeSlot == null) {
      setError(isLong ? '长期任务槽已满' : '短期任务槽已满');
      return;
    }
    const slotType = isLong ? 'long' : 'short';
    doEquipTask(task._id, freeSlot, user.token, slotType);
  };

  // 拖放装备
  const handleDropToSlot = (taskId, slotIndex, slotType = 'short') => {
    doEquipTask(taskId, slotIndex, user.token, slotType);
  };

  // -----------------------------
  // 6. 卸下任务
  // -----------------------------
  const {
    execute: doUnequipTask,
    isLoading: unequipping,
    error: unequipError
  } = useApiAction(unequipTaskService, {
    onSuccess: () => {
      showSuccess('已卸下任务');
      fetchTasks();
    },
    onError: (err) => {
      console.error(err);
      setError('卸下任务失败');
    }
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
    console.log('[TasksPage] handleSubmit 收到数据：', formData);
      if (editingTask) {
        doUpdateTask(editingTask._id, formData, user.token);
      } else {
        doCreateTask(formData, user.token);
      }
    };

  // 合并所有 loading / error
  const loadingAny = deleting || completing || creating || updating || equipping || unequipping;
  const errorAny   = deleteError || completeError || createError || updateError || equipError || unequipError || error;

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">我的任务</h1>
          <button
            onClick={() => {
              setCreateSlotType('短期');
              setCreateSlotIndex(-1);
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            disabled={loadingAny}
          >
            创建新任务
          </button>
        </div>

        {errorAny && <div className="text-red-600">{errorAny}</div>}
        {loadingAny && <div className="text-gray-600">加载中...</div>}
        {successMessage && <div className="text-green-600">{successMessage}</div>}

        <CreateTaskModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setCreateSlotIndex(-1);
          }}
          onSubmit={handleSubmit}
          loading={editingTask ? updating : creating}
          initialData={editingTask}
          slotIndex={createSlotIndex}
          defaultType={createSlotType}
          defaultDueDateTime={
            createSlotType === '短期'
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0,19)
              : undefined
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-1/2">
              <DailyTaskPanel
                tasks={tasks}
                equippedTasks={equippedShortTasks}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onUnequip={handleUnequip}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, 'short')}
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
                onEdit={setEditingTask}
                onDrop={(tid, idx) => handleDropToSlot(tid, idx, 'long')}
                onCreateTask={(idx) => handleCreateFromSlot(idx, '长期')}
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