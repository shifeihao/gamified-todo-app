import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import AuthContext from '../context/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 简单的表单验证
    if (!email || !password) {
      showError('All fields are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // 调用登录函数
      await login(email, password);
      
      // 登录成功后显示提示并跳转
      showSuccess('Login successful！');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Login failed, please check your credentials';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      
      <div className="max-w-md mx-auto mt-10 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Login
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-2"
              >
                Mail
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Please enter your email"
                required
              />
            </div>
            
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Please enter your password"
                required
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Login'}
              </button>
            </div>
            
            <div className="text-center text-gray-600">
              No Account yet？{' '}
              <Link to="/register" className="text-primary-600 hover:underline">
                Register
              </Link>
            </div>
          </form>
        </div>

        {/* 演示账号信息 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Demo Account</h3>
          <p className="text-blue-700 mb-1">Mail: demo@example.com</p>
          <p className="text-blue-700">Password: password123</p>
          <p className="text-sm text-blue-600 mt-2">
            Note: This is just a demo account and will not be displayed in the actual application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
