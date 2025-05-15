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
      // If a 404 is returned, it may mean that the user has not yet selected a career.
      if (error.response?.status === 404) {
        return { hasClass: false };
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch user stats');
    }
  };