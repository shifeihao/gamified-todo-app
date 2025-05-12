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
                                  defaultType = 'short',
                                  defaultDueDateTime
                                }) => {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState(initialData?.title || '');
  const [taskType, setTaskType] = useState(initialData?.type || defaultType);
  const [dueDate, setDueDate] = useState('');
  const [useReward, setUseReward] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardError, setCardError] = useState('');
  const [shortBlankCards, setShortBlankCards] = useState(0);
  const [longBlankCards, setLongBlankCards] = useState(0);
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

  // taskType 改变时，short任务设置为当前本地时间 +24h
  useEffect(() => {
    if (taskType === 'short') {
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
        console.log("获取卡片库存，当前任务类型:", taskType, "来自卡槽:", slotIndex >= 0, "卡槽索引:", slotIndex);
        
        const res = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (res.data && res.data.inventory) {
          // 计算短期空白卡片数量
          const shortBlanks = res.data.inventory.filter(c =>
            c.type === 'blank' &&
            !c.used &&
            c.taskDuration === 'short'
          ).length;
          
          // 计算长期空白卡片数量
          const longBlanks = res.data.inventory.filter(c =>
            c.type === 'blank' &&
            !c.used &&
            c.taskDuration === 'long'
          ).length;
          
          // 设置对应数量
          setShortBlankCards(shortBlanks);
          setLongBlankCards(longBlanks);
          
          // 筛选与当前任务类型匹配的奖励卡 - 无论是来自普通创建还是卡槽创建
          const currentType = taskType;  // 确保使用当前任务类型
          
          // 不使用查询列表方式筛选，而是直接遍历数组手动筛选并打印每个卡片信息，方便排查问题
          let matchingRewards = 0;
          console.log("筛选可用奖励卡片, 当前任务类型:", currentType);
          
          res.data.inventory.forEach(card => {
            if (card.type === 'special' && !card.used) {
              const isMatch = card.taskDuration === currentType || card.taskDuration === 'general';
              console.log(`卡片ID: ${card._id}, 标题: ${card.title}, 类型: ${card.type}, 任务时长: ${card.taskDuration}, 匹配: ${isMatch}`);
              if (isMatch) {
                matchingRewards++;
              }
            }
          });
          
          console.log(`匹配的奖励卡片总数: ${matchingRewards}`);
          setRewardCardCount(matchingRewards);
          
          console.log(`短期空白卡: ${shortBlanks}, 长期空白卡: ${longBlanks}, 奖励卡: ${matchingRewards}`);
        }
      } catch (err) {
        console.error('获取卡片库存失败:', err);
      }
    };
    
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, user, taskType, slotIndex]);  // 添加slotIndex作为依赖项，确保卡槽变化时重新获取

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
      setTaskType('short');
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
    setTaskType('short');
    setUseReward(false);
    setSelectedCard(null);
    onClose();
  };

  const isFromSlot = slotIndex >= 0;

  // 获取当前任务类型对应的空白卡片数量
  const getCurrentBlankCardCount = () => {
    return taskType === 'short' ? shortBlankCards : longBlankCards;
  };

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
                <option value="short">Quick Quests</option>
                <option value="long">Quest Chains
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
                ? `Available Reward Cards（${taskType === 'short' ? 'short' : 'long'}）: ${rewardCardCount}`
                : taskType === 'short'
                  ? `Available Blank Quick Quest Cards: ${shortBlankCards}`
                  : `Available Blank Long-Term Cards: ${longBlankCards}`
              }
            </div>
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                  type="checkbox"
                  checked={useReward}
                  onChange={e => setUseReward(e.target.checked)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
              />
              <span>Use a Reward Card?</span>
            </label>
          </div>

          {/* 奖励卡列表 */}
          {useReward && (
              <div>
                <CardSelector
                    key={`card-selector-${taskType}-${slotIndex}`}
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
