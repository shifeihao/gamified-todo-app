const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { TaskCalendar } = require('./TaskCalendar');

// 模拟任务数据
const mockTasks = [
  {
    _id: '1',
    title: '长期任务1',
    type: 'long',
    equipped: true,
    slotPosition: 0,
    subTasks: [
      {
        id: 'sub1',
        title: '子任务1',
        dueDate: '2024-05-15',
        status: 'pending'
      },
      {
        id: 'sub2',
        title: '子任务2',
        dueDate: '2024-05-20',
        status: 'completed'
      }
    ]
  }
];

// 模拟 FullCalendar 组件
jest.mock('@fullcalendar/react', () => {
  return function DummyCalendar({ events, dayCellDidMount }) {
    return React.createElement(
      'div',
      { 'data-testid': 'calendar' },
      React.createElement('div', null, 'Calendar Mock'),
      React.createElement('div', null, `Events: ${events.length}`)
    );
  };
});

describe('TaskCalendar 组件', () => {
  beforeEach(() => {
    // 清除所有模拟
    jest.clearAllMocks();
  });

  test('应当正确渲染日历组件', () => {
    render(React.createElement(TaskCalendar, { tasks: mockTasks }));
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  test('应当处理任务数据并创建日历事件', () => {
    render(React.createElement(TaskCalendar, { tasks: mockTasks }));
    expect(screen.getByText(/Events: 2/)).toBeInTheDocument(); // 两个子任务
  });

  test('空任务列表应当正确渲染', () => {
    render(React.createElement(TaskCalendar, { tasks: [] }));
    expect(screen.getByText(/Events: 0/)).toBeInTheDocument();
  });

  test('应当只处理已装备的长期任务', () => {
    const mixedTasks = [
      ...mockTasks,
      {
        _id: '2',
        title: '短期任务',
        type: 'short',
        equipped: true,
        subTasks: [
          {
            id: 'sub3',
            title: '子任务3',
            dueDate: '2024-05-25'
          }
        ]
      },
      {
        _id: '3',
        title: '未装备长期任务',
        type: 'long',
        equipped: false,
        subTasks: [
          {
            id: 'sub4',
            title: '子任务4',
            dueDate: '2024-05-30'
          }
        ]
      }
    ];

    render(React.createElement(TaskCalendar, { tasks: mixedTasks }));
    expect(screen.getByText(/Events: 2/)).toBeInTheDocument(); // 仍然只有原来的两个子任务
  });
}); 