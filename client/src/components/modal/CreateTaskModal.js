// src/components/modal/CreateTaskModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../base/Modal';
import { TaskForm } from '../form/TaskForm';
import { CardSelector } from '../base/CardSelector';
import { Tooltip } from '../base/Tooltip';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { 
  HelpCircle, Loader2, Clock, Calendar, Check, 
  CreditCard, ArrowLeft, ArrowRight, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  
  // Properly calculate initial task type
  const getInitialTaskType = () => {
    // 编辑现有任务时，使用其类型
    if (initialData?.type) {
      console.log(`编辑现有任务，使用类型: ${initialData.type}`);
      return initialData.type;
    }
    
    // 从槽位创建任务时，使用槽位类型
    if (isFromSlot) {
      console.log(`从槽位创建任务，使用类型: ${defaultType}`); 
      return defaultType;
    }
    
    // 默认情况
    console.log(`使用默认类型: ${defaultType}`);
    return defaultType;
  };

  // Form state
  const [taskType, setTaskType] = useState(getInitialTaskType());
  const [useReward, setUseReward] = useState(initialData?.cardId ? true : false);
  const [selectedCard, setSelectedCard] = useState(initialData?.cardDetails || null);
  const [selectedBlankCard, setSelectedBlankCard] = useState(null);
  const [formValues, setFormValues] = useState(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [cardError, setCardError] = useState('');
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [dueDate, setDueDate] = useState('');
  
  // Inventory state
  const [shortBlankCards, setShortBlankCards] = useState(0);
  const [longBlankCards, setLongBlankCards] = useState(0);
  const [rewardCardCount, setRewardCardCount] = useState(0);
  const [shortRewardCount, setShortRewardCount] = useState(0);
  const [longRewardCount, setLongRewardCount] = useState(0);
  const [blankCards, setBlankCards] = useState([]);
  const [rewardCards, setRewardCards] = useState([]);

  // 添加默认类型的输出，帮助调试
  useEffect(() => {
    console.log("CreateTaskModal初始化参数:", {
      isFromSlot,
      slotIndex,
      defaultType,
      initialTaskType: getInitialTaskType()
    });
  }, []);

  // Effect to initialize task type and handle card selection when task type changes
  useEffect(() => {
    // 严格控制任务类型 - 从槽创建任务时始终使用槽位类型
    if (isFromSlot && taskType !== defaultType) {
      console.log(`从槽创建任务，强制使用类型: ${defaultType}`);
      setTaskType(defaultType);
      return; // 提前返回，避免重置卡片选择
    }
    
    // 编辑现有任务时总是使用任务原类型
    if (initialData?.type && taskType !== initialData.type) {
      console.log(`编辑现有任务，强制使用类型: ${initialData.type}`);
      setTaskType(initialData.type);
      return; // 提前返回，避免重置卡片选择
    }
    
    // Automatically switch to reward cards if blank cards are not available
    const hasShortBlankCards = shortBlankCards > 0;
    const hasLongBlankCards = longBlankCards > 0;
    const hasShortReward = shortRewardCount > 0;
    const hasLongReward = longRewardCount > 0;
    
    const hasCurrentTypeBlank = taskType === 'short' ? hasShortBlankCards : hasLongBlankCards;
    const hasCurrentTypeReward = taskType === 'short' ? hasShortReward : hasLongReward;
    
    // If blank cards are not available but reward cards are, switch to reward mode
    if (!hasCurrentTypeBlank && hasCurrentTypeReward) {
      setUseReward(true);
    }
  }, [initialData, defaultType, isFromSlot, shortBlankCards, longBlankCards, shortRewardCount, longRewardCount]);

  // Effect to handle card selection when task type changes
  useEffect(() => {
    // Reset card selection when task type changes
    setSelectedBlankCard(null);
    setSelectedCard(null);
    
    // 当任务类型改变时立即重新获取库存
    // 这会触发依赖于taskType的fetchInventory()
    if (isOpen && user) {
      console.log(`任务类型变更为: ${taskType}，重新获取匹配的卡片`);
      setIsFetchingInventory(true);
      setTimeout(() => {
        fetchInventory(); // 手动触发库存获取
      }, 10);
    }
  }, [taskType]);

  // Effect to handle due date
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

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      // 如果不是编辑模式，需要重置表单状态
      if (!initialData) {
        resetFormState();
      }
    }
  }, [isOpen, initialData]);

  // 添加单独的fetchInventory函数，供手动调用
  const fetchInventory = async () => {
    if (!user || !isOpen) return;
    setIsFetchingInventory(true);
    setCardError('');
    try {
      const res = await axios.get('/api/cards/inventory', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const inventory = res.data.inventory || [];

      // Calculate short and long term cards (both blank and reward)
      const shortBlanks = inventory.filter(c =>
        c.type === 'blank' &&
        !c.used &&
        c.taskDuration === 'short'
      );
      
      const longBlanks = inventory.filter(c =>
        c.type === 'blank' &&
        !c.used &&
        c.taskDuration === 'long'
      );
      
      const shortRewards = inventory.filter(c => 
        c.type === 'special' && 
        !c.used && 
        (c.taskDuration === 'short' || c.taskDuration === 'general')
      );
      
      const longRewards = inventory.filter(c => 
        c.type === 'special' && 
        !c.used && 
        (c.taskDuration === 'long' || c.taskDuration === 'general')
      );

      // Update card count statistics
      setShortBlankCards(shortBlanks.length);
      setLongBlankCards(longBlanks.length);
      setShortRewardCount(shortRewards.length);
      setLongRewardCount(longRewards.length);
      
      console.log(`当前任务类型: ${taskType}`);
      console.log(`空白卡数量 - 短期: ${shortBlanks.length}, 长期: ${longBlanks.length}`);
      console.log(`奖励卡数量 - 短期: ${shortRewards.length}, 长期: ${longRewards.length}`);
      
      // Get cards for current task type
      const currentTypeBlankCards = taskType === 'short' ? shortBlanks : longBlanks;
      const currentTypeRewardCards = taskType === 'short' ? shortRewards : longRewards;
      
      // Update card lists
      setBlankCards(currentTypeBlankCards);
      setRewardCards(currentTypeRewardCards);
      setRewardCardCount(currentTypeRewardCards.length);
      
      console.log(`${taskType} task available cards - Blank:${currentTypeBlankCards.length}, Reward:${currentTypeRewardCards.length}`);
      
      // Card selection logic
      const hasBlankCards = currentTypeBlankCards.length > 0;
      const hasRewardCards = currentTypeRewardCards.length > 0;
      
      // Check if previously selected cards are still valid
      const prevSelectedCardStillValid = useReward && selectedCard && 
        currentTypeRewardCards.some(c => c._id === selectedCard._id);
      
      const prevBlankCardStillValid = !useReward && selectedBlankCard && 
        currentTypeBlankCards.some(c => c._id === selectedBlankCard._id);
       
      // 1. If previous selection is still valid, keep it
      if (prevSelectedCardStillValid || prevBlankCardStillValid) {
        // Keep current selection
        console.log("保持当前卡片选择");
      }
      // 2. If no blank cards but reward cards available, auto-switch to reward card mode
      else if (!hasBlankCards && hasRewardCards) {
        console.log("没有空白卡片，自动切换到奖励卡片模式");
        setUseReward(true);
        setSelectedCard(currentTypeRewardCards[0]);
        setSelectedBlankCard(null);
      } 
      // 3. If blank cards available and not in reward mode, select blank card
      else if (hasBlankCards && !useReward) {
        console.log("选择匹配任务类型的空白卡片");
        setSelectedBlankCard(currentTypeBlankCards[0]);
        setSelectedCard(null);
      }
      // 4. If reward cards available and in reward mode, select reward card
      else if (hasRewardCards && useReward) {
        console.log("选择匹配任务类型的奖励卡片");
        setSelectedCard(currentTypeRewardCards[0]);
        setSelectedBlankCard(null);
      }
      // 5. If no cards available, clear all selections
      else {
        console.log("没有可用卡片，清除所有选择");
        setSelectedBlankCard(null);
        setSelectedCard(null);
      }
      
      setIsFetchingInventory(false);
    } catch (err) {
      console.error("Failed to obtain card inventory:", err);
      setCardError("Could not load card inventory.");
      setIsFetchingInventory(false);
    }
  };

  // Effect to fetch inventory when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, user, useReward]);

  const resetFormState = () => {
    // 完全重置所有状态
    setTaskType(getInitialTaskType());
    setUseReward(false); // 始终重置为false，避免使用上一次的状态
    setSelectedCard(null);
    setSelectedBlankCard(null);
    setCardError('');
    setCurrentStep(1);
    setFormValues(null);
    // 确保清除表单值
    if (document.getElementById('title')) document.getElementById('title').value = '';
    if (document.getElementById('description')) document.getElementById('description').value = '';
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const handleTaskFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmitForm = async (formFields) => {
    // Check if ANY cards are available for this task type
    const hasCurrentTypeCards = getCurrentBlankCardCount() > 0 || getCurrentRewardCardCount() > 0;
    
    if (!hasCurrentTypeCards) {
      setCardError(`You need cards for ${taskType === 'short' ? 'Daily Quests' : 'Quest Chains'} to create this task. Please obtain cards first.`);
      return;
    }
    
    // Validate the selected card based on the card type (blank or reward)
    if (useReward) {
      if (!selectedCard?._id) {
        setCardError('Please select a reward card');
        return;
      }

      // 验证选择的奖励卡是否匹配当前任务类型
      if (selectedCard.taskDuration !== 'general' && selectedCard.taskDuration !== taskType) {
        setCardError(`This reward card only supports ${selectedCard.taskDuration === 'short' ? 'Daily Quests' : 'Quest Chains'} but you're creating a ${taskType === 'short' ? 'Daily Quest' : 'Quest Chain'}`);
        // 触发重新选择卡片
        fetchInventory();
        return;
      }
    } else {
      if (!selectedBlankCard?._id) {
        // If no blank cards but reward cards are available, suggest switching
        if (getCurrentRewardCardCount() > 0) {
          setCardError('No blank cards available. Please use a reward card instead.');
          return;
        }
        setCardError('No available cards');
        return;
      }

      // 验证选择的空白卡是否匹配当前任务类型
      if (selectedBlankCard.taskDuration !== 'general' && selectedBlankCard.taskDuration !== taskType) {
        setCardError(`This blank card only supports ${selectedBlankCard.taskDuration === 'short' ? 'Daily Quests' : 'Quest Chains'} but you're creating a ${taskType === 'short' ? 'Daily Quest' : 'Quest Chain'}`);
        // 触发重新选择卡片
        fetchInventory();
        return;
      }
    }
    
    setCardError('');

    // Handle due date
    let finalDueDate = null;
    if (taskType === 'long' && formFields.dueDate) {
      if (formFields.dueDate.length === 10) {
        finalDueDate = new Date(formFields.dueDate + "T00:00:00.000Z").toISOString();
      } else {
        finalDueDate = new Date(formFields.dueDate).toISOString();
      }
      
      // 验证长期任务的子任务
      if (formFields.subTasks && formFields.subTasks.length > 0) {
        // 检查子任务的标题和截止时间
        for (let i = 0; i < formFields.subTasks.length; i++) {
          const subTask = formFields.subTasks[i];
          
          // 验证子任务标题
          if (!subTask.title || subTask.title.trim() === '') {
            toast.error(
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm">Subtask Title Required</span>
                <div className="text-xs">
                  All subtasks in the Quest Chain must have a title.
                </div>
              </div>,
              { duration: 5000, position: 'top-center' }
            );
            return;
          }
          
          // 验证子任务截止时间
          if (!subTask.dueDate) {
            toast.error(
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm">Subtask Deadline Required</span>
                <div className="text-xs">
                  All subtasks in the Quest Chain must have a deadline.
                </div>
              </div>,
              { duration: 5000, position: 'top-center' }
            );
            return;
          }
          
          // 验证子任务截止时间不能晚于主任务截止时间
          const subTaskDueDate = new Date(subTask.dueDate);
          const mainTaskDueDate = new Date(finalDueDate);
          
          if (subTaskDueDate > mainTaskDueDate) {
            toast.error(
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm">Invalid Subtask Deadline</span>
                <div className="text-xs">
                  Subtask #{i+1} deadline cannot be later than the main quest deadline.
                </div>
              </div>,
              { duration: 5000, position: 'top-center' }
            );
            return;
          }
        }
      }
    }

    // If creating/editing from a slot, verify task type matches slot type
    if (isFromSlot) {
      const slotTaskType = defaultType || 'short';
      if (taskType !== slotTaskType) {
        setCardError(`When adding to a ${slotTaskType === 'short' ? 'Daily Quest' : 'Quest Chain'} slot, you must create a matching task type.`);
        return;
      }
    }

    const taskPayload = {
      ...formFields,
      title: formFields.title,
      type: taskType,
      dueDate: finalDueDate,
      fromSlot: isFromSlot,
      slotIndex: isFromSlot ? slotIndex : undefined,
      experienceReward: formFields.experienceReward || 10,
      goldReward: formFields.goldReward || 5,
      cardUsed: useReward ? selectedCard._id : selectedBlankCard._id
    };

    try {
      await onSubmit(taskPayload);
      handleClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      setCardError(err.message || 'Failed to create task. Please try again.');
    }
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      // Even if there are no available cards, allow proceeding to next step
      // This will show a warning in the next step instead of blocking progress
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const modalTitle = initialData
    ? `${isFromSlot ? `Edit Slot ${slotIndex + 1} Task` : 'Edit Task'}`
    : `${isFromSlot ? `New Slot ${slotIndex + 1} Task` : 'New Task'}`;

  // Get current task type blank card count
  const getCurrentBlankCardCount = () => {
    return taskType === 'short' ? shortBlankCards : longBlankCards;
  };

  // Get current task type reward card count
  const getCurrentRewardCardCount = () => {
    return taskType === 'short' ? shortRewardCount : longRewardCount;
  };

  // Check if any cards are available
  const hasAvailableCards = useReward 
    ? getCurrentRewardCardCount() > 0 
    : getCurrentBlankCardCount() > 0;
  
  // Check if ANY cards of the current task type are available (either blank or reward)
  const hasAnyCardForCurrentType = getCurrentRewardCardCount() > 0 || getCurrentBlankCardCount() > 0;

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

  // Render task type selector
  const renderTaskTypeSelector = () => (
    <div className="flex flex-wrap gap-3 mb-6">
      <div 
        className={`flex-1 min-w-[120px] p-3 border rounded-lg cursor-pointer transition-all flex flex-col ${
          taskType === 'short' 
            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
            : 'border-gray-200 hover:border-purple-300'
        }`}
        onClick={() => setTaskType('short')}
      >
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">Daily Quest</span>
        </div>
        <span className="text-xs text-gray-500 flex-grow">24h short-term task</span>
        <div className="mt-2 text-xs">
          <span className={shortBlankCards > 0 ? "text-green-600" : "text-red-500"}>
            {shortBlankCards} blank
          </span>
          {shortRewardCount > 0 && (
            <span className="text-blue-600 ml-2">
              {shortRewardCount} reward
            </span>
          )}
        </div>
      </div>
      
      <div 
        className={`flex-1 min-w-[120px] p-3 border rounded-lg cursor-pointer transition-all flex flex-col ${
          taskType === 'long' 
            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' 
            : 'border-gray-200 hover:border-teal-300'
        }`}
        onClick={() => setTaskType('long')}
      >
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-teal-500" />
          <span className="font-medium text-sm">Quest Chain</span>
        </div>
        <span className="text-xs text-gray-500 flex-grow">Long-term with steps</span>
        <div className="mt-2 text-xs">
          <span className={longBlankCards > 0 ? "text-green-600" : "text-red-500"}>
            {longBlankCards} blank
          </span>
          {longRewardCount > 0 && (
            <span className="text-blue-600 ml-2">
              {longRewardCount} reward
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Render card selection
  const renderCardSelector = () => (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Card Type Selection</span>
            {isFetchingInventory && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
          
          {/* Card type toggle */}
          <div className="flex items-center">
            {/* Show toggle when reward cards are available */}
            {getCurrentRewardCardCount() > 0 && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useReward}
                  onChange={e => {
                    setUseReward(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedCard(null);
                      if (blankCards.length > 0) {
                        setSelectedBlankCard(blankCards[0]);
                      }
                    } else {
                      setSelectedBlankCard(null);
                      if (rewardCards.length > 0) {
                        setSelectedCard(rewardCards[0]);
                      }
                    }
                    setCardError('');
                  }}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer ${useReward ? 'peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600' : ''} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                <span className="ml-2 text-xs text-gray-700">Use special reward card</span>
              </label>
            )}
            
            {/* Show hint when no cards are available */}
            {getCurrentRewardCardCount() === 0 && getCurrentBlankCardCount() === 0 && (
              <div className="text-xs text-red-500">
                No cards available. Get cards first.
              </div>
            )}
            
            {/* Show hint when only blank cards are available */}
            {getCurrentRewardCardCount() === 0 && getCurrentBlankCardCount() > 0 && (
              <div className="text-xs text-gray-500">
                Only blank cards available
              </div>
            )}
            
            {/* Show hint when only reward cards are available */}
            {getCurrentRewardCardCount() > 0 && getCurrentBlankCardCount() === 0 && !useReward && (
              <div className="text-xs text-gray-500">
                Only reward cards available
              </div>
            )}
          </div>
        </div>

        {/* Card selector */}
        {useReward ? (
          <div>
            {getCurrentRewardCardCount() === 0 && !isFetchingInventory ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
                No reward cards available for {taskType === 'short' ? 'daily quests' : 'quest chains'}
              </div>
            ) : (
              <CardSelector
                key={`card-selector-${taskType}-${slotIndex}`}
                onSelect={setSelectedCard}
                selectedCard={selectedCard}
                showRewards
                taskType={taskType}
                disabled={getCurrentRewardCardCount() === 0 && !selectedCard}
              />
            )}
          </div>
        ) : (
          <div>
            {getCurrentBlankCardCount() === 0 && !isFetchingInventory ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md flex justify-between items-center">
                <span>No blank cards available for {taskType === 'short' ? 'Daily Quest' : 'Quest Chain'}</span>
                {getCurrentRewardCardCount() > 0 && (
                  <button 
                    onClick={() => setUseReward(true)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Use reward card
                  </button>
                )}
              </div>
            ) : selectedBlankCard ? (
              <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Standard {taskType === 'short' ? 'Daily Quest' : 'Quest Chain'} Card</div>
                    <div className="text-xs text-gray-500 mt-0.5">Basic task card without special effects</div>
                  </div>
                  <Check className="text-green-500 h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
                No blank cards found. Please refresh or obtain cards first.
              </div>
            )}
          </div>
        )}
        
        {cardError && (
          <div className="text-red-500 text-xs mt-1">{cardError}</div>
        )}
      </div>
    </div>
  );

  // Add missing cards warning at the top of step 2
  const renderMissingCardsWarning = () => {
    if (hasAnyCardForCurrentType) return null;
    
    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
        <div className="font-medium mb-1">Warning: No Cards Available</div>
        <p>You don't have any {taskType === 'short' ? 'Daily Quest' : 'Quest Chain'} cards available. 
        Please obtain cards first to create this task.</p>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <div className="px-4 py-4">
        {/* Task Type & Card Selection (Step 1) */}
        {currentStep === 1 && (
          <>
            {/* Always render the task type selector, but add warning for slot-based tasks */}
            {renderTaskTypeSelector()}
            
            {isFromSlot && taskType !== defaultType && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
                <div className="font-medium mb-1">Warning: Task Type Mismatch</div>
                <p>You are creating a task for a {defaultType === 'short' ? 'Daily Quest' : 'Quest Chain'} slot. 
                The task type must match the slot type when equipped.</p>
              </div>
            )}
            
            {/* Task Information */}
            {taskType === 'short' && expirationInfo && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-2 mb-6">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-700">Daily Quest Information</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Task expires in <span className="font-semibold">{expirationInfo.hours} hours</span> ({expirationInfo.date} {expirationInfo.time})
                  </div>
                </div>
              </div>
            )}
            
            {/* Card Selector */}
            {renderCardSelector()}

            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={handleClose} 
                className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleNextStep}
                className="px-3 py-1.5 text-xs rounded text-white flex items-center bg-blue-500 hover:bg-blue-600"
              >
                Next <ArrowRight className="ml-1 w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {/* Task Details (Step 2) */}
        {currentStep === 2 && (
          <>
            {renderMissingCardsWarning()}
            <TaskForm
              onSubmit={handleSubmitForm}
              onCancel={handlePreviousStep}
              loading={loading}
              initialData={initialData}
              taskType={taskType}
              defaultDueDateTime={dueDate}
              key={taskType + (initialData?._id || 'new')}
              disableSubmit={!hasAnyCardForCurrentType || isFetchingInventory}
              onChange={handleTaskFormChange}
              compact={true}
            />
          </>
        )}
      </div>
    </Modal>
  );
};
