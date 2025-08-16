import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const Charity = () => {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const response = await api.get('/charity/');
      setCharities(response.data);
    } catch (error) {
      console.error('failed to fetch charities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">donate books to charity</h1>
        <p className="text-lg text-gray-600">
          give your books a second life by donating to verified charities
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">loading charities...</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map((charity) => (
            <div key={charity.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{charity.name}</h3>
                {charity.is_verified && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">verified</span>
                )}
              </div>
              
              {charity.description && (
                <p className="text-gray-600 mb-4">{charity.description}</p>
              )}
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <p>{charity.email}</p>
                {charity.phone && <p>{charity.phone}</p>}
                {charity.website && (
                  <p>
                    <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      website
                    </a>
                  </p>
                )}
              </div>
              
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                donate books
              </button>
            </div>
          ))}
        </div>
      )}

      {charities.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">no verified charities available</div>
        </div>
      )}
    </div>
  );
};

export default Charity;
