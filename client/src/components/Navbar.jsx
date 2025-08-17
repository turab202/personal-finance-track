// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-400">
            FinTrack Pro
          </span>
        </div>

        {/* Hamburger menu for mobile */}
        <button 
          className="md:hidden p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="hover:text-yellow-300 transition duration-200 font-medium"
              >
                Dashboard
              </Link>
              <Link 
                to="/add-transaction" 
                className="hover:text-yellow-300 transition duration-200 font-medium"
              >
                Add Transaction
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-medium transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hover:text-yellow-300 transition duration-200 font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md font-medium transition duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700 px-4 pb-4">
          <div className="flex flex-col space-y-3">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  onClick={closeMenu}
                  className="block py-2 hover:bg-blue-600 px-3 rounded-md transition duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/add-transaction" 
                  onClick={closeMenu}
                  className="block py-2 hover:bg-blue-600 px-3 rounded-md transition duration-200"
                >
                  Add Transaction
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left py-2 hover:bg-blue-600 px-3 rounded-md transition duration-200 bg-red-500 hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={closeMenu}
                  className="block py-2 hover:bg-blue-600 px-3 rounded-md transition duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={closeMenu}
                  className="block py-2 bg-white text-blue-600 hover:bg-gray-100 px-3 rounded-md text-center transition duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}