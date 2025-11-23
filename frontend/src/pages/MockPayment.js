import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const MockPayment = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState('loading'); // loading, payment, processing, success

  const bookData = location.state?.book;

  useEffect(() => {
    if (!bookData) {
      navigate('/search');
      return;
    }
    createMockReservation();
  }, [bookData]);

  const createMockReservation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/payments/mock-reserve', {
        book_id: bookData.id
      });
      
      setReservationData(response.data);
      setPaymentStep('payment');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create reservation');
      setPaymentStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    setPaymentStep('processing');
    
    // Simulate payment processing time
    setTimeout(async () => {
      try {
        // Mock payment verification
        await api.post('/payments/mock-verify-payment', {
          mock_order_id: reservationData.mock_order_id,
          mock_payment_id: `pay_${Date.now()}`,
          reservation_id: reservationData.id
        });
        
        setPaymentStep('success');
        
        // Navigate to success page after a short delay
        setTimeout(() => {
          navigate('/payment-success', { 
            state: { 
              reservationId: reservationData.id,
              bookTitle: reservationData.book_title
            }
          });
        }, 2000);
      } catch (error) {
        setError('Payment verification failed. Please try again.');
        setPaymentStep('error');
      }
    }, 3000); // 3 second delay to simulate payment processing
  };

  const handleCancel = () => {
    navigate('/search');
  };

  if (paymentStep === 'loading') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Setting up payment...</div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'error' || error) {
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

  if (paymentStep === 'processing') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Processing payment...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we confirm your payment</div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div className="text-lg font-semibold text-green-800">Payment Successful!</div>
          <div className="text-sm text-gray-600 mt-2">Redirecting to confirmation page...</div>
        </div>
      </div>
    );
  }

  if (!reservationData) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Mock Razorpay Interface */}
      <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-800">Mock Payment Gateway</h2>
          <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Demo Mode
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
          <div className="space-y-2">
            <p><strong>Merchant:</strong> Readar</p>
            <p><strong>Book:</strong> {reservationData.book_title}</p>
            <p><strong>Amount:</strong> ₹{reservationData.reservation_fee}</p>
            <p><strong>Order ID:</strong> {reservationData.mock_order_id}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">Customer Details</h4>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This is a mock payment interface. 
            No actual payment will be processed. Click "Pay Now" to simulate a successful payment.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleMockPayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-lg font-semibold"
          >
            Pay ₹{reservationData.reservation_fee}
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Mock Payment Gateway - No real transactions will be processed
        </p>
      </div>
    </div>
  );
};

export default MockPayment;