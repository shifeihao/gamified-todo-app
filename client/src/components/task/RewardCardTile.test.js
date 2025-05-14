import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RewardCardTile } from './RewardCardTile';

const mockCard = {
  title: '奖励卡片',
  description: '这是一个奖励卡片的描述',
  taskDuration: 'short',
  bonus: {
    experienceMultiplier: 2,
    goldMultiplier: 1.5,
    specialBonus: '特殊奖励'
  }
};

describe('RewardCardTile 组件', () => {
  test('应当正确渲染基本信息', () => {
    render(<RewardCardTile card={mockCard} />);
    
    expect(screen.getByText('奖励卡片')).toBeInTheDocument();
    expect(screen.getByText('这是一个奖励卡片的描述')).toBeInTheDocument();
    expect(screen.getByText('Short Task')).toBeInTheDocument();
  });

  test('应当显示奖励倍率', () => {
    render(<RewardCardTile card={mockCard} />);
    
    expect(screen.getByText('2x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('特殊奖励')).toBeInTheDocument();
  });

  test('点击时应调用onClick回调', () => {
    const handleClick = jest.fn();
    render(<RewardCardTile card={mockCard} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('奖励卡片'));
    expect(handleClick).toHaveBeenCalledWith(mockCard);
  });

  test('readOnly模式下不应调用onClick', () => {
    const handleClick = jest.fn();
    render(<RewardCardTile card={mockCard} onClick={handleClick} readOnly={true} />);
    
    fireEvent.click(screen.getByText('奖励卡片'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('选中状态应显示不同样式', () => {
    const { container } = render(<RewardCardTile card={mockCard} isSelected={true} />);
    
    expect(container.firstChild).toHaveClass('border-purple-500');
    expect(container.firstChild).toHaveClass('bg-purple-200');
  });

  test('已使用的卡片应显示Used标记', () => {
    render(<RewardCardTile card={{ ...mockCard, isUsed: true }} />);
    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  test('长期任务卡片应显示不同标记', () => {
    render(<RewardCardTile card={{ ...mockCard, taskDuration: 'long' }} />);
    expect(screen.getByText('Long Task')).toBeInTheDocument();
  });

  test('没有特殊奖励时不应显示特殊奖励部分', () => {
    const cardWithoutSpecialBonus = {
      ...mockCard,
      bonus: {
        experienceMultiplier: 2,
        goldMultiplier: 1.5
      }
    };
    
    render(<RewardCardTile card={cardWithoutSpecialBonus} />);
    expect(screen.queryByText('特殊奖励')).not.toBeInTheDocument();
  });
}); 