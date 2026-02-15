import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CAR_MODELS_LIST, CAR_YEARS, Compatibility } from '../types';
import { searchGlobalPartDatabase, DEFAULT_IMAGE } from '../services/productsService';
import { parseCarString, ParsedCarData } from '../services/carTreeService';
import { Plus, Trash2, Save, AlertCircle, Check, List, Database, Image as ImageIcon, X, Lock, Search, Wand2, Tag, ChevronDown, Sliders, FileSpreadsheet, UploadCloud, RefreshCw, ArrowRight, Car, Settings, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const CATEGORY_BRANDS_MAP: Record<string, string[]> = {
  'Запчасти для ТО': ['Renault', 'Motrio', 'Mann-Filter', 'Filtron', 'Purflux', 'Bosch', 'NGK', 'Denso', 'Champion'],
  'Двигатель': ['Renault', 'Motrio', 'Gates', 'Contitech', 'INA', 'Dayco', 'Victor Reinz', 'Elring', 'Kolbenschmidt', 'Mahle'],
  'Подвеска и Рулевое': ['Renault', 'Motrio', 'TRW', 'Lemforder', 'Sidem', 'Moog', 'Sasic', 'KYB', 'Monroe', 'Sachs', 'Bilstein'],
  'Тормозная система': ['Renault', 'Motrio', 'TRW', 'Brembo', 'Ate', 'Textar', 'Ferodo', 'Zimmermann', 'Bosch', 'NK'],
  'Трансмиссия и Сцепление': ['Renault', 'Valeo', 'Luk', 'Sachs', 'Exedy', 'Aisin', 'GKN', 'SKF', 'SNR'],
  'Электрика и Освещение': ['Renault', 'Valeo', 'Bosch', 'Hella', 'Osram', 'Philips', 'Narva', 'Magneti Marelli', 'Era'],
  'Кузовные детали': ['Renault', 'Gordon', 'Tong Yang', 'Klokkerholm', 'Van Wezel', 'Polcar'],
  'Охлаждение и Отопление': ['Renault', 'Valeo', 'Behr-Hella', 'Nissens', 'Luzar', 'Termal', 'NRF'],
  'Выхлопная система': ['Renault', 'Bosal', 'Walker', 'Polmostrow', 'CBD'],
  'Масла моторные': ['Elf', 'Castrol', 'Shell', 'Motul', 'Lukoil', 'Mobil', 'Total', 'ZIC', 'Liqui Moly', 'Rolf', 'Sintec'],
  'Прочее': []
};

const CATEGORIES = Object.keys(CATEGORY_BRANDS_MAP);

interface ImportCompatItem {
    originalStr: string; 
    missingInfo: string[]; 
    isComplete: boolean;
}

interface ImportItem {
  status: 'new' | 'update' | 'unchanged' | 'error';
  id?: string;
  part_number: string;
  brand: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  message?: string;
  existingData?: any;
  compatibleModels: ImportCompatItem[]; 
}

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'single' | 'import'>('single');
  const [loading, setLoading] = useState(false);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Single Product State ---
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [imageInputs, setImageInputs] = useState<string[]>(['']);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [selectedEngines, setSelectedEngines] = useState<string[]>([]);
  const [compatibleOems, setCompatibleOems] = useState<string[]>([]);
  const [legacyCompat, setLegacyCompat] = useState<Compatibility[]>([]);

  // --- Import State ---
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanPartNumber = (pn: string) => {
      return String(pn).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleGlobalSearch = async () => {
    if (!partNumber) {
        setError("Введите артикул для поиска");
        return;
    }
    setSearchingGlobal(true);
    setError(null);
    try {
        const result = await searchGlobalPartDatabase(partNumber);
        if (result) {
            setName(result.name);
            setBrand(result.brand);
            if (Object.keys(CATEGORY_BRANDS_MAP).includes(result.category)) {
                setCategory(result.category);
            }
            if (result.specs) {
                setSpecifications(prev => ({ ...prev, ...result.specs }));
            }
            const newOems = result.crosses.filter(c => !compatibleOems.includes(c));
            if (newOems.length > 0) {
                setCompatibleOems([...compatibleOems, ...newOems]);
            }
            alert("Данные успешно найдены в глобальной базе!");
        } else {
            alert("Артикул не найден в глобальной базе, заполните данные вручную.");
        }
    } catch (e) {
        console.error(e);
        setError("Ошибка связи с базой данных");
    } finally {
        setSearchingGlobal(false);
    }
  };

  const handleImageChange = (index: number, val: string) => {
      const newImgs = [...imageInputs];
      newImgs[index] = val;
      setImageInputs(newImgs);
  };
  const addImageInput = () => setImageInputs([...imageInputs, '']);
  const removeImageInput = (index: number) => {
      const newImgs = imageInputs.filter((_, i) => i !== index);
      setImageInputs(newImgs.length ? newImgs : ['']);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !partNumber || !price) {
        setError('Заполните обязательные поля (Название, Артикул, Цена)');
        setLoading(false);
        return;
    }

    try {
      const cleanSpecs: Record<string, string> = {};
      Object.entries(specifications).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim() !== '') cleanSpecs[k] = v.trim();
      });

      const cleanImages = imageInputs.filter(u => u.trim() !== '');

      const { error } = await supabase.from('products').insert({
        name,
        part_number: partNumber,
        brand,
        price: Number(price),
        stock: Number(stock),
        category,
        description,
        images: cleanImages, // New array support
        compatible_engines: selectedEngines,
        compatible_oem: compatibleOems,
        compatibility: legacyCompat,
        specifications: cleanSpecs
      });

      if (error) throw error;
      alert('Товар успешно добавлен!');
      navigate('/catalog');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  // --- BULK IMPORT LOGIC ---

  const getXLSX = () => {
    // @ts-ignore
    return XLSX.default || XLSX;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const arrayBuffer = evt.target?.result;
            const lib = getXLSX();
            
            if (!lib.read || !lib.utils) {
                throw new Error("Excel lib error");
            }

            const wb = lib.read(arrayBuffer, { type: 'array' });
            if (!wb.SheetNames.length) throw new Error("Empty file");
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = lib.utils.sheet_to_json(ws, { header: 1 });
            
            await processImportData(data);
        } catch (err: any) {
            console.error(err);
            setError("Ошибка чтения: " + err.message);
            setLoading(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImportData = async (rows: any[]) => {
      setLoading(true);
      if (!rows || rows.length === 0) {
          setError("Файл пуст");
          setLoading(false);
          return;
      }

      // 1. Dynamic Header Detection
      const MAX_SCAN_ROWS = 20;
      let headerRowIndex = -1;
      let colMap: any = null;

      for (let r = 0; r < Math.min(rows.length, MAX_SCAN_ROWS); r++) {
          const row = (rows[r] as any[]).map(c => String(c).toLowerCase().trim());
          const findColIndex = (keywords: string[]) => row.findIndex(c => keywords.some(k => c.includes(k)));
          
          const pnIdx = findColIndex(['code', 'артикул', 'номер', 'oem', 'part', 'код']);
          
          if (pnIdx !== -1) {
              headerRowIndex = r;

              // Find all columns named 'level'
              const levelIndices = row.map((c, i) => c === 'level' ? i : -1).filter(i => i !== -1);
              
              let compatIdx = -1;
              let catIdx = -1;
              
              if (levelIndices.length >= 2) {
                  compatIdx = levelIndices[1];
              } else {
                  compatIdx = findColIndex(['модель', 'применимость', 'авто', 'car', 'совместимость', 'подходит']);
              }

              if (levelIndices.length >= 3) {
                  catIdx = levelIndices[2];
              } else {
                  catIdx = findColIndex(['cat', 'категория', 'группа', 'вид', 'тип']);
              }

              colMap = {
                  part_number: pnIdx,
                  brand: findColIndex(['brand', 'бренд', 'производитель', 'фирма', 'марка']),
                  name: findColIndex(['description', 'название', 'наименование', 'продукт']),
                  price: findColIndex(['price', 'цена', 'стоимость', 'розница']),
                  stock: findColIndex(['stock', 'остаток', 'количество', 'кол-во', 'qnt', 'qty', 'qt', 'наличие']),
                  level: compatIdx,
                  category: catIdx,
                  image: findColIndex(['image', 'фото', 'изображение', 'картинка', 'pic', 'url'])
              };
              break; 
          }
      }

      if (headerRowIndex === -1 || !colMap) {
          setError("Не найдена строка заголовков (должна содержать 'Артикул' или 'Code')");
          setLoading(false);
          return;
      }

      // 2. Fetch existing products
      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .limit(10000);
      
      const map = new Map<string, ImportItem>();

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || !row[colMap.part_number]) continue;

          const partNumber = String(row[colMap.part_number]).trim();
          if (partNumber === '') continue;

          const cleanPart = cleanPartNumber(partNumber);
          
          const brand = colMap.brand !== -1 ? String(row[colMap.brand] || '').trim() : '';
          const name = colMap.name !== -1 ? String(row[colMap.name] || '').trim() : `Part ${partNumber}`;
          const price = colMap.price !== -1 ? parseFloat(String(row[colMap.price]).replace(',', '.').replace(/[^0-9.]/g, '')) : 0;
          
          let category = 'Прочее';
          if (colMap.category !== -1 && row[colMap.category]) {
              let rawCat = String(row[colMap.category]).trim();
              if (rawCat.length > 3 && rawCat.indexOf(' ') === 1 && rawCat.indexOf('  ') === -1) {
                   const compressed = rawCat.replace(/\s+/g, '');
                   if (compressed.length > 2) rawCat = compressed;
              }
              if (rawCat.length > 1) {
                 category = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
              }
          }
          
          let stock = 0;
          if (colMap.stock !== -1) {
             const s = String(row[colMap.stock]).toLowerCase();
             stock = (s.includes('да') || s.includes('>')) ? 10 : (parseInt(s) || 0);
          }

          let rawCompat = '';
          if (colMap.level !== -1 && row[colMap.level]) {
              rawCompat = String(row[colMap.level]);
          }

          // Image Parsing
          let images: string[] = [];
          if (colMap.image !== -1 && row[colMap.image]) {
              const rawImg = String(row[colMap.image]);
              // Split by space, comma, or semicolon to support multiple images
              images = rawImg.split(/[\s,;]+/).filter(u => u.trim() !== '' && u.includes('http'));
          }
          
          const parsed = parseCarString(rawCompat);
          const hasModel = parsed.modelName !== '';

          if (!map.has(cleanPart)) {
              const existing = existingProducts?.find(p => cleanPartNumber(p.part_number) === cleanPart);
              let status: ImportItem['status'] = existing ? 'unchanged' : 'new';
              let message = '';

              if (existing) {
                  if (Math.abs(existing.price - price) > 0.1 || existing.stock !== stock) {
                      status = 'update';
                      message = 'Обновление цены/остатка';
                  }
                  
                  if (category !== 'Прочее' && existing.category === 'Прочее') {
                      status = 'update';
                      message = message ? message + ', категория' : 'Обновлена категория';
                  }

                  if (images.length > 0 && (!existing.images || existing.images.length === 0)) {
                      status = 'update';
                      message = message ? message + ', фото' : 'Добавлены фото';
                  }
                  
                  if (hasModel) {
                       const existingCompats = existing.compatibility || [];
                       const existsRaw = existingCompats.some((c: any) => c.model === rawCompat);
                       if (!existsRaw) {
                           status = 'update';
                           message = message ? message + ', новые авто' : 'Добавлены данные авто';
                       }
                  }
              }

              map.set(cleanPart, {
                  status,
                  id: existing?.id,
                  part_number: partNumber,
                  brand,
                  name,
                  price,
                  stock,
                  category, 
                  images,
                  message,
                  compatibleModels: hasModel ? [{ originalStr: rawCompat, missingInfo: parsed.missing, isComplete: parsed.isComplete }] : [],
                  existingData: existing
              });
          } else {
              const item = map.get(cleanPart)!;
              if (hasModel) {
                  if (!item.compatibleModels.some(c => c.originalStr === rawCompat)) {
                      item.compatibleModels.push({ originalStr: rawCompat, missingInfo: parsed.missing, isComplete: parsed.isComplete });
                      if (item.status === 'unchanged') {
                           item.status = 'update';
                           item.message = 'Дополнительная применимость';
                      }
                  }
              }
              // Merge images if multiple rows have different images for same part (rare but possible)
              if (images.length > 0) {
                  const combined = Array.from(new Set([...item.images, ...images]));
                  if (combined.length > item.images.length) {
                      item.images = combined;
                      if (item.status === 'unchanged') item.status = 'update';
                  }
              }
          }
      }

      setImportData(Array.from(map.values()));
      setLoading(false);
  };

  const saveImport = async () => {
      setLoading(true);
      const toProcess = importData.filter(i => i.status !== 'unchanged');
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of toProcess) {
         try {
             let finalCompat: { model: string, years: number[] }[] = [];

             if (item.existingData && Array.isArray(item.existingData.compatibility)) {
                 finalCompat = [...item.existingData.compatibility];
             }

             item.compatibleModels.forEach(newItem => {
                 if (!finalCompat.some(existing => existing.model === newItem.originalStr)) {
                     finalCompat.push({ model: newItem.originalStr, years: [] });
                 }
             });

             const payload: any = {
                 name: item.name,
                 part_number: item.part_number,
                 brand: item.brand,
                 price: item.price,
                 stock: item.stock,
                 category: item.category,
                 compatibility: finalCompat,
                 images: item.images
             };

             if (item.status === 'update' && item.id) {
                 await supabase.from('products').update(payload).eq('id', item.id);
             } else {
                 await supabase.from('products').insert(payload);
             }
             successCount++;
         } catch (e) {
             console.error(`Ошибка при сохранении ${item.part_number}:`, e);
             errorCount++;
         }
      }
      
      setLoading(false);
      
      if (errorCount > 0) {
          alert(`Обработано: ${successCount}. Ошибок: ${errorCount}. Проверьте консоль.`);
      } else {
          alert(`Успешно обработано ${successCount} товаров`);
          setImportData([]);
          navigate('/catalog');
      }
  };

  const removeImportItem = (index: number) => {
      setImportData(prev => prev.filter((_, i) => i !== index));
  };

  if (authLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Plus className="mr-3 bg-primary text-white rounded-lg p-1" size={36} />
            Управление товарами
          </h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('single')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'single' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Одиночное</button>
              <button onClick={() => setActiveTab('import')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'import' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}><FileSpreadsheet size={16} className="mr-2"/> Импорт Excel</button>
          </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center"><AlertCircle className="mr-2" size={20}/>{error}</div>}

      {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-gray-700">
                        <List className="mr-2" size={20} />
                        Основная информация
                    </h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Артикул (OEM) *</label>
                        <div className="flex gap-2">
                            <input type="text" required className="flex-1 bg-white border-gray-300 rounded-lg p-2.5 border uppercase text-gray-900 font-bold" value={partNumber} onChange={e => setPartNumber(e.target.value)} placeholder="8200768913" />
                            <button type="button" onClick={handleGlobalSearch} className="bg-secondary text-white px-4 rounded-lg"><Wand2 size={18} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm font-medium mb-1">Название *</label><input type="text" required className="w-full border p-2.5 rounded-lg text-gray-900" value={name} onChange={e => setName(e.target.value)} /></div>
                        <div><label className="block text-sm font-medium mb-1">Бренд</label><input type="text" className="w-full border p-2.5 rounded-lg text-gray-900" value={brand} onChange={e => setBrand(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium mb-1">Цена *</label><input type="number" required className="w-full border p-2.5 rounded-lg text-gray-900" value={price} onChange={e => setPrice(e.target.value)} /></div>
                        <div><label className="block text-sm font-medium mb-1">Остаток</label><input type="number" className="w-full border p-2.5 rounded-lg text-gray-900" value={stock} onChange={e => setStock(e.target.value)} /></div>
                        <div><label className="block text-sm font-medium mb-1">Категория</label><select className="w-full border p-2.5 rounded-lg text-gray-900 bg-white" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Фотографии (Ссылки)</label>
                         <div className="space-y-2">
                             {imageInputs.map((img, idx) => (
                                 <div key={idx} className="flex gap-2">
                                     <input type="text" className="w-full border p-2.5 rounded-lg text-gray-900" value={img} onChange={e => handleImageChange(idx, e.target.value)} placeholder="https://..." />
                                     {img && <img src={img} className="w-10 h-10 object-cover rounded border" alt=""/>}
                                     <button type="button" onClick={() => removeImageInput(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                             <button type="button" onClick={addImageInput} className="text-sm text-primary font-bold flex items-center"><Plus size={16} className="mr-1"/> Добавить фото</button>
                         </div>
                    </div>
                </div>
               </div>
               <div>
                   <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center">
                        {loading ? <span className="animate-spin h-5 w-5 border-2 border-white rounded-full"></span> : <><Save className="mr-2"/> Сохранить</>}
                   </button>
               </div>
          </form>
      ) : (
          <div>
              {!importData.length ? (
                  <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary" onClick={() => fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                      {loading ? <div className="py-10"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary mx-auto mb-4"></div><p>Анализ файла...</p></div> : 
                      <><UploadCloud size={48} className="text-blue-500 mb-4"/><h3 className="text-xl font-bold mb-2">Загрузите прайс-лист</h3><p className="text-gray-500 text-center max-w-lg">Ожидаются колонки: CODE, BRAND, NAME, PRICE, QNT, IMAGE (можно несколько через запятую)</p></>}
                  </div>
              ) : (
                  <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                              <span className="flex items-center text-sm font-bold text-gray-800"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"/>Новых: {importData.filter(i => i.status === 'new').length}</span>
                              <span className="flex items-center text-sm font-bold text-gray-800"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"/>Обновлений: {importData.filter(i => i.status === 'update').length}</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => setImportData([])} className="text-red-500 px-4 py-2 font-bold hover:bg-red-50 rounded">Отмена</button>
                              <button onClick={saveImport} disabled={loading} className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center"><Save size={18} className="mr-2"/> Импортировать</button>
                          </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 uppercase text-xs font-bold text-gray-600">
                                  <tr>
                                      <th className="p-3">Статус</th>
                                      <th className="p-3">Артикул</th>
                                      <th className="p-3">Бренд</th>
                                      <th className="p-3 w-1/5">Название</th>
                                      <th className="p-3">Цена</th>
                                      <th className="p-3">Фото</th>
                                      <th className="p-3 w-1/3">Авто</th>
                                      <th className="p-3"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {importData.filter(i => i.status !== 'unchanged').map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                          <td className="p-3">
                                              {item.status === 'new' && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">NEW</span>}
                                              {item.status === 'update' && <div className="flex flex-col"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold w-min">UPD</span><span className="text-[10px] text-gray-500 mt-1">{item.message}</span></div>}
                                          </td>
                                          <td className="p-3 font-mono font-bold text-gray-900">{item.part_number}</td>
                                          <td className="p-3 text-gray-800">{item.brand}</td>
                                          <td className="p-3 text-gray-800">{item.name}</td>
                                          <td className="p-3 text-gray-800">{item.price}</td>
                                          <td className="p-3">
                                              {item.images.length > 0 ? (
                                                  <div className="flex -space-x-2">
                                                      {item.images.slice(0,3).map((img, i) => (
                                                          <img key={i} src={img} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt=""/>
                                                      ))}
                                                      {item.images.length > 3 && <span className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">+{item.images.length - 3}</span>}
                                                  </div>
                                              ) : <span className="text-gray-400">-</span>}
                                          </td>
                                          <td className="p-3">
                                              <div className="flex flex-col gap-1">
                                                  {item.compatibleModels.length ? item.compatibleModels.map((m, mid) => (
                                                      <div key={mid} className={`px-2 py-1 rounded border text-xs font-mono flex items-center justify-between ${m.isComplete ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-gray-800'}`}>
                                                          <span className="line-clamp-1" title={m.originalStr}>{m.originalStr}</span>
                                                          {!m.isComplete && (
                                                              <span className="text-[10px] text-red-500 font-bold ml-2 whitespace-nowrap">
                                                                  Нет: {m.missingInfo.join(', ')}
                                                              </span>
                                                          )}
                                                      </div>
                                                  )) : <span className="text-gray-400 text-xs flex items-center"><AlertTriangle size={12} className="mr-1"/> Нет данных</span>}
                                              </div>
                                          </td>
                                          <td className="p-3"><button onClick={() => removeImportItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default AddProduct;