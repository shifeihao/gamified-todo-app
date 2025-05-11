import React, { useContext, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from  '../../context/AuthContext';
import UserLevelBar from '../base/UserLevelBar';
import axios from 'axios';

// Create custom event for task completion notification
export const TASK_COMPLETED_EVENT = 'taskCompleted';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fetch level info
  const fetchLevelInfo = async () => {
    try {
      // Get level info and user profile
      const [levelRes, profileRes] = await Promise.all([
        axios.get("/api/levels/userLevelBar", {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${user.token}` },
        })
      ]);

      // Merge level and gold info
      setLevelInfo({
        ...levelRes.data,
        gold: profileRes.data.gold
      });
    } catch (err) {
      console.error("Failed to fetch level info:", err);
    }
  };

  // Listen for task completion event
  useEffect(() => {
    const handleTaskCompleted = () => {
      if (user?.token) {
        fetchLevelInfo();
      }
    };

    // Add event listener
    window.addEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted);

    // Initial fetch of level info
    if (user?.token) {
      fetchLevelInfo();
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted);
    };
  }, [user]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get profile menu position for the portal
  const getProfileMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, right: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      right: window.innerWidth - rect.right - window.scrollX
    };
  };

  // Profile menu content
  const ProfileMenu = () => {
    const { top, right } = getProfileMenuPosition();
    
    return ReactDOM.createPortal(
      <div 
        ref={profileMenuRef}
        className="fixed bg-white rounded-md shadow-xl py-1 w-64 z-[9999]"
        style={{ top: `${top}px`, right: `${right}px` }}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#a546f5] text-white flex items-center justify-center text-lg font-semibold">
              {user.username ? user.username.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
              <div className="text-xs text-gray-500 truncate" style={{ maxWidth: '180px' }}>
                {user.email}
              </div>
            </div>
          </div>
        </div>
        <div className="py-1">
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            Personal Profile
          </Link>
          <Link
            to="/achievements"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            Personal Achievements
          </Link>
          <button
            onClick={() => {
              handleLogout();
              setIsProfileMenuOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
      <nav className="bg-gradient-to-r from-[#1f005c] via-[#5b1fa6] to-[#8e2de2] bg-opacity-90 backdrop-blur text-white shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold">TaskMaster</span>
              </Link>
            </div>

            {user && (
                <div className="hidden md:block flex-1 px-8 max-w-lg">
                  <UserLevelBar data={levelInfo} />
                </div>
            )}

            <div className="hidden md:flex md:items-center md:space-x-4">
              {user ? (
                  <>
                    <Link to="/dashboard" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
                      Dashboard
                    </Link>
                    <Link to="/tasks" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
                      Tasks
                    </Link>

                    <div className="relative">
                      <button
                          ref={buttonRef}
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          className="flex items-center space-x-2 focus:outline-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#a546f5] text-white flex items-center justify-center text-sm font-semibold">
                          {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                        </div>
                      </button>

                      {isProfileMenuOpen && <ProfileMenu />}
                    </div>
                  </>
              ) : (
                  <>
                    <Link to="/login" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
                      Login
                    </Link>
                    <Link to="/register" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
                      Register
                    </Link>
                  </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#a546f5] focus:outline-none"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
            <div className="md:hidden">
              {user && (
                  <div className="px-4 py-2">
                    <UserLevelBar data={levelInfo} />
                  </div>
              )}
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {user ? (
                    <>
                      <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Dashboard
                      </Link>
                      <Link to="/tasks" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Tasks
                      </Link>
                      <Link to="/profile" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Profile
                      </Link>
                      <Link to="/achievements" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Achievements
                      </Link>
                      <button
                          onClick={() => {
                            handleLogout();
                            toggleMenu();
                          }}
                          className="block w-full text-left px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold"
                      >
                        Logout
                      </button>
                    </>
                ) : (
                    <>
                      <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Login
                      </Link>
                      <Link to="/register" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
                        Register
                      </Link>
                    </>
                )}
              </div>
            </div>
        )}
      </nav>
  );
};

export default Navbar;
