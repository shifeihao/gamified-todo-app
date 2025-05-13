import React, { useState, useContext, useEffect } from 'react';
import { Navbar } from '../components/navbar';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProfilePage = () => {
  const { user, updateProfile, loading, error } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({
    taskCount: 0,
    completedTasks: 0,
    completionRate: 0,
  });

  // 当用户数据加载时，填充表单
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  // 模拟获取用户统计数据
  useEffect(() => {
    // 在实际应用中，这里应该从API获取数据
    // 这里使用模拟数据
    if (user) {
      setStats({
        taskCount: 24,
        completedTasks: 18,
        completionRate: 75,
      });
    }
  }, [user]);

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    // 验证密码
    if (formData.password && formData.password !== formData.confirmPassword) {
      showError('The passwords you entered twice do not match');
      return;
    }

    try {
      // 准备更新数据
      const updateData = {
        username: formData.username,
        email: formData.email,
      };

      // 只有当密码字段有值时才包含密码
      if (formData.password) {
        updateData.password = formData.password;
      }

      // 调用更新个人资料API
      await updateProfile(updateData);
      
      // 清空密码字段
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
      
      setSuccess(true);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      const errorMessage = 'Update profile failed';
      setFormError(errorMessage);
      showError(errorMessage);
      console.error(err);
    }
  };

  return (
    <div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Personal Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 个人资料表单 */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {formError}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (leave blank to keep unchanged)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 用户信息卡片 */}
          <div className="lg:col-span-1">
            <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white mb-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white text-primary-600 flex items-center justify-center text-3xl font-bold mb-4">
                  {user && user.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
                <h2 className="text-xl font-bold mb-1">{user && user.username}</h2>
                <p className="text-primary-100 mb-4">{user && user.email}</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user && user.experience}</div>
                    <div className="text-sm text-primary-100">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user && user.gold}</div>
                    <div className="text-sm text-primary-100">Coins</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Task Statistics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Total number of tasks</span>
                    <span className="text-sm font-medium text-gray-700">{stats.taskCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Completed tasks</span>
                    <span className="text-sm font-medium text-gray-700">{stats.completedTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(stats.completedTasks / stats.taskCount) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-700">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
