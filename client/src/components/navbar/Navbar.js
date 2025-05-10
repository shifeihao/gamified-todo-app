import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from  '../../context/AuthContext';
import UserLevelBar from '../base/UserLevelBar';
import axios from 'axios';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // 获取等级信息
  const fetchLevelInfo = async () => {
    try {
      const res = await axios.get('/api/levels/userLevelBar', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // 检查数据是否有变化
      if (JSON.stringify(res.data) !== JSON.stringify(levelInfo)) {
        setLevelInfo(res.data);
        setLastUpdateTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to obtain level information:', err);
    }
  };

  useEffect(() => {
    if (user?.token) {
      // 立即获取一次等级信息
      fetchLevelInfo();
      
      // 设置定时器，每5秒更新一次
      const timer = setInterval(() => {
        // 如果距离上次更新超过3秒，则更新数据
        if (Date.now() - lastUpdateTime > 3000) {
          fetchLevelInfo();
        }
      }, 5000);
      
      // 清理函数
      return () => {
        clearInterval(timer);
      };
    }
  }, [user, lastUpdateTime]);

  // 处理登出
  const handleLogout = () => {
    setLevelInfo(null);
    setLastUpdateTime(0);
    logout();
    navigate("/login");
  };

  // 切换菜单
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 切换个人资料菜单
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
      <nav className="bg-primary-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 左侧导航 */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Task Master</span>
              </Link>
            </div>

            {/* 中间等级条 - 仅在桌面版显示 */}
            {user && levelInfo && (
                <div className="hidden md:flex items-center justify-center flex-1 px-4">
                  <div className="w-full max-w-sm">  {/* 將 max-w-md 改為 max-w-sm */}
                    <UserLevelBar data={levelInfo} isNavbar={true} />
                  </div>
                </div>
            )}

            {/* 右侧导航 */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {user ? (
                  <>
                    <Link
                        to="/dashboard"
                        className="px-3 py-2 rounded-md hover:bg-primary-700"
                    >
                      Dashboard
                    </Link>
                    <Link
                        to="/tasks"
                        className="px-3 py-2 rounded-md hover:bg-primary-700"
                    >
                      Task
                    </Link>
                    <Link to="/" className="px-3 py-2 rounded-md hover:bg-primary-700">
                      Logout
                    </Link>
                    {/* 个人资料头像和折叠菜单 */}
                    <div className="relative">
                      <button
                          onClick={toggleProfile}
                          className="flex items-center space-x-2 focus:outline-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-primary-600 flex items-center justify-center text-sm font-bold">
                          {user && user.username ? user.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <svg
                            className={`h-4 w-4 transform ${isProfileOpen ? 'rotate-180' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                          <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {/* 个人资料折叠菜单 */}
                      {isProfileOpen && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              <Link
                                  to="/profile"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={toggleProfile}
                              >
                                Personal Profile
                              </Link>
                              <Link
                                  to="/achievements"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={toggleProfile}
                              >
                                Personal achievements
                              </Link>
                            </div>
                          </div>
                      )}
                    </div>
                  </>
              ) : (
                  <>
                    <Link
                        to="/login"
                        className="px-3 py-2 rounded-md hover:bg-primary-700"
                    >
                      Login
                    </Link>
                    <Link
                        to="/register"
                        className="px-3 py-2 rounded-md hover:bg-primary-700"
                    >
                      Register
                    </Link>
                  </>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden flex items-center">
              <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md hover:bg-primary-700 focus:outline-none"
              >
                <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  {isMenuOpen ? (
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                      />
                  ) : (
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                      />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {user && levelInfo && (
                    <div className="px-3 py-2 border-b border-primary-700">
                      <UserLevelBar data={levelInfo} isNavbar={true} />
                    </div>
                )}

                <Link
                    to="/"
                    className="block px-3 py-2 rounded-md hover:bg-primary-700"
                    onClick={toggleMenu}
                >
                  首页
                </Link>

                {user ? (
                    <>
                      <Link
                          to="/dashboard"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        仪表盘
                      </Link>
                      <Link
                          to="/tasks"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        任务
                      </Link>
                      <Link
                          to="/profile"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        个人资料
                      </Link>
                      <Link
                          to="/achievements"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        个人成就
                      </Link>
                      <button
                          onClick={() => {
                            handleLogout();
                            toggleMenu();
                          }}
                          className="block w-full text-left px-3 py-2 rounded-md hover:bg-primary-700"
                      >
                        登出
                      </button>
                    </>
                ) : (
                    <>
                      <Link
                          to="/login"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        登录
                      </Link>
                      <Link
                          to="/register"
                          className="block px-3 py-2 rounded-md hover:bg-primary-700"
                          onClick={toggleMenu}
                      >
                        注册
                      </Link>
                    </>
                )}
              </div>
            </div>
        )}
      </nav>
  );
};