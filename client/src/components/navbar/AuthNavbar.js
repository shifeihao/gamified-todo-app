import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const AuthNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-[#1f005c] via-[#5b1fa6] to-[#8e2de2] bg-opacity-90 backdrop-blur text-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src="/logo_mini.png" alt="TaskMasters" className="h-8 w-auto mr-2" />
              <span className="text-xl font-bold">TaskMasters</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/login" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
              Login
            </Link>
            <Link to="/register" className="px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold">
              Register
            </Link>
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
              Login
            </Link>
            <Link to="/register" className="block px-3 py-2 rounded-md hover:bg-[#a546f5] font-semibold" onClick={toggleMenu}>
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AuthNavbar; 