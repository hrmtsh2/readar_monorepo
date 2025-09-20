import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/*elements loaded regardless of auth state*/}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">readar</h1>
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
                sell
              </Link>
              <Link to="/lend" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                buy
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
                <Link to="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  profile
                </Link>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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
