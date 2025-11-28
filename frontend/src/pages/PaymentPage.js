import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const PaymentPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservationCreated, setReservationCreated] = useState(false);

  const bookData = location.state?.book;
  const paymentType = location.state?.payment_type || 'purchase';

  useEffect(() => {
    if (!bookData) {
      navigate('/search');
      return;
    }
    // Create reservation immediately for both purchase and rental
    if (!reservationCreated) {
      createReservation();
    }
  }, [bookData, reservationCreated, navigate]);

  const createReservation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        book_id: bookData.id,
        payment_type: paymentType
      };
      
      // rental_weeks will be determined by book's rental_duration on backend
      const response = await api.post('/payments/phonepe/initiate', payload);
      
      // PhonePe returns payment_url - redirect user directly
      if (response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        setError('Failed to initiate payment');
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create reservation');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Setting up payment...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/search')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Search
        </button>
      </div>
    );
  }

  // PhonePe redirects automatically, show loading state
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-8">
        <div className="text-lg text-gray-600 mb-4">Redirecting to PhonePe payment gateway...</div>
        <div className="text-sm text-gray-500">Please wait while we set up your payment</div>
      </div>
    </div>
  );
};

export default PaymentPage;