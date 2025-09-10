import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyReadar from './pages/MyReadar';
import BookSearch from './pages/BookSearch';
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile';
import Charity from './pages/Charity';
import Sell from "./pages/Sell";
import Borrow from "./pages/Borrow";
import Lend from "./pages/Lend";
import MyStock from "./pages/MyStock";
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/charity" element={<Charity />} />
              <Route path="/sell" element={<Sell />}/>
              <Route path="/borrow" element={<Borrow />}/>
              <Route path="/lend" element={<Lend />}/>
              <Route 
                path="/my-readar" 
                element={
                  <ProtectedRoute>
                    <MyReadar />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-stock" 
                element={
                  <ProtectedRoute>
                    <MyStock />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
