import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const MyReadar = () => {
  const { user } = useAuth();
  const [myBooks, setMyBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    price: '',
    tags: '',
    description: '',
    stock: 1,
    is_for_sale: true,
    is_for_rent: false
  });
  const [showAddBook, setShowAddBook] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  const fetchMyBooks = async () => {
    try {
      const response = await api.get('/books/my/books');
      setMyBooks(response.data);
    } catch (error) {
      console.error('failed to fetch books:', error);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books/', {
        ...newBook,
        price: parseFloat(newBook.price)
      });
      setNewBook({
        title: '',
        author: '',
        price: '',
        tags: '',
        description: '',
        stock: 1,
        is_for_sale: true,
        is_for_rent: false
      });
      setShowAddBook(false);
      fetchMyBooks();
    } catch (error) {
      console.error('failed to add book:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBook({
      ...newBook,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">my readar</h1>
        <p className="text-gray-600">welcome back, {user?.first_name}!</p>
      </div>

      {/*unified user dashboard*/}
      {user && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">my books ({myBooks.length})</h2>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                add book
              </button>
            </div>

            {/*add book form*/}
            {showAddBook && (
              <form onSubmit={handleAddBook} className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="book title"
                    value={newBook.title}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="author"
                    placeholder="author"
                    value={newBook.author}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="number"
                    name="price"
                    placeholder="price"
                    value={newBook.price}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="tags"
                    placeholder="tags (comma-separated)"
                    value={newBook.tags}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="stock"
                    placeholder="stock"
                    value={newBook.stock}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  name="description"
                  placeholder="description"
                  value={newBook.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  rows="3"
                />
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_for_sale"
                      checked={newBook.is_for_sale}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    for sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_for_rent"
                      checked={newBook.is_for_rent}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    for rent
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    add book
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBook(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                  >
                    cancel
                  </button>
                </div>
              </form>
            )}

            {/*books list*/}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBooks.map((book) => (
                <div key={book.id} className="border border-gray-200 p-4 rounded-md">
                  <h3 className="font-semibold text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                  <p className="text-lg font-bold text-green-600">${book.price}</p>
                  <p className="text-sm text-gray-500">stock: {book.stock}</p>
                  <div className="flex space-x-2 mt-2">
                    {book.is_for_sale && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">sale</span>
                    )}
                    {book.is_for_rent && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">rent</span>
                    )}
                  </div>
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
          </div>

          {/*additional sections */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">my reservations</h2>
            <p className="text-gray-500">reservations feature coming soon...</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">reading history</h2>
            <p className="text-gray-500">reading data tracking coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReadar;
