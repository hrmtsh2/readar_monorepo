import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    // reset form data to current user data
    setProfileData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zip_code: user?.zip_code || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // reset form data to original user data
    setProfileData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zip_code: user?.zip_code || '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // filter out empty strings and only send changed fields
      const updateData = {};
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== '') {
          updateData[key] = profileData[key];
        }
      });

      const response = await api.put('/users/profile', updateData);
      
      // update the user context with new data
      if (setUser) {
        setUser(response.data);
      }
      
      setIsEditing(false);
      alert('profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('failed to update profile. please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">profile</h1>
          {!isEditing && (
            <button 
              onClick={handleEdit} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              edit profile
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {/* non-editable fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700">email</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">username</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.username}</p>
          </div>
          

          {/* editable fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">first name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user.first_name || 'not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">last name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user.last_name || 'not provided'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +1234567890"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{user.phone || 'not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">address</label>
            {isEditing ? (
              <textarea
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
                rows="2"
                placeholder="Street address"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{user.address || 'not provided'}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">city</label>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user.city || 'not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">state</label>
              {isEditing ? (
                <input
                  type="text"
                  name="state"
                  value={profileData.state}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user.state || 'not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              {isEditing ? (
                <input
                  type="text"
                  name="zip_code"
                  value={profileData.zip_code}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user.zip_code || 'not provided'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">account status</label>
            <div className="mt-1 flex space-x-2">
              <span className={`px-2 py-1 rounded text-xs ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user?.is_active ? 'active' : 'inactive'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user?.is_verified ? 'verified' : 'unverified'}
              </span>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="mt-6 flex space-x-3">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'saving...' : 'save changes'}
            </button>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              cancel
            </button>
          </div>
        )}

        {user.created_at && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              member since: {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
