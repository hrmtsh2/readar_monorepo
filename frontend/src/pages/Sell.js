import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

const Sell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [salesHistory, setSalesHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [newBook, setNewBook] = useState({
        title: "",
        author: "",
        tags: "",
        description: "",
        price: "",
        stock: "1",
        condition: "",
        is_for_sale: true,
        is_for_rent: false,
        rental_price_per_day: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSalesHistory();
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewBook(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const bookData = {
                ...newBook,
                price: parseFloat(newBook.price),
                stock: parseInt(newBook.stock),
                rental_price_per_day: newBook.rental_price_per_day 
                    ? parseFloat(newBook.rental_price_per_day) 
                    : null
            };

            await api.post('/books/', bookData);
            
            // close modal and reset form
            setShowAddBookModal(false);
            setNewBook({
                title: "",
                author: "",
                tags: "",
                description: "",
                price: "",
                stock: "1",
                condition: "",
                is_for_sale: true,
                is_for_rent: false,
                rental_price_per_day: ""
            });

            // redirect to my-stock page
            navigate('/my-stock');
        } catch (error) {
            console.error('error adding book:', error);
            alert('failed to add book. please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">please log in to access this page</h1>
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
                                            ${sale.price.toFixed(2)}
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

            {/* add book modal */}
            {showAddBookModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">add new book</h3>
                                <button
                                    onClick={() => setShowAddBookModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            book title *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={newBook.title}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            author
                                        </label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={newBook.author}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            price *
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={newBook.price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            tags <span className="text-gray-500 text-xs">(comma-separated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={newBook.tags}
                                            onChange={handleInputChange}
                                            placeholder="e.g. fiction, mystery, thriller"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            stock
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={newBook.stock}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        condition
                                    </label>
                                    <select
                                        name="condition"
                                        value={newBook.condition}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">select condition</option>
                                        <option value="new">new</option>
                                        <option value="like-new">like new</option>
                                        <option value="very-good">very good</option>
                                        <option value="good">good</option>
                                        <option value="acceptable">acceptable</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newBook.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="describe the book's condition, any notes, etc."
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_for_sale"
                                            checked={newBook.is_for_sale}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">available for sale</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_for_rent"
                                            checked={newBook.is_for_rent}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">available for rent</span>
                                    </label>
                                </div>

                                {newBook.is_for_rent && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            rental price per day
                                        </label>
                                        <input
                                            type="number"
                                            name="rental_price_per_day"
                                            value={newBook.rental_price_per_day}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddBookModal(false)}
                                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                                        disabled={submitting}
                                    >
                                        cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'adding...' : 'add book'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sell;