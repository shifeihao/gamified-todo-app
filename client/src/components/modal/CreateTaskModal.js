// client/src/components/modal/CreateTaskModal.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Modal } from '../base';
import { TaskForm } from '../form';
import { CardSelector } from '../base';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

/* ---------------------- custom hooks ---------------------- */
// 统一管理卡片库存，避免重复请求
const useCardInventory = (taskType) => {
  const { user } = useContext(AuthContext);
  const [state, setState] = useState({
    blankCount: 0,
    rewardCount: 0,
    firstBlankId: '',
    loading: false,
    error: null
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await axios.get('/api/cards/inventory', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const blanks = data.inventory.filter((c) => c.type === 'blank');
      const rewards = data.inventory.filter(
        (c) =>
          c.type === 'special' &&
          (c.taskDuration === taskType || c.taskDuration === '通用')
      );
      setState({
        blankCount: blanks.length,
        rewardCount: rewards.length,
        firstBlankId: blanks[0]?._id ?? '',
        loading: false,
        error: null
      });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setState((s) => ({ ...s, loading: false, error: err }));
      }
    }
    return () => controller.abort();
  }, [user, taskType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
};

// 生成/维护默认截止日期
const useDefaultDueDate = (taskType, initial = '') => {
  const [dueDate, setDueDate] = useState(initial);

  useEffect(() => {
    if (taskType === '长期') {
      setDueDate('');
    } else if (taskType === '短期' && !dueDate) {
      const d = new Date(Date.now() + 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 16); // YYYY-MM-DDTHH:mm
      setDueDate(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType]);

  return [dueDate, setDueDate];
};

/* ---------------------- component ---------------------- */
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
  const [title, setTitle] = useState(initialData?.title || '');
  const [taskType, setTaskType] = useState(initialData?.type || defaultType);
  const [useReward, setUseReward] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardError, setCardError] = useState('');

  // derive flags
  const isFromSlot = slotIndex >= 0;
  const isBlankCardOnlyShort = !useReward && selectedCard == null;
  const isTypeLocked = isFromSlot || isBlankCardOnlyShort;

  // inventory hook
  const { blankCount, rewardCount, firstBlankId } = useCardInventory(taskType);

  // due date hook
  const [dueDate, setDueDate] = useDefaultDueDate(
    taskType,
    defaultDueDateTime || ''
  );

  /* ---------------- handlers ---------------- */
  const resetState = () => {
    setTitle('');
    setTaskType('短期');
    setUseReward(false);
    setSelectedCard(null);
    setCardError('');
  };

  const handleSubmit = async (formFields) => {
    if (!title.trim()) {
      setCardError('请输入任务标题');
      return;
    }
    if (useReward && !selectedCard) {
      setCardError('请先选择一张奖励卡片');
      return;
    }

    const finalType = isBlankCardOnlyShort ? '短期' : taskType;
    const cardId = useReward ? selectedCard._id : firstBlankId;

    if (!cardId) {
      setCardError('没有可用的空白卡片，请先领取卡片或选择奖励卡');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        type: finalType,
        ...formFields,
        fromSlot: isFromSlot,
        slotIndex,
        cardId
      });
      onClose();
      resetState();
    } catch (err) {
      console.error('创建任务失败:', err);
      setCardError('创建任务失败，请稍后重试');
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  /* 当关闭奖励卡选项时清空选择 */
  const handleRewardToggle = (checked) => {
    setUseReward(checked);
    if (!checked) setSelectedCard(null);
  };

  /* ---------------------- render ---------------------- */
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isFromSlot ? `创建任务到槽位 ${slotIndex + 1}` : '创建新任务'}
    >
      <div className="py-4 space-y-4">
        {/* 标题与类型 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务标题 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="请输入任务标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务类型
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              disabled={isTypeLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="短期">短期</option>
              <option value="长期">长期</option>
            </select>
            {isFromSlot && (
              <p className="text-sm text-gray-500 mt-1">
                任务类型由任务槽位确定，无法修改
              </p>
            )}
            {!isFromSlot && isBlankCardOnlyShort && (
              <p className="text-sm text-gray-500 mt-1">
                使用空白卡片时仅可创建短期任务
              </p>
            )}
          </div>
        </div>

        {/* 卡片选择栏 */}
        <div className="flex items-center justify-between">
          <div
            className={`text-sm ${
              (useReward ? rewardCount : blankCount) === 0
                ? 'text-red-600 font-semibold'
                : 'text-gray-700'
            }`}
          >
            {useReward
              ? `可用奖励卡片: ${rewardCount}`
              : `可用空白卡片: ${blankCount}`}
          </div>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useReward}
              onChange={(e) => handleRewardToggle(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
            />
            <span>使用奖励卡片</span>
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
            {cardError && <p className="text-red-500 text-sm mt-1">{cardError}</p>}
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
