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

  const bookData = location.state?.book;

  useEffect(() => {
    if (!bookData) {
      navigate('/search');
      return;
    }
    // Only create reservation once
    if (!reservationCreated) {
      createReservation();
    }
  }, [bookData, reservationCreated, navigate]);

  const createReservation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/payments/reserve', {
        book_id: bookData.id,
        advance_percentage: 20.0
      });
      
      setReservationData(response.data);
      setReservationCreated(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!reservationData) return;

    const options = {
      key: reservationData.key_id,
      amount: reservationData.amount,
      currency: reservationData.currency,
      name: 'Readar',
      description: `Advance payment for "${reservationData.book_title}"`,
      order_id: reservationData.razorpay_order_id,
      handler: async function (response) {
        try {
          // Verify payment
          await api.post('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            reservation_id: reservationData.id
          });
          
          // Navigate to success page
          navigate('/payment-success', { 
            state: { 
              reservationId: reservationData.id,
              bookTitle: reservationData.book_title
            }
          });
        } catch (error) {
          setError('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        contact: user.phone || ''
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: function() {
          setError('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
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

  if (!reservationData) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Reservation</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Book Details</h3>
        <p><strong>Title:</strong> {bookData.title}</p>
        <p><strong>Author:</strong> {bookData.author}</p>
        <p><strong>Full Price:</strong> ₹{bookData.price}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        <p><strong>Advance Payment (20%):</strong> ₹{reservationData.reservation_fee}</p>
        <p><strong>Remaining Amount:</strong> ₹{(bookData.price - reservationData.reservation_fee).toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-2">
          Pay the remaining amount directly to the seller when collecting the book.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-yellow-800">What happens after payment?</h4>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>• You'll receive the seller's contact details</li>
          <li>• The book will be reserved for you for 24 hours</li>
          <li>• Contact the seller to arrange pickup</li>
          <li>• Pay the remaining amount during pickup</li>
        </ul>
      </div>

      <button
        onClick={handlePayment}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-lg font-semibold"
      >
        Pay ₹{reservationData.reservation_fee} with Razorpay
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Powered by Razorpay. Your payment is secure and protected.
      </p>
    </div>
  );
};

export default PaymentPage;