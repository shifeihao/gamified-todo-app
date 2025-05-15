import React, { useState, useContext, useEffect } from 'react';
import { Navbar } from '../components/navbar';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchUserStat } from '../services/userStat';
import { getEquippedTasks, getTaskHistory } from '../services/taskService';

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
    currentTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });

  // When user data is loaded, fill the form
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

  // Fetch real user statistics
  useEffect(() => {
    if (user && user.token) {
      Promise.all([
        getEquippedTasks(user.token),
        getTaskHistory(user.token)
      ]).then(([equipped, history]) => {
        const completed = history.filter(t => t.status === 'completed' || t.status === 'Completed');
        setStats({
          currentTasks: equipped.length,
          completedTasks: completed.length,
          completionRate: history.length ? Math.round((completed.length / history.length) * 100) : 0,
        });
      }).catch(() => {
        setStats({ currentTasks: 0, completedTasks: 0, completionRate: 0 });
      });
    }
  }, [user]);

  // Handling input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handling form submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    // Verify Password
    if (formData.password && formData.password !== formData.confirmPassword) {
      showError('The passwords you entered twice do not match');
      return;
    }

    try {
      // Prepare to update data
      const updateData = {
        username: formData.username,
        email: formData.email,
      };

      // Include the password only if the password field has a value
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Calling the Update Profile API
      await updateProfile(updateData);
      
      // Clear the password field
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
          {/* Personal data form */}
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
                    className="px-6 py-2 rounded bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Information Card */}
          <div className="lg:col-span-1">
            <div className="card bg-gradient-to-r from-purple-500 to-purple-700 text-white mb-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white text-purple-600 flex items-center justify-center text-3xl font-bold mb-4">
                  {user && user.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
                <h2 className="text-xl font-bold mb-1">{user && user.username}</h2>
                <p className="text-purple-100 mb-4">{user && user.email}</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user && user.experience}</div>
                    <div className="text-sm text-purple-100">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user && user.gold}</div>
                    <div className="text-sm text-purple-100">Coins</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Task Statistics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Current Tasks</span>
                    <span className="text-sm font-medium text-gray-700">{stats.currentTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700"
                      style={{ width: `${stats.completedTasks > 0 ? Math.min((stats.currentTasks / stats.completedTasks) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Completed Tasks</span>
                    <span className="text-sm font-medium text-gray-700">{stats.completedTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-600"
                      style={{ width: '100%' }}
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
                      className="h-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-500"
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
