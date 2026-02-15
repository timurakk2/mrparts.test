import React, { createContext, useContext, useState, useEffect } from 'react';
import { CarModel, CarGeneration, CarModification } from '../types';

interface SelectedCar {
  model: CarModel;
  generation: CarGeneration;
  modification: CarModification;
}

interface GarageContextType {
  selectedCar: SelectedCar | null;
  selectCar: (model: CarModel, generation: CarGeneration, modification: CarModification) => void;
  clearCar: () => void;
  isGarageOpen: boolean;
  setGarageOpen: (open: boolean) => void;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export const GarageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(() => {
    try {
      const stored = localStorage.getItem('mrparts_garage');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isGarageOpen, setGarageOpen] = useState(false);

  useEffect(() => {
    if (selectedCar) {
      localStorage.setItem('mrparts_garage', JSON.stringify(selectedCar));
    } else {
      localStorage.removeItem('mrparts_garage');
    }
  }, [selectedCar]);

  const selectCar = (model: CarModel, generation: CarGeneration, modification: CarModification) => {
    setSelectedCar({ model, generation, modification });
    setGarageOpen(false);
  };

  const clearCar = () => {
    setSelectedCar(null);
  };

  return (
    <GarageContext.Provider value={{ selectedCar, selectCar, clearCar, isGarageOpen, setGarageOpen }}>
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) throw new Error('useGarage must be used within a GarageProvider');
  return context;
};
