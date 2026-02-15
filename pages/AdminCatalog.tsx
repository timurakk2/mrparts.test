import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Product, CarModel, Compatibility } from '../types';
import { fetchProducts } from '../services/productsService';
import { fetchDynamicCarTree, formatCarString, parseCarString } from '../services/carTreeService';
import { Search, Save, Trash2, Edit2, Image as ImageIcon, Filter, CheckCircle, XCircle, RefreshCw, Car, Plus, X, List, Sliders, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminCatalog: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // --- CAR TREE DATA (For dropdowns) ---
  const [carTree, setCarTree] = useState<CarModel[]>([]);

  // --- EDIT MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'compatibility' | 'specs'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [specsList, setSpecsList] = useState<{key: string, value: string}[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>([]);
  
  // Compatibility Builder State
  const [newCarMode, setNewCarMode] = useState<'select' | 'manual'>('select');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedGenId, setSelectedGenId] = useState('');
  const [selectedModId, setSelectedModId] = useState('');
  
  const [manualModel, setManualModel] = useState('');
  const [manualYears, setManualYears] = useState('');
  const [manualMod, setManualMod] = useState('');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!authLoading && !user) {
        navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    const [prodData, treeData] = await Promise.all([
        fetchProducts(),
        fetchDynamicCarTree()
    ]);
    setProducts(prodData);
    setFilteredProducts(prodData);
    setCarTree(treeData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = products;
    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = q.replace(/[^a-z0-9а-яё]/g, '');
        
        result = result.filter(p => {
             const nameMatch = (p.name || '').toLowerCase().includes(q);
             const descMatch = (p.description || '').toLowerCase().includes(q);
             const brandMatch = (p.brand || '').toLowerCase().includes(q);
             const catMatch = (p.category || '').toLowerCase().includes(q);
             const rawPart = p.part_number ? p.part_number.toLowerCase() : '';
             const cleanPart = rawPart.replace(/[^a-z0-9]/g, '');
             const partMatch = rawPart.includes(q) || (cleanQ.length > 2 && cleanPart.includes(cleanQ));
             
             return nameMatch || partMatch || descMatch || brandMatch || catMatch;
        });
    }
    if (categoryFilter) {
        result = result.filter(p => p.category === categoryFilter);
    }
    setFilteredProducts(result);
  }, [searchQuery, categoryFilter, products]);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]));

  // --- ACTIONS ---

  const openEditModal = (product: Product) => {
      setEditingId(product.id);
      setFormData({
          ...product,
          compatibility: product.compatibility ? [...product.compatibility] : []
      });
      // Specs
      const specsArr = Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value }));
      setSpecsList(specsArr);
      
      // Images
      let imgs = product.images || [];
      if (imgs.length === 0) imgs = [''];
      setImageInputs(imgs);

      setActiveTab('general');
      setSaveStatus('idle');
      
      // Reset builder
      setSelectedModelId('');
      setSelectedGenId('');
      setSelectedModId('');
      setManualModel('');
      setManualYears('');
      setManualMod('');
      
      setIsModalOpen(true);
  };

  const closeEditModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
  };

  const handleFieldChange = (field: keyof Product, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- IMAGES LOGIC ---
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

  // --- COMPATIBILITY LOGIC ---

  const removeCompatItem = (index: number) => {
      setFormData(prev => {
          const newCompat = [...(prev.compatibility || [])];
          newCompat.splice(index, 1);
          return { ...prev, compatibility: newCompat };
      });
  };

  const addCompatItem = () => {
      let finalString = '';

      if (newCarMode === 'select') {
          if (!selectedModelId || !selectedGenId || !selectedModId) return;
          const model = carTree.find(m => m.id === selectedModelId);
          const gen = model?.generations.find(g => g.id === selectedGenId);
          const mod = gen?.modifications.find(m => m.id === selectedModId);
          
          if (model && gen && mod) {
              finalString = formatCarString(model.name, gen.name, mod.name);
          }
      } else {
          if (!manualModel || !manualYears || !manualMod) return;
          finalString = formatCarString(manualModel, manualYears, manualMod);
      }

      if (finalString) {
          setFormData(prev => {
              const current = prev.compatibility || [];
              if (current.some(c => c.model === finalString)) return prev;
              return {
                  ...prev,
                  compatibility: [...current, { model: finalString, years: [] }]
              };
          });
          setSelectedModId('');
          setManualMod('');
      }
  };

  // --- SPECIFICATIONS LOGIC ---

  const addSpecRow = () => {
      setSpecsList([...specsList, { key: '', value: '' }]);
  };

  const updateSpecRow = (index: number, field: 'key' | 'value', val: string) => {
      const newList = [...specsList];
      newList[index][field] = val;
      setSpecsList(newList);
  };

  const removeSpecRow = (index: number) => {
      setSpecsList(specsList.filter((_, i) => i !== index));
  };

  // --- SAVE ---

  const handleSave = async () => {
      if (!editingId) return;
      setSaveStatus('saving');

      // Convert specs array back to object
      const cleanSpecs: Record<string, string> = {};
      specsList.forEach(item => {
          if (item.key.trim()) cleanSpecs[item.key.trim()] = item.value.trim();
      });

      // Clean Images
      const cleanImages = imageInputs.filter(url => url.trim() !== '');

      try {
          const { error } = await supabase
              .from('products')
              .update({
                  name: formData.name,
                  part_number: formData.part_number,
                  brand: formData.brand,
                  price: Number(formData.price),
                  stock: Number(formData.stock),
                  images: cleanImages,     // Save all to new field
                  category: formData.category,
                  description: formData.description,
                  compatibility: formData.compatibility,
                  specifications: cleanSpecs
              })
              .eq('id', editingId);

          if (error) throw error;

          // Update local state
          const updatedProduct = { 
              ...formData, 
              specifications: cleanSpecs, 
              images: cleanImages, 
              id: editingId 
          } as Product;
          
          setProducts(prev => prev.map(p => p.id === editingId ? updatedProduct : p));
          setFilteredProducts(prev => prev.map(p => p.id === editingId ? updatedProduct : p));

          setSaveStatus('success');
          setTimeout(() => {
              closeEditModal();
          }, 1000);
      } catch (err) {
          console.error(err);
          setSaveStatus('error');
      }
  };

  const deleteProduct = async (id: string) => {
      if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          setProducts(prev => prev.filter(p => p.id !== id));
          setFilteredProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
          console.error(err);
          alert('Ошибка удаления: ' + (err as any).message);
      }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1";

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
          <Edit2 className="mr-3 text-primary" /> Редактор базы данных
          <span className="ml-4 text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-normal">
              Всего товаров: {products.length}
          </span>
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-grow max-w-lg">
             <input 
                type="text" 
                placeholder="Поиск по названию или артикулу..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary text-gray-900 bg-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <div className="relative min-w-[200px]">
              <select 
                className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white text-gray-900"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                  <option value="">Все категории</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold">
                  <tr>
                      <th className="p-4 w-16">Фото</th>
                      <th className="p-4">Артикул</th>
                      <th className="p-4 w-1/3">Название</th>
                      <th className="p-4">Категория</th>
                      <th className="p-4 w-24">Цена</th>
                      <th className="p-4 w-20">Ост.</th>
                      <th className="p-4 w-32 text-right">Действия</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                              <img src={product.images && product.images[0] ? product.images[0] : ''} alt="" className="w-10 h-10 object-cover rounded bg-gray-100 border border-gray-200" />
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-gray-500">
                              {product.part_number}
                          </td>
                          <td className="p-4">
                              <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.brand}</div>
                          </td>
                          <td className="p-4 text-sm">
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{product.category}</span>
                          </td>
                          <td className="p-4 font-bold text-gray-800">{product.price} ₽</td>
                          <td className="p-4">
                              <span className={`font-bold text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {product.stock}
                              </span>
                          </td>
                          <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                  <button onClick={() => openEditModal(product)} className="text-blue-500 hover:bg-blue-50 p-2 rounded">
                                      <Edit2 size={16}/>
                                  </button>
                                  <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                      <Trash2 size={16}/>
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                      <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">
                              Товары не найдены
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Редактирование товара</h2>
                        <p className="text-sm text-gray-500 font-mono">{formData.part_number}</p>
                      </div>
                      <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 px-6">
                      <button 
                        onClick={() => setActiveTab('general')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          Основное
                      </button>
                      <button 
                        onClick={() => setActiveTab('compatibility')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'compatibility' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          <Car size={16} className="mr-2"/>
                          Применимость
                      </button>
                      <button 
                        onClick={() => setActiveTab('specs')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'specs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          <Sliders size={16} className="mr-2"/>
                          Характеристики
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-grow overflow-y-auto p-6 bg-white">
                      {activeTab === 'general' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="col-span-2 md:col-span-1 space-y-4">
                                  <div>
                                      <label className={labelClass}>Название</label>
                                      <input type="text" className={inputClass} value={formData.name} onChange={e => handleFieldChange('name', e.target.value)} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className={labelClass}>Артикул</label>
                                          <input type="text" className={inputClass} value={formData.part_number} onChange={e => handleFieldChange('part_number', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className={labelClass}>Бренд</label>
                                          <input type="text" className={inputClass} value={formData.brand} onChange={e => handleFieldChange('brand', e.target.value)} />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className={labelClass}>Цена</label>
                                          <input type="number" className={inputClass} value={formData.price} onChange={e => handleFieldChange('price', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className={labelClass}>Остаток</label>
                                          <input type="number" className={inputClass} value={formData.stock} onChange={e => handleFieldChange('stock', e.target.value)} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className={labelClass}>Категория</label>
                                      <input type="text" className={inputClass} value={formData.category} onChange={e => handleFieldChange('category', e.target.value)} />
                                  </div>
                              </div>
                              <div className="col-span-2 md:col-span-1 space-y-4">
                                  <div>
                                      <label className={labelClass}>Фотографии</label>
                                      <div className="space-y-2">
                                          {imageInputs.map((img, idx) => (
                                              <div key={idx} className="flex gap-2">
                                                  <input 
                                                    type="text" 
                                                    className={inputClass} 
                                                    value={img} 
                                                    onChange={e => handleImageChange(idx, e.target.value)}
                                                    placeholder="https://..."
                                                  />
                                                  {img && <img src={img} className="w-10 h-10 object-cover rounded border" alt="" />}
                                                  <button onClick={() => removeImageInput(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                              </div>
                                          ))}
                                          <button onClick={addImageInput} className="text-sm text-primary font-bold flex items-center mt-2"><Plus size={16} className="mr-1"/> Добавить фото</button>
                                      </div>
                                  </div>
                                  <div>
                                      <label className={labelClass}>Описание</label>
                                      <textarea className="w-full border border-gray-300 p-2 rounded-lg h-32 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={formData.description} onChange={e => handleFieldChange('description', e.target.value)} />
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* ... (Compatibility and Specs tabs remain same) ... */}
                      {activeTab === 'compatibility' && (
                          <div className="space-y-6">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center">
                                      <Plus size={16} className="mr-2 text-primary"/> Добавить совместимость
                                  </h3>
                                  
                                  <div className="flex gap-4 mb-3 text-sm">
                                      <label className="flex items-center cursor-pointer">
                                          <input type="radio" checked={newCarMode === 'select'} onChange={() => setNewCarMode('select')} className="mr-2 text-primary"/>
                                          Из базы
                                      </label>
                                      <label className="flex items-center cursor-pointer">
                                          <input type="radio" checked={newCarMode === 'manual'} onChange={() => setNewCarMode('manual')} className="mr-2 text-primary"/>
                                          Создать новую
                                      </label>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                      {newCarMode === 'select' ? (
                                          <>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Модель</label>
                                                  <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" value={selectedModelId} onChange={e => { setSelectedModelId(e.target.value); setSelectedGenId(''); setSelectedModId(''); }}>
                                                      <option value="">Выбрать...</option>
                                                      {carTree.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Года</label>
                                                  <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" value={selectedGenId} onChange={e => { setSelectedGenId(e.target.value); setSelectedModId(''); }} disabled={!selectedModelId}>
                                                      <option value="">Выбрать...</option>
                                                      {carTree.find(m => m.id === selectedModelId)?.generations.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Модификация</label>
                                                  <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" value={selectedModId} onChange={e => setSelectedModId(e.target.value)} disabled={!selectedGenId}>
                                                      <option value="">Выбрать...</option>
                                                      {carTree.find(m => m.id === selectedModelId)?.generations.find(g => g.id === selectedGenId)?.modifications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                  </select>
                                              </div>
                                          </>
                                      ) : (
                                          <>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Модель</label>
                                                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" placeholder="Renault Kiger" value={manualModel} onChange={e => setManualModel(e.target.value)} />
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Годы</label>
                                                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" placeholder="2021-..." value={manualYears} onChange={e => setManualYears(e.target.value)} />
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Двиг.</label>
                                                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900" placeholder="1.0 SCe" value={manualMod} onChange={e => setManualMod(e.target.value)} />
                                              </div>
                                          </>
                                      )}
                                      <button onClick={addCompatItem} className="bg-primary text-white p-2 rounded text-sm font-bold hover:bg-primary-dark border border-transparent">
                                          Добавить
                                      </button>
                                  </div>
                              </div>
                              <div>
                                  <h3 className="font-bold text-sm text-gray-700 mb-2">Текущая применимость ({formData.compatibility?.length || 0})</h3>
                                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                      {formData.compatibility?.map((compat, idx) => {
                                          const parsed = parseCarString(compat.model);
                                          return (
                                              <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50 text-sm">
                                                  <div>
                                                      <div className="font-bold text-gray-800">{parsed.modelName} <span className="font-normal text-gray-500">{parsed.yearRange}</span></div>
                                                      <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1 rounded">{parsed.volume} {parsed.valves} {parsed.engine}</div>
                                                  </div>
                                                  <button onClick={() => removeCompatItem(idx)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeTab === 'specs' && (
                          <div>
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-sm text-gray-700">Параметры</h3>
                                  <button onClick={addSpecRow} className="text-primary text-sm font-bold flex items-center"><Plus size={16} className="mr-1"/> Добавить поле</button>
                              </div>
                              <div className="space-y-2">
                                  {specsList.map((spec, idx) => (
                                      <div key={idx} className="flex gap-2">
                                          <input type="text" className="flex-1 border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={spec.key} onChange={e => updateSpecRow(idx, 'key', e.target.value)} />
                                          <input type="text" className="flex-1 border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={spec.value} onChange={e => updateSpecRow(idx, 'value', e.target.value)} />
                                          <button onClick={() => removeSpecRow(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                      <button onClick={closeEditModal} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition-colors">Отмена</button>
                      <button onClick={handleSave} disabled={saveStatus === 'saving'} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center">
                          {saveStatus === 'saving' && <RefreshCw className="animate-spin mr-2" size={16} />}
                          {saveStatus === 'success' ? 'Сохранено!' : 'Сохранить изменения'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminCatalog;