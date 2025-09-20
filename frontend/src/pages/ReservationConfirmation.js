import React from "react";
import { Link, useLocation } from "react-router-dom";

const ReservationConfirmation = () => {
  const location = useLocation();
  const book = location.state?.book;

  return (
    <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-lg shadow-lg text-center">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Reservation Confirmed!</h1>
      <p className="text-gray-700 mb-6">
        Thank you for your payment. Your reservation is complete.<br />
        You will receive an email with further details and pickup instructions.
      </p>
      {book && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Details</h2>
          <div className="mb-1"><span className="font-medium">Title:</span> {book.title}</div>
          {book.author && <div className="mb-1"><span className="font-medium">Author:</span> {book.author}</div>}
          {book.price && <div className="mb-1"><span className="font-medium">Price:</span> ₹{book.price}</div>}
          {book.tags && <div className="mb-1"><span className="font-medium">Tags:</span> {book.tags}</div>}
          {book.description && <div className="mb-1"><span className="font-medium">Description:</span> {book.description}</div>}
        </div>
      )}
      <div className="flex flex-col items-center space-y-4">
        <Link to="/my-readar" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
          Go to My Readar
        </Link>
        <Link to="/search" className="text-blue-600 hover:underline">
          Browse More Books
        </Link>
      </div>
      <div className="mt-8 text-sm text-gray-400">
        Need help? <a href="mailto:support@readar.com" className="underline">Contact support</a>
      </div>
    </div>
  );
};

export default ReservationConfirmation;
