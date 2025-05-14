const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const axios = require('axios');
const { CardSelector } = require('./CardSelector');
const AuthContext = require('../../context/AuthContext').default;

// 模拟axios
jest.mock('axios');

const mockCards = [
  {
    _id: '1',
    title: '测试卡片1',
    description: '这是测试卡片1的描述',
    taskDuration: 'short',
    bonus: { experienceMultiplier: 1.5, goldMultiplier: 1.2 }
  },
  {
    _id: '2',
    title: '测试卡片2',
    description: '这是测试卡片2的描述',
    taskDuration: 'long',
    bonus: { experienceMultiplier: 2, goldMultiplier: 1.8 }
  }
];

describe('CardSelector组件', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockCards });
  });

  test('应该正确渲染卡片选择器', async () => {
    render(
      React.createElement(AuthContext.Provider, { value: { user: { token: 'test-token' } } },
        React.createElement(CardSelector, { onCardSelect: jest.fn() })
      )
    );
    
    await waitFor(() => {
      expect(screen.getByText('测试卡片1')).toBeInTheDocument();
      expect(screen.getByText('测试卡片2')).toBeInTheDocument();
    });
  });

  test('点击卡片应该调用onCardSelect', async () => {
    const mockOnCardSelect = jest.fn();
    
    render(
      React.createElement(AuthContext.Provider, { value: { user: { token: 'test-token' } } },
        React.createElement(CardSelector, { onCardSelect: mockOnCardSelect })
      )
    );
    
    await waitFor(() => {
      expect(screen.getByText('测试卡片1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('测试卡片1'));
    expect(mockOnCardSelect).toHaveBeenCalledWith(mockCards[0]);
  });
});
