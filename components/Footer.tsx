import React from 'react';
import { Car, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Car className="text-primary" size={28} />
              <span className="text-2xl font-bold">Mr.Parts</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ваш надежный партнер в мире запчастей Renault. Только проверенные поставщики и гарантия совместимости.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">Покупателям</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Как сделать заказ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Оплата и доставка</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Возврат товара</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Гарантия</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">Каталог</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/catalog?model=Logan" className="hover:text-primary transition-colors">Renault Logan</a></li>
              <li><a href="/catalog?model=Duster" className="hover:text-primary transition-colors">Renault Duster</a></li>
              <li><a href="/catalog?model=Kaptur" className="hover:text-primary transition-colors">Renault Kaptur</a></li>
              <li><a href="/catalog?model=Arkana" className="hover:text-primary transition-colors">Renault Arkana</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">Контакты</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-primary" />
                <span>8 (800) 555-35-35</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-primary" />
                <span>info@mrparts.ru</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin size={16} className="text-primary" />
                <span>г. Москва, ул. Автозаводская 23</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Mr.Parts. Все права защищены.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
             <span className="hover:text-white cursor-pointer">Политика конфиденциальности</span>
             <span className="hover:text-white cursor-pointer">Публичная оферта</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
