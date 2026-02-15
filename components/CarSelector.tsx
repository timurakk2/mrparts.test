import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAR_MODELS_LIST, CAR_YEARS } from '../types';
import { Search } from 'lucide-react';

const CarSelector: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!selectedModel) return;
    
    let query = `/catalog?model=${selectedModel}`;
    if (selectedYear) {
      query += `&year=${selectedYear}`;
    }
    navigate(query);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-4xl mx-auto -mt-10 relative z-20 border border-gray-100">
       <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
         <span className="w-1 h-6 bg-primary mr-3 rounded-full"></span>
         Подберите запчасти для вашего Renault
       </h2>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Модель</label>
             <select 
               className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 appearance-none"
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
             >
               <option value="">Выберите модель</option>
               {CAR_MODELS_LIST.map(model => (
                 <option key={model} value={model}>{model}</option>
               ))}
             </select>
          </div>
          
          <div className="relative">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Год выпуска</label>
             <select 
               className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 appearance-none"
               value={selectedYear}
               onChange={(e) => setSelectedYear(e.target.value)}
             >
               <option value="">Любой год</option>
               {CAR_YEARS.map(year => (
                 <option key={year} value={year}>{year}</option>
               ))}
             </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!selectedModel}
              className={`w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2
                 ${selectedModel 
                    ? 'bg-primary hover:bg-primary-dark cursor-pointer transform hover:-translate-y-1' 
                    : 'bg-gray-300 cursor-not-allowed'}
              `}
            >
              <Search size={20} />
              <span>Найти запчасти</span>
            </button>
          </div>
       </div>
    </div>
  );
};

export default CarSelector;