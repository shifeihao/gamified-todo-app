import axios from 'axios';


export const getAvailableClasses = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get(`/api/character/classes`, config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch classes');
    }
  };
  
  export const selectClass = async (token, classSlug, gender = 'male') => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.post(
        `/api/character/select-class`,
        { classSlug, gender},
        config
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to select class');
    }
  };
  
  export const getUserStats = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get(`/api/character/stats`, config);
      return response.data;
    } catch (error) {
      // 如果返回404，可能意味着用户还没有选择职业
      if (error.response?.status === 404) {
        return { hasClass: false };
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch user stats');
    }
  };