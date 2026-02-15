import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/productsService';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Check, ArrowLeft, Truck, ShieldCheck, Info, Car, Calendar, Zap } from 'lucide-react';
import { DEFAULT_IMAGE } from '../services/productsService';
import { parseCarString } from '../services/carTreeService';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchProductById(id);
      setProduct(data || null);
      if (data) {
          // Determine initial image
          const initialImg = (data.images && data.images.length > 0) 
            ? data.images[0] 
            : DEFAULT_IMAGE;
          setSelectedImage(initialImg);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // --- COMPATIBILITY GROUPING LOGIC ---
  const groupedCompatibility = useMemo(() => {
    if (!product || !Array.isArray(product.compatibility)) return null;

    // Structure: Map<ModelName, Map<YearRange, Set<Modification>>>
    const groups = new Map<string, Map<string, Set<string>>>();

    product.compatibility.forEach((item) => {
        const rawStr = item.model;
        const parsed = parseCarString(rawStr);

        // Fallback if parsing fails totally, use raw string as model
        const modelName = parsed.modelName || 'Другие';
        const yearRange = parsed.yearRange || 'Все года';
        
        let modBadge = '';
        if (parsed.isComplete || parsed.volume) {
            const parts = [parsed.volume, parsed.valves, parsed.engine].filter(Boolean);
            if (parsed.power) parts.push(`(${parsed.power})`);
            modBadge = parts.join(' ');
        } else {
             modBadge = rawStr.replace(modelName, '').replace(yearRange, '').replace(/[()]/g, '').trim();
             if (modBadge.length < 2) modBadge = 'Все модификации';
        }

        if (!groups.has(modelName)) {
            groups.set(modelName, new Map());
        }
        
        const modelGroup = groups.get(modelName)!;
        if (!modelGroup.has(yearRange)) {
            modelGroup.set(yearRange, new Set());
        }

        modelGroup.get(yearRange)!.add(modBadge);
    });

    return groups;
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Товар не найден</h2>
        <button onClick={() => navigate('/catalog')} className="mt-4 text-primary font-bold hover:underline">
           Вернуться в каталог
        </button>
      </div>
    );
  }

  const isInCart = items.some(item => item.id === product.id);
  const images = (product.images && product.images.length > 0) ? product.images : [selectedImage || DEFAULT_IMAGE];

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-1" />
        Назад
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left: Image Gallery */}
            <div className="bg-gray-50 p-8 flex flex-col items-center">
                {/* Main Image */}
                <div className="relative w-full h-[400px] flex items-center justify-center mb-6">
                    <img 
                        src={selectedImage || DEFAULT_IMAGE} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm mix-blend-multiply transition-opacity duration-300" 
                    />
                    {product.stock > 0 ? (
                        <span className="absolute top-0 left-0 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-bold border border-green-200">
                            В наличии: {product.stock}
                        </span>
                    ) : (
                        <span className="absolute top-0 left-0 bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full font-bold border border-red-200">
                            Нет в наличии
                        </span>
                    )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto w-full px-2 py-2">
                        {images.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedImage(img)}
                                className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="p-8">
                <div className="mb-2">
                    <span className="text-sm text-gray-400 uppercase tracking-wider font-bold">Артикул: {product.part_number}</span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
                
                {product.brand && (
                    <div className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-6">
                        Бренд: {product.brand}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between border-b border-gray-100 pb-6 mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
                        {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`
                        flex items-center justify-center space-x-2 px-8 py-3 rounded-lg font-bold text-lg transition-all w-full sm:w-auto
                        ${isInCart 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30'}
                        ${product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 shadow-none' : ''}
                        `}
                    >
                        {isInCart ? (
                        <>
                            <Check size={20} />
                            <span>В корзине</span>
                        </>
                        ) : (
                        <>
                            <ShoppingCart size={20} />
                            <span>В корзину</span>
                        </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                    <div className="flex items-center text-gray-600">
                        <Truck className="mr-2 text-primary" size={18} />
                        <span>Быстрая доставка</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <ShieldCheck className="mr-2 text-primary" size={18} />
                        <span>Гарантия качества</span>
                    </div>
                </div>

                {/* Compatibility Cards */}
                {groupedCompatibility && groupedCompatibility.size > 0 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                            <Car className="mr-2 text-primary" size={20}/>
                            Применимость
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {Array.from(groupedCompatibility.entries()).map(([model, generations]) => (
                                <div key={model} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                                        <span className="font-bold text-gray-800 text-lg">{model}</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {Array.from(generations.entries()).map(([yearRange, mods]) => (
                                            <div key={yearRange} className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap min-w-[100px]">
                                                    <Calendar size={12} className="mr-1.5"/>
                                                    {yearRange}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.from(mods).map((mod, i) => (
                                                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            <Zap size={10} className="mr-1 text-green-600"/>
                                                            {mod}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Description */}
                 <div className="mb-8">
                    <h3 className="font-bold text-gray-800 mb-2">Описание</h3>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-600 leading-relaxed text-sm">
                        {product.description || "Описание отсутствует."}
                    </div>
                </div>

                {/* Parameters Section */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="bg-[#fbf9f4] rounded-xl p-6 border border-[#ebe5da]">
                        <div className="flex items-center mb-4">
                            <h3 className="font-bold text-gray-800 uppercase tracking-wide border-b-2 border-accent pb-1">
                                Характеристики
                            </h3>
                        </div>
                        
                        <div className="space-y-2">
                             {Object.entries(product.specifications).map(([key, value]) => (
                                 <div key={key} className="flex justify-between items-baseline border-b border-gray-200/50 pb-1 last:border-0">
                                     <span className="text-gray-500 font-medium text-sm flex-1 mr-4">{key}</span>
                                     <span className="text-gray-900 font-semibold text-sm text-right">{value}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;