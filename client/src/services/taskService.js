import axios from 'axios';

// 创建一个带有认证token的请求配置
const getConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 获取所有任务
export const getTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : '获取任务失败'
    );
  }
};

// 获取已装备的任务
export const getEquippedTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : '获取已装备任务失败'
    );
  }
};

// 获取已装备的short任务
export const getEquippedShortTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    // 过滤出short任务，并标记是否过期（装备后24小时）
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

// 获取已装备的长期任务
export const getEquippedLongTasks = async (token) => {
  try {
    const { data } = await axios.get('/api/tasks/equipped', getConfig(token));
    // 过滤出长期任务
    return data.filter(task => task.type === 'long' || task.slotType === 'long');
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : 'Failed to obtain the equipped Long-term task'
    );
  }
};

// 创建新任务
export const createTask = async (taskData, token) => {
  try {
    // ✅ 不再调用 /api/cards/consume
    const { data } = await axios.post(
        '/api/tasks',
        taskData,  // taskData 已含经验奖励、卡片 ID 等
        getConfig(token)
    );
    return data;
  } catch (error) {
    // 捕获服务器错误并以 toast 形式显示
    const errorMessage = error.response?.data?.message || '创建任务失败';
    
    // 导入 toast (确保按需导入，避免循环引用)
    const { toast } = require('react-hot-toast');
    
    // 显示错误信息
    toast.error(
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-sm">创建任务失败</span>
        <div className="text-xs">{errorMessage}</div>
      </div>,
      { duration: 5000, position: 'top-center' }
    );
    
    // 返回错误对象，而不是直接抛出错误
    return {
      success: false,
      message: errorMessage
    };
  }
};


// 获取单个任务
export const getTaskById = async (id, token) => {
  try {
    const { data } = await axios.get(`/api/tasks/${id}`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : '获取任务详情失败'
    );
  }
};

// 更新任务
export const updateTask = async (id, taskData, token) => {
  try {
    const { data } = await axios.put(`/api/tasks/${id}`, taskData, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : '更新任务失败'
    );
  }
};

// 删除任务
export const deleteTask = async (id, token) => {
  try {
    const { data } = await axios.delete(`/api/tasks/${id}`, getConfig(token));
    return data;
  } catch (error) {
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : '删除任务失败'
    );
  }
};

// 完成任务
export const completeTask = async (id, token) => {
  try {
    const { data } = await axios.put(
      `/api/tasks/${id}`,
      { status: 'completed' },
      getConfig(token)
    );
    
    // 确保返回数据存在
    if (!data) {
      console.error('任务完成接口返回数据为空');
      return { 
        success: false, 
        message: '任务完成操作失败，服务器未返回数据', 
        task: { _id: id, status: 'pending' },
        reward: { expGained: 0, goldGained: 0 }
      };
    }
    
    console.log('任务完成接口响应数据:', data);
    
    // 如果response没有包含reward对象，但task属性存在，构造一个默认的reward对象
    if (!data.reward && data.task) {
      const task = data.task;
      const defaultXp = task.experienceReward || (task.type === 'long' ? 30 : 10);
      const defaultGold = task.goldReward || (task.type === 'long' ? 15 : 5);
      
      console.log(`没有找到奖励信息，使用默认值: ${defaultXp} XP, ${defaultGold} Gold`);
      
      data.reward = {
        expGained: defaultXp,
        goldGained: defaultGold
      };
    }
    
    return data;
  } catch (error) {
    console.error('完成任务失败:', error.response || error);
    const errorMessage = error.response?.data?.message || '完成任务失败，请稍后再试';
    
    // 返回错误信息和默认数据结构，而不是抛出错误
    return {
      success: false,
      message: errorMessage,
      task: { _id: id, status: 'pending' },
      reward: { expGained: 0, goldGained: 0 }
    };
  }
};

// 装备任务到任务槽
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
        : '装备任务失败'
    );
  }
};

// 卸下已装备的任务
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
        : '卸下任务失败'
    );
  }
};

// 完成子任务
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
        : '完成子任务失败'
    );
  }
};

// 完成长期任务（专用端点）
export const completeLongTask = async (id, token) => {
  try {
    console.log(`正在调用长期任务完成API，任务ID: ${id}`);
    
    const config = getConfig(token);
    console.log('请求配置:', config);
    
    const response = await axios.post(
      `/api/tasks/${id}/complete`,
      {},
      config
    );
    
    const { data } = response;
    console.log('长期任务完成API响应:', data);
    
    // 确保返回数据存在
    if (!data) {
      console.error('长期任务完成接口返回数据为空');
      return { 
        success: false, 
        message: '任务完成操作失败，服务器未返回数据', 
        task: { _id: id, status: 'pending' },
        reward: { expGained: 0, goldGained: 0 }
      };
    }
    
    // 检查响应中是否包含longTaskInfo
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
      
      console.log('创建了默认的longTaskInfo:', data.longTaskInfo);
    }
    
    // 如果response没有包含reward对象，但task属性存在，构造一个默认的reward对象
    if (!data.reward && data.task) {
      const task = data.task;
      const defaultXp = task.experienceReward || 30;
      const defaultGold = task.goldReward || 15;
      
      console.log(`没有找到奖励信息，使用默认值: ${defaultXp} XP, ${defaultGold} Gold`);
      
      data.reward = {
        expGained: defaultXp,
        goldGained: defaultGold
      };
    } else if (data.reward && (data.reward.expGained === 0 || data.reward.goldGained === 0) && data.task) {
      // 如果奖励值为0，也使用任务本身或默认值
      const task = data.task;
      
      // 如果存在longTaskInfo且有finalBonusExperience/finalBonusGold，优先使用这些值
      if (data.longTaskInfo) {
        if (data.reward.expGained === 0) {
          data.reward.expGained = data.longTaskInfo.finalBonusExperience || task.experienceReward || 30;
          console.log(`奖励XP为0，使用longTaskInfo中的值: ${data.reward.expGained} XP`);
        }
        if (data.reward.goldGained === 0) {
          data.reward.goldGained = data.longTaskInfo.finalBonusGold || task.goldReward || 15;
          console.log(`奖励Gold为0，使用longTaskInfo中的值: ${data.reward.goldGained} Gold`);
        }
      } else {
        // 没有longTaskInfo，使用任务本身或默认值
        if (data.reward.expGained === 0) {
          data.reward.expGained = task.experienceReward || 30;
          console.log(`奖励XP为0，使用默认值: ${data.reward.expGained} XP`);
        }
        if (data.reward.goldGained === 0) {
          data.reward.goldGained = task.goldReward || 15;
          console.log(`奖励Gold为0，使用默认值: ${data.reward.goldGained} Gold`);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('长期任务完成API错误:', error.response || error);
    // 返回错误信息和默认数据结构，不要抛出错误
    return {
      success: false,
      message: error.response?.data?.message || '完成长期任务失败，请稍后再试',
      task: { _id: id, status: 'pending' },
      reward: { expGained: 30, goldGained: 15 }  // 使用默认值
    };
  }
};
