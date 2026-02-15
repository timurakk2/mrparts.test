import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import AddProduct from './pages/AddProduct';
import ProductDetails from './pages/ProductDetails';
import AdminCatalog from './pages/AdminCatalog';
import { GarageProvider } from './context/GarageContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <GarageProvider>
            <Router>
              <div className="flex flex-col min-h-screen font-sans text-secondary">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/add-product" element={<AddProduct />} />
                    <Route path="/admin" element={<AdminCatalog />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
        </GarageProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;