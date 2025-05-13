import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegisterForm } from './RegisterForm';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

// 模拟 useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// 模拟注册函数
const mockRegister = jest.fn();

const renderRegisterForm = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ register: mockRegister }}>
        <RegisterForm {...props} />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('RegisterForm 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应当正确渲染注册表单', () => {
    renderRegisterForm();
    
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  test('应当允许输入所有字段', () => {
    renderRegisterForm();
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Mail/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  test('密码不匹配应显示错误信息', async () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

    const submitButton = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('有效表单提交应调用注册函数', async () => {
    renderRegisterForm();
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Mail/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    mockRegister.mockResolvedValueOnce({ success: true });

    const submitButton = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('注册失败应显示错误信息', async () => {
    renderRegisterForm();
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Mail/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const errorMessage = 'Email already exists';
    mockRegister.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    const submitButton = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  test('加载状态应禁用注册按钮', async () => {
    renderRegisterForm();
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Mail/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    mockRegister.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 100);
    }));

    const submitButton = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Loading.../i)).toBeInTheDocument();
  });
});
