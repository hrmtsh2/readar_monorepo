import React, { useState } from 'react';
import { api } from '../utils/api';

const AddBookModal = ({ isOpen, onClose, onSuccess }) => {
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
        weekly_fee: ""
    });
    const [submitting, setSubmitting] = useState(false);

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
                weekly_fee: newBook.weekly_fee 
                    ? parseFloat(newBook.weekly_fee) 
                    : null
            };

            await api.post('/books/', bookData);
            
            // Reset form
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
                weekly_fee: ""
            });

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
            
            // Close modal
            onClose();
        } catch (error) {
            console.error('error adding book:', error);
            alert('failed to add book. please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">add new book</h3>
                        <button
                            onClick={onClose}
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
                                    price (₹) *
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
                                    stock *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={newBook.stock}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
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
                                    <option value="excellent">excellent</option>
                                    <option value="good">good</option>
                                    <option value="fair">fair</option>
                                    <option value="poor">poor</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                tags/genre
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={newBook.tags}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., fiction, romance, mystery"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                description
                            </label>
                            <textarea
                                name="description"
                                value={newBook.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Book condition, edition, etc."
                            />
                        </div>

                        <div className="flex items-center space-x-6">
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
                                    weekly rental fee (₹)
                                </label>
                                <input
                                    type="number"
                                    name="weekly_fee"
                                    value={newBook.weekly_fee}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                                <p className="text-sm text-gray-500 mt-1">Amount charged per week for renting this book</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                            >
                                cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'adding...' : 'add book'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddBookModal;
