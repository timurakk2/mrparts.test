export interface Compatibility {
  model: string;
  years: number[];
}

// New interfaces for the "Smart Garage" system
export interface CarModel {
  id: string;
  name: string; // e.g., "Duster"
  generations: CarGeneration[];
}

export interface CarGeneration {
  id: string;
  name: string; // e.g., "1 (2010-2015)"
  years: number[];
  modifications: CarModification[];
}

export interface CarModification {
  id: string;
  name: string; // e.g., "1.6 16V K4M"
  engine_code: string; // e.g., "K4M"
  // Removed drive and transmission as requested
  power_hp?: number; // Optional, kept just in case
}

export interface Product {
  id: string;
  name: string;
  part_number: string; // OEM Number
  brand?: string; // Manufacturer (e.g. Renault, Bosch)
  price: number;
  images: string[]; // NEW: Array of image URLs (Main image is images[0])
  category: string;
  description: string;
  stock: number;
  // Detailed technical specifications (Key-Value pairs)
  specifications?: Record<string, string>;
  // Legacy compatibility for simple display
  compatibility: Compatibility[]; 
  // NEW: Smart matching fields
  compatible_engines?: string[]; // ["K4M", "F4R"] - matches ANY car with this engine
  compatible_oem?: string[]; // Cross-reference numbers
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export interface FilterState {
  model: string | null;
  year: number | null;
  category: string | null;
  search: string;
}

export const CAR_MODELS_LIST = [
  'Logan',
  'Duster',
  'Sandero',
  'Megane',
  'Kaptur',
  'Arkana',
  'Fluence'
];

export const CAR_YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);