import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskRepository } from './TaskRepository';

// 模拟任务数据
const mockTasks = [
  {
    _id: '1',
    title: '短期任务1',
    type: 'short',
    category: 'Default',
    equipped: false,
    createdAt: '2024-05-01',
    experienceReward: 100
  },
  {
    _id: '2',
    title: '长期任务1',
    type: 'long',
    category: 'Study',
    equipped: false,
    createdAt: '2024-05-02',
    experienceReward: 200
  },
  {
    _id: '3',
    title: '已装备任务',
    type: 'short',
    category: 'Default',
    equipped: true,
    createdAt: '2024-05-03'
  }
];

const defaultProps = {
  tasks: mockTasks,
  onComplete: jest.fn(),
  onDelete: jest.fn(),
  onEdit: jest.fn(),
  onEquip: jest.fn()
};

// 模拟 Lucide 图标
jest.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  ArrowDownAZ: () => <div data-testid="sort-icon">Sort</div>,
  ArrowUpAZ: () => <div data-testid="sort-icon">Sort</div>,
  X: () => <div>X</div>
}));

describe('TaskRepository 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染未装备的任务', () => {
    render(<TaskRepository {...defaultProps} />);
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
    expect(screen.queryByText('已装备任务')).not.toBeInTheDocument();
  });

  test('搜索功能应当正常工作', () => {
    render(<TaskRepository {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tasks...');
    fireEvent.change(searchInput, { target: { value: '短期' } });
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.queryByText('长期任务1')).not.toBeInTheDocument();
  });

  test('分类筛选应当正常工作', () => {
    render(<TaskRepository {...defaultProps} />);
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 选择 Default 分类
    fireEvent.click(screen.getByText('Default'));
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.queryByText('长期任务1')).not.toBeInTheDocument();
  });

  test('类型筛选应当正常工作', () => {
    render(<TaskRepository {...defaultProps} />);
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 选择 long 类型
    fireEvent.click(screen.getByText('long'));
    
    expect(screen.queryByText('短期任务1')).not.toBeInTheDocument();
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
  });

  test('排序功能应当正常工作', () => {
    render(<TaskRepository {...defaultProps} />);
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 选择按经验值排序
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'experienceReward' } });
    
    // 获取任务列表
    const tasks = screen.getAllByText(/任务\d/);
    expect(tasks[0]).toHaveTextContent('长期任务1'); // 200经验值
    expect(tasks[1]).toHaveTextContent('短期任务1'); // 100经验值
  });

  test('拖拽功能应当正常工作', () => {
    render(<TaskRepository {...defaultProps} />);
    
    const taskElement = screen.getByText('短期任务1').closest('div');
    
    fireEvent.dragStart(taskElement);
    expect(taskElement).toHaveClass('opacity-50');
    
    fireEvent.dragEnd(taskElement);
    expect(taskElement).not.toHaveClass('opacity-50');
  });

  test('无匹配任务时应显示提示信息', () => {
    render(<TaskRepository {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tasks...');
    fireEvent.change(searchInput, { target: { value: '不存在的任务' } });
    
    expect(screen.getByText('No matching tasks found')).toBeInTheDocument();
  });

  test('活跃筛选器数量应正确显示', () => {
    render(<TaskRepository {...defaultProps} />);
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 应用两个筛选条件
    fireEvent.click(screen.getByText('Default')); // 分类
    fireEvent.click(screen.getByText('short')); // 类型
    
    // 验证筛选器数量标记
    const filterCount = screen.getByText('2');
    expect(filterCount).toBeInTheDocument();
  });
}); 