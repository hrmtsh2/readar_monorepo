import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [reservationDetails, setReservationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { reservationId, bookTitle } = location.state || {};

  useEffect(() => {
    if (!reservationId) {
      navigate('/search');
      return;
    }
    fetchReservationDetails();
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      const response = await api.get(`/payments/reservation/${reservationId}`);
      setReservationDetails(response.data);
    } catch (error) {
      setError('Failed to fetch reservation details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading reservation details...</div>
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

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">Your advance payment has been processed successfully.</p>
      </div>

      {reservationDetails && (
        <>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Book Reserved</h3>
            <p><strong>Title:</strong> {reservationDetails.book_title}</p>
            <p><strong>Author:</strong> {reservationDetails.book_author}</p>
            <p><strong>Advance Paid:</strong> ₹{reservationDetails.amount_paid}</p>
            <p><strong>Remaining Amount:</strong> ₹{reservationDetails.remaining_amount}</p>
            <p><strong>Reservation Valid Until:</strong> {new Date(reservationDetails.valid_until).toLocaleString()}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Seller Contact Details</h3>
            <p><strong>Name:</strong> {reservationDetails.seller_name}</p>
            <p><strong>Email:</strong> {reservationDetails.seller_email}</p>
            {reservationDetails.seller_phone && (
              <p><strong>Phone:</strong> {reservationDetails.seller_phone}</p>
            )}
            <p><strong>Book Location:</strong> {reservationDetails.book_location}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-yellow-800">Next Steps:</h4>
            <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Contact the seller using the details above</li>
              <li>Arrange a convenient time to pick up the book</li>
              <li>Pay the remaining amount (₹{reservationDetails.remaining_amount}) to the seller during pickup</li>
              <li>The seller will mark the book as "collected" in their dashboard</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800">Important Notes:</h4>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>• Your reservation is valid for 24 hours from the time of payment</li>
              <li>• If you don't collect the book within this time, your advance payment will be refunded</li>
              <li>• Please be respectful when contacting the seller</li>
              <li>• Inspect the book condition before making the final payment</li>
            </ul>
          </div>
        </>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/search')}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Continue Browsing
        </button>
        <button
          onClick={() => navigate('/my-readar')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          View My Reservations
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;