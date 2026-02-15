import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDynamicCarTree } from '../services/carTreeService';
import { useGarage } from '../context/GarageContext';
import { CarModel, CarGeneration, CarModification } from '../types';
import { Car, Check, RefreshCw } from 'lucide-react';

const AdvancedCarSelector: React.FC = () => {
  const navigate = useNavigate();
  const { selectCar } = useGarage();

  const [treeData, setTreeData] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [selectedGen, setSelectedGen] = useState<CarGeneration | null>(null);
  const [selectedMod, setSelectedMod] = useState<CarModification | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchDynamicCarTree();
      setTreeData(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleModelSelect = (modelId: string) => {
    const model = treeData.find(m => m.id === modelId) || null;
    setSelectedModel(model);
    setSelectedGen(null);
    setSelectedMod(null);
    if (model) {
        // If only one year range, auto-select it
        if (model.generations.length === 1) {
            setSelectedGen(model.generations[0]);
            setStep(3);
        } else {
            setStep(2);
        }
    }
  };

  const handleGenSelect = (genId: string) => {
    const gen = selectedModel?.generations.find(g => g.id === genId) || null;
    setSelectedGen(gen);
    setSelectedMod(null);
    if (gen) setStep(3);
  };

  const handleModSelect = (modId: string) => {
    const mod = selectedGen?.modifications.find(m => m.id === modId) || null;
    setSelectedMod(mod);
  };

  const handleSubmit = () => {
    if (selectedModel && selectedGen && selectedMod) {
      selectCar(selectedModel, selectedGen, selectedMod);
      navigate('/catalog');
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedModel(null);
    setSelectedGen(null);
    setSelectedMod(null);
  };

  if (loading) {
      return (
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto -mt-10 relative z-20 border border-gray-100 p-8 flex justify-center items-center">
              <RefreshCw className="animate-spin text-primary mr-2" /> Загрузка базы авто...
          </div>
      );
  }

  if (treeData.length === 0) {
       return (
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto -mt-10 relative z-20 border border-gray-100 p-8 text-center text-gray-500">
              База автомобилей пуста. Добавьте товары с привязкой к авто.
          </div>
      );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto -mt-10 relative z-20 border border-gray-100 overflow-hidden">
      <div className="bg-secondary text-white p-4 flex justify-between items-center">
        <h2 className="font-bold flex items-center">
            <Car className="mr-2" size={20} />
            Умный подбор запчастей
        </h2>
        {step > 1 && (
            <button onClick={reset} className="text-xs text-gray-300 hover:text-white underline">
                Сбросить
            </button>
        )}
      </div>
      
      <div className="p-6">
        {/* Progress Steps */}
        <div className="flex items-center mb-6 text-sm">
            <div className={`flex items-center ${step >= 1 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-2">1</span>
                Модель
            </div>
            <div className="h-px w-8 bg-gray-200 mx-2"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-2">2</span>
                Год выпуска
            </div>
            <div className="h-px w-8 bg-gray-200 mx-2"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-2">3</span>
                Модификация
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Model */}
            <div className={`transition-opacity ${step !== 1 && 'hidden md:block opacity-50'}`}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Выберите Модель</label>
                <select 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3"
                    value={selectedModel?.id || ''}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    disabled={step !== 1}
                >
                    <option value="">Не выбрано</option>
                    {treeData.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Step 2: Generation (Now displayed as Years) */}
            {step >= 2 && (
                <div className="animate-fade-in">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Год выпуска</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3"
                        value={selectedGen?.id || ''}
                        onChange={(e) => handleGenSelect(e.target.value)}
                    >
                        <option value="">Не выбрано</option>
                        {selectedModel?.generations.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Step 3: Modification */}
            {step >= 3 && (
                <div className="animate-fade-in">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Модификация (Двигатель)</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3"
                        value={selectedMod?.id || ''}
                        onChange={(e) => handleModSelect(e.target.value)}
                    >
                        <option value="">Не выбрано</option>
                        {selectedGen?.modifications.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    {selectedMod && (
                        <p className="text-xs text-green-600 mt-2 flex items-center">
                            <Check size={12} className="mr-1"/>
                            Выбрано: {selectedMod.name}
                        </p>
                    )}
                </div>
            )}
        </div>
        
        {/* Action Button */}
        {selectedMod && (
            <div className="mt-6 flex justify-end animate-fade-in">
                <button
                    onClick={handleSubmit}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center transition-transform hover:-translate-y-1"
                >
                    <Check className="mr-2" />
                    Показать запчасти
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCarSelector;