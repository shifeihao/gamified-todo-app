import React, { useState, useEffect, useContext } from 'react';

import { Modal } from '../base';
import { TaskForm } from '../form';
import { CardSelector } from '../base';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

export const CreateTaskModal = ({
                                  isOpen,
                                  onClose,
                                  onSubmit,
                                  loading = false,
                                  slotIndex = -1,
                                  initialData = null,
                                  defaultType = '短期',
                                  defaultDueDateTime
                                }) => {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState(initialData?.title || '');
  const [taskType, setTaskType] = useState(initialData?.type || defaultType);
  const [dueDate, setDueDate] = useState('');
  const [useReward, setUseReward] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardError, setCardError] = useState('');
  const [dailyCards, setDailyCards] = useState(0);
  const [rewardCardCount, setRewardCardCount] = useState(0);

  // 将 Date 转为本地 'YYYY-MM-DDTHH:mm' 格式
  const getLocalDateTimeString = date => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  // 使用 initialData 或 defaultDueDateTime 初始化
  useEffect(() => {
    setTitle(initialData?.title || '');
    setTaskType(initialData?.type || defaultType);
  }, [initialData, defaultType]);

  // taskType 改变时，短期任务设置为当前本地时间 +24h
  useEffect(() => {
    if (taskType === '短期') {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      setDueDate(getLocalDateTimeString(now));
    } else {
      setDueDate('');
    }
  }, [taskType]);

  // 每次打开弹窗或切换类型时拉取库存
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        // ✅ 从 cardInventory 中筛选 blank 卡，区分长/短期
        const blanks = res.data.inventory.filter(c =>
            c.type === 'blank' &&
            !c.used && // ✅ 只统计未使用的
            (taskType === '短期'
                ? ['短期', '通用'].includes(c.taskDuration)
                : ['长期', '通用'].includes(c.taskDuration))
        ).length;
        setDailyCards(blanks);

        const rewards = res.data.inventory.filter(card =>
            card.type === 'special' &&
            !card.used && // ✅ 只统计未使用的
            ['通用', taskType].includes(card.taskDuration)
        ).length;
        setRewardCardCount(rewards);
      } catch (err) {
        console.error('Failed to obtain card inventory:', err);
      }
    };
    if (isOpen && user) fetchInventory();
  }, [isOpen, user, taskType]);

  const handleSubmit = async formFields => {
    try {
      if (!title.trim()) return alert('Please enter a task title');
      setCardError('');

      let cardId;
      if (useReward) {
        if (!selectedCard?._id) return alert('Please select a rewards card');
        cardId = selectedCard._id;
      }

      const isoDueDate = dueDate ? new Date(dueDate).toISOString() : '';
      const rawTaskData = {
        title,
        type: taskType,
        dueDate: isoDueDate,
        ...formFields,
        fromSlot: slotIndex >= 0,
        slotIndex,
        ...(useReward ? { cardId } : {})
      };

      // ✅ 发起卡片消耗请求，包含奖励或空白卡片的逻辑
      const res = await axios.post('/api/cards/consume', {
        taskData: rawTaskData,
        ...(useReward ? { cardId } : {})
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const processedTask = res.data.processedTask;

      // ✅ 确保 cardUsed 字段存在
      if (!processedTask.cardUsed) {
        return alert('The task is not bound to a card, please try again');
      }
      await onSubmit(processedTask);  // ✅ 传入包含 cardUsed 的任务数据

      // 清空表单状态
      setTitle('');
      setTaskType('短期');
      setUseReward(false);
      setSelectedCard(null);
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task, please try again');
    }
  };


  const handleClose = () => {
    setTitle('');
    setTaskType('短期');
    setUseReward(false);
    setSelectedCard(null);
    onClose();
  };

  const isFromSlot = slotIndex >= 0;

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={
            isFromSlot ? `Create a task to slot ${slotIndex + 1}` : 'Create a new task'
          }
      >
        <div className="py-4 space-y-4">
          {/* 标题与类型 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Type *
              </label>
              <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  disabled={isFromSlot}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="短期">Quick Quests</option>
                <option value="长期">Quest Chains
                </option>
              </select>
              {isFromSlot && (
                  <p className="text-sm text-gray-500 mt-1">
                    The task type is determined by the task slot and cannot be modified.
                  </p>
              )}
            </div>
          </div>

          {/* 奖励卡 / 空白卡 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {useReward
                  ? `Available Reward Cards（${taskType}）: ${rewardCardCount}`
                  : `Available Blank Cards（${taskType}）: ${dailyCards}`}
            </div>
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                  type="checkbox"
                  checked={useReward}
                  onChange={e => setUseReward(e.target.checked)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
              />
              <span>Do you use reward cards?</span>
            </label>
          </div>

          {/* 奖励卡列表 */}
          {useReward && (
              <div>
                <CardSelector
                    onSelect={setSelectedCard}
                    selectedCard={selectedCard}
                    showRewards
                    taskType={taskType}
                />
                {cardError && <p className="text-red-500 text-sm">{cardError}</p>}
              </div>
          )}

          {/* 其他字段 */}
          <TaskForm
              onSubmit={handleSubmit}
              onCancel={handleClose}
              loading={loading}
              initialData={initialData}
              taskType={taskType}
              defaultDueDateTime={dueDate}
              onDueDateChange={setDueDate}
          />
        </div>
      </Modal>
  );
};
