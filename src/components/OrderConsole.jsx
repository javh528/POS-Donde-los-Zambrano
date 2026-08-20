import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft, Plus, Minus, ShoppingBag, Edit3, Utensils,
  Printer, UtensilsCrossed, ChevronDown, ChevronUp, Layers, Eye, EyeOff, X, Info
} from 'lucide-react';
import { generateKitchenTicket } from '../utils/kitchenTicket';

export const OrderConsole = ({ onOpenInvoice }) => {
  const {
    activeTableId,
    tables,
    shiftMode,
    userRole,
    fastFoodMenu,
    lunchMenu,
    addItemToTable,
    updateItemQty,
    markTableServed,
    markTableBilling,
    setCurrentView,
  } = useApp();

  const activeTable = tables.find((t) => t.id === activeTableId) || tables[0];
  const [itemNote, setItemNote] = useState('');
  const [expandedDescIds, setExpandedDescIds] = useState({});
  const [showMobileOrderDrawer, setShowMobileOrderDrawer] = useState(false);

  // Collapsible section state
  const [sectionsState, setSectionsState] = useState({
    salchipapas: true,
    hamburguesas: true,
    sandwiches: true,
    hotdogs: true,
    adicionales: true,
    bebidas: true,
  });

  const toggleSection = (key) => {
    setSectionsState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (isOpen) => {
    setSectionsState({
      salchipapas: isOpen,
      hamburguesas: isOpen,
      sandwiches: isOpen,
      hotdogs: isOpen,
      adicionales: isOpen,
      bebidas: isOpen,
    });
  };

  const toggleDesc = (id) => {
    setExpandedDescIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  const getAddedQty = (itemId) => {
    const matching = activeTable.items.filter((i) => i.id === itemId);
    return matching.reduce((sum, i) => sum + (i.qty || 1), 0);
  };

  // Lunch available items
  const availableSoups = (lunchMenu.soups || []).filter(
    (s) => !(lunchMenu.disabledSoups || []).includes(s)
  );
  const availableProteins = (lunchMenu.proteins || []).filter(
    (p) => !(lunchMenu.disabledProteins || []).includes(p)
  );

  // Lunch Combo Configurator State
  const [lunchSoup, setLunchSoup] = useState(availableSoups[0] || (lunchMenu.soups && lunchMenu.soups[0]) || '');
  const [lunchProtein, setLunchProtein] = useState(availableProteins[0] || (lunchMenu.proteins && lunchMenu.proteins[0]) || '');
  const [lunchRice, setLunchRice] = useState(lunchMenu.sidesOptions[0].options[0]);
  const [lunchSalad, setLunchSalad] = useState(lunchMenu.sidesOptions[1].options[0]);
  const [lunchSide, setLunchSide] = useState(lunchMenu.sidesOptions[2].options[0]);
  const [lunchNoteCustom, setLunchNoteCustom] = useState('');

  // Fast Food Menu Data mapping
  const salchipapasTradicionales = fastFoodMenu.find((c) => c.category === 'Salchipapas')?.items || [];
  const salchipapasArmadas = fastFoodMenu.find((c) => c.category === 'Salchipapas Armadas')?.items || [];
  const salchipapasFamiliares = fastFoodMenu.find((c) => c.category === 'Salchipapas Familiares')?.items || [];
  const hamburguesasItems = fastFoodMenu.find((c) => c.category === 'Hamburguesas')?.items || [];
  const sandwichesItems = fastFoodMenu.find((c) => c.category === 'Sándwiches')?.items || [];
  const hotdogsItems = fastFoodMenu.find((c) => c.category === 'Hot Dogs')?.items || [];
  const adicionalesItems = fastFoodMenu.find((c) => c.category === 'Adicionales')?.items || [];
  const bebidasItems = fastFoodMenu.find((c) => c.category === 'Bebidas')?.items || [];

  const totalAmount = activeTable.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  const handleAddFastFoodItem = (item) => {
    addItemToTable(activeTable.id, { ...item, notes: itemNote.trim() });
    setItemNote('');
  };

  const handleAddLunchCombo = () => {
    const basePrice = lunchMenu.priceBase || 15000;
    const comboDescription = `Sopa: ${lunchSoup} | Seco: ${lunchProtein} (${lunchRice}, ${lunchSalad}, ${lunchSide})`;

    let notesText = comboDescription;
    if (lunchNoteCustom.trim()) {
      notesText += ` | Nota Especial: ${lunchNoteCustom.trim()}`;
    }

    const itemName = `Almuerzo: ${lunchProtein}`;

    addItemToTable(activeTable.id, {
      id: `almuerzo-${Date.now()}`,
      name: itemName,
      price: basePrice,
      notes: notesText,
      category: 'Almuerzos Caseros',
    });

    setLunchSoup(lunchMenu.soups[0]);
    setLunchProtein(lunchMenu.proteins[0]);
    setLunchRice(lunchMenu.sidesOptions[0].options[0]);
    setLunchSalad(lunchMenu.sidesOptions[1].options[0]);
    setLunchSide(lunchMenu.sidesOptions[2].options[0]);
    setLunchNoteCustom('');
  };

  const handlePrintKitchen = () => {
    const doc = generateKitchenTicket(activeTable, shiftMode);
    doc.autoPrint();
    const url = doc.output('bloburl');
    window.open(url, '_blank');
  };

  // Helper para renderizar filas de producto ultra-compactas (2 toques máximo)
  const renderCompactRow = (item, hoverBorderClass = 'hover:border-amber-500/50') => {
    const qty = getAddedQty(item.id);
    const isExpanded = expandedDescIds[item.id];

    return (
      <div
        key={item.id}
        className={`rounded-xl border transition-all ${
          qty > 0
            ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
            : `bg-slate-950/70 border-slate-800/80 ${hoverBorderClass}`
        }`}
      >
        <div className="flex items-center justify-between p-2 px-3 gap-2 min-h-[48px]">
          {/* Nombre + Ícono Info */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span
              onClick={() => item.description && toggleDesc(item.id)}
              className="text-xs font-bold text-white truncate cursor-pointer hover:text-amber-300 transition-colors"
            >
              {item.name}
            </span>
            {item.description && (
              <button
                type="button"
                onClick={() => toggleDesc(item.id)}
                className="text-[10px] text-slate-400 hover:text-amber-400 p-0.5 rounded-full shrink-0 cursor-pointer"
                title="Ver detalles"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Precio + Control de Adición Rápida (Touch Target 44px) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-black text-amber-400">
              ${item.price.toLocaleString('es-CO')}
            </span>

            {qty > 0 ? (
              <div className="flex items-center gap-1 bg-slate-900 border border-amber-500/50 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const idx = activeTable.items.findIndex((i) => i.id === item.id);
                    if (idx >= 0) updateItemQty(activeTable.id, idx, -1);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-white rounded-md font-black text-xs transition-colors cursor-pointer"
                  title="Restar 1"
                >
                  −
                </button>
                <span className="font-mono font-black text-xs text-amber-300 w-5 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddFastFoodItem(item)}
                  className="w-7 h-7 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md font-black text-xs transition-colors cursor-pointer"
                  title="Sumar 1"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleAddFastFoodItem(item)}
                className="w-8 h-8 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-black rounded-lg text-sm transition-all flex items-center justify-center border border-slate-700 hover:border-amber-400 shadow-sm cursor-pointer shrink-0"
                title={`Agregar ${item.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Descripción Bajo Demanda */}
        {isExpanded && item.description && (
          <div className="px-3 pb-2 pt-0 text-[11px] text-slate-400 border-t border-slate-800/50 mt-1 italic">
            {item.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden relative pb-16 lg:pb-0">

      {/* ── Top Header Bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('TABLES')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all shadow cursor-pointer shrink-0"
            title="Volver al control de mesas"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Atrás</span>
          </button>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2 leading-tight">
              {activeTable.name}
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-600/30 text-red-400 border border-red-500/40 rounded-full">
                Toma de Comanda
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{shiftMode === 'LUNCH' ? '☀️ Almuerzos Caseros' : '🌙 Comidas Rápidas'}</span>
              <span>·</span>
              <span className="font-mono text-amber-400 font-bold">${totalAmount.toLocaleString('es-CO')}</span>
            </p>
          </div>
        </div>

        {/* Acciones principales del Header */}
        <div className="flex items-center gap-2">
          {activeTable.items.length > 0 && (
            <>
              <button
                onClick={handlePrintKitchen}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-1.5 px-3 rounded-xl text-xs transition-colors shadow"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Imprimir Cocina</span>
              </button>

              {userRole === 'ADMIN' ? (
                <button
                  onClick={() => onOpenInvoice(activeTable)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Facturar / Cobrar</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    markTableServed(activeTable.id);
                    markTableBilling(activeTable.id);
                    setCurrentView('TABLES');
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-1.5 px-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Servida / Dejar Pendiente</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>


      {/* ── MAIN CONTENT: Menu List + Sidebar ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT / CENTER: Menu Scrollable Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
          
          {shiftMode === 'LUNCH' ? (
            /* ─ CONFIGURADOR DE ALMUERZO CASERO ─ */
            <div id="sec-almuerzos" className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <span>☀️ Armado de Almuerzo Casero</span>
                    </h3>
                    <p className="text-xs text-slate-400">Selecciona sopa, seco, acompañamientos, bebida y adicionales</p>
                  </div>
                  <span className="text-sm font-mono font-black text-amber-300 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30">
                    Base: ${lunchMenu.priceBase.toLocaleString('es-CO')}
                  </span>
                </div>

                {/* Sopa + Proteína */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="text-base">🥣</span> 1. Sopa del Día
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {availableSoups.map((soup) => (
                        <button
                          key={soup}
                          onClick={() => setLunchSoup(soup)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                            lunchSoup === soup
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                              : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800'
                          }`}
                        >
                          {soup}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="text-base">🥩</span> 2. Proteína (Seco)
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {availableProteins.map((prot) => (
                        <button
                          key={prot}
                          onClick={() => setLunchProtein(prot)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                            lunchProtein === prot
                              ? 'bg-red-600 text-white border-red-500 font-bold shadow-md'
                              : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800'
                          }`}
                        >
                          {prot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acompañamientos */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-3">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="text-base">🍚</span> 3. Acompañamientos
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Arroz</div>
                      <select
                        value={lunchRice}
                        onChange={(e) => setLunchRice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {lunchMenu.sidesOptions[0].options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Ensalada</div>
                      <select
                        value={lunchSalad}
                        onChange={(e) => setLunchSalad(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {lunchMenu.sidesOptions[1].options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Grano / Papa</div>
                      <select
                        value={lunchSide}
                        onChange={(e) => setLunchSide(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {lunchMenu.sidesOptions[2].options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nota + Botón agregar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={lunchNoteCustom}
                      onChange={(e) => setLunchNoteCustom(e.target.value)}
                      placeholder="Nota especial (ej: sin cebolla, sin sal, término medio)..."
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddLunchCombo}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      + Agregar Almuerzo (
                      ${(lunchMenu.priceBase || 15000).toLocaleString('es-CO')}
                      )
                    </span>
                  </button>
                </div>
              </div>

              {/* ── CARTA DE BEBIDAS Y GASEOSAS / JUGOS EN ALMUERZO ── */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🥤</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        BEBIDAS (GASEOSAS, JUGOS HIT Y JUGOS NATURALES)
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-mono">
                          {bebidasItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Agrega bebidas por separado a la cuenta de la mesa</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {bebidasItems.map((item) => renderCompactRow(item, 'hover:border-blue-500/50'))}
                  </div>
                </div>
              </div>
            </div>

          ) : (
            /* ─ CARTA DIGITAL CONTINUA (FILAS COMPACTAS - HIGH SPEED) ─ */
            <div className="space-y-4 max-w-5xl mx-auto">

              {/* Toolbar: Quick Note + Expand/Collapse Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md">
                <div className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    placeholder="Nota rápida para el próximo ítem (ej: sin cebolla, salsa extra)..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setAllSections(true)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-[11px] transition-colors border border-slate-700 cursor-pointer"
                    title="Desplegar todas las categorías"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Desplegar Todo</span>
                  </button>
                  <button
                    onClick={() => setAllSections(false)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-[11px] transition-colors border border-slate-700 cursor-pointer"
                    title="Ocultar todas las categorías"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Colapsar</span>
                  </button>
                </div>
              </div>

              {/* 1. SECCIÓN: SALCHIPAPAS */}
              <div id="sec-salchipapas" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('salchipapas')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍟</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        SALCHIPAPAS
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {salchipapasTradicionales.length + salchipapasArmadas.length + salchipapasFamiliares.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Tradicionales • Ármala como quieras • Familiares</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.salchipapas ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.salchipapas ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.salchipapas && (
                  <div className="p-3.5 space-y-3.5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                      {/* Tradicionales */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                        <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
                          <span>🍟 Tradicionales</span>
                          <span className="text-[9px] text-slate-500 font-mono">{salchipapasTradicionales.length} ítems</span>
                        </h4>
                        <div className="space-y-1.5">
                          {salchipapasTradicionales.map((item) => renderCompactRow(item, 'hover:border-red-500/50'))}
                        </div>
                      </div>

                      {/* Armadas & Familiares */}
                      <div className="space-y-3">
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                          <div className="border-b border-slate-800 pb-1.5">
                            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                              🔥 Ármala como quieras
                            </h4>
                            <p className="text-[9px] font-bold text-red-400 uppercase leading-none mt-0.5">
                              Pollo, Carne, Chorizo, Tocineta, Chicharrón
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {salchipapasArmadas.map((item) => renderCompactRow(item, 'hover:border-amber-500/50'))}
                          </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                          <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                            👨‍👩‍👧‍👦 Salchipapas Familiares
                          </h4>
                          <div className="space-y-1.5">
                            {salchipapasFamiliares.map((item) => renderCompactRow(item, 'hover:border-amber-500/50'))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SECCIÓN: HAMBURGUESAS */}
              <div id="sec-hamburguesas" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('hamburguesas')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍔</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        HAMBURGUESAS
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {hamburguesasItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Carne artesanal, pollo, queso derretido y tocineta</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.hamburguesas ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.hamburguesas ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.hamburguesas && (
                  <div className="p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hamburguesasItems.map((item) => renderCompactRow(item, 'hover:border-amber-500/50'))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. SECCIÓN: SÁNDWICHES */}
              <div id="sec-sandwiches" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('sandwiches')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🥪</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        SÁNDWICHES
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {sandwichesItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Pan baguette tostado, pollo, champiñones y especialidad Caliche</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.sandwiches ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.sandwiches ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.sandwiches && (
                  <div className="p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sandwichesItems.map((item) => renderCompactRow(item, 'hover:border-blue-500/50'))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. SECCIÓN: HOT DOGS */}
              <div id="sec-hotdogs" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('hotdogs')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🌭</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        HOT DOGS
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {hotdogsItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Perros sencillos, americanos, tocineta, maíz y baño de queso</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.hotdogs ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.hotdogs ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.hotdogs && (
                  <div className="p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hotdogsItems.map((item) => renderCompactRow(item, 'hover:border-yellow-500/50'))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. SECCIÓN: ADICIONALES */}
              <div id="sec-adicionales" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('adicionales')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🥓</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        ADICIONALES
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {adicionalesItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Chorizo, tocineta, chicharrón, maíz, pollo y carne extra</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.adicionales ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.adicionales ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.adicionales && (
                  <div className="p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {adicionalesItems.map((item) => renderCompactRow(item, 'hover:border-emerald-500/50'))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6. SECCIÓN: BEBIDAS */}
              <div id="sec-bebidas" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleSection('bebidas')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🥤</span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        BEBIDAS
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                          {bebidasItems.length} opciones
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Jugos naturales en agua/leche, limonada, gaseosas y Hit</p>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    sectionsState.bebidas ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sectionsState.bebidas ? '−' : '+'}
                  </div>
                </button>

                {sectionsState.bebidas && (
                  <div className="p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {bebidasItems.map((item) => renderCompactRow(item, 'hover:border-cyan-500/50'))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* RIGHT: Order Summary Sidebar (Desktop View) */}
        <aside className="hidden lg:flex shrink-0 w-64 bg-slate-900/95 border-l border-slate-800 flex-col min-h-0 overflow-hidden shadow-xl">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-black text-white text-xs flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-red-500" />
              Resumen Comanda
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded-lg">
              {activeTable.items.length} ítems
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
            {activeTable.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-700" />
                <p className="text-slate-500 text-[11px]">
                  Comanda vacía.<br />Selecciona productos de la carta.
                </p>
              </div>
            ) : (
              activeTable.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-[11px] text-white leading-tight">{item.name}</span>
                    <span className="font-mono text-[11px] font-bold text-amber-400 whitespace-nowrap shrink-0">
                      ${(item.price * item.qty).toLocaleString('es-CO')}
                    </span>
                  </div>

                  {item.notes && (
                    <div className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-1 rounded-lg italic border border-slate-800 leading-snug">
                      {item.notes.length > 50 ? item.notes.slice(0, 50) + '…' : item.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 font-mono">
                      ${item.price.toLocaleString('es-CO')}/u
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateItemQty(activeTable.id, index, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono font-black text-xs text-white w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateItemQty(activeTable.id, index, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeTable.items.length > 0 && (
            <div className="shrink-0 border-t border-slate-800 px-3 py-3 space-y-2 bg-slate-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TOTAL:</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  ${totalAmount.toLocaleString('es-CO')}
                </span>
              </div>

              <button
                onClick={handlePrintKitchen}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>IMPRIMIR COCINA</span>
              </button>

              <button
                onClick={() => {
                  markTableServed(activeTable.id);
                  markTableBilling(activeTable.id);
                  setCurrentView('TABLES');
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>MARCAR SERVIDA</span>
              </button>

              {userRole === 'ADMIN' && (
                <button
                  onClick={() => onOpenInvoice(activeTable)}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-2 px-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>COBRAR &amp; FACTURAR</span>
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── STICKY MOBILE BOTTOM BAR (Thumb Zone para Meseros en Celular) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2.5 shadow-2xl flex items-center justify-between gap-2">
        <div
          onClick={() => setShowMobileOrderDrawer(true)}
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
        >
          <div className="relative p-2 bg-amber-500 text-slate-950 rounded-xl font-black shrink-0">
            <ShoppingBag className="w-4 h-4" />
            {activeTable.items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                {activeTable.items.length}
              </span>
            )}
          </div>
          <div className="truncate">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">
              {activeTable.name}
            </div>
            <div className="text-sm font-black text-amber-400 font-mono leading-tight mt-0.5">
              ${totalAmount.toLocaleString('es-CO')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowMobileOrderDrawer(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
          >
            🛒 Ver ({activeTable.items.length})
          </button>
          
          {activeTable.items.length > 0 && (
            <>
              <button
                onClick={handlePrintKitchen}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 rounded-xl text-xs shadow cursor-pointer"
                title="Imprimir Cocina"
              >
                <Printer className="w-4 h-4" />
              </button>

              {userRole === 'ADMIN' ? (
                <button
                  onClick={() => onOpenInvoice(activeTable)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow cursor-pointer whitespace-nowrap"
                >
                  Cobrar
                </button>
              ) : (
                <button
                  onClick={() => {
                    markTableServed(activeTable.id);
                    markTableBilling(activeTable.id);
                    setCurrentView('TABLES');
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs shadow cursor-pointer whitespace-nowrap"
                >
                  Servida / Pendiente
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE ORDER DRAWER / MODAL SLIDE-UP ── */}
      {showMobileOrderDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-white text-sm">
                  Comanda de {activeTable.name}
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {activeTable.items.length} ítems
                </span>
              </div>
              <button
                onClick={() => setShowMobileOrderDrawer(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body (Items List) */}
            <div className="p-3 flex-1 overflow-y-auto space-y-2">
              {activeTable.items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No hay productos en esta comanda.
                </div>
              ) : (
                activeTable.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-white">{item.name}</span>
                      <span className="font-mono text-xs font-black text-amber-400">
                        ${(item.price * item.qty).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded-lg italic border border-slate-800/80">
                        {item.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        ${item.price.toLocaleString('es-CO')}/u
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQty(activeTable.id, idx, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-white font-black rounded-lg text-sm cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono font-black text-xs text-white w-6 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateItemQty(activeTable.id, idx, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Comanda:</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  ${totalAmount.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handlePrintKitchen();
                    setShowMobileOrderDrawer(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Cocina</span>
                </button>

                {userRole === 'ADMIN' ? (
                  <button
                    onClick={() => {
                      setShowMobileOrderDrawer(false);
                      onOpenInvoice(activeTable);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Cobrar Factura</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMobileOrderDrawer(false);
                      markTableServed(activeTable.id);
                      markTableBilling(activeTable.id);
                      setCurrentView('TABLES');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Servida &amp; Pendiente</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
