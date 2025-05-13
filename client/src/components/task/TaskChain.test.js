import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskChain } from './TaskChain';
import AuthContext from '../../context/AuthContext';

// 模拟任务数据
const mockTasks = [
  {
    _id: '1',
    title: '长期任务1',
    description: '描述1',
    status: 'pending',
    type: 'long'
  },
  {
    _id: '2',
    title: '长期任务2',
    description: '描述2',
    status: 'in-progress',
    type: 'long'
  }
];

const mockUser = {
  token: 'test-token'
};

const defaultProps = {
  tasks: mockTasks,
  onComplete: jest.fn(),
  onDelete: jest.fn(),
  onEdit: jest.fn(),
  onCreateTask: jest.fn(),
  onDrop: jest.fn()
};

const renderTaskChain = (props = {}) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <TaskChain {...defaultProps} {...props} />
    </AuthContext.Provider>
  );
};

describe('TaskChain 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染任务链', () => {
    renderTaskChain();
    
    // 验证长期任务渲染
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
    expect(screen.getByText('长期任务2')).toBeInTheDocument();
  });

  test('应当显示创建任务按钮', () => {
    renderTaskChain({
      tasks: [mockTasks[0]] // 只传入一个任务，第二个槽位应显示创建按钮
    });
    
    expect(screen.getByText('Create Quest Chain')).toBeInTheDocument();
  });

  test('应当显示锁定的槽位', () => {
    renderTaskChain();
    
    // 验证锁定的槽位
    const lockedSlots = screen.getAllByText(/Chain Slot Locked/i);
    expect(lockedSlots).toHaveLength(3); // 总共5个槽位，2个激活，3个锁定
  });

  test('点击创建按钮应调用onCreateTask', () => {
    renderTaskChain({
      tasks: [mockTasks[0]]
    });
    
    const createButton = screen.getByText('Create Quest Chain');
    fireEvent.click(createButton);
    
    expect(defaultProps.onCreateTask).toHaveBeenCalledWith(1); // 第二个槽位的索引
  });

  test('拖放任务到空槽位应调用onDrop', () => {
    renderTaskChain({
      tasks: [mockTasks[0]]
    });
    
    const dropZone = screen.getByText('Create Quest Chain').closest('div');
    
    // 模拟拖放事件
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: {
        getData: () => JSON.stringify({ _id: '3', type: 'long' })
      }
    });
    
    expect(defaultProps.onDrop).toHaveBeenCalledWith('3', 1);
  });

  test('应当显示任务连接线', () => {
    renderTaskChain();
    
    // 验证箭头图标存在
    const arrows = document.querySelectorAll('.text-purple-400');
    expect(arrows.length).toBeGreaterThan(0);
  });

  test('应当显示槽位编号', () => {
    renderTaskChain();
    
    // 检查已填充槽位的编号
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('锁定的槽位应显示等级要求', () => {
    renderTaskChain();
    
    expect(screen.getByText('Reach level 4 to unlock')).toBeInTheDocument();
    expect(screen.getByText('Reach level 5 to unlock')).toBeInTheDocument();
    expect(screen.getByText('Reach level 6 to unlock')).toBeInTheDocument();
  });

  test('应当正确过滤非长期任务', () => {
    const mixedTasks = [
      ...mockTasks,
      {
        _id: '3',
        title: '短期任务',
        type: 'short'
      }
    ];
    
    renderTaskChain({
      tasks: mixedTasks
    });
    
    // 只应该渲染长期任务
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
    expect(screen.getByText('长期任务2')).toBeInTheDocument();
    expect(screen.queryByText('短期任务')).not.toBeInTheDocument();
  });
}); 