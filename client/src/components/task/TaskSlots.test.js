import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskSlots } from './TaskSlots';
import AuthContext from '../../context/AuthContext';

// 模拟任务数据
const mockTasks = [
  {
    _id: '1',
    title: '任务1',
    description: '描述1',
    status: 'pending',
    slotPosition: 0
  },
  {
    _id: '2',
    title: '任务2',
    description: '描述2',
    status: 'in-progress',
    slotPosition: 1
  }
];

const mockUser = {
  token: 'test-token'
};

const defaultProps = {
  items: mockTasks,
  totalSlots: 5,
  activeCount: 3,
  onCreate: jest.fn(),
  onDrop: jest.fn(),
  onComplete: jest.fn(),
  onDelete: jest.fn(),
  onEdit: jest.fn(),
  onUnequip: jest.fn()
};

const renderTaskSlots = (props = {}) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <TaskSlots {...defaultProps} {...props} />
    </AuthContext.Provider>
  );
};

describe('TaskSlots 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染所有槽位', () => {
    renderTaskSlots();
    
    // 验证已填充的槽位
    expect(screen.getByText('任务1')).toBeInTheDocument();
    expect(screen.getByText('任务2')).toBeInTheDocument();
    
    // 验证空槽位
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    
    // 验证锁定的槽位
    const lockedSlots = screen.getAllByText('Slot Locked');
    expect(lockedSlots).toHaveLength(2); // 总共5个槽位，3个激活，2个锁定
  });

  test('点击空槽位应调用onCreate', () => {
    renderTaskSlots();
    
    const createButton = screen.getByText('Create New Task').closest('button');
    fireEvent.click(createButton);
    
    expect(defaultProps.onCreate).toHaveBeenCalledWith(2); // 第三个槽位的索引
  });

  test('应当显示槽位编号', () => {
    renderTaskSlots();
    
    const slotNumbers = screen.getAllByText(/[1-3]/);
    expect(slotNumbers).toHaveLength(3); // 3个激活的槽位都应显示编号
  });

  test('锁定的槽位应显示等级要求', () => {
    renderTaskSlots();
    
    const levelTexts = screen.getAllByText(/Reach level \d+ to unlock/);
    expect(levelTexts).toHaveLength(2);
    expect(screen.getByText('Reach level 4 to unlock')).toBeInTheDocument();
    expect(screen.getByText('Reach level 5 to unlock')).toBeInTheDocument();
  });

  test('拖放任务到空槽位应调用onDrop', () => {
    renderTaskSlots();
    
    const dropZone = screen.getByText('Create New Task').closest('div');
    
    // 模拟拖放事件
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: {
        getData: () => JSON.stringify({ _id: '3', status: 'pending' })
      }
    });
    
    expect(defaultProps.onDrop).toHaveBeenCalledWith('3', 2);
  });

  test('不应接受已完成任务的拖放', () => {
    renderTaskSlots();
    
    const dropZone = screen.getByText('Create New Task').closest('div');
    
    // 模拟拖放已完成的任务
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: {
        getData: () => JSON.stringify({ _id: '3', status: 'completed' })
      }
    });
    
    expect(defaultProps.onDrop).not.toHaveBeenCalled();
  });

  test('应支持不同的主题颜色', () => {
    renderTaskSlots({ themeColor: 'blue' });
    
    const createButton = screen.getByText('Create New Task').closest('button');
    expect(createButton).toHaveClass('text-blue-500');
  });

  test('应支持自定义槽位高度', () => {
    renderTaskSlots({ slotHeight: 'min-h-40' });
    
    const slot = screen.getByText('Create New Task').closest('div');
    expect(slot).toHaveClass('min-h-40');
  });
}); 