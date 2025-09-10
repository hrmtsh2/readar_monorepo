import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

const MyStock = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyBooks();
        }
    }, [user]);

    const fetchMyBooks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/books/my/books');
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
            setBooks([]);
        } finally {
            setLoading(false);
        }
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
                <h1 className="text-3xl font-bold text-gray-900">my stock</h1>
                <p className="text-gray-600">manage your books available for sale and rent</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Your Books ({books.length})</h2>
                
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">loading your books...</p>
                    </div>
                ) : books.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {books.map((book) => (
                            <div key={book.id} className="border border-gray-200 p-4 rounded-md hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                                {book.author && <p className="text-sm text-gray-600 mb-2">by {book.author}</p>}
                                <p className="text-lg font-bold text-green-600 mb-1">${book.price}</p>
                                <p className="text-sm text-gray-500 mb-2">stock: {book.stock}</p>
                                {book.condition && (
                                    <p className="text-sm text-gray-500 mb-2">condition: {book.condition}</p>
                                )}
                                <div className="flex space-x-2 mb-2">
                                    {book.is_for_sale && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">for sale</span>
                                    )}
                                    {book.is_for_rent && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">for rent</span>
                                    )}
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    book.status === 'in_stock' 
                                        ? 'bg-green-100 text-green-800' 
                                        : book.status === 'sold'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {book.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">no books in your stock yet.</p>
                        <p className="text-gray-400 mt-1">add books from the sell page to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyStock;
