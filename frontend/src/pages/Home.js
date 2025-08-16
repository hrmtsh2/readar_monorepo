import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          discover books around you
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          buy, sell, borrow, and lend books with real people in your community
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">for buyers & borrowers</h3>
            <p className="text-gray-600">find books at competitive prices, reserve for pickup, join auctions</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">for sellers & lenders</h3>
            <p className="text-gray-600">list your books, earn through sales & rentals, compete with amazon</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">for book lovers</h3>
            <p className="text-gray-600">share reading data, find book clubs, donate to charities</p>
          </div>
        </div>
        
        <div className="space-x-4">
          <Link 
            to="/search" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium inline-block"
          >
            search books
          </Link>
          {!user && (
            <Link 
              to="/register" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-md text-lg font-medium inline-block"
            >
              join readar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
