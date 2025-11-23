import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#f2efeb] shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/*elements loaded regardless of auth state*/}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 inline-flex items-center h-16 overflow-hidden">
              <img src="/logo-readar.png" alt="Readar" className="h-12 w-auto object-contain block" />
              <span className="sr-only">Readar</span>
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/search" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                buy/borrow
              </Link>
              {/* 
              will add donation feature later
              <Link to="/charity" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                donate
              </Link> */}
                <Link to="/sell" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  sell/lend
                </Link>
            </div>
          </div>
          {/*elements loaded based on auth state*/}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/my-stock" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  my stock
                </Link>
                <Link to="/my-readar" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  my readar
                </Link>
                <Link to="/seller-dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  sales
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
