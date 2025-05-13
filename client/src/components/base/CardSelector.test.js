import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { CardSelector } from './CardSelector';
import AuthContext from '../../context/AuthContext';

jest.mock('axios');

const sampleData = {
  inventory: [
    { _id: '1', title: 'Blank Card', type: 'blank', used: false, taskDuration: 'general' },
    { _id: '2', title: 'Short Special', type: 'special', used: false, taskDuration: 'short', bonus: { experienceMultiplier: 2, goldMultiplier: 3 } },
    { _id: '3', title: 'Long Special Used', type: 'special', used: true, taskDuration: 'long' },
    { _id: '4', title: 'Long Special Unused', type: 'special', used: false, taskDuration: 'long', bonus: { experienceMultiplier: 5, goldMultiplier: 1 } }
  ],
  dailyCards: { blank: 5 }
};

const renderWithAuth = (props = {}) => {
  const defaultProps = {
    onSelect: jest.fn(),
    showRewards: false,
    taskType: 'short',
  };

  // 确保模拟返回正确的数据
  axios.get.mockImplementation(() => Promise.resolve({ data: sampleData }));
  
  return render(
    <AuthContext.Provider value={{ user: { token: 'fake-token' } }}>
      <CardSelector {...defaultProps} {...props} />
    </AuthContext.Provider>
  );
};

describe('CardSelector Component', () => {
  beforeEach(() => {
    // 确保每个测试开始前重置模拟状态
    jest.clearAllMocks();
    // 预先设置axios模拟
    axios.get.mockImplementation(() => Promise.resolve({ data: sampleData }));
  });

  test('renders blank cards count when showRewards is false', async () => {
    renderWithAuth({ showRewards: false });
    
    // 等待axios被调用并且数据被处理
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    
    // 使用findByText代替getByText，以便更好地处理异步渲染
    const blankCardsText = await screen.findByText(/Blank cards available:/i);
    expect(blankCardsText).toBeInTheDocument();
    expect(blankCardsText).toHaveTextContent('Blank cards available: 5');
    
    // 验证不应该渲染的元素
    expect(screen.queryByText(/Short-term Card/i)).not.toBeInTheDocument();
  });

  test('renders reward cards when showRewards is true and filters correctly', async () => {
    renderWithAuth({ showRewards: true, taskType: 'short' });
    
    // 等待axios调用完成
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    
    // 使用findByText以便处理异步渲染
    try {
      const specialCard = await screen.findByText('Short Special', {}, { timeout: 3000 });
      expect(specialCard).toBeInTheDocument();
      expect(screen.queryByText('Long Special Unused')).not.toBeInTheDocument();
      expect(screen.queryByText('Blank Card')).not.toBeInTheDocument();
    } catch (error) {
      // 如果找不到预期文本，记录渲染的内容以便调试
      console.log('当前DOM内容:', document.body.innerHTML);
      throw error;
    }
  });

  test('calls onSelect when a reward card is clicked', async () => {
    const onSelect = jest.fn();
    renderWithAuth({ showRewards: true, taskType: 'short', onSelect });
    
    // 使用findByText，等待卡片出现
    const card = await screen.findByText('Short Special', {}, { timeout: 3000 });
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(sampleData.inventory[1]);
  });

  test('applies correct background color based on card type', async () => {
    renderWithAuth({ showRewards: true, taskType: 'short' });
    
    // 使用findByText，等待卡片出现
    const cardTitle = await screen.findByText('Short Special', {}, { timeout: 3000 });
    
    // 检查父元素的类名
    expect(cardTitle.parentElement).toHaveClass('bg-purple-100');
  });
});
