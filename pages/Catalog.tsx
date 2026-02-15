import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchProducts } from '../services/productsService';
import { parseCarString } from '../services/carTreeService'; // Import the shared parser
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Filter, X, Car, AlertTriangle, Factory, BadgeCheck, ChevronRight } from 'lucide-react';
import { useGarage } from '../context/GarageContext';

const Catalog: React.FC = () => {
  const location = useLocation();
  const { selectedCar, clearCar } = useGarage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse query params on load (support legacy URL params for sharing)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('search');
    if (s) setSearchQuery(s);
  }, [location.search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    };
    load();
  }, []);

  // Extract all unique brands available in products
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand).filter(Boolean) as string[]));
  }, [products]);

  // Detect if the search query matches a known brand
  const detectedBrand = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null;
    const query = searchQuery.toLowerCase();
    return uniqueBrands.find(brand => brand.toLowerCase().includes(query) || query.includes(brand.toLowerCase()));
  }, [searchQuery, uniqueBrands]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        // Create a "clean" version for Part Number matching (remove spaces, dashes, dots)
        const cleanQuery = query.replace(/[^a-z0-9а-яё]/g, '');
        
        // Search in Name (Standard substring match)
        const matchName = (product.name || '').toLowerCase().includes(query);
        
        // Search in Part Number (Robust: matches "8200-123" with "8200123")
        const rawPart = product.part_number ? product.part_number.toLowerCase() : '';
        const cleanPart = rawPart.replace(/[^a-z0-9]/g, '');
        
        // Match if query is inside raw part OR clean query is inside clean part (if query is substantial)
        const matchPart = rawPart.includes(query) || (cleanQuery.length > 2 && cleanPart.includes(cleanQuery));

        // Search in Brand
        const matchBrand = (product.brand || '').toLowerCase().includes(query);
        
        // Search in Description
        const matchDesc = (product.description || '').toLowerCase().includes(query);
        
        // Search in Category
        const matchCat = (product.category || '').toLowerCase().includes(query);
        
        // Search in Cross-references (OEMs) - also Robust
        const matchOem = product.compatible_oem?.some(oem => {
            const cleanOem = oem.toLowerCase().replace(/[^a-z0-9]/g, '');
            return oem.toLowerCase().includes(query) || (cleanQuery.length > 2 && cleanOem.includes(cleanQuery));
        });
        
        if (!matchName && !matchPart && !matchBrand && !matchDesc && !matchCat && !matchOem) return false;
      }

      // 2. Category Filter
      if (categoryFilter && product.category !== categoryFilter) return false;

      // 3. SMART GARAGE MATCHING
      // Note: If user specifically searches by Part Number (high confidence), we might want to show it even if it doesn't match the car.
      // But for now, we keep strict filtering to be safe, unless the user clears the car.
      if (selectedCar) {
         // Parameters from the user's selected car
         const userModel = selectedCar.model.name;
         const userYearGroup = selectedCar.generation.name;
         // Modification name "1.6 16V K4M" - this is the strict target
         const userModificationName = selectedCar.modification.name;
         const userEngine = selectedCar.modification.engine_code;
         
         // 3.1. Strict Compatibility String Check (Using parsed Groups)
         if (product.compatibility && product.compatibility.length > 0) {
             const stringMatchFound = product.compatibility.some(c => {
                 // We rely on the shared parser to decompose the product's stored string
                 // into structural parts, then compare those parts with the selected car.
                 const parsed = parseCarString(c.model);
                 
                 // If the parsed string is invalid/empty, ignore it
                 if (parsed.missing.length > 0) return false;

                 // STRICT MATCHING LOGIC
                 
                 // 1. Model must match (e.g. "Clio")
                 if (parsed.modelName !== userModel) return false;
                 
                 // 2. Year Group must match (e.g. "2 (1998-2005)")
                 if (parsed.yearRange !== userYearGroup) return false;

                 // 3. Modification Match (Volume + Valves + Engine)
                 // Reconstruct the modification string from the product data
                 // format: "1.2 16V D4F"
                 const productModName = [parsed.volume, parsed.valves, parsed.engine].filter(Boolean).join(' ');
                 
                 // Compare with user's modification name
                 if (productModName !== userModificationName) return false;
                 
                 return true;
             });

             if (stringMatchFound) return true;
         }

         // 3.2. Fallback: Generic Engine Code Match (e.g. for universal filters like "K4M")
         // Only use this if NO compatibility strings were found (or none matched).
         // Actually, typically we want to show it if EITHER specific string matches OR generic engine matches.
         if (product.compatible_engines && product.compatible_engines.length > 0) {
             if (product.compatible_engines.includes(userEngine)) return true;
         }

         return false; // Hidden if no match
      }

      return true;
    });
  }, [products, searchQuery, selectedCar, categoryFilter]);

  const clearFilters = () => {
    setCategoryFilter('');
    setSearchQuery('');
  };

  const selectBrandFilter = (brand: string) => {
      setSearchQuery(brand);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Garage Notification Banner */}
      {selectedCar && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex items-center justify-between animate-fade-in">
            <div className="flex items-center">
                <div className="bg-primary text-white p-2 rounded-full mr-4">
                    <Car size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">
                        {selectedCar.model.name}
                        <span className="text-gray-500 font-normal ml-2 text-sm">{selectedCar.generation.name}</span>
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Модификация: <span className="font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">{selectedCar.modification.name}</span>
                    </p>
                </div>
            </div>
            <button 
                onClick={clearCar} 
                className="text-sm text-gray-500 hover:text-red-500 underline whitespace-nowrap ml-4"
            >
                Сбросить авто
            </button>
        </div>
      )}

      {/* Brand Detection Banner */}
      {detectedBrand && (
         <div 
            onClick={() => selectBrandFilter(detectedBrand)}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between max-w-2xl"
         >
            <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-md flex items-center justify-center text-lg font-bold mr-3 shadow-sm">
                    {detectedBrand.charAt(0)}
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-gray-900 leading-none">{detectedBrand}</h2>
                        <BadgeCheck className="text-blue-500" size={16} />
                    </div>
                     <p className="text-xs text-gray-500 mt-0.5">Официальный каталог</p>
                </div>
            </div>
            
            <div className="flex items-center text-primary text-sm font-bold group-hover:underline">
                <span className="hidden sm:inline mr-1">Смотреть все</span>
                <ChevronRight size={16} />
            </div>
         </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className={`
            fixed inset-0 z-40 bg-white p-6 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 md:bg-transparent md:p-0 md:w-64 md:block
            ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex justify-between items-center md:hidden mb-6">
             <h2 className="text-xl font-bold">Фильтры</h2>
             <button onClick={() => setShowMobileFilters(false)}><X /></button>
          </div>

          <div className="space-y-6">
            <div className="bg-white md:p-4 rounded-xl md:shadow-sm md:border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-3">Категория</h3>
               <div className="space-y-2">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={categoryFilter === ''}
                      onChange={() => setCategoryFilter('')}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Все категории</span>
                 </label>
                 {categories.map(cat => (
                   <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={categoryFilter === cat}
                        onChange={() => setCategoryFilter(cat)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{cat}</span>
                   </label>
                 ))}
               </div>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showMobileFilters && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
             <h1 className="text-2xl font-bold text-gray-800">
               {selectedCar ? 'Подобранные запчасти' : 'Каталог запчастей'}
               <span className="text-gray-400 text-lg font-normal ml-2">({filteredProducts.length})</span>
             </h1>
             
             <button 
               className="mt-4 sm:mt-0 md:hidden flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
               onClick={() => setShowMobileFilters(true)}
             >
                <Filter size={18} />
                <span>Фильтры</span>
             </button>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
             </div>
          ) : filteredProducts.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
             </div>
          ) : (
             <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="inline-block p-4 bg-yellow-50 rounded-full mb-4 text-yellow-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Товары не найдены</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {selectedCar 
                        ? `Для ${selectedCar.model.name} ${selectedCar.generation.name} (${selectedCar.modification.name}) запчастей в этой категории пока нет.` 
                        : 'Попробуйте изменить параметры поиска.'}
                </p>
                <button 
                  onClick={clearFilters}
                  className="text-primary font-bold hover:underline"
                >
                  Сбросить фильтры
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;