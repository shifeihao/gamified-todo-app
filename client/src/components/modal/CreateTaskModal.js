// src/components/modal/CreateTaskModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../base/Modal';
import { TaskForm } from '../form/TaskForm';
import { CardSelector } from '../base/CardSelector';
import { Tooltip } from '../base/Tooltip';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { HelpCircle, Loader2 } from 'lucide-react';

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

  const isFromSlot = slotIndex >= 0;
  const initialTaskType = initialData?.type || (isFromSlot && initialData?.slotInfo?.type) || defaultType;

  const [taskType, setTaskType] = useState(initialTaskType);
  const [useReward, setUseReward] = useState(initialData?.cardId ? true : false);
  const [selectedCard, setSelectedCard] = useState(initialData?.cardDetails || null);
  const [cardError, setCardError] = useState('');
  const [shortBlankCards, setShortBlankCards] = useState(0);
  const [longBlankCards, setLongBlankCards] = useState(0);
  const [rewardCardCount, setRewardCardCount] = useState(0);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [dueDate, setDueDate] = useState('');

  // Effect to initialize or update taskType based on props
  useEffect(() => {
    const newType = initialData?.type || (isFromSlot && initialData?.slotInfo?.type) || defaultType;
    if (newType !== taskType) {
      setTaskType(newType);
    }
  }, [initialData, defaultType, isFromSlot, taskType]);

  // Effect to initialize or update dueDate based on taskType or defaultDueDateTime prop
  useEffect(() => {
    if (defaultDueDateTime) {
      setDueDate(defaultDueDateTime);
    } else if (taskType === 'short' && !initialData?.dueDate) {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      now.setHours(23, 59);
      setDueDate(now.toISOString().slice(0, 16));
    } else if (initialData?.dueDate) {
      setDueDate(new Date(initialData.dueDate).toISOString().slice(0, 16));
    } else {
      setDueDate('');
    }
  }, [taskType, defaultDueDateTime, initialData]);

  // Fetch card inventory
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user || !isOpen) return;
      setIsFetchingInventory(true);
      setCardError('');
      try {
        const res = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const inventory = res.data.inventory || [];

        const blanks = inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          (taskType === 'short'
            ? ['short', 'general'].includes(c.taskDuration)
            : ['long', 'general'].includes(c.taskDuration))
          ).length;

        const rewards = res.data.inventory.filter(card =>
          card.type === 'special' &&
          !card.used &&
          ['general', taskType].includes(card.taskDuration)
        );
        const longBlanks = res.data.inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          c.taskDuration === 'long'
        ).length;
        const shortBlanks = res.data.inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          c.taskDuration === 'short'
        ).length;

        // 更新空白卡片状态
        setShortBlankCards(shortBlanks);
        setLongBlankCards(longBlanks);

        // Calculate matching reward cards
        const matchingRewards = res.data.inventory.filter(card =>
          card.type === 'special' &&
          !card.used &&
          ['general', taskType].includes(card.taskDuration)
        ).length;

        console.log(`Long-term Blank Cards: ${longBlanks}, Short-term Blank Cards: ${shortBlanks}, Reward Cards: ${matchingRewards}`);
        setRewardCardCount(matchingRewards);
      } catch (err) {
        console.error('Failed to obtain card inventory:', err);
        setCardError('Could not load card inventory.');
      }
    };
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, user, taskType, slotIndex]); // Added slotIndex as dependency to refetch inventory on slot change

  const resetFormState = () => {
    setTaskType(initialData?.type || defaultType);
    setUseReward(initialData?.cardId ? true : false);
    setSelectedCard(initialData?.cardDetails || null);
    setCardError('');
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const handleSubmitForm = async (formFields) => {
    if (useReward && !selectedCard?._id) {
      setCardError('Please select a reward card or uncheck "Use reward card".');
      return;
    }
    setCardError('');

    // 只处理长期任务的截止时间
    let finalDueDate = null;
    if (taskType === 'long' && formFields.dueDate) {
      if (formFields.dueDate.length === 10) {
        finalDueDate = new Date(formFields.dueDate + "T00:00:00.000Z").toISOString();
      } else {
        finalDueDate = new Date(formFields.dueDate).toISOString();
      }
    }

    const taskPayload = {
      ...formFields,
      title: formFields.title,
      type: taskType,
      dueDate: finalDueDate,  // 短期任务的dueDate为null，由后端处理装备后24小时
      fromSlot: isFromSlot,
      slotIndex: isFromSlot ? slotIndex : undefined,
      experienceReward: formFields.experienceReward || 10,
      goldReward: formFields.goldReward || 5,
      ...(useReward && selectedCard?._id ? { cardUsed: selectedCard._id } : {})
    };

    try {
      await onSubmit(taskPayload);
      handleClose();
    } catch (err) {
      console.error('Failed to submit task:', err);
      setCardError(err.message || 'Failed to create/update task. Please try again.');
    }
  };

  const modalTitle = initialData
    ? `Edit Task ${isFromSlot ? `in Slot ${slotIndex + 1}` : ''}`
    : `Create Task ${isFromSlot ? `for Slot ${slotIndex + 1}` : ''}`;

  // 获取当前任务类型对应的空白卡片数量
  const getCurrentBlankCardCount = () => {
    return taskType === 'short' ? shortBlankCards : longBlankCards;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      <div className="py-4 space-y-6">
        {/* Section 1: Task Basics */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="text-md font-semibold text-gray-800 mb-3">1. Task Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label htmlFor="taskTypeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Task Type *
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="taskTypeSelect"
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  disabled={isFromSlot}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="short">Daily Quest (Short-term)</option>
                  <option value="long">Quest Chain (Long-term)</option>
                </select>
                {isFromSlot && (
                  <Tooltip content="Task type is determined by the slot and cannot be modified.">
                    <HelpCircle className="h-5 w-5 text-gray-400" />
                  </Tooltip>
                )}
              </div>
            </div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <span>Long Blank Cards: <span className="font-semibold">{longBlankCards}</span></span>
            {isFetchingInventory && taskType === 'long' && <Loader2 className="h-4 w-4 ml-2 animate-spin text-primary-500" />}
          </div>
          <div className="flex items-center">
            <span>Short Blank Cards: <span className="font-semibold">{shortBlankCards}</span></span>
            {isFetchingInventory && taskType === 'short' && <Loader2 className="h-4 w-4 ml-2 animate-spin text-primary-500" />}
          </div>
        </div>
        <div className="text-sm text-gray-700">
          {useReward
            ? `Available Reward Cards (${taskType === 'short' ? 'short' : 'long'}): ${rewardCardCount}`
            : `Available Cards (${taskType}): ${getCurrentBlankCardCount()}`}
        </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useReward}
                onChange={e => {
                  setUseReward(e.target.checked);
                  if (!e.target.checked) setSelectedCard(null);
                  setCardError('');
                }}
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span>Use a Reward Card (does not consume a Blank Card)</span>
            </label>
            {useReward && rewardCardCount === 0 && !isFetchingInventory && (
                <p className="text-xs text-orange-600 mt-1">You have no reward cards available for this task type.</p>
            )}
          </div>

          {useReward && (
            <div className="mt-3">
              <CardSelector
                    key={`card-selector-${taskType}-${slotIndex}`}
                onSelect={setSelectedCard}
                selectedCard={selectedCard}
                showRewards
                taskType={taskType}
                disabled={rewardCardCount === 0 && !selectedCard}
              />
            </div>
          )}
          {cardError && <p className="text-red-600 text-sm mt-2">{cardError}</p>}
        </div>

        {/* Section 3: Task Details */}
        <div className="pt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">3. Task Details</h3>
          <TaskForm
            onSubmit={handleSubmitForm}
            onCancel={handleClose}
            loading={loading}
            initialData={initialData}
            taskType={taskType}
            defaultDueDateTime={dueDate}
            key={taskType + (initialData?._id || 'new')}
          />
        </div>
      </div>
    </Modal>
  );
};
