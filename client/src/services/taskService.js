import axios from 'axios';

// Create a request configuration with an authentication token
const getConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Get all tasks
export const getTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain task'
    );
  }
};

// Get equipped tasks
export const getEquippedTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain equipped tasks'
    );
  }
};

// Get the equipped short task
export const getEquippedShortTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    // Filter out short tasks and mark whether they are expired (24 hours after equipment)
    const now = Date.now();
    return data
      .filter(task => task.type === 'short' || task.slotType === 'short')
      .map(task => ({
        ...task,
        expired:
          task.slotEquippedAt
            ? now - new Date(task.slotEquippedAt).getTime() > 24 * 60 * 60 * 1000
            : false
      }));
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain the equipped short-term task'
    );
  }
};

// Get equipped long-term tasks
export const getEquippedLongTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    // Filter out long-term tasks
    return data.filter(task => task.type === 'long' || task.slotType === 'long');
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain the equipped Long-term task'
    );
  }
};

// Create a new task
export const createTask = async (taskData, token) => {
  try {
    // ✅ No longer call /api/cards/consume
    const { data } = await axios.post(
        '/api/tasks',
        taskData,  // taskData Includes experience rewards, card ID, etc.
        getConfig(token)
    );
    return data;
  } catch (error) {
    // Capture server errors and display them as a toast
    const errorMessage = error.response?.data?.message || 'Failed to create task';
    
    // Import toast (make sure to import as needed to avoid circular references)
    const { toast } = require('react-hot-toast');
    
    // Display error message
    toast.error(
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-sm">Failed to create task</span>
        <div className="text-xs">{errorMessage}</div>
      </div>,
      { duration: 5000, position: 'top-center' }
    );
    
    // Return an error object instead of throwing an error directly
    return {
      success: false,
      message: errorMessage
    };
  }
};


// Get a single task
export const getTaskById = async (id, token) => {
  try {
    const { data } = await axios.get(`/api/tasks/${id}`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain task details'
    );
  }
};

// Update Tasks
export const updateTask = async (id, taskData, token) => {
  try {
    const { data } = await axios.put(`/api/tasks/${id}`, taskData, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Update task failed'
    );
  }
};

// Deleting a task
export const deleteTask = async (id, token) => {
  try {
    const { data } = await axios.delete(`/api/tasks/${id}`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to delete task'
    );
  }
};

// Complete the task
export const completeTask = async (id, token) => {
  try {
    const { data } = await axios.put(
      `/api/tasks/${id}`,
      { status: 'completed' },
      getConfig(token)
    );
    
    // Make sure the returned data exists
    if (!data) {
      console.error('The task completion interface returns empty data');
      return { 
        success: false, 
        message: 'The task completion operation failed and the server did not return data.',
        task: { _id: id, status: 'pending' },
        reward: { expGained: 0, goldGained: 0 }
      };
    }
    
    console.log('Task completion interface response data:', data);
    
    // If the response does not contain a reward object, but the task attribute exists, construct a default reward object
    if (!data.reward && data.task) {
      const task = data.task;
      const defaultXp = task.experienceReward || (task.type === 'long' ? 30 : 10);
      const defaultGold = task.goldReward || (task.type === 'long' ? 15 : 5);
      
        console.log(`No reward information found, using default value: ${defaultXp} XP, ${defaultGold} Gold`);
      
      data.reward = {
        expGained: defaultXp,
        goldGained: defaultGold
      };
    }
    
    return data;
  } catch (error) {
    console.error('Failed to complete the task:', error.response || error);
    const errorMessage = error.response?.data?.message || 'Failed to complete the task, please try again later';
    
    // Return error information and a default data structure instead of throwing an error
    return {
      success: false,
      message: errorMessage,
      task: { _id: id, status: 'pending' },
      reward: { expGained: 0, goldGained: 0 }
    };
  }
};

// Equip the task to the task slot
export const equipTask = async (id, slotPosition, token, slotType = 'short') => {
  try {
    const { data } = await axios.put(
      `/api/tasks/${id}/equip`,
      { slotPosition, slotType },
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Equipment mission failed'
    );
  }
};

// Remove equipped tasks
export const unequipTask = async (id, token) => {
  try {
    const { data } = await axios.put(
      `/api/tasks/${id}/unequip`,
      {},
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Uninstall task failed'
    );
  }
};

// Complete subtasks
export const completeSubtask = async (taskId, subtaskIndex, token) => {
  try {
    const { data } = await axios.put(
      `/api/tasks/${taskId}`,
      { subTaskIndex: subtaskIndex },
      getConfig(token)
    );
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to complete subtask'
    );
  }
};

// Completing long-term tasks (dedicated endpoints)
export const completeLongTask = async (id, token) => {
  try {
    console.log(`Calling the long-term task completion API, task ID: ${id}`);
    
    const config = getConfig(token);
    console.log('Request Configuration:', config);
    
    const response = await axios.post(
      `/api/tasks/${id}/complete`,
      {},
      config
    );
    
    const { data } = response;
    console.log('Long-term task completion API response:', data);
    
    // 确保返回数据存在
    if (!data) {
      console.error('The long-term task completion interface returns empty data');
      return { 
        success: false, 
        message: 'The task completion operation failed and the server did not return data.',
        task: { _id: id, status: 'pending' },
        reward: { expGained: 0, goldGained: 0 }
      };
    }
    
    // Check if the response contains longTaskInfo
    if (!data.longTaskInfo && data.task && data.task.type === 'long') {
      // 如果没有longTaskInfo但任务是长期任务，创建一个默认的longTaskInfo
      const subTaskCount = data.task.subTasks ? data.task.subTasks.length : 0;
      const completedSubTaskCount = data.task.subTasks ? 
        data.task.subTasks.filter(st => st.status === 'completed').length : 0;
      
      data.longTaskInfo = {
        totalSubTasks: subTaskCount,
        allSubTasksCompleted: completedSubTaskCount === subTaskCount,
        alreadyCompletedSubTasksCount: completedSubTaskCount,
        finalBonusExperience: data.task.experienceReward || 30,
        finalBonusGold: data.task.goldReward || 15
      };
      
      console.log('Created a default longTaskInfo:', data.longTaskInfo);
    }
    
    // If the response does not contain a reward object, but the task attribute exists, construct a default reward object
    if (!data.reward && data.task) {
      const task = data.task;
      const defaultXp = task.experienceReward || 30;
      const defaultGold = task.goldReward || 15;
      
      console.log(`No reward information found, using default value: ${defaultXp} XP, ${defaultGold} Gold`);
      
      data.reward = {
        expGained: defaultXp,
        goldGained: defaultGold
      };
    } else if (data.reward && (data.reward.expGained === 0 || data.reward.goldGained === 0) && data.task) {
      // If the reward value is 0, the task itself or the default value is used.
      const task = data.task;
      
      // If longTaskInfo exists and there is finalBonusExperience/finalBonusGold, these values ​​are used first
      if (data.longTaskInfo) {
        if (data.reward.expGained === 0) {
          data.reward.expGained = data.longTaskInfo.finalBonusExperience || task.experienceReward || 30;
          console.log(`Reward XP is 0, use the value from longTaskInfo: ${data.reward.expGained} XP`);
        }
        if (data.reward.goldGained === 0) {
          data.reward.goldGained = data.longTaskInfo.finalBonusGold || task.goldReward || 15;
          console.log(`The reward Gold is 0, use the value in longTaskInfo: ${data.reward.goldGained} Gold`);
        }
      } else {
        // No longTaskInfo, use the task itself or default value
        if (data.reward.expGained === 0) {
          data.reward.expGained = task.experienceReward || 30;
          console.log(`Bonus XP is 0, use default value: ${data.reward.expGained} XP`);
        }
        if (data.reward.goldGained === 0) {
          data.reward.goldGained = task.goldReward || 15;
          console.log(`The reward Gold is 0, using the default value: ${data.reward.goldGained} Gold`);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Long-term task completion API error:', error.response || error);
    // Return error information and default data structure, do not throw errors
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to complete the long task, please try again later',
      task: { _id: id, status: 'pending' },
      reward: { expGained: 30, goldGained: 15 }  // Use default values
    };
  }
};

// Get task history
export const getTaskHistory = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/history', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain task history'
    );
  }
};
