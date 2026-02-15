import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { DEFAULT_IMAGE } from '../services/productsService';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
           <Trash2 size={48} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ваша корзина пуста</h2>
        <p className="text-gray-500 mb-8 max-w-md">Похоже, вы еще ничего не добавили. Перейдите в каталог, чтобы найти нужные запчасти для вашего Renault.</p>
        <Link to="/catalog" className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors">
          Перейти к покупкам
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-4">
          {items.map(item => {
             const displayImage = (item.images && item.images.length > 0) ? item.images[0] : DEFAULT_IMAGE;
             return (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                  <img src={displayImage} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-gray-50" />
                  
                  <div className="flex-grow text-center sm:text-left">
                    <div className="text-xs text-gray-400 font-mono">{item.part_number}</div>
                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                    <div className="text-primary font-semibold sm:hidden mt-2">
                       {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-white rounded-md transition-colors text-gray-600 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-white rounded-md transition-colors text-gray-600"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="hidden sm:block text-right min-w-[120px]">
                    <div className="font-bold text-lg text-gray-900">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
                    <div className="text-xs text-gray-400">{item.price.toLocaleString('ru-RU')} ₽ / шт</div>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="Удалить"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
            );
          })}
          
          <button 
            onClick={clearCart} 
            className="text-sm text-red-500 hover:underline flex items-center space-x-1 mt-4"
          >
            <Trash2 size={14} />
            <span>Очистить корзину</span>
          </button>
        </div>

        <div className="lg:w-96">
           <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold mb-6 border-b pb-4">Итого</h3>
              
              <div className="flex justify-between mb-2 text-gray-600">
                <span>Товары ({items.length})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-6 text-gray-600">
                <span>Доставка</span>
                <span className="text-green-600">Бесплатно</span>
              </div>
              
              <div className="flex justify-between mb-8 text-xl font-bold text-gray-900">
                <span>К оплате</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center space-x-2"
              >
                <CreditCard size={20} />
                <span>Оформить заказ</span>
              </button>
              
              <p className="text-xs text-gray-400 mt-4 text-center">
                Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;