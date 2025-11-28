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
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest', 'availability', 'availability-reverse'
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
  let displayedBooks = books
    .filter(book => book.status !== 'reserved')
    .filter(book => !(user && book.owner_id === user.id));

  // Apply sorting
  if (sortOrder === 'availability') {
    displayedBooks = [...displayedBooks].sort((a, b) => {
      const getAvailabilityScore = (book) => {
        const isRent = book.is_for_rent === true || book.is_for_rent === 1;
        const isSale = book.is_for_sale === true || book.is_for_sale === 1;
        
        if (isRent && isSale) return 2; // rent/sale
        if (isRent && !isSale) return 1; // rent only
        if (!isRent && isSale) return 3; // sale only
        return 4;
      };
      const scoreA = getAvailabilityScore(a);
      const scoreB = getAvailabilityScore(b);
      return scoreA - scoreB;
    });
  } else if (sortOrder === 'availability-reverse') {
    displayedBooks = [...displayedBooks].sort((a, b) => {
      const getAvailabilityScore = (book) => {
        const isRent = book.is_for_rent === true || book.is_for_rent === 1;
        const isSale = book.is_for_sale === true || book.is_for_sale === 1;
        
        if (isRent && isSale) return 2; // rent/sale
        if (isRent && !isSale) return 3; // rent only
        if (!isRent && isSale) return 1; // sale only
        return 4;
      };
      const scoreA = getAvailabilityScore(a);
      const scoreB = getAvailabilityScore(b);
      return scoreA - scoreB;
    });
  }

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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">search books to buy or borrow</h1>
      
      {/*search filters*/}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              name="q"
              placeholder="Search title, author, tags..."
              value={filters.q}
              onChange={handleFilterChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={filters.city}
              onChange={handleFilterChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <input
              type="number"
              name="min_price"
              placeholder="Min price"
              value={filters.min_price}
              onChange={handleFilterChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="max_price"
              placeholder="Max price"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-md"
            >
              Search
            </button>
          </div>
          
          <div className="flex space-x-3">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                name="for_sale"
                checked={filters.for_sale === true}
                onChange={handleFilterChange}
                className="mr-1.5"
              />
              for sale
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                name="for_rent"
                checked={filters.for_rent === true}
                onChange={handleFilterChange}
                className="mr-1.5"
              />
              for rent
            </label>
          </div>
        </form>
      </div>

      {/*search results*/}
      <div className="mb-4 flex justify-between items-center">
        {loading ? (
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div className="text-sm text-gray-700">{displayedBooks.length} {displayedBooks.length === 1 ? 'book' : 'books'} found</div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="latest">Latest</option>
            <option value="availability">Rent → Rent/Sale → Sale</option>
            <option value="availability-reverse">Sale → Rent/Sale → Rent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">searching...</div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedBooks.map((book) => (
            <div key={book.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col h-full">
              {/* Book Image */}
              <div className="w-full h-32 mb-2 flex items-center justify-center bg-gray-50 rounded">
                <img
                  src={book.image_url || '/logo-readar.png'}
                  alt={book.title}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.target.src = '/logo-readar.png';
                  }}
                />
              </div>
              
              {/* Title - fixed height */}
              <h3 className="text-base font-semibold text-gray-900 mb-1 h-10 line-clamp-2">{book.title}</h3>
              
              {/* Author - fixed height */}
              <div className="text-xs text-gray-700 mb-1 h-5">
                {book.author && <span>by {book.author}</span>}
              </div>
              
              {/* Description - fixed height */}
              <div className="text-gray-600 mb-2 text-xs h-8 overflow-hidden">
                {book.description && <p className="line-clamp-1">{book.description.substring(0, 80)}{book.description.length > 80 ? '...' : ''}</p>}
              </div>
              
              {/* Price and status section - fixed height */}
              <div className="flex justify-between items-center mb-2 h-10">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-green-600">₹{book.price}</span>
                  {book.is_for_rent && book.weekly_fee && (
                    <span className="text-xs text-blue-600">₹{book.weekly_fee}/week</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {book.stock && book.stock > 0 && (
                    <span className="text-xs text-gray-600">{book.stock}</span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${
                    book.status === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {book.status.replace('_', ' ')}
                  </span>
                </div>
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
