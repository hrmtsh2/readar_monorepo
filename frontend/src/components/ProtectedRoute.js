import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// wraps over any protected component; redirects to login if needed
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
