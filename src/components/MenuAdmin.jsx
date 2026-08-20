import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Utensils, Plus, Search, Edit3, Trash2, CheckCircle2, XCircle,
  Sun, Moon, ShieldAlert, ArrowLeft, Power, X
} from 'lucide-react';

const FAST_FOOD_CATEGORY_OPTIONS = [
  'Salchipapas',
  'Salchipapas Armadas',
  'Salchipapas Familiares',
  'Hamburguesas',
  'Sándwiches',
  'Hot Dogs',
  'Adicionales',
  'Bebidas',
];

// Modal simple para agregar un item de almuerzo (solo nombre)
const LunchItemMiniModal = ({ title, placeholder, onSave, onClose }) => {
  const [value, setValue] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSave(value.trim());
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nombre *</label>
            <input
              type="text"
              autoFocus
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sección genérica de lista con toggle, botón agregar y eliminar
const LunchSection = ({ title, emoji, accentColor, items, disabledItems, onToggle, onAdd, onDelete, placeholder }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${accentColor}`}>
            <span>{emoji} {title}</span>
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">Sin opciones. Agrega una con el botón.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isAvailable = !disabledItems.includes(item);
              return (
                <div
                  key={item}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${
                    isAvailable
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-50'
                  }`}
                >
                  <span className="font-semibold text-xs text-white flex-1 min-w-0 truncate">{item}</span>
                  {/* Toggle disponibilidad */}
                  <button
                    onClick={() => onToggle(item)}
                    title={isAvailable ? 'Desactivar hoy' : 'Activar hoy'}
                    className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer shrink-0 ${
                      isAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full transition-all ${isAvailable ? 'bg-white' : 'bg-slate-500'}`} />
                  </button>
                  {/* Eliminar */}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      title="Eliminar permanentemente"
                      className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <LunchItemMiniModal
          title={`Agregar ${title}`}
          placeholder={placeholder}
          onSave={onAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export const MenuAdmin = () => {
  const {
    allAdminProducts,
    lunchMenu,
    toggleProductAvailability,
    saveAdminProduct,
    deleteAdminProduct,
    bulkToggleCategoryAvailability,
    updateLunchConfig,
    setCurrentView,
  } = useApp();

  const [activeSessionTab, setActiveSessionTab] = useState('FAST_FOOD');
  const [selectedFastFoodCat, setSelectedFastFoodCat] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  // Fast Food product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({
    id: '', name: '', category: 'Salchipapas', price: '', cost: '',
    description: '', image: '', session: 'FAST_FOOD', disponible_hoy: true,
  });

  // Fast Food filters (Excluye completamente cualquier producto de sesión LUNCH o categoría de almuerzo)
  const fastFoodProducts = useMemo(() =>
    allAdminProducts.filter((p) => {
      const isLunchSession = p.session === 'LUNCH';
      const isLunchCategory = p.category === 'Almuerzos Caseros' || p.category === 'Adicionales Almuerzo';
      const isLunchType = p.type === 'extra';
      return !isLunchSession && !isLunchCategory && !isLunchType;
    }), [allAdminProducts]);

  const fastFoodCategories = useMemo(() => {
    const set = new Set(fastFoodProducts.map((p) => p.category));
    return ['TODAS', ...Array.from(set).filter((cat) => cat !== 'Almuerzos Caseros' && cat !== 'Adicionales Almuerzo')];
  }, [fastFoodProducts]);

  const filteredFastFoodProducts = useMemo(() =>
    fastFoodProducts.filter((p) => {
      const matchCat = selectedFastFoodCat === 'TODAS' || p.category === selectedFastFoodCat;
      const matchQ = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    }), [fastFoodProducts, selectedFastFoodCat, searchQuery]);

  const totalFastFoodCount = fastFoodProducts.length;
  const availableFastFoodCount = fastFoodProducts.filter((p) => p.disponible_hoy !== false).length;
  const unavailableFastFoodCount = totalFastFoodCount - availableFastFoodCount;

  // Fast Food CRUD handlers
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setProductToEdit(product);
      setFormData({
        id: product.id, name: product.name, category: product.category,
        price: product.price, cost: product.cost || '', description: product.description || '',
        image: product.image || '', session: 'FAST_FOOD', disponible_hoy: product.disponible_hoy !== false,
      });
    } else {
      setProductToEdit(null);
      setFormData({
        id: '', name: '', session: 'FAST_FOOD',
        category: selectedFastFoodCat !== 'TODAS' ? selectedFastFoodCat : 'Salchipapas',
        price: '', cost: '', description: '', image: '', disponible_hoy: true,
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProductSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;
    await saveAdminProduct({
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name.trim(), category: formData.category.trim(),
      price: parseFloat(formData.price) || 0, cost: parseFloat(formData.cost) || 0,
      description: formData.description.trim(), image: formData.image.trim(),
      session: 'FAST_FOOD', type: 'product',
      disponible_hoy: formData.disponible_hoy, active: formData.disponible_hoy,
    });
    setShowProductModal(false);
  };

  // Lunch config helpers
  const makeToggler = (disabledKey) => (itemName) => {
    const current = lunchMenu[disabledKey] || [];
    const newList = current.includes(itemName)
      ? current.filter((x) => x !== itemName)
      : [...current, itemName];
    updateLunchConfig({ [disabledKey]: newList });
  };

  const makeAdder = (listKey) => async (newItem) => {
    const updated = [...(lunchMenu[listKey] || []), newItem];
    await updateLunchConfig({ [listKey]: updated });
  };

  const makeSidesAdder = (sideIndex) => async (newItem) => {
    const currentSides = JSON.parse(JSON.stringify(lunchMenu.sidesOptions || []));
    if (currentSides[sideIndex]) {
      currentSides[sideIndex].options.push(newItem);
      await updateLunchConfig({ sidesOptions: currentSides });
    }
  };

  const makeSidesDeleter = (sideIndex) => async (itemName) => {
    const currentSides = JSON.parse(JSON.stringify(lunchMenu.sidesOptions || []));
    if (currentSides[sideIndex]) {
      currentSides[sideIndex].options = currentSides[sideIndex].options.filter((o) => o !== itemName);
      await updateLunchConfig({ sidesOptions: currentSides });
    }
  };

  const makeSidesToggler = (sideIndex, disabledKey) => (itemName) => {
    const current = lunchMenu[disabledKey] || [];
    const newList = current.includes(itemName)
      ? current.filter((x) => x !== itemName)
      : [...current, itemName];
    updateLunchConfig({ [disabledKey]: newList });
  };

  const makeDeleter = (listKey) => async (itemName) => {
    const updated = (lunchMenu[listKey] || []).filter((x) => x !== itemName);
    await updateLunchConfig({ [listKey]: updated });
  };



  const handleUpdatePriceBase = (val) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) updateLunchConfig({ priceBase: num });
  };

  // Sides data
  const riceOptions = lunchMenu.sidesOptions?.[0]?.options || [];
  const saladOptions = lunchMenu.sidesOptions?.[1]?.options || [];
  const sideOptions = lunchMenu.sidesOptions?.[2]?.options || [];

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 z-10 relative flex-1 flex flex-col h-full min-h-0 overflow-y-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('DASHBOARD')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-amber-400" />
              <span>Administración de Menú &amp; Disponibilidad</span>
            </h1>
            <p className="text-xs text-slate-400">Gestión de platos disponibles hoy. Cambios instantáneos en la comanda.</p>
          </div>
        </div>

        {/* Botón nuevo producto solo visible en pestaña Rápidas */}
        {activeSessionTab === 'FAST_FOOD' && (
          <button onClick={() => handleOpenProductModal(null)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto Rápidas</span>
          </button>
        )}
      </div>

      {/* ── SELECTOR DE PESTAÑAS ── */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
        <button onClick={() => setActiveSessionTab('FAST_FOOD')}
          className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSessionTab === 'FAST_FOOD'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-900'
          }`}>
          <Moon className="w-4 h-4 text-blue-300" />
          <span>🌙 Comidas Rápidas ({totalFastFoodCount})</span>
        </button>
        <button onClick={() => setActiveSessionTab('LUNCH')}
          className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSessionTab === 'LUNCH'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-900'
          }`}>
          <Sun className="w-4 h-4" />
          <span>☀️ Almuerzos Caseros del Día</span>
        </button>
      </div>

      {/* ════════ PESTAÑA: COMIDAS RÁPIDAS ════════ */}
      {activeSessionTab === 'FAST_FOOD' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Rápidas</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">{totalFastFoodCount}</div>
              </div>
              <Utensils className="w-5 h-5 text-slate-500" />
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Disponibles Hoy</div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">{availableFastFoodCount}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase">Ocultos Hoy</div>
                <div className="text-xl font-black text-red-300 font-mono mt-0.5">{unavailableFastFoodCount}</div>
              </div>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>

          {/* Búsqueda y filtros por categoría */}
          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
              </div>
              {selectedFastFoodCat !== 'TODAS' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={() => bulkToggleCategoryAvailability(selectedFastFoodCat, true)}
                    className="flex-1 sm:flex-none bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <Power className="w-3.5 h-3.5" />
                    <span>Activar Todos</span>
                  </button>
                  <button onClick={() => bulkToggleCategoryAvailability(selectedFastFoodCat, false)}
                    className="flex-1 sm:flex-none bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <Power className="w-3.5 h-3.5" />
                    <span>Desactivar Todos</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {fastFoodCategories.map((cat) => (
                <button key={cat} onClick={() => setSelectedFastFoodCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedFastFoodCat === cat
                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Productos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-6 flex-1 min-h-0">
            {filteredFastFoodProducts.map((product) => {
              const isAvailable = product.disponible_hoy !== false;
              return (
                <div key={product.id}
                  className={`rounded-2xl p-3.5 transition-all duration-300 flex flex-col justify-between border shadow-lg ${
                    isAvailable ? 'bg-slate-900/70 border-slate-800 hover:border-blue-500/40' : 'bg-slate-950/90 border-slate-900 opacity-60'
                  }`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md uppercase tracking-wider">
                          {product.category}
                        </span>
                        <h3 className="font-extrabold text-white text-sm mt-1 leading-tight">{product.name}</h3>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                          {isAvailable ? 'Disponible' : 'Oculto'}
                        </span>
                        <button onClick={() => toggleProductAvailability(product.id, !isAvailable)}
                          className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center cursor-pointer ${
                            isAvailable ? 'bg-emerald-500 justify-end shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800 justify-start'
                          }`}>
                          <div className={`w-4 h-4 rounded-full ${isAvailable ? 'bg-white' : 'bg-slate-500'}`} />
                        </button>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 italic">{product.description}</p>
                    )}
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Precio Venta</div>
                      <div className="text-base font-black text-amber-400 font-mono">
                        ${product.price?.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleOpenProductModal(product)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setProductToDelete(product)}
                        className="p-2 bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ PESTAÑA: ALMUERZOS CASEROS ════════ */}
      {activeSessionTab === 'LUNCH' && (
        <div className="space-y-4 pb-6">

          {/* Precio base único */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">☀️ Precio Único del Almuerzo Ejecutivo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Todos los almuerzos tienen el mismo precio (sopa + seco + principio + bebida)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 font-bold">$</span>
              <input type="number" defaultValue={lunchMenu.priceBase || 15000}
                onBlur={(e) => handleUpdatePriceBase(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-base font-black text-amber-400 font-mono focus:outline-none focus:border-amber-400 text-right" />
            </div>
          </div>

          {/* Grid 2 columnas para las secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. SOPAS */}
            <LunchSection
              title="Sopas del Día"
              emoji="🥣"
              accentColor="text-amber-400"
              items={lunchMenu.soups || []}
              disabledItems={lunchMenu.disabledSoups || []}
              onToggle={makeToggler('disabledSoups')}
              onAdd={makeAdder('soups')}
              onDelete={makeDeleter('soups')}
              placeholder="Ej. Sancocho de Gallina Criolla"
            />

            {/* 2. PROTEÍNAS */}
            <LunchSection
              title="Proteínas / Secos del Día"
              emoji="🥩"
              accentColor="text-red-400"
              items={lunchMenu.proteins || []}
              disabledItems={lunchMenu.disabledProteins || []}
              onToggle={makeToggler('disabledProteins')}
              onAdd={makeAdder('proteins')}
              onDelete={makeDeleter('proteins')}
              placeholder="Ej. Carne Asada a la Plancha"
            />

            {/* 3. ARROZ */}
            <LunchSection
              title="Opciones de Arroz"
              emoji="🍚"
              accentColor="text-yellow-400"
              items={riceOptions}
              disabledItems={lunchMenu.disabledRice || []}
              onToggle={makeSidesToggler(0, 'disabledRice')}
              onAdd={makeSidesAdder(0)}
              onDelete={makeSidesDeleter(0)}
              placeholder="Ej. Arroz con Coco"
            />

            {/* 4. ENSALADA */}
            <LunchSection
              title="Opciones de Ensalada"
              emoji="🥗"
              accentColor="text-green-400"
              items={saladOptions}
              disabledItems={lunchMenu.disabledSalad || []}
              onToggle={makeSidesToggler(1, 'disabledSalad')}
              onAdd={makeSidesAdder(1)}
              onDelete={makeSidesDeleter(1)}
              placeholder="Ej. Ensalada Verde de la Casa"
            />

            {/* 5. PRINCIPIO / GRANO */}
            <LunchSection
              title="Principio / Grano"
              emoji="🥔"
              accentColor="text-orange-400"
              items={sideOptions}
              disabledItems={lunchMenu.disabledSide || []}
              onToggle={makeSidesToggler(2, 'disabledSide')}
              onAdd={makeSidesAdder(2)}
              onDelete={makeSidesDeleter(2)}
              placeholder="Ej. Frijoles Rojos Guisados"
            />

            {/* 6. BEBIDAS (GASEOSAS, JUGOS HIT Y JUGOS NATURALES) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🥤 Bebidas (Gaseosas, Jugos Hit y Jugos Naturales)</span>
                </h3>
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setFormData({
                      id: '',
                      name: '',
                      session: 'FAST_FOOD',
                      category: 'Bebidas',
                      price: '',
                      cost: '',
                      description: '',
                      image: '',
                      disponible_hoy: true,
                    });
                    setShowProductModal(true);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Bebida</span>
                </button>
              </div>

              {allAdminProducts.filter((p) => p.category === 'Bebidas').length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-2">Sin bebidas configuradas.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {allAdminProducts.filter((p) => p.category === 'Bebidas').map((bev) => {
                    const isAvailable = bev.disponible_hoy !== false;
                    return (
                      <div
                        key={bev.id}
                        className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isAvailable
                            ? 'bg-slate-950/80 border-slate-800'
                            : 'bg-slate-950/40 border-slate-900 opacity-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="font-semibold text-xs text-white truncate">{bev.name}</div>
                          <div className="text-[11px] font-mono font-bold text-amber-400">
                            ${bev.price?.toLocaleString('es-CO')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Toggle Disponibilidad */}
                          <button
                            onClick={() => toggleProductAvailability(bev.id, !isAvailable)}
                            title={isAvailable ? 'Desactivar hoy' : 'Activar hoy'}
                            className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
                              isAvailable ? 'bg-emerald-500 justify-end shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-700 justify-start'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full transition-all ${isAvailable ? 'bg-white' : 'bg-slate-500'}`} />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenProductModal(bev)}
                            title="Editar precio/datos"
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => setProductToDelete(bev)}
                            title="Eliminar bebida"
                            className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR PRODUCTO RÁPIDAS ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <span>{productToEdit ? 'Editar Producto' : 'Crear Producto - Comidas Rápidas'}</span>
              </h2>
              <button onClick={() => setShowProductModal(false)}
                className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Producto *</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Salchipapa Especial Zambrano"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría *</label>
                  <select value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-bold">
                    {FAST_FOOD_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio Venta ($) *</label>
                  <input type="number" required value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ej. 15900"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción</label>
                <textarea rows="2" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredientes, detalles..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Disponible Hoy</div>
                  <div className="text-[10px] text-slate-400">Mostrar en la comanda del mesero</div>
                </div>
                <button type="button"
                  onClick={() => setFormData({ ...formData, disponible_hoy: !formData.disponible_hoy })}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center cursor-pointer ${
                    formData.disponible_hoy ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">¿Eliminar Producto?</h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Estás seguro de eliminar <span className="text-white font-bold">"{productToDelete.name}"</span>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setProductToDelete(null)}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                Cancelar
              </button>
              <button onClick={async () => { await deleteAdminProduct(productToDelete.id); setProductToDelete(null); }}
                className="py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow cursor-pointer">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
