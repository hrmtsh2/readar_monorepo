import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const PaymentVerifying = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get('reservation_id');

  useEffect(() => {
    if (!reservationId) {
      console.log('No reservation ID, redirecting to search');
      navigate('/search');
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log('Verifying payment for reservation:', reservationId);
        // Check PhonePe payment status
        const response = await api.get(`/payments/phonepe/status/${reservationId}`);
        console.log('Payment status response:', response.data);
        
        // Redirect based on actual payment status
        if (response.data.phonepe_status === 'COMPLETED') {
          console.log('Payment completed, redirecting to success page');
          navigate(`/payment-success?reservation_id=${reservationId}`, { replace: true });
        } else {
          console.log('Payment not completed, status:', response.data.phonepe_status);
          // For PENDING, FAILED, or any other status, go to failed page
          navigate(`/payment-failed?reservation_id=${reservationId}`, { replace: true });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        console.error('Error details:', error.response?.data);
        // On error, redirect to failed page
        navigate(`/payment-failed?reservation_id=${reservationId}`, { replace: true });
      }
    };

    // Add a small delay to ensure PhonePe has processed the payment
    const timer = setTimeout(() => {
      verifyPayment();
    }, 2000);

    return () => clearTimeout(timer);
  }, [reservationId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">
            Please wait while we verify your payment status with PhonePe...
          </p>
          <p className="text-sm text-gray-500 mt-4">
            This will only take a moment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerifying;
