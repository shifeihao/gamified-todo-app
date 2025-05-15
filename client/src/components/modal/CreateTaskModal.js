// src/components/modal/CreateTaskModal.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Modal } from '../base/Modal';
import { TaskForm } from '../form/TaskForm';
import { CardSelector } from '../base/CardSelector';
import { Tooltip } from '../base/Tooltip';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { 
  HelpCircle, Loader2, Clock, Calendar, Check, 
  CreditCard, ArrowLeft, ArrowRight, X, AlertCircle 
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
  
    // Add refs to prevent infinite update loop
  const initializedRef = useRef(false);
  const taskTypeInitializedRef = useRef(false);
  const dueDateInitializedRef = useRef(false);
  
  // Properly calculate initial task type
  const getInitialTaskType = () => {
    // When editing an existing task, use its type
    if (initialData?.type) {
      console.log(`Edit an existing task, using the type: ${initialData.type}`);
      return initialData.type;
    }
    
    // When creating a task from a slot, use the slot type
    if (isFromSlot) {
      console.log(`Create a task from a slot, using type: ${defaultType}`);
      return defaultType;
    }
    
    // Default to the provided default type
    console.log(`Use default type: ${defaultType}`);
    return defaultType;
  };

  // Form state
  const [taskType, setTaskType] = useState(getInitialTaskType());
  const [useReward, setUseReward] = useState(initialData?.useRewardCard || initialData?.cardId ? true : false);
  const [selectedCard, setSelectedCard] = useState(initialData?.cardDetails || null);
  const [selectedBlankCard, setSelectedBlankCard] = useState(null);
  const [formValues, setFormValues] = useState(null);
  
  // Remember selectedCardId to auto-select later (used for quick create feature)
  const selectedCardIdRef = useRef(initialData?.selectedCardId || null);
  // Track if this modal was opened with a specific card to select
  const hasSpecificCardSelection = useRef(!!initialData?.selectedCardId || !!initialData?.useRewardCard);
  // 添加一个ref来跟踪卡片是否已锁定选择
  const cardSelectionLocked = useRef(false);
  
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

  // Add a ref to cache the last form data
  const prevFormValuesRef = useRef(null);
  
  // Added default type output to help debugging
  useEffect(() => {
    if (!initializedRef.current) {
      console.log("CreateTaskModal  Initialization parameters:", {
        isFromSlot,
        slotIndex,
        defaultType,
        initialTaskType: getInitialTaskType()
      });
      initializedRef.current = true;
    }
  }, []);

  // Effect to initialize task type and handle card selection when task type changes
  useEffect(() => {
    // Preventing duplicate execution
    if (taskTypeInitializedRef.current) {
      return;
    }
    
    // Strictly control task types - always use the slot type when creating tasks from slots
    if (isFromSlot && taskType !== defaultType) {
      console.log(`Create a task from a slot, enforcing the type: ${defaultType}`);
      setTaskType(defaultType);
      taskTypeInitializedRef.current = true;
      return; // Return early to avoid resetting card selection
    }
    
    // 编辑现有任务时总是使用任务原类型
    if (initialData?.type && taskType !== initialData.type) {
      console.log(`编辑现有任务，强制使用类型: ${initialData.type}`);
      setTaskType(initialData.type);
      taskTypeInitializedRef.current = true;
      return; // Return early to avoid resetting card selection
    }
    
    // 如果是快速创建模式（通过奖励卡片上的按钮），强制使用奖励卡片模式
    if (hasSpecificCardSelection.current) {
      console.log("快速创建模式，强制使用奖励卡片");
      setUseReward(true);
    }
    
    taskTypeInitializedRef.current = true;
  }, [initialData, defaultType, isFromSlot, taskType]);

  // Separate the logic of automatically switching reward card mode and update it in a functional form using useState to avoid chain reactions
  useEffect(() => {
    // Automatically switch to reward cards if blank cards are not available
    const hasShortBlankCards = shortBlankCards > 0;
    const hasLongBlankCards = longBlankCards > 0;
    const hasShortReward = shortRewardCount > 0;
    const hasLongReward = longRewardCount > 0;
    
    const hasCurrentTypeBlank = taskType === 'short' ? hasShortBlankCards : hasLongBlankCards;
    const hasCurrentTypeReward = taskType === 'short' ? hasShortReward : hasLongReward;
    
    // If blank cards are not available but reward cards are, switch to reward mode
    if (!hasCurrentTypeBlank && hasCurrentTypeReward && !useReward) {
      console.log("There are no blank cards but there are reward cards, switch to reward card mode");
      setUseReward(true);
    }
  }, [shortBlankCards, longBlankCards, shortRewardCount, longRewardCount, taskType, useReward]);

  // Effect to handle card selection when task type changes
  useEffect(() => {
    // Reset card selection when task type changes
    setSelectedBlankCard(null);
    setSelectedCard(null);
    
    // 当任务类型改变时立即重新获取库存
    // 这会触发依赖于taskType的fetchInventory()
    if (isOpen && user && taskType) {
      console.log(`Task type changed to: ${taskType}, retrieve the matching cards`);
      setIsFetchingInventory(true);
      const timer = setTimeout(() => {
        fetchInventory(); // Use setTimeout to avoid possible state update conflicts
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [taskType]);

  // Effect to handle due date
  useEffect(() => {
    if (dueDateInitializedRef.current) {
      return;
    }
    
    if (defaultDueDateTime) {
      setDueDate(defaultDueDateTime);
    } else if (taskType === 'short' && !initialData?.dueDate) {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      now.setHours(23, 59);
      setDueDate(now.toISOString().slice(0, 16));
    } else if (initialData?.dueDate) {
      setDueDate(new Date(initialData.dueDate).toISOString().slice(0, 16));
    } else if (taskType === 'long') {
      // Set a default due date of one week for long-term tasks
      const now = new Date();
      now.setDate(now.getDate() + 7);
      setDueDate(now.toISOString().slice(0, 10)); // 只保留日期部分
    } else {
      setDueDate('');
    }
    
    dueDateInitializedRef.current = true;
  }, [taskType, defaultDueDateTime, initialData]);

  // Reset step and refs when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      // If it is not in edit mode, you need to reset the form state
      if (!initialData) {
        resetFormState();
      }
    } else {
      // Reset all refs so that they can be initialized correctly the next time the modal window is opened
      initializedRef.current = false;
      taskTypeInitializedRef.current = false;
      dueDateInitializedRef.current = false;
    }
  }, [isOpen, initialData]);
  
  // Check and modify the task type selection logic to prevent infinite loops
  const didSetDefaultType = useRef(false);
  useEffect(() => {
    // Only set defaultType on initial load, not every render
    if (defaultType && !didSetDefaultType.current) {
      setTaskType(defaultType);
      didSetDefaultType.current = true;
    }
  }, [defaultType]);

  // Make sure to reset the flag when the component unmounts
  useEffect(() => {
    return () => {
      didSetDefaultType.current = false;
      initializedRef.current = false;
      taskTypeInitializedRef.current = false;
      dueDateInitializedRef.current = false;
    };
  }, []);

  // Add a separate fetchInventory function for manual calling
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
      
      console.log(`Current task type: ${taskType}`);
      console.log(`Blank Card Quantity - Short Term: ${shortBlanks.length}, Long Term: ${longBlanks.length}`);
      console.log(`Number of Reward Cards - Short Term: ${shortRewards.length}, Long Term: ${longRewards.length}`);
      
      // Get cards for current task type
      const currentTypeBlankCards = taskType === 'short' ? shortBlanks : longBlanks;
      const currentTypeRewardCards = taskType === 'short' ? shortRewards : longRewards;
      
      // Update card lists
      setBlankCards(currentTypeBlankCards);
      setRewardCards(currentTypeRewardCards);
      setRewardCardCount(currentTypeRewardCards.length);
      
      console.log(`${taskType} task available cards - Blank:${currentTypeBlankCards.length}, Reward:${currentTypeRewardCards.length}`);
      
      // Check if we need to auto-select a specific reward card (for quick create feature)
      if (selectedCardIdRef.current) {
        console.log(`尝试根据ID自动选择卡片: ${selectedCardIdRef.current}`);
        
        // 在所有奖励卡片中寻找精确匹配ID的卡片，不仅在当前任务类型中寻找
        const allRewardCards = [...shortRewards, ...longRewards];
        // 使用精确的ID匹配
        const cardToSelect = allRewardCards.find(c => c._id === selectedCardIdRef.current);
        
        if (cardToSelect) {
          console.log("找到匹配的奖励卡片:", cardToSelect.title);
          
          // 如果卡片的任务类型与当前不同，切换到对应的任务类型
          if (cardToSelect.taskDuration !== 'general' && cardToSelect.taskDuration !== taskType) {
            console.log(`切换任务类型以匹配卡片: ${cardToSelect.taskDuration}`);
            setTaskType(cardToSelect.taskDuration);
          }
          
          // 强制使用奖励卡片模式并选择此卡片
          setUseReward(true); // 快速创建始终使用奖励卡片模式
          setSelectedCard(cardToSelect);
          setSelectedBlankCard(null);
          
          // 清除ID引用，以避免再次尝试选择
          selectedCardIdRef.current = null;
          // 锁定卡片选择，防止后续代码覆盖已选择的卡片
          cardSelectionLocked.current = true;
          
          setIsFetchingInventory(false);
          return;
        } else {
          console.log("在可用奖励卡片中未找到指定ID的卡片");
          // 即使找不到匹配的卡片，也保持奖励卡片模式优先
          setUseReward(true);
          
          // 不清空selectedCardIdRef，保留它用于后续可能的查找
          console.log("保留卡片ID以便后续匹配");
        }
      }
      
      // 如果卡片选择已锁定，表示已经选择了特定卡片，不再进行自动选择
      if (cardSelectionLocked.current) {
        console.log("卡片选择已锁定，保持当前选择");
        setIsFetchingInventory(false);
        return;
      }
      
      // Regular card selection logic
      const hasBlankCards = currentTypeBlankCards.length > 0;
      const hasRewardCards = currentTypeRewardCards.length > 0;
      
      // 如果是通过特定卡片打开的（快速创建模式），即使找不到精确的卡片，也优先使用奖励卡片模式
      if (hasSpecificCardSelection.current) {
        console.log("快速创建模式 - 优先使用奖励卡片");
        setUseReward(true);
        
        if (hasRewardCards) {
          setSelectedCard(currentTypeRewardCards[0]);
          setSelectedBlankCard(null);
          // 快速创建模式下，一旦选择了卡片就锁定选择
          cardSelectionLocked.current = true;
        }
        
        setIsFetchingInventory(false);
        return;
      }
      
      // Check if previously selected cards are still valid
      const prevSelectedCardStillValid = useReward && selectedCard && 
        currentTypeRewardCards.some(c => c._id === selectedCard._id);
      
      const prevBlankCardStillValid = !useReward && selectedBlankCard && 
        currentTypeBlankCards.some(c => c._id === selectedBlankCard._id);
       
      // 1. If previous selection is still valid, keep it
      if (prevSelectedCardStillValid || prevBlankCardStillValid) {
        // Keep current selection
        console.log("Keep current card selection");
      }
      // 2. If no blank cards but reward cards available, auto-switch to reward card mode
      else if (!hasBlankCards && hasRewardCards) {
        console.log("No blank cards, automatically switch to reward card mode");
        setUseReward(true);
        setSelectedCard(currentTypeRewardCards[0]);
        setSelectedBlankCard(null);
      } 
      // 3. If blank cards available and not in reward mode, select blank card
      else if (hasBlankCards && !useReward) {
        console.log("Select a blank card that matches the task type");
        setSelectedBlankCard(currentTypeBlankCards[0]);
        setSelectedCard(null);
      }
      // 4. If reward cards available and in reward mode, select reward card
      else if (hasRewardCards && useReward) {
        console.log("Select a reward card that matches the mission type");
        setSelectedCard(currentTypeRewardCards[0]);
        setSelectedBlankCard(null);
      }
      // 5. If no cards available, clear all selections
      else {
        console.log("No cards available, clear all selections");
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
      // 当模态窗口打开时，如果是快速创建模式(selectedCardId存在)，强制设置useReward为true
      if (initialData?.selectedCardId) {
        console.log("快速创建模式检测到selectedCardId，强制使用奖励卡片");
        setUseReward(true);
        // 确保selectedCardIdRef被设置
        selectedCardIdRef.current = initialData.selectedCardId;
        // 重置卡片选择锁定状态
        cardSelectionLocked.current = false;
      }
      
      fetchInventory();
    }
  }, [isOpen, user]);  // 移除useReward依赖，避免因useReward变化导致重新获取库存

  const resetFormState = () => {
    // Completely reset all states
    setTaskType(getInitialTaskType());
    setUseReward(false); // Always reset to false to avoid using the last state
    setSelectedCard(null);
    setSelectedBlankCard(null);
    setCardError('');
    setCurrentStep(1);
    setFormValues(null);
    // 重置卡片选择锁定状态
    cardSelectionLocked.current = false;
    // Make sure to clear the form values
    if (document.getElementById('title')) document.getElementById('title').value = '';
    if (document.getElementById('description')) document.getElementById('description').value = '';
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  // Render missing cards warning at the top of step 2
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
  
  // Optimize the way of packaging TaskForm to avoid unnecessary re-rendering
  const handleFormChange = useCallback((formValues) => {
    if (!formValues) return;
    
    // Compare current and previous form data
    const formValuesJSON = JSON.stringify(formValues);
    if (formValuesJSON === prevFormValuesRef.current) {
      return; // If the value has not changed, do not update the state
    }
    
    // Update cache and state
    prevFormValuesRef.current = formValuesJSON;
    setFormValues(formValues);
  }, []);

  const handleSubmitForm = async (formFields) => {
    // First check if the form fields are valid
    if (!formFields.title || formFields.title.trim() === '') {
      toast.error(
        <div className="flex items-center">
          <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Task title is required</span>
        </div>,
        { duration: 3000, position: 'top-center' }
      );
      return;
    }
    
    // Verify subtask information - if it is a long-term task
    if (taskType === 'long') {
      // Make sure there is a deadline
      if (!formFields.dueDate) {
        toast.error(
          <div className="flex items-center">
            <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Task Chain requires a deadline</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        return;
      }
      
      // Check subtasks
      if (!formFields.subTasks || formFields.subTasks.length === 0) {
        toast.error(
          <div className="flex items-center">
            <span className="font-medium">Task Chain requires at least one step</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        return;
      }
    }
    
    // Check if ANY cards are available for this task type
    const hasCurrentTypeCards = getCurrentBlankCardCount() > 0 || getCurrentRewardCardCount() > 0;
    
    if (!hasCurrentTypeCards) {
      toast.error(
        <div className="flex items-center">
          <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
          <span className="font-medium">No cards available for {taskType === 'short' ? 'Daily Quests' : 'Quest Chains'}</span>
        </div>,
        { duration: 3000, position: 'top-center' }
      );
      setCardError(`You need cards for ${taskType === 'short' ? 'Daily Quests' : 'Quest Chains'} to create this task.`);
      return;
    }
    
    // Validate the selected card based on the card type (blank or reward)
    if (useReward) {
      if (!selectedCard?._id) {
        toast.error(
          <div className="flex items-center">
            <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Please select a reward card</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        return;
      }

      // Verify that the selected reward card matches the current task type
      if (selectedCard.taskDuration !== 'general' && selectedCard.taskDuration !== taskType) {
        toast.error(
          <div className="flex items-center">
            <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">This reward card doesn't support {taskType === 'short' ? 'Daily Quests' : 'Quest Chains'}</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        setCardError(`This reward card only supports ${selectedCard.taskDuration === 'short' ? 'Daily Quests' : 'Quest Chains'}.`);
        // Trigger reselection of card
        fetchInventory();
        return;
      }
    } else {
      if (!selectedBlankCard?._id) {
        // If no blank cards but reward cards are available, suggest switching
        if (getCurrentRewardCardCount() > 0) {
          toast.error(
            <div className="flex items-center">
              <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
              <span className="font-medium">No blank cards available. Please use a reward card instead.</span>
            </div>,
            { duration: 3000, position: 'top-center' }
          );
        } else {
          toast.error(
            <div className="flex items-center">
              <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
              <span className="font-medium">No available cards</span>
            </div>,
            { duration: 3000, position: 'top-center' }
          );
        }
        return;
      }

      // Verify that the selected blank card matches the current task type
      if (selectedBlankCard.taskDuration !== 'general' && selectedBlankCard.taskDuration !== taskType) {
        toast.error(
          <div className="flex items-center">
            <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">This blank card doesn't support {taskType === 'short' ? 'Daily Quests' : 'Quest Chains'}</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        setCardError(`This blank card only supports ${selectedBlankCard.taskDuration === 'short' ? 'Daily Quests' : 'Quest Chains'}.`);
        // Trigger reselection of card
        fetchInventory();
        return;
      }
    }
    
    setCardError('');

    // Handle due date
    let finalDueDate = null;
    try {
      if (taskType === 'long' && formFields.dueDate) {
        if (formFields.dueDate.length === 10) {
          finalDueDate = new Date(formFields.dueDate + "T23:59:59.000Z").toISOString();
        } else {
          finalDueDate = new Date(formFields.dueDate).toISOString();
        }
        
        // Verify subtasks of long-term tasks
        if (formFields.subTasks && formFields.subTasks.length > 0) {
          // Make sure all subtask deadlines are valid dates
          const mainTaskDueDate = new Date(finalDueDate);
          
          for (let i = 0; i < formFields.subTasks.length; i++) {
            const subTask = formFields.subTasks[i];
            
            // Verify that the subtask deadline cannot be later than the main task deadline
            let subTaskDueDate;
            try {
              subTaskDueDate = new Date(subTask.dueDate);
              
              if (isNaN(subTaskDueDate.getTime())) {
                toast.error(
                  <div className="flex items-center">
                    <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Step #{i+1} has an invalid date format</span>
                  </div>,
                  { duration: 3000, position: 'top-center' }
                );
                return;
              }
              
              if (subTaskDueDate > mainTaskDueDate) {
                toast.error(
                  <div className="flex items-center">
                    <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Step #{i+1} deadline cannot be later than the main task deadline</span>
                  </div>,
                  { duration: 3000, position: 'top-center' }
                );
                return;
              }
            } catch (err) {
              console.error(`Date parsing error for subtask #${i+1}:`, err);
              toast.error(
                <div className="flex items-center">
                  <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Invalid date format in step #{i+1}</span>
                </div>,
                { duration: 3000, position: 'top-center' }
              );
              return;
            }
          }
        }
      } else if (taskType === 'short') {
        // Short-term tasks use a deadline of 24 hours later
        const now = new Date();
        now.setHours(now.getHours() + 24);
        finalDueDate = now.toISOString();
      }
    } catch (err) {
      console.error("Date parsing error:", err);
      toast.error(
        <div className="flex items-center">
          <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Invalid date format. Please check your dates.</span>
        </div>,
        { duration: 3000, position: 'top-center' }
      );
      return;
    }

    // If creating/editing from a slot, verify task type matches slot type
    if (isFromSlot) {
      const slotTaskType = defaultType || 'short';
      if (taskType !== slotTaskType) {
        toast.error(
          <div className="flex items-center">
            <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Task type must match slot type ({slotTaskType === 'short' ? 'Daily Quest' : 'Quest Chain'})</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        setCardError(`When adding to a ${slotTaskType === 'short' ? 'Daily Quest' : 'Quest Chain'} slot, you must create a matching task type.`);
        return;
      }
    }

    // Building task data
    const taskPayload = {
      ...formFields,
      title: formFields.title.trim(),
      type: taskType,
      dueDate: finalDueDate,
      fromSlot: isFromSlot,
      slotIndex: isFromSlot ? slotIndex : undefined,
      experienceReward: formFields.experienceReward || 10,
      goldReward: formFields.goldReward || 5,
      cardUsed: useReward ? selectedCard._id : selectedBlankCard._id
    };

    // Remove logs and reduce console output
    try {
      // Display loading status
      setCardError('');
      // Submit Create Task
      await onSubmit(taskPayload);
      // Close after success
      handleClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error(
        <div className="flex items-center">
          <X className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Failed to create task: {err.message || 'Unknown error'}</span>
        </div>,
        { duration: 3000, position: 'top-center' }
      );
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
    <div className="flex flex-col mb-6">
      {/* Removed the slot task type lock prompt text */}
      
      <div className="flex flex-wrap gap-3">
        <div 
          className={`flex-1 min-w-[120px] p-3 border rounded-lg transition-all flex flex-col ${
            taskType === 'short' 
              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
          } ${isFromSlot ? (defaultType === 'short' ? 'cursor-default' : 'cursor-not-allowed opacity-60') : 'cursor-pointer'}`}
          onClick={() => !isFromSlot && setTaskType('short')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">Daily Quest</span>
            {isFromSlot && defaultType === 'short' && (
              <div className="ml-auto">
                <div 
                  className="bg-purple-200 text-purple-700 text-xs h-5 w-5 flex items-center justify-center rounded-full font-bold relative group"
                >
                  !
                  {/* Floating Tips */}
                  <div className="absolute hidden group-hover:block w-52 bg-white border border-gray-200 shadow-lg text-gray-700 text-xs rounded-md p-2 -right-6 top-6 z-10">
                    <span className="font-medium">Fixed Task Type</span>
                    <p className="mt-1">This slot({slotIndex+1})only support Daily Quest type</p>
                    <div className="absolute -top-1 right-7 w-2 h-2 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 flex-grow">24h short-term task</span>
          <div className="mt-2 text-xs flex gap-2">
            <span className="text-gray-600">
              {shortBlankCards} blank
            </span>
            <span className="text-blue-600">
              {shortRewardCount} reward
            </span>
          </div>
        </div>
        
        <div 
          className={`flex-1 min-w-[120px] p-3 border rounded-lg transition-all flex flex-col ${
            taskType === 'long' 
              ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' 
              : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
          } ${isFromSlot ? (defaultType === 'long' ? 'cursor-default' : 'cursor-not-allowed opacity-60') : 'cursor-pointer'}`}
          onClick={() => !isFromSlot && setTaskType('long')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span className="font-medium text-sm">Task Chain</span>
            {isFromSlot && defaultType === 'long' && (
              <div className="ml-auto">
                <div 
                  className="bg-teal-200 text-teal-700 text-xs h-5 w-5 flex items-center justify-center rounded-full font-bold relative group"
                  title="This task type is fixed for the selected slot"
                >
                  !
                  {/* Floating Tips */}
                  <div className="absolute hidden group-hover:block w-52 bg-white border border-gray-200 shadow-lg text-gray-700 text-xs rounded-md p-2 -right-6 top-6 z-10">
                    <span className="font-medium">Fixed Task Type</span>
                    <p className="mt-1">This slot({slotIndex+1})only support Task Chain type</p>
                    <div className="absolute -top-1 right-7 w-2 h-2 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 flex-grow">Long-term with steps</span>
          <div className="mt-2 text-xs flex gap-2">
            <span className="text-gray-600">
              {longBlankCards} blank
            </span>
            <span className="text-blue-600">
              {longRewardCount} reward
            </span>
          </div>
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
            {/* 只有在有奖励卡片，或者是快速创建模式时才显示开关 */}
            {(getCurrentRewardCardCount() > 0 || hasSpecificCardSelection.current) && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useReward}
                  onChange={e => {
                    // 如果是快速创建模式，不允许关闭奖励卡片模式
                    if (hasSpecificCardSelection.current && !e.target.checked) {
                      toast.error(
                        <div className="flex items-center">
                          <AlertCircle className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
                          <span className="font-medium">快速创建模式必须使用奖励卡片</span>
                        </div>,
                        { duration: 3000, position: 'top-center' }
                      );
                      return;
                    }
                    
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
              <div className="text-xs text-gray-500">
                No cards available. Get cards first.
              </div>
            )}
            
            {/* Show hint when only blank cards are available */}
            {getCurrentRewardCardCount() === 0 && getCurrentBlankCardCount() > 0 && !hasSpecificCardSelection.current && (
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
            {/* {taskType === 'short' && expirationInfo && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-2 mb-6">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-700">Daily Quest Information</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Task expires in <span className="font-semibold">{expirationInfo.hours} hours</span> ({expirationInfo.date} {expirationInfo.time})
                  </div>
                </div>
              </div>
            )} */}
            
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
            {hasAnyCardForCurrentType ? null : (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
                <div className="font-medium mb-1">Warning: No Cards Available</div>
                <p>You don't have any {taskType === 'short' ? 'Daily Quest' : 'Quest Chain'} cards available. 
                Please obtain cards first to create this task.</p>
              </div>
            )}
            <TaskForm
              onSubmit={handleSubmitForm}
              onCancel={handlePreviousStep}
              loading={loading}
              initialData={initialData}
              taskType={taskType}
              defaultDueDateTime={dueDate}
              key={`${taskType}-${initialData?._id || 'new'}-${slotIndex}`}
              disableSubmit={!hasAnyCardForCurrentType || isFetchingInventory}
              onChange={handleFormChange}
              compact={true}
            />
          </>
        )}
      </div>
    </Modal>
  );
};
