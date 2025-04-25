import React, { useState, useEffect, useContext } from 'react';

import {Modal} from '../base';
import {TaskForm} from '../form';
import {CardSelector} from '../base';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  slotIndex = -1,
  initialData = null,
  defaultType = '短期',       // 新增：默认任务类型
  defaultDueDateTime         // 新增：默认截止日期时间（YYYY-MM-DDTHH:mm）
}) => {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState(initialData?.title || '');
  const [taskType, setTaskType] = useState(initialData?.type || defaultType);
  
  // 当initialData或defaultType变化时，重置任务类型
  useEffect(() => {
    setTaskType(initialData?.type || defaultType);
  }, [initialData, defaultType]);
  const [useReward, setUseReward] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardError, setCardError] = useState('');
  const [dailyCards, setDailyCards] = useState(0);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDailyCards(res.data.dailyCards.blank || 0);
      } catch (err) {
        console.error('获取卡片库存失败:', err);
      }
    };
    if (user) fetchInventory();
  }, [user]);

  const getFirstBlankCardId = async () => {
    try {
      const res = await axios.get('/api/cards/inventory', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const blank = res.data.inventory.find(c => c.type === 'blank');
      return blank?._id || '';
    } catch (err) {
      console.error('获取空白卡片失败:', err);
      return '';
    }
  };

  const handleSubmit = async (formFields) => {
    try {
      if (!title.trim()) {
        return alert('请输入任务标题');
      }
      if (useReward && !selectedCard) {
        setCardError('请先选择一张奖励卡片');
        return;
      }
      setCardError('');
      const cardId = useReward ? selectedCard._id : await getFirstBlankCardId();
      const taskData = {
        title,
        type: taskType,
        ...formFields,
        fromSlot: slotIndex >= 0,
        slotIndex,
        cardId
      };
      await onSubmit(taskData);
      // reset
      setTitle('');
      setTaskType('短期');
      setUseReward(false);
      setSelectedCard(null);
      setCardError('');
      onClose();
    } catch (err) {
      console.error('创建任务失败:', err);
    }
  };

  const handleClose = () => {
    setTitle('');
    setTaskType('短期');
    setUseReward(false);
    setSelectedCard(null);
    setCardError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={slotIndex >= 0 ? `创建任务到槽位 ${slotIndex+1}` : '创建新任务'}
    >
      <div className="py-4 space-y-4">
        {/* 标题与类型 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务标题 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="请输入任务标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务类型</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="短期">短期</option>
              <option value="长期">长期</option>
            </select>
          </div>
        </div>

        {/* 奖励卡/空白卡行 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">可用空白卡片: {dailyCards}</div>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useReward}
              onChange={e => setUseReward(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
            />
            <span>是否使用奖励卡片</span>
          </label>
        </div>

        {/* 奖励卡列表 */}
        {useReward && (
          <div>
            <CardSelector
              onSelect={setSelectedCard}
              selectedCard={selectedCard}
              showRewards={true}
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
          defaultDueDateTime={defaultDueDateTime}
        />
      </div>
    </Modal>
  );
};
