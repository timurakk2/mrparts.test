import React, { useEffect, useState } from 'react';
import AdvancedCarSelector from '../components/AdvancedCarSelector';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/productsService';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Wrench } from 'lucide-react';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setFeaturedProducts(data.slice(0, 4)); // Show first 4 as featured
    };
    loadProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-secondary text-white pb-20 pt-16 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-primary opacity-10 transform skew-x-12 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-gray-800 opacity-50 rounded-tr-full"></div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <span className="text-primary font-bold tracking-widest uppercase mb-2 block">Официальный дилер запчастей</span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Все для вашего <br />
              <span className="text-primary">Renault</span> в одном месте
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Умный подбор по модификации двигателя. Мы точно знаем, какая деталь подойдет вашему автомобилю.
            </p>
            <div className="flex space-x-4">
              <Link to="/catalog" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Перейти в каталог
              </Link>
              <a href="#features" className="border border-gray-500 hover:border-white text-gray-300 hover:text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Узнать больше
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
             {/* Decorative Image Placeholder */}
             <img 
               src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="Renault Parts" 
               className="rounded-3xl shadow-2xl border-4 border-gray-700/50 transform rotate-2 hover:rotate-0 transition-transform duration-500 w-4/5"
             />
          </div>
        </div>
      </div>

      {/* Advanced Car Selector Widget */}
      <div className="container mx-auto px-4">
         <AdvancedCarSelector />
      </div>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="text-primary" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Совместимость 100%</h3>
                 <p className="text-gray-500">Алгоритм подбора проверяет код двигателя и модификацию кузова перед покупкой.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Truck className="text-blue-600" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Быстрая доставка</h3>
                 <p className="text-gray-500">Отправляем заказы в день оформления. Работаем со всеми крупными ТК.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                 <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wrench className="text-orange-500" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Экспертный опыт</h3>
                 <p className="text-gray-500">Мы специализируемся только на Renault, поэтому знаем все нюансы каждой модели.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
           <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Популярные товары</h2>
                <p className="text-gray-500 mt-2">Выбор наших покупателей за последнюю неделю</p>
              </div>
              <Link to="/catalog" className="text-primary font-bold hover:text-primary-dark flex items-center">
                 Весь каталог &rarr;
              </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {featuredProducts.map(product => (
               <ProductCard key={product.id} product={product} />
             ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
