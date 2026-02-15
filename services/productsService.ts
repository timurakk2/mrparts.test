import { supabase } from '../supabaseClient';
import { Product } from '../types';

export const DEFAULT_IMAGE = 'https://i.postimg.cc/rFLH2JTz/Group-342.png';

// Mock Data is now empty as requested
const MOCK_PRODUCTS: Product[] = [];

// Helper to normalize images
const normalizeImages = (item: any): string[] => {
    let imgs: string[] = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        imgs = item.images.filter((url: any) => typeof url === 'string' && url.trim() !== '');
    }
    return imgs;
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    // Loop to fetch all records in batches
    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .range(from, from + step - 1);

      if (error) {
        console.warn("Supabase error fetching products:", error.message);
        hasMore = false;
        break; 
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += step;
        if (data.length < step) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    if (allData.length === 0) return [];

    return allData.map((item: any) => {
      const images = normalizeImages(item);
      return {
        ...item,
        description: item.description || '',
        brand: item.brand || '',
        category: item.category || 'Прочее',
        images: images,
        compatibility: Array.isArray(item.compatibility) ? item.compatibility : [],
        compatible_engines: Array.isArray(item.compatible_engines) ? item.compatible_engines : [],
        compatible_oem: Array.isArray(item.compatible_oem) ? item.compatible_oem : [],
        specifications: item.specifications || {}
      };
    }) as Product[];
  } catch (err) {
    console.error("Unexpected error:", err);
    return [];
  }
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    const images = normalizeImages(data);

    return {
      ...data,
      description: data.description || '',
      images: images,
      compatibility: Array.isArray(data.compatibility) ? data.compatibility : [],
      compatible_engines: Array.isArray(data.compatible_engines) ? data.compatible_engines : [],
      compatible_oem: Array.isArray(data.compatible_oem) ? data.compatible_oem : [],
      specifications: data.specifications || {}
    } as Product;
  } catch (err) {
     return undefined;
  }
};

// --- SIMULATED GLOBAL PARTS DATABASE ---
const GLOBAL_PARTS_DB: Record<string, { name: string; brand: string; category: string; crosses: string[]; specs?: Record<string, string> }> = {
  // Filters
  '7700274177': { 
      name: 'Фильтр масляный', 
      brand: 'Renault', 
      category: 'Фильтры', 
      crosses: ['W75/3', 'OP643/3', 'LS218'],
      specs: { "Высота": "79 мм", "Резьба": "M20x1.5", "Тип фильтра": "Накручиваемый" } 
  },
  'W75/3': { name: 'Фильтр масляный', brand: 'MANN-FILTER', category: 'Фильтры', crosses: ['7700274177', '8200768913'] },
  
  // Wipers
  'AD14FL350': {
      name: 'Щетка стеклоочистителя 350мм',
      brand: 'Blue Print',
      category: 'Щетки стеклоочистителя',
      crosses: [],
      specs: {
          "Длина щетки": "350мм/14\"",
          "Тип щетки": "Бескаркасная",
          "Сторона установки": "Задняя"
      }
  }
};

export const searchGlobalPartDatabase = async (oem: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const cleanOem = oem.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let result = GLOBAL_PARTS_DB[oem] || GLOBAL_PARTS_DB[cleanOem];

  if (!result) {
    const foundKey = Object.keys(GLOBAL_PARTS_DB).find(key => {
        const item = GLOBAL_PARTS_DB[key];
        return item.crosses.some(c => c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanOem);
    });
    if (foundKey) {
        const main = GLOBAL_PARTS_DB[foundKey];
        return {
            ...main,
            foundByCross: true,
            originalOem: foundKey
        };
    }
  }

  return result || null;
};