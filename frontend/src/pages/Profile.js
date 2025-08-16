import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">profile</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">name</label>
            <p className="mt-1 text-sm text-gray-900">{user?.first_name} {user?.last_name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">username</label>
            <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">user type</label>
            <p className="mt-1 text-sm text-gray-900">{user?.user_type}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">account status</label>
            <div className="mt-1 flex space-x-2">
              <span className={`px-2 py-1 rounded text-xs ${
                user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user?.is_active ? 'active' : 'inactive'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                user?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user?.is_verified ? 'verified' : 'unverified'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            edit profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
