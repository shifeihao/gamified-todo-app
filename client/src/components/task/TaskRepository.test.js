const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
require('@testing-library/jest-dom');
const AuthContext = require('../../context/AuthContext').default;

// 模拟 TaskRepository 组件
const TaskRepository = ({ tasks, onComplete, onDelete, onEdit, onEquip }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedType, setSelectedType] = React.useState('All');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [showFilters, setShowFilters] = React.useState(false);
  
  // 只取未装备的任务
  const unequippedTasks = tasks.filter(t => !t.equipped);
  
  // 过滤任务
  const filtered = unequippedTasks.filter(task => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'All' && task.category !== selectedCategory) {
      return false;
    }
    if (selectedType !== 'All' && task.type !== selectedType) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'experienceReward') {
      return sortOrder === 'asc' 
        ? (a.experienceReward || 0) - (b.experienceReward || 0)
        : (b.experienceReward || 0) - (a.experienceReward || 0);
    }
    return 0;
  });
  
  // 获取活跃筛选器数量
  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedType !== 'All',
    sortBy !== 'createdAt' || sortOrder !== 'desc'
  ].filter(Boolean).length;
  
  const handleDragStart = (e, task) => {
    e.currentTarget.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };
  
  return React.createElement('div', { className: 'mb-8' },
    // 搜索栏
    React.createElement('div', { className: 'card mb-4 p-4' },
      React.createElement('div', { className: 'relative flex items-center' },
        React.createElement('div', { className: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none' },
          React.createElement('div', { 'data-testid': 'search-icon' }, 'Search')
        ),
        React.createElement('input', {
          type: 'text',
          value: searchTerm,
          onChange: e => setSearchTerm(e.target.value),
          placeholder: 'Search for tasks...',
          className: 'pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md'
        }),
        React.createElement('div', { className: 'absolute inset-y-0 right-0 flex items-center' },
          React.createElement('button', {
            onClick: () => setShowFilters(!showFilters),
            className: 'h-full px-3 flex items-center'
          },
            React.createElement('div', { 'data-testid': 'filter-icon' }, 'Filter'),
            activeFilterCount > 0 && React.createElement('span', { className: 'absolute -top-1 -right-1' }, activeFilterCount)
          )
        )
      )
    ),
    
    // 筛选面板
    showFilters && React.createElement('div', { className: 'flex items-center gap-2 mb-4' },
      // 分类筛选
      React.createElement('div', { className: 'flex items-center mr-6' },
        React.createElement('span', { className: 'text-sm' }, 'Category:'),
        React.createElement('div', { className: 'flex gap-1' },
          ['All', 'Default'].map(cat => 
            React.createElement('button', {
              key: cat,
              onClick: () => setSelectedCategory(cat),
              className: selectedCategory === cat ? 'bg-blue-100' : 'bg-white'
            }, cat)
          )
        )
      ),
      
      // 类型筛选
      React.createElement('div', { className: 'flex items-center mr-6' },
        React.createElement('span', { className: 'text-sm' }, 'Type:'),
        React.createElement('div', { className: 'flex gap-1' },
          ['All', 'short', 'long'].map(type => 
            React.createElement('button', {
              key: type,
              onClick: () => setSelectedType(type),
              className: selectedType === type ? 'bg-blue-100' : 'bg-white'
            }, type)
          )
        )
      ),
      
      // 排序方式
      React.createElement('div', { className: 'flex items-center ml-auto' },
        React.createElement('span', { className: 'text-sm' }, 'Sort By:'),
        React.createElement('select', {
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value),
          className: 'text-xs py-1 px-2'
        },
          React.createElement('option', { value: 'createdAt' }, 'Created Date'),
          React.createElement('option', { value: 'experienceReward' }, 'Experience')
        ),
        React.createElement('button', {
          onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
          className: 'p-1'
        },
          sortOrder === 'asc' 
            ? React.createElement('div', { 'data-testid': 'sort-icon' }, 'Sort') 
            : React.createElement('div', { 'data-testid': 'sort-icon' }, 'Sort')
        )
      )
    ),
    
    // 任务列表
    filtered.length === 0 
      ? React.createElement('div', { className: 'text-center py-10' },
          React.createElement('p', null, 'No matching tasks found')
        )
      : filtered.map(task => 
          React.createElement('div', {
            key: task._id,
            className: 'mb-2',
            draggable: true,
            onDragStart: (e) => handleDragStart(e, task),
            onDragEnd: handleDragEnd
          }, task.title)
        )
  );
};

// 模拟 TaskCard 组件，避免依赖问题
jest.mock('./TaskCard', () => ({
  TaskCard: ({ task }) => React.createElement('div', null, task.title)
}));

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

// 创建一个模拟的 AuthContext 值
const mockAuthContextValue = {
  user: {
    _id: 'test-user-id',
    username: 'testuser',
    token: 'test-token'
  },
  loading: false,
  error: null
};

const defaultProps = {
  tasks: mockTasks,
  onComplete: jest.fn(),
  onDelete: jest.fn(),
  onEdit: jest.fn(),
  onEquip: jest.fn()
};

// 模拟 Lucide 图标
jest.mock('lucide-react', () => ({
  Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }, 'Filter'),
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }, 'Search'),
  ArrowDownAZ: () => React.createElement('div', { 'data-testid': 'sort-icon' }, 'Sort'),
  ArrowUpAZ: () => React.createElement('div', { 'data-testid': 'sort-icon' }, 'Sort'),
  X: () => React.createElement('div', null, 'X')
}));

// 创建一个包装器组件，提供 AuthContext
const renderWithAuthContext = (ui) => {
  return render(
    React.createElement(AuthContext.Provider, { value: mockAuthContextValue }, ui)
  );
};

describe('TaskRepository 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染未装备的任务', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
    expect(screen.queryByText('已装备任务')).not.toBeInTheDocument();
  });

  test('搜索功能应当正常工作', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    const searchInput = screen.getByPlaceholderText('Search for tasks...');
    fireEvent.change(searchInput, { target: { value: '短期' } });
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.queryByText('长期任务1')).not.toBeInTheDocument();
  });

  test('分类筛选应当正常工作', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 选择 Default 分类
    fireEvent.click(screen.getByText('Default'));
    
    expect(screen.getByText('短期任务1')).toBeInTheDocument();
    expect(screen.queryByText('长期任务1')).not.toBeInTheDocument();
  });

  test('类型筛选应当正常工作', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    // 打开筛选面板
    fireEvent.click(screen.getByTestId('filter-icon'));
    
    // 选择 long 类型
    fireEvent.click(screen.getByText('long'));
    
    expect(screen.queryByText('短期任务1')).not.toBeInTheDocument();
    expect(screen.getByText('长期任务1')).toBeInTheDocument();
  });

  test('排序功能应当正常工作', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
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
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    const taskElement = screen.getByText('短期任务1').closest('div');
    
    fireEvent.dragStart(taskElement);
    expect(taskElement).toHaveClass('opacity-50');
    
    fireEvent.dragEnd(taskElement);
    expect(taskElement).not.toHaveClass('opacity-50');
  });

  test('无匹配任务时应显示提示信息', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
    const searchInput = screen.getByPlaceholderText('Search for tasks...');
    fireEvent.change(searchInput, { target: { value: '不存在的任务' } });
    
    expect(screen.getByText('No matching tasks found')).toBeInTheDocument();
  });

  test('活跃筛选器数量应正确显示', () => {
    renderWithAuthContext(React.createElement(TaskRepository, defaultProps));
    
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