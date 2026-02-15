import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut, Car, Wrench, PlusCircle, Database } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';

const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const { selectedCar, clearCar } = useGarage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group shrink-0">
             <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-primary-dark transition-colors">
                <Car size={24} />
             </div>
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800 leading-none">Mr.Parts</span>
                <span className="text-xs text-primary font-semibold tracking-wider">RENAULT EXPERTS</span>
             </div>
          </Link>

          {/* Garage Status (Desktop) */}
          {selectedCar && (
            <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-1 mx-4 border border-gray-200">
                <div className="bg-white p-1 rounded-full mr-3 shadow-sm text-primary">
                    <Car size={16} />
                </div>
                <div className="flex flex-col mr-3">
                    <span className="text-xs font-bold text-gray-800 leading-tight">
                        {selectedCar.model.name} {selectedCar.generation.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {selectedCar.modification.name}
                    </span>
                </div>
                <button 
                    onClick={clearCar}
                    className="text-gray-400 hover:text-red-500 ml-2"
                    title="Сменить авто"
                >
                    <X size={14} />
                </button>
            </div>
          )}

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4 relative">
            <input
              type="text"
              placeholder={selectedCar ? "Поиск запчастей для вашего авто..." : "Поиск по артикулу..."}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 shrink-0">
            <Link to="/catalog" className="text-gray-600 hover:text-primary font-medium transition-colors">
              Каталог
            </Link>
            
            {/* Admin Controls */}
            {user && (
                <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
                    <Link to="/add-product" title="Импорт Excel" className="text-gray-500 hover:text-primary transition-colors">
                        <PlusCircle size={20}/>
                    </Link>
                    <Link to="/admin" title="Редактор базы" className="text-gray-500 hover:text-primary transition-colors">
                        <Database size={20}/>
                    </Link>
                </div>
            )}

            <Link to="/cart" className="relative text-gray-600 hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <button onClick={signOut} title="Выйти" className="text-gray-400 hover:text-red-500">
                  <LogOut size={22} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center space-x-1 text-gray-600 hover:text-primary">
                <User size={22} />
                <span className="font-medium">Войти</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 animate-fade-in">
             {selectedCar && (
                 <div className="bg-gray-50 p-3 rounded-lg mt-3 mb-3 flex items-center justify-between">
                     <div>
                         <div className="font-bold text-sm text-gray-800">{selectedCar.model.name} {selectedCar.generation.name}</div>
                         <div className="text-xs text-gray-500">{selectedCar.modification.name}</div>
                     </div>
                     <button onClick={clearCar} className="text-red-500 text-xs font-bold border border-red-200 px-2 py-1 rounded">Сменить</button>
                 </div>
             )}
             <form onSubmit={handleSearch} className="mt-4 mb-4 relative">
                <input
                  type="text"
                  placeholder="Поиск запчастей..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </form>
            <div className="flex flex-col space-y-3">
              <Link to="/catalog" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Каталог запчастей
              </Link>
              {user && (
                  <>
                    <Link to="/add-product" className="text-primary font-bold py-2 flex items-center" onClick={() => setIsMenuOpen(false)}>
                        <PlusCircle size={18} className="mr-2"/> Импорт товаров
                    </Link>
                    <Link to="/admin" className="text-gray-700 font-medium py-2 flex items-center" onClick={() => setIsMenuOpen(false)}>
                        <Database size={18} className="mr-2"/> Управление базой
                    </Link>
                  </>
              )}
              <Link to="/cart" className="flex items-center justify-between text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                <span>Корзина</span>
                {itemCount > 0 && (
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{itemCount}</span>
                )}
              </Link>
              {user ? (
                 <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="text-left text-red-500 font-medium py-2">
                   Выйти ({user.email})
                 </button>
              ) : (
                <Link to="/auth" className="text-primary font-bold py-2" onClick={() => setIsMenuOpen(false)}>
                  Вход / Регистрация
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;