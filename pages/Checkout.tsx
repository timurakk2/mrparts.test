import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Москва'
  });

  if (items.length === 0 && step !== 'success') {
     navigate('/cart');
     return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = async () => {
    setLoading(true);
    
    // Create order in Supabase
    if (user) {
      try {
        const { error } = await supabase.from('orders').insert({
          user_id: user.id,
          total_amount: total,
          status: 'paid', // Simulating successful payment
          shipping_address: {
             city: formData.city,
             address: formData.address,
             phone: formData.phone
          },
          payment_info: {
             provider: 'yookassa',
             status: 'succeeded'
          }
        });
        
        if (error) console.error("Order creation error:", error);
      } catch (err) {
        console.error("Supabase error", err);
      }
    }

    // Simulate Yookassa processing delay
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      clearCart();
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Заказ успешно оплачен!</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Спасибо за покупку в Mr.Parts. Мы уже начали собирать ваш заказ. Информация отправлена на {formData.email}.
        </p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-lg font-bold">
          Вернуться на главную
        </button>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
         <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-center">Оплата через ЮKassa</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
               <div className="flex justify-between mb-4">
                 <span className="text-gray-600">Сумма заказа:</span>
                 <span className="font-bold">{total.toLocaleString('ru-RU')} ₽</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Комиссия:</span>
                 <span className="font-bold">0 ₽</span>
               </div>
            </div>

            {/* Mock Yookassa UI */}
            <div className="space-y-4 mb-8">
               <div className="flex items-center p-4 border rounded-lg cursor-pointer bg-blue-50 border-blue-200">
                  <CreditCard className="mr-4 text-blue-600" />
                  <div>
                    <div className="font-bold">Банковская карта</div>
                    <div className="text-xs text-gray-500">Visa, Mastercard, MIR</div>
                  </div>
                  <div className="ml-auto w-4 h-4 bg-blue-600 rounded-full"></div>
               </div>
               <div className="flex items-center p-4 border rounded-lg cursor-pointer opacity-60">
                  <div className="w-8 h-8 bg-gray-200 rounded mr-4 flex items-center justify-center text-xs font-bold">SPB</div>
                  <div>
                    <div className="font-bold">СБП</div>
                    <div className="text-xs text-gray-500">Система быстрых платежей</div>
                  </div>
                  <div className="ml-auto w-4 h-4 border-2 border-gray-300 rounded-full"></div>
               </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center transition-all"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              ) : (
                <span>Оплатить {total.toLocaleString('ru-RU')} ₽</span>
              )}
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
           <form id="checkout-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold flex items-center">
                 <Truck className="mr-2 text-primary" />
                 Доставка и получатель
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary border"
                      placeholder="Иванов Иван Иванович"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary border"
                      placeholder="+7 (999) 000-00-00"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  className="w-full border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary border"
                  placeholder="example@mail.ru"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary border"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary border"
                      placeholder="Улица, дом, квартира"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
              </div>
           </form>
        </div>

        <div className="md:col-span-1">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Ваш заказ</h3>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 {items.map(item => (
                   <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 line-clamp-1 w-2/3">{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                   </div>
                 ))}
              </div>
              <div className="border-t pt-4">
                 <div className="flex justify-between text-xl font-bold mb-6">
                    <span>Итого:</span>
                    <span>{total.toLocaleString('ru-RU')} ₽</span>
                 </div>
                 <button 
                   form="checkout-form"
                   type="submit"
                   className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
                 >
                   Перейти к оплате
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
