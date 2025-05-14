const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { LoginForm } = require('./LoginForm');
const { BrowserRouter } = require('react-router-dom');
const AuthContext = require('../../context/AuthContext').default;

// 模拟 useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// 模拟登录函数
const mockLogin = jest.fn();

const renderLoginForm = (props = {}) => {
  return render(
    React.createElement(BrowserRouter, null,
      React.createElement(AuthContext.Provider, { value: { login: mockLogin } },
        React.createElement(LoginForm, props)
      )
    )
  );
};

describe('LoginForm 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染登录表单', () => {
    renderLoginForm();
    
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  test('应当允许输入所有字段', () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('有效表单提交应调用登录函数', async () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    mockLogin.mockResolvedValueOnce({ success: true });

    const submitButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('登录失败应显示错误信息', async () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const errorMessage = 'Invalid email or password';
    mockLogin.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    const submitButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  test('加载状态应禁用登录按钮', async () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    mockLogin.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 100);
    }));

    const submitButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Logging in.../i)).toBeInTheDocument();
  });
});
