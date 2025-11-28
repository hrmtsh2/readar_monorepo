import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const PaymentPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservationCreated, setReservationCreated] = useState(false);
  const [rentalWeeks, setRentalWeeks] = useState(1);
  const [showRentalSelector, setShowRentalSelector] = useState(true);

  const bookData = location.state?.book;
  const paymentType = location.state?.payment_type || 'purchase';

  useEffect(() => {
    if (!bookData) {
      navigate('/search');
      return;
    }
    // For purchase, create reservation immediately
    // For rental, wait for user to select weeks
    if (paymentType === 'purchase' && !reservationCreated) {
      createReservation();
    }
  }, [bookData, reservationCreated, navigate, paymentType]);

  const createReservation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        book_id: bookData.id,
        payment_type: paymentType
      };
      
      // Add rental_weeks for rental payments
      if (paymentType === 'rental') {
        payload.rental_weeks = rentalWeeks;
      }
      
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

  const handleConfirmRental = () => {
    setShowRentalSelector(false);
    setReservationCreated(false);
    createReservation();
  };

  // Show rental weeks selector for rental payments
  if (paymentType === 'rental' && showRentalSelector && !loading) {
    const weeklyFee = parseFloat(bookData.weekly_fee || 0);
    const totalCost = weeklyFee * rentalWeeks;
    
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rent Book</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">{bookData.title}</h3>
          <p className="text-gray-600 text-sm mb-1">by {bookData.author}</p>
          <p className="text-blue-600 font-medium">₹{weeklyFee}/week</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-3">
            Select Rental Duration
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(weeks => (
              <button
                key={weeks}
                onClick={() => setRentalWeeks(weeks)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rentalWeeks === weeks
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="text-2xl font-bold">{weeks}</div>
                <div className="text-sm">{weeks === 1 ? 'Week' : 'Weeks'}</div>
                <div className="text-sm font-semibold mt-1">₹{(weeklyFee * weeks).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Rental Duration:</span>
            <span className="font-semibold">{rentalWeeks} {rentalWeeks === 1 ? 'week' : 'weeks'}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Weekly Rate:</span>
            <span className="font-semibold">₹{weeklyFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-blue-300">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">₹{totalCost.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/search')}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRental}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-medium"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  }

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