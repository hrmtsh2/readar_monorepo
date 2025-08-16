import React from 'react';
import { useParams } from 'react-router-dom';

const BookDetail = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">book detail page</h1>
        <p className="text-gray-600">book id: {id}</p>
        <p className="text-gray-500 mt-4">detailed book view with auction/reservation functionality coming soon...</p>
      </div>
    </div>
  );
};

export default BookDetail;
