import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import AddBookModal from "../components/AddBookModal";
import ImportErrorsModal from "../components/ImportErrorsModal";
import ImportMatchesModal from "../components/ImportMatchesModal";

const MyStock = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [showImportErrors, setShowImportErrors] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const [showImportMatches, setShowImportMatches] = useState(false);
    const [importMatches, setImportMatches] = useState([]);
    const fileInputRef = React.useRef(null);

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

    const handleBookAdded = () => {
        fetchMyBooks(); // Refresh the list after adding a book
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">my stock</h1>
                        <p className="text-gray-600">manage your books available for sale and rent</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                            add book
                        </button>
                        <button
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
                            disabled={importing}
                        >
                            {importing ? 'importing...' : 'import excel'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const f = e.target.files && e.target.files[0];
                                if (!f) return;
                                setImporting(true);
                                try {
                                    const form = new FormData();
                                    form.append('file', f);
                                    const res = await api.post('/books/import-excel', form, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    const created = res.data?.created ?? res.data?.imported ?? 0;
                                    const errors = res.data?.errors ?? [];
                                    const matches = res.data?.matches ?? [];
                                    if (errors && errors.length > 0) {
                                        setImportErrors(errors);
                                        setShowImportErrors(true);
                                    }
                                    if (matches && matches.length > 0) {
                                        setImportMatches(matches);
                                        setShowImportMatches(true);
                                    }
                                    if ((!errors || errors.length === 0) && (!matches || matches.length === 0)) {
                                        alert(`Imported ${created} books successfully.`);
                                    }
                                    fetchMyBooks();
                                } catch (err) {
                                    console.error('Import error', err);
                                    alert('Import failed: ' + (err?.response?.data?.detail || err.message));
                                } finally {
                                    setImporting(false);
                                    e.target.value = null;
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Add Book Modal */}
            <AddBookModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleBookAdded}
            />
            <ImportErrorsModal
                isOpen={showImportErrors}
                onClose={() => { setShowImportErrors(false); setImportErrors([]); }}
                errors={importErrors}
            />
            <ImportMatchesModal
                isOpen={showImportMatches}
                onClose={() => { setShowImportMatches(false); setImportMatches([]); fetchMyBooks(); }}
                matches={importMatches}
                onMerge={async (m) => {
                    // merge stock: call PUT /books/{id} with new stock
                    try {
                        const existing = m.suggested;
                        const add = parseInt(m.row_data?.stock || 1) || 1;
                        const newStock = (existing.stock || 0) + add;
                        await api.put(`/books/${existing.id}`, { stock: newStock });
                        // remove this match from list
                        setImportMatches(prev => prev.filter(x => x.row !== m.row));
                    } catch (err) {
                        console.error('merge failed', err);
                        alert('Failed to merge stock: ' + (err?.response?.data?.detail || err.message));
                    }
                }}
                onCreate={async (m) => {
                    try {
                        const rd = m.row_data || {};
                        const payload = {
                            title: m.title,
                            author: rd.author || null,
                            price: rd.price,
                            stock: rd.stock || 1,
                            is_for_sale: rd.is_for_sale ?? true,
                            is_for_rent: rd.is_for_rent ?? false,
                            weekly_fee: rd.weekly_fee ?? null,
                            condition: rd.condition ?? null,
                            tags: rd.tags ?? null,
                            description: rd.description ?? null,
                            isbn: rd.isbn ?? null
                        };
                        await api.post('/books/', payload);
                        setImportMatches(prev => prev.filter(x => x.row !== m.row));
                    } catch (err) {
                        console.error('create failed', err);
                        alert('Failed to create book: ' + (err?.response?.data?.detail || err.message));
                    }
                }}
            />

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
                                <div className="mb-1">
                                    <p className="text-lg font-bold text-green-600">₹{book.price}</p>
                                    {book.is_for_rent && book.weekly_fee && (
                                        <p className="text-sm text-blue-600">₹{book.weekly_fee}/week rental</p>
                                    )}
                                </div>
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
                                <button
                                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                    onClick={async () => {
                                        try {
                                            const res = await api.delete(`/books/${book.id}`);
                                            if (res.status === 200) {
                                                fetchMyBooks();
                                            } else {
                                                alert('Failed to remove book: ' + res.status);
                                            }
                                        } catch (err) {
                                            alert('Failed to remove book: ' + (err?.response?.data?.detail || err.message));
                                            console.error(err);
                                        }
                                    }}
                                >
                                    remove
                                </button>
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
