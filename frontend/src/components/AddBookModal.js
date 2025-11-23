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
    const [potentialMatch, setPotentialMatch] = useState(null);
    const [checkingMatch, setCheckingMatch] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewBook(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const normalize = (s) => s ? s.toString().toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() : '';

    const jaccardSimilarity = (a, b) => {
        const A = new Set(a.split(/\s+/).filter(Boolean));
        const B = new Set(b.split(/\s+/).filter(Boolean));
        if (A.size === 0 && B.size === 0) return 1;
        const inter = [...A].filter(x => B.has(x)).length;
        const union = new Set([...A, ...B]).size;
        return union === 0 ? 0 : inter / union;
    };

    const findBestMatch = (title, books) => {
        const nTitle = normalize(title);
        let best = null;
        let bestScore = 0;
        for (const b of books) {
            const n = normalize(b.title || '');
            if (!n) continue;
            const score = jaccardSimilarity(nTitle, n);
            if (score > bestScore) {
                bestScore = score;
                best = { book: b, score };
            }
        }
        return { best, bestScore };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setPotentialMatch(null);

        try {
            // First, fetch current user's books to compare titles
            setCheckingMatch(true);
            const resp = await api.get('/books/my/books');
            const myBooks = resp.data || [];
            const { best, bestScore } = findBestMatch(newBook.title || '', myBooks);
            setCheckingMatch(false);

            // threshold for similarity — tuned conservatively
            if (best && best.score >= 0.6) {
                // prompt the user with the potential match
                setPotentialMatch({ existing: best.book, score: best.score });
                setSubmitting(false);
                return; // wait for user decision
            }

            // No strong match — create a new book
            const bookData = {
                ...newBook,
                price: parseFloat(newBook.price),
                stock: parseInt(newBook.stock),
                weekly_fee: newBook.weekly_fee 
                    ? parseFloat(newBook.weekly_fee) 
                    : null
            };

            await api.post('/books/', bookData);
            // Reset and close
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
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('error adding book:', error);
            alert('failed to add book. please try again.');
        } finally {
            setSubmitting(false);
            setCheckingMatch(false);
        }
    };

    const handleMergeToExisting = async () => {
        if (!potentialMatch || !potentialMatch.existing) return;
        setSubmitting(true);
        try {
            const existing = potentialMatch.existing;
            const addCount = parseInt(newBook.stock) || 1;
            const newStock = (existing.stock || 0) + addCount;
            // Only update stock — keep other fields as-is. Frontend could offer more options later.
            const update = { stock: newStock };
            await api.put(`/books/${existing.id}`, update);
            // success
            setPotentialMatch(null);
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
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('merge failed', err);
            alert('Failed to merge into existing book. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateNewAfterMatch = async () => {
        // user chose to still create a new entry despite match
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
            setPotentialMatch(null);
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
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('create new failed', err);
            alert('Failed to create book. Please try again.');
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
                    
                    {potentialMatch ? (
                        <div className="mb-4 p-4 border border-yellow-300 bg-yellow-50 rounded">
                            <h4 className="font-medium text-yellow-800">Similar book found in your stock</h4>
                            <p className="text-sm text-gray-700 mt-2">We found a close match in your books:</p>
                            <div className="mt-2 p-3 bg-white rounded border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">{potentialMatch.existing.title}</div>
                                        <div className="text-sm text-gray-600">{potentialMatch.existing.author || '-'}</div>
                                        <div className="text-sm text-gray-600">stock: {potentialMatch.existing.stock || 0}</div>
                                    </div>
                                    <div className="text-sm text-gray-500">similarity: {(potentialMatch.score || 0).toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2 justify-end">
                                <button
                                    onClick={() => { setPotentialMatch(null); }}
                                    className="px-3 py-1 bg-gray-200 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateNewAfterMatch}
                                    className="px-3 py-1 bg-blue-600 text-white rounded"
                                >
                                    Create separate entry
                                </button>
                                <button
                                    onClick={handleMergeToExisting}
                                    className="px-3 py-1 bg-green-600 text-white rounded"
                                >
                                    Add stock to existing
                                </button>
                            </div>
                        </div>
                    ) : null}

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
