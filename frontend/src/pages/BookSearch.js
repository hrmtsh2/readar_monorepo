// search books to buy or borrow
// "buy/borrow" link on navbar leads to this page

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const BookSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({
    q: '', // search query ("The God of Small Things Arundhati Roy Fiction...")
    min_price: 0,
    max_price: 10000, // aribtrary default max price
    city: '',
    for_sale: null,
    for_rent: null
  });
  const [loading, setLoading] = useState(false);

  const searchBooks = useCallback(async () => {
    setLoading(true);
    try {
      // turns form values into url search params for querying
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/books?${params}`);
  // Sort books by created_at descending (latest first)
  const sortedBooks = [...response.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  setBooks(sortedBooks);
    } catch (error) {
      console.error('search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // set user's city as default of user data available
    if (user && user.city && filters.city === '') {
      setFilters(prevFilters => ({
        ...prevFilters,
        city: user.city
      }));
    }
  }, [user, filters.city]);

  useEffect(() => {
    searchBooks();
  }, [searchBooks]);

  // derive the actually displayed books after client-side filters
  const displayedBooks = books
    .filter(book => book.status !== 'reserved')
    .filter(book => !(user && book.owner_id === user.id));

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? (checked ? true : null) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchBooks();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">search books to buy or borrow</h1>
      
      {/*search filters*/}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="q"
              placeholder="Search title, author, tags, description..."
              value={filters.q}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={filters.city}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              name="min_price"
              placeholder="Min price"
              value={filters.min_price}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="max_price"
              placeholder="Max price"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Search
            </button>
          </div>
          
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="for_sale"
                checked={filters.for_sale === true}
                onChange={handleFilterChange}
                className="mr-2"
              />
              for sale
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="for_rent"
                checked={filters.for_rent === true}
                onChange={handleFilterChange}
                className="mr-2"
              />
              for rent
            </label>
          </div>
        </form>
      </div>

      {/*search results*/}
      <div className="mb-4">
        {loading ? (
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div className="text-sm text-gray-700">{displayedBooks.length} {displayedBooks.length === 1 ? 'book' : 'books'} found</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">searching...</div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedBooks.map((book) => (
            <div key={book.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col h-full">
              {/* Title - fixed height */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1 h-14 line-clamp-2">{book.title}</h3>
              
              {/* Author - fixed height */}
              <div className="text-sm text-gray-700 mb-2 h-6">
                {book.author && <span>by {book.author}</span>}
              </div>
              
              {/* Description - fixed height */}
              <div className="text-gray-600 mb-4 text-sm h-16 overflow-hidden">
                {book.description && <p className="line-clamp-3">{book.description.substring(0, 120)}{book.description.length > 120 ? '...' : ''}</p>}
              </div>
              
              {/* Price and status section - fixed height */}
              <div className="flex justify-between items-center mb-4 h-12">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-green-600">₹{book.price}</span>
                  {book.is_for_rent && book.weekly_fee && (
                    <span className="text-sm text-blue-600">₹{book.weekly_fee}/week rental</span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs h-fit ${
                  book.status === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {/*"in_stock" -> "in stock"*/}
                  {book.status.replace('_', ' ')}
                </span>
              </div>
              
              {/* Buttons - pushed to bottom with mt-auto */}
              <div className="flex space-x-2 mt-auto">
                    {book.is_for_sale && (
                          <ReserveButton book={book} />
                        )}
                    {book.is_for_rent && book.weekly_fee && parseFloat(book.weekly_fee) > 0 && (
                      <button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
                        onClick={() => navigate('/payment', { state: { book, payment_type: 'rental' } })}
                      >
                        Rent
                      </button>
                    )}
              </div>
            </div>
          ))}
        </div>
          </>
      )}

      {displayedBooks.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">no books found. log in and try again.</div>
        </div>
      )}
    </div>
  );
};


function ReserveButton({ book }) {
  const navigate = useNavigate();

  const handleReserve = () => {
    // Use Razorpay payment for both sale and rent
    navigate('/payment', { state: { book } });
  };

  return (
    <button
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm text-center"
      onClick={handleReserve}
    >
  Reserve
    </button>
  );
}
export default BookSearch;
