import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCard } from './TaskCard';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';

// 模拟 axios
jest.mock('axios');

// 模拟 toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockTask = {
  _id: '123',
  title: '测试任务',
  description: '这是一个测试任务',
  status: 'pending',
  category: 'study',
  dueDate: '2024-12-31',
  subTasks: [
    { id: '1', title: '子任务1', status: 'pending' },
    { id: '2', title: '子任务2', status: 'completed' }
  ]
};

const mockUser = {
  token: 'test-token'
};

const defaultProps = {
  task: mockTask,
  onComplete: jest.fn(),
  onDelete: jest.fn(),
  onEdit: jest.fn(),
  onEquip: jest.fn(),
  onUnequip: jest.fn(),
  onDragStart: jest.fn(),
  draggable: false,
  isEquipped: false
};

const renderTaskCard = (props = {}) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <TaskCard {...defaultProps} {...props} />
    </AuthContext.Provider>
  );
};

describe('TaskCard 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染基本任务信息', () => {
    renderTaskCard();
    
    expect(screen.getByText('测试任务')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  test('应当正确渲染子任务列表', () => {
    renderTaskCard();
    
    const subtasks = screen.getAllByText(/子任务/);
    expect(subtasks).toHaveLength(2);
    expect(subtasks[0]).toHaveTextContent('子任务1');
    expect(subtasks[1]).toHaveTextContent('子任务2');
  });

  test('过期任务应显示过期状态', () => {
    renderTaskCard({
      isEquipped: true,
      task: { ...mockTask, expired: true }
    });
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('装备中的任务应显示剩余时间', () => {
    renderTaskCard({
      isEquipped: true
    });
    
    const timeElement = screen.getByTestId('time-left');
    expect(timeElement).toBeInTheDocument();
  });

  test('点击删除按钮应调用onDelete', () => {
    renderTaskCard({
      isEquipped: true,
      task: { ...mockTask, expired: true }
    });
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('123');
  });

  test('完成子任务应发送请求并更新状态', async () => {
    axios.put.mockResolvedValueOnce({
      data: {
        subTaskReward: {
          expGained: 10,
          goldGained: 5
        },
        task: { ...mockTask }
      }
    });

    renderTaskCard();
    
    const subtaskIcon = screen.getAllByTestId('subtask-icon')[0];
    fireEvent.click(subtaskIcon);
    
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/tasks/123',
        { subTaskIndex: 0 },
        expect.any(Object)
      );
    });
  });

  test('任务可拖拽时应设置draggable属性', () => {
    renderTaskCard({
      draggable: true
    });
    
    const taskCard = screen.getByText('测试任务').closest('div[draggable]');
    expect(taskCard).toHaveAttribute('draggable', 'true');
  });

  test('点击任务应打开详情模态框', () => {
    renderTaskCard();
    
    const infoButton = screen.getByTitle('View Details');
    fireEvent.click(infoButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}); 