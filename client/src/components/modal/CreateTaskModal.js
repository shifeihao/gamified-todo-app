// src/components/modal/CreateTaskModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../base/Modal';
import { TaskForm } from '../form/TaskForm';
import { CardSelector } from '../base/CardSelector';
import { Tooltip } from '../base/Tooltip';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { HelpCircle, Loader2, Clock, Calendar } from 'lucide-react';

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
  const [selectedBlankCard, setSelectedBlankCard] = useState(null);
  const [blankCards, setBlankCards] = useState([]);

  // Effect to initialize or update taskType based on props
  useEffect(() => {
    const newType = initialData?.type || (isFromSlot && initialData?.slotInfo?.type) || defaultType;
    if (newType !== taskType) {
      setTaskType(newType);
      setSelectedBlankCard(null); // Reset blank card selection
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

        // Get matching blank cards for task type
        const currentTypeBlankCards = inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          (taskType === 'short'
            ? ['short', 'general'].includes(c.taskDuration)
            : ['long', 'general'].includes(c.taskDuration))
        );
        
        setBlankCards(currentTypeBlankCards);

        const longBlanks = inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          c.taskDuration === 'long'
        ).length;
        const shortBlanks = inventory.filter(c =>
          c.type === 'blank' &&
          !c.used &&
          c.taskDuration === 'short'
        ).length;

        // Update blank card states
        setShortBlankCards(shortBlanks);
        setLongBlankCards(longBlanks);

        // Auto-select first available blank card (if any)
        if (currentTypeBlankCards.length > 0 && !useReward) {
          setSelectedBlankCard(currentTypeBlankCards[0]);
        } else if (currentTypeBlankCards.length === 0) {
          setSelectedBlankCard(null);
        }

        // Calculate matching reward cards
        const matchingRewards = inventory.filter(card =>
          card.type === 'special' &&
          !card.used &&
          ['general', taskType].includes(card.taskDuration)
        );
        
        setRewardCardCount(matchingRewards.length);
        
        // If no blank cards but reward cards available, auto-switch to reward card
        if (currentTypeBlankCards.length === 0 && matchingRewards.length > 0 && !useReward) {
          setUseReward(true);
          if (matchingRewards.length > 0) {
            setSelectedCard(matchingRewards[0]);
          }
        }
        
        setIsFetchingInventory(false);
      } catch (err) {
        console.error("Failed to obtain card inventory:", err);
        setCardError("Could not load card inventory.");
        setIsFetchingInventory(false);
      }
    };
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, user, taskType, slotIndex, useReward]); // Added useReward as dependency

  const resetFormState = () => {
    setTaskType(initialData?.type || defaultType);
    setUseReward(initialData?.cardId ? true : false);
    setSelectedCard(initialData?.cardDetails || null);
    setSelectedBlankCard(null);
    setCardError('');
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const handleSubmitForm = async (formFields) => {
    // Validate card selection
    if (useReward) {
      if (!selectedCard?._id) {
        setCardError('Please select a reward card');
        return;
      }
    } else {
      if (!selectedBlankCard?._id) {
        setCardError('No available blank cards');
        return;
      }
    }
    
    setCardError('');

    // Only process due date for long-term tasks
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
      dueDate: finalDueDate,  // Short-term tasks' dueDate is null, backend handles 24h from equip time
      fromSlot: isFromSlot,
      slotIndex: isFromSlot ? slotIndex : undefined,
      experienceReward: formFields.experienceReward || 10,
      goldReward: formFields.goldReward || 5,
      cardUsed: useReward ? selectedCard._id : selectedBlankCard._id // Use selected card ID
    };

    try {
      await onSubmit(taskPayload);
      handleClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      setCardError(err.message || 'Failed to create task. Please try again.');
    }
  };

  const modalTitle = initialData
    ? `${isFromSlot ? `Edit Task in Slot ${slotIndex + 1}` : 'Edit Task'}`
    : `${isFromSlot ? `Create Task for Slot ${slotIndex + 1}` : 'Create Task'}`;

  // Get current task type blank card count
  const getCurrentBlankCardCount = () => {
    return taskType === 'short' ? shortBlankCards : longBlankCards;
  };

  // Check if any cards are available
  const hasAvailableCards = useReward 
    ? rewardCardCount > 0 
    : getCurrentBlankCardCount() > 0;

  // Calculate task expiration time
  const getExpirationInfo = () => {
    if (taskType === 'short') {
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 24);
      return {
        date: expiration.toLocaleDateString('en-US'),
        time: expiration.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        hours: 24
      };
    }
    return null;
  };

  const expirationInfo = getExpirationInfo();

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
                  <Tooltip content="Task type is determined by the slot and cannot be modified">
                    <HelpCircle className="h-5 w-5 text-gray-400" />
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* Card inventory info */}
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
            
            {/* Task expiration info */}
            {taskType === 'short' && expirationInfo && (
              <div className="col-span-2 bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start space-x-2">
                <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Task Expiration</p>
                  <p className="text-sm text-blue-600">
                    Short-term tasks are valid for <span className="font-semibold">24 hours</span> after being equipped
                    (Expires: {expirationInfo.date} {expirationInfo.time})
                  </p>
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-700">
              {useReward
                ? `Available Reward Cards (${taskType === 'short' ? 'short' : 'long'}): ${rewardCardCount}`
                : `Available Cards (${taskType === 'short' ? 'short' : 'long'}): ${getCurrentBlankCardCount()}`}
            </div>
          </div>

          {/* Reward card option */}
          <div className="mt-4">
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useReward}
                onChange={e => {
                  setUseReward(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedCard(null);
                    // Auto select first blank card
                    if (blankCards.length > 0) {
                      setSelectedBlankCard(blankCards[0]);
                    }
                  } else {
                    setSelectedBlankCard(null);
                  }
                  setCardError('');
                }}
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span>Use a Reward Card (does not consume a Blank Card)</span>
            </label>
            {useReward && rewardCardCount === 0 && !isFetchingInventory && (
                <p className="text-xs text-orange-600 mt-1">You have no reward cards available for this task type</p>
            )}
          </div>

          {/* Only show reward card selection */}
          {useReward && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Select Reward Card *
              </h4>
              
              {rewardCardCount === 0 && !isFetchingInventory ? (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md">
                  You don't have any reward cards available for {taskType === 'short' ? 'short-term' : 'long-term'} tasks
                </div>
              ) : (
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
            </div>
          )}
          
          {/* Show card operation related error messages */}
          {cardError && <p className="text-red-600 text-sm mt-2">{cardError}</p>}
          
          {/* If no cards available, show message */}
          {!hasAvailableCards && !isFetchingInventory && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md">
              No cards available for creating {taskType === 'short' ? 'short-term' : 'long-term'} tasks.
              Please obtain cards first or try creating a different type of task.
            </div>
          )}
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
            disableSubmit={!hasAvailableCards || isFetchingInventory}
          />
        </div>
      </div>
    </Modal>
  );
};
