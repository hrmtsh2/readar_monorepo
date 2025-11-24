import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSellerReservations();
    // Check for new reservations every 30 seconds
    const interval = setInterval(fetchSellerReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSellerReservations = async () => {
    try {
      // Get reservations for books owned by this user
      const response = await api.get('/payments/seller-reservations');
      const newReservations = Array.isArray(response.data) ? response.data : [];
      
      // Check for new notifications (new reservations since last check)
      if (reservations.length > 0) {
        const newReservationIds = newReservations
          .filter(r => !reservations.find(existing => existing.id === r.id))
          .map(r => r.id);
        
        if (newReservationIds.length > 0) {
          const newNotifications = newReservations
            .filter(r => newReservationIds.includes(r.id))
            .map(r => ({
              id: Date.now() + Math.random(),
              type: 'new_reservation',
              message: `New reservation for "${r.book_title}" by ${r.buyer_name}`,
              timestamp: new Date().toISOString(),
              reservationId: r.id
            }));
          
          setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep last 10 notifications
        }
      }
      
      setReservations(newReservations);
    } catch (error) {
      setError('Failed to fetch reservations');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsCollected = async (reservationId) => {
    try {
      await api.post(`/payments/mark-collected/${reservationId}`);
      // Refresh the list
      fetchSellerReservations();
      
      // Add success notification
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation) {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'collection_marked',
          message: `Successfully marked "${reservation.book_title}" as collected`,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10));
      }
    } catch (error) {
      alert('Failed to mark as collected: ' + (error.response?.data?.detail || error.message));
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading your reservations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>
      
      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                notification.type === 'new_reservation' 
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-green-50 border-green-400'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No reservations found for your books.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{reservation.book_title}</h3>
                  <p className="text-gray-600 mb-2">by {reservation.book_author}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p><strong>Buyer:</strong> {reservation.buyer_name}</p>
                      <p><strong>Email:</strong> {reservation.buyer_email}</p>
                      {reservation.buyer_phone && (
                        <p><strong>Phone:</strong> {reservation.buyer_phone}</p>
                      )}
                    </div>
                    <div>
                      <p><strong>Amount Paid:</strong> ₹{reservation.amount_paid}</p>
                      <p><strong>Remaining:</strong> ₹{reservation.remaining_amount}</p>
                      <p><strong>Total Price:</strong> ₹{reservation.total_price}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p><strong>Reserved On:</strong> {new Date(reservation.created_at).toLocaleString()}</p>
                    <p><strong>Valid Until:</strong> {new Date(reservation.valid_until).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      reservation.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800'
                        : reservation.status === 'COLLECTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {reservation.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      reservation.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Payment: {reservation.payment_status}
                    </span>
                  </div>
                </div>

                <div className="ml-4">
                  {reservation.status === 'ACTIVE' && reservation.payment_status === 'PAID' && (
                    <button
                      onClick={() => markAsCollected(reservation.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Mark as Collected
                    </button>
                  )}
                  {reservation.status === 'COLLECTED' && (
                    <div className="text-green-600 font-semibold">✓ Completed</div>
                  )}
                </div>
              </div>

              {reservation.status === 'ACTIVE' && reservation.payment_status === 'PAID' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-800">
                    <strong>Action Required:</strong> The buyer has paid the amount. 
                    Please coordinate with them for book pickup and collect the remaining amount (₹{reservation.remaining_amount}) 
                    in person. Once the book is handed over, click "Mark as Collected" above.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;