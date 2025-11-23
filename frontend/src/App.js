import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyReadar from './pages/MyReadar';
import BookSearch from './pages/BookSearch';
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile';
import Charity from './pages/Charity';
import Sell from "./pages/Sell";
import MyStock from "./pages/MyStock";
import ProtectedRoute from './components/ProtectedRoute';
import ReservationConfirmation from './pages/ReservationConfirmation';
import PaymentPage from './pages/PaymentPage';
import PaymentPageIntegration from './pages/PaymentPageIntegration';
import PaymentSuccess from './pages/PaymentSuccess';
import SellerDashboard from './pages/SellerDashboard';
import MockPayment from './pages/MockPayment';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#f2efeb] flex flex-col">
          <Navbar />
          <main className="flex-grow max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/charity" element={<Charity />} />
              <Route path="/sell" element={<Sell />}/>
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
              <Route path="/reservation-confirmation" element={<ReservationConfirmation />} />
              <Route 
                path="/mock-payment" 
                element={
                  <ProtectedRoute>
                    <MockPayment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment" 
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment-page" 
                element={
                  <ProtectedRoute>
                    <PaymentPageIntegration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment-success" 
                element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/seller-dashboard" 
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
