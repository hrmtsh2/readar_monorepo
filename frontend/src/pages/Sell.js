import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";
import AddBookModal from "../components/AddBookModal";

const Sell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [salesHistory, setSalesHistory] = useState([]);
    const [userBooks, setUserBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddBookModal, setShowAddBookModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSalesHistory();
            fetchUserBooks();
        }
    }, [user]);

    const fetchSalesHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/books/my/sales');
            setSalesHistory(response.data);
        } catch (error) {
            console.error('Error fetching sales history:', error);
            setSalesHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBooks = async () => {
        try {
            const response = await api.get('/books/my/books/with-reservations');
            setUserBooks(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching user books:', error);
            setUserBooks([]);
        }
    };

    const handleBookAdded = () => {
        fetchUserBooks(); // Refresh the list after adding a book
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date parsing error:', error);
            return '-';
        }
    };

    if (!user) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">please log in to start selling</h1>
                </div>
            </div>
        );
    }


    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">sell books</h1>
                <p className="text-gray-600">welcome back, {user?.first_name}!</p>
            </div>

            {/* sales history */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">your sales history</h2>
                    <button
                        onClick={() => setShowAddBookModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        add book
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">loading sales history...</p>
                    </div>
                ) : salesHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        book title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        buyer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {salesHistory.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(sale.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {sale.book_title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {sale.buyer_name} (ID: {sale.buyer_id})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{sale.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                sale.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">no sales yet. add your first book to start selling!</p>
                    </div>
                )}
            </div>

            {/* user books listing */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">your books</h2>
                </div>

                {userBooks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        S/N
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        title
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        author
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        tags
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        price
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        stock
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        listing type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        condition
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        reserved by
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        upload date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        weekly fee
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {userBooks.map((book, idx) => (
                                    <tr key={book.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.id}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                            {book.title}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.author || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {book.description || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {book.tags || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                                            ₹{book.price}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.stock}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                {book.is_for_sale && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        For Sale
                                                    </span>
                                                )}
                                                {book.is_for_rent && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        For Rent
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.condition || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                book.status === 'in_stock' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : book.status === 'reserved'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : book.status === 'sold'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {book.status ? book.status.replace('_', ' ') : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.reservation ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{book.reservation.buyer_name}</span>
                                                    <span className="text-xs text-gray-500">{book.reservation.buyer_email}</span>
                                                    <span className="text-xs text-blue-600">Fee: ₹{book.reservation.reservation_fee}</span>
                                                    <span className={`text-xs mt-1 inline-flex px-2 py-1 rounded-full ${
                                                        book.reservation.status === 'confirmed' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {book.reservation.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {book.created_at ? formatDate(book.created_at) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {book.is_for_rent && book.weekly_fee ? `₹${book.weekly_fee}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">no books added yet. click "add book" to start!</p>
                    </div>
                )}
            </div>

            {/* add book modal */}
            <AddBookModal 
                isOpen={showAddBookModal}
                onClose={() => setShowAddBookModal(false)}
                onSuccess={handleBookAdded}
            />
        </div>
    );
};

export default Sell;