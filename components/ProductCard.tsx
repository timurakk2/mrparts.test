import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_IMAGE } from '../services/productsService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const isInCart = items.some(item => item.id === product.id);

  // Safe access to compatibility
  const compatibilityList = Array.isArray(product.compatibility) 
    ? product.compatibility.map(c => c.model).join(', ') 
    : '';

  const goToDetails = () => {
      navigate(`/product/${product.id}`);
  };

  // Logic: Prefer images array, then default
  let displayImage = DEFAULT_IMAGE;
  if (product.images && product.images.length > 0 && product.images[0].trim() !== '') {
      displayImage = product.images[0];
  }

  return (
    <div 
        onClick={goToDetails}
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden group cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={displayImage} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock > 0 ? (
           <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium border border-green-200">
             В наличии: {product.stock}
           </span>
        ) : (
           <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-medium border border-red-200">
             Нет в наличии
           </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
            <div className="text-xs text-gray-400 font-mono uppercase">{product.part_number}</div>
            {product.brand && (
                <div className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {product.brand}
                </div>
            )}
        </div>
        <h3 className="font-semibold text-gray-800 mb-2 leading-tight flex-grow group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Simple compatibility preview */}
        <div className="text-xs text-gray-500 mb-4 line-clamp-1">
          {compatibilityList ? `Подходит для: ${compatibilityList}` : 'Универсальный / См. описание'}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">{product.price.toLocaleString('ru-RU')} ₽</span>
          </div>
          
          <button
            onClick={(e) => {
                e.stopPropagation(); // Prevent navigation when clicking buy
                addToCart(product);
            }}
            disabled={product.stock === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isInCart 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30'}
              ${product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 shadow-none' : ''}
            `}
          >
            {isInCart ? (
               <>
                 <Check size={18} />
                 <span>В корзине</span>
               </>
            ) : (
               <>
                 <ShoppingCart size={18} />
                 <span>Купить</span>
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;