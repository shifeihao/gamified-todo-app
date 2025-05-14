const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { TaskForm } = require('./TaskForm');

// 模拟提交和取消函数
const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();
const mockOnChange = jest.fn();

const renderTaskForm = (props = {}) => {
  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    onChange: mockOnChange,
    loading: false,
    initialData: null,
    taskType: 'short',
    defaultDueDateTime: '',
    disableSubmit: false
  };

  return render(<TaskForm {...defaultProps} {...props} />);
};

describe('TaskForm 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染表单组件', () => {
    renderTaskForm();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
  });

  test('应当允许输入表单数据', () => {
    renderTaskForm();
    
    // 输入标题
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: '测试任务' } });
    expect(titleInput.value).toBe('测试任务');
    
    // 输入描述
    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, { target: { value: '这是一个测试任务描述' } });
    expect(descriptionInput.value).toBe('这是一个测试任务描述');
  });

  test('提交前应验证表单', async () => {
    renderTaskForm();
    
    // 不输入任何值直接提交
    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitButton);
    
    // 应当显示错误信息
    expect(await screen.findByText(/Task title cannot be empty/i)).toBeInTheDocument();
    
    // 验证onSubmit没有被调用
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('填写有效数据后应当成功提交表单', async () => {
    renderTaskForm();
    
    // 填写表单
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: '测试任务' } });
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitButton);
    
    // 验证onSubmit被调用，并且参数正确
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('测试任务');
      expect(submittedData.status).toBe('pending');
    });
  });

  test('长期任务应当允许添加子任务', async () => {
    renderTaskForm({ taskType: 'long' });
    
    // 检查是否显示添加步骤按钮
    const addStepButton = screen.getByRole('button', { name: /Add Step/i });
    expect(addStepButton).toBeInTheDocument();
    
    // 点击添加子任务
    fireEvent.click(addStepButton);
    
    // 验证子任务输入框出现
    const stepInput = screen.getByPlaceholderText(/Step 1/i);
    expect(stepInput).toBeInTheDocument();
    
    // 填写子任务
    fireEvent.change(stepInput, { target: { value: '子任务1' } });
    expect(stepInput.value).toBe('子任务1');
  });

  test('应当正确加载初始数据', () => {
    const initialData = {
      title: '初始任务',
      description: '初始描述',
      status: 'pending',
      dueDate: '2023-12-31',
      subTasks: [
        { id: '1', title: '初始子任务', dueDate: '2023-12-30' }
      ]
    };
    
    renderTaskForm({ 
      initialData,
      taskType: 'long'
    });
    
    // 验证初始数据正确加载
    expect(screen.getByLabelText(/Title/i).value).toBe('初始任务');
    expect(screen.getByLabelText(/Description/i).value).toBe('初始描述');
    
    // 验证子任务加载
    const subTaskInput = screen.getByDisplayValue('初始子任务');
    expect(subTaskInput).toBeInTheDocument();
    
    // 验证提交按钮文本是"Save Changes"
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });
  
  test('点击取消按钮应调用onCancel', () => {
    renderTaskForm();
    
    const cancelButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  test('加载状态应禁用提交按钮', () => {
    renderTaskForm({ loading: true });
    
    const submitButton = screen.getByRole('button', { name: /Processing/i });
    expect(submitButton).toBeDisabled();
  });
});
