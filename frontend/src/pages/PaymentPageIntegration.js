import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const PaymentPageIntegration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bookData = location.state?.book;

  const createPaymentPage = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/payments/payment-page/create', {
        book_id: bookData.id,
        payment_type: 'purchase'
      });
      
      setPaymentConfig(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create payment page');
    } finally {
      setLoading(false);
    }
  }, [bookData]);

  useEffect(() => {
    if (!bookData) {
      navigate('/search');
      return;
    }
    createPaymentPage();
  }, [bookData, createPaymentPage, navigate]);

  const redirectToPaymentPage = () => {
    if (paymentConfig) {
      // For demo purposes, simulate successful payment after 3 seconds
      setTimeout(() => {
        navigate(`/payment-success?reservation_id=${paymentConfig.reservation_id}`);
      }, 3000);
      
      // In production, uncomment these lines to redirect to actual Payment Page:
      // const paymentUrl = `${paymentConfig.payment_page_url}?amount=${paymentConfig.amount * 100}&currency=${paymentConfig.currency}&description=Purchase of ${paymentConfig.book_title}&redirect_url=${paymentConfig.success_url}`;
      // window.location.href = paymentUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Setup Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/search')}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!paymentConfig) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Purchase</h2>
          
          {/* Book Details */}
          <div className="border-b pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Book Details</h3>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{bookData.title}</h4>
                <p className="text-gray-600">by {bookData.author}</p>
                <p className="text-gray-500 text-sm mt-2">{bookData.genre}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">₹{paymentConfig.amount}</p>
                <p className="text-sm text-gray-500">Full Payment</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Secure payment via Razorpay</li>
                <li>✓ Full amount will be held in escrow</li>
                <li>✓ Released to seller only after you confirm book collection</li>
                <li>✓ 24-hour collection window</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={redirectToPaymentPage}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Proceed to Payment (₹{paymentConfig.amount})
            </button>
            
            <button
              onClick={() => navigate('/search')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>

          {/* Payment Page Demo Note */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> This will simulate a Razorpay Payment Page redirect. 
              In production, you'll be redirected to the actual Razorpay payment interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPageIntegration;