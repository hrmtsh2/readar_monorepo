import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');
  
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reservationId) {
      fetchReservationDetails();
    } else {
      setLoading(false);
    }
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      const response = await api.get(`/phonepe/status/${reservationId}`);
      setReservationData(response.data);
    } catch (error) {
      console.error('Failed to fetch reservation details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Failure Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          Your payment could not be processed. The reservation has been cancelled.
        </p>

        {/* Payment Details */}
        {reservationData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reservation ID:</span>
              <span className="font-medium">#{reservationData.reservation_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">₹{reservationData.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {reservationData.payment_status || 'Failed'}
              </span>
            </div>
            {reservationData.phonepe_status && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PhonePe Status:</span>
                <span className="font-medium">{reservationData.phonepe_status}</span>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">What happened?</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Payment was cancelled or declined</li>
            <li>• No amount has been deducted from your account</li>
            <li>• The book is still available for reservation</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/search')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Browse Books
          </button>
          
          {reservationId && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
          >
            Go to Home
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/contact-us.html" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
