import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Receipt, Trash2, Printer, UtensilsCrossed, DollarSign, PhoneCall } from 'lucide-react';
import { generateKitchenTicket } from '../utils/kitchenTicket';

export const TableGrid = ({ onOpenInvoice }) => {
  const {
    tables,
    shiftMode,
    userRole,
    openTableOrder,
    clearTable,
    markTableServed,
    markTableBilling,
    qrAlerts,
    acceptQrAlert,
    dismissQrAlert,
  } = useApp();

  const handlePrintKitchenTicket = (table) => {
    const doc = generateKitchenTicket(table, shiftMode);
    doc.autoPrint();
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  const visibleTables = tables.filter((t) => typeof t.id === 'number' && t.id >= 1 && t.id <= 10);

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 z-10 relative flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto min-h-0">

      {/* ── QR Alert Banner ── */}
      {qrAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 border border-red-500/80 rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shrink-0">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                  ¡NUEVO PEDIDO QR!
                </span>
                <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{alert.tableName}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {alert.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')} — ${alert.total.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => acceptQrAlert(alert.id)}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all whitespace-nowrap"
            >
              Aceptar Pedido
            </button>
            <button
              onClick={() => dismissQrAlert(alert.id)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all whitespace-nowrap"
            >
              Ignorar
            </button>
          </div>
        </div>
      ))}

      {/* ── Legend Bar ── */}
      <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 shadow-sm shrink-0 gap-2">
        {/* Shift badge */}
        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap border ${
          shiftMode === 'LUNCH'
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        }`}>
          {shiftMode === 'LUNCH' ? '☀️ Almuerzos' : '🌙 Rápidas'}
        </span>

        {/* State dots */}
        <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />Libre
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Ocupada
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />Servida
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />Cobrar
          </span>
        </div>
      </div>

      {/* ── Tables Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pb-6">
        {visibleTables.map((table) => {
          const hasItems = table.items.length > 0;
          const isBilling = table.status === 'BILLING';
          const isServed = table.status === 'SERVED';
          const isOccupied = table.status === 'OCCUPIED' || (hasItems && !isServed && !isBilling);
          const isAvailable = !hasItems && table.status === 'AVAILABLE';
          const totalAmount = table.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

          let cardStyle = 'bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/60';
          let statusColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
          let statusLabel = 'LIBRE';
          let statusPulse = false;

          if (isBilling) {
            cardStyle = 'bg-gradient-to-br from-yellow-950/60 via-slate-900 to-slate-900 border-2 border-yellow-400/80 shadow-[0_0_24px_rgba(250,204,21,0.3)]';
            statusColor = 'bg-yellow-400 text-slate-950 font-black';
            statusLabel = 'COBRAR';
            statusPulse = true;
          } else if (isServed) {
            cardStyle = 'bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-900 border-2 border-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.2)]';
            statusColor = 'bg-blue-600 text-white font-bold';
            statusLabel = 'SERVIDA';
          } else if (isOccupied) {
            cardStyle = 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-2 border-red-600/70 shadow-[0_0_20px_rgba(220,38,38,0.2)]';
            statusColor = 'bg-red-600 text-white font-bold';
            statusLabel = 'OCUPADA';
            statusPulse = true;
          }

          return (
            <div
              key={table.id}
              className={`rounded-2xl p-2.5 sm:p-3 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg border relative ${cardStyle}`}
            >
              {/* Card Header: Number + Status */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-xs">
                    {table.id}
                  </div>
                  <span className="font-extrabold text-white text-sm">Mesa {table.id}</span>
                </div>
                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md uppercase font-bold whitespace-nowrap ${statusColor} ${statusPulse ? 'animate-pulse' : ''}`}>
                  {statusLabel}
                </span>
              </div>

              {/* Items list or empty state */}
              <div className="flex-1 min-h-0">
                {hasItems ? (
                  <div className="bg-black/20 rounded-xl p-2 border border-white/5 space-y-1.5 max-h-[110px] sm:max-h-[130px] overflow-y-auto">
                    {table.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="truncate text-slate-300 pr-1">
                          <span className="font-bold text-amber-400">{item.qty}×</span> {item.name}
                        </span>
                        <span className="font-mono text-slate-400 whitespace-nowrap shrink-0">
                          ${(item.price * item.qty).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl text-slate-600 text-[11px]">
                    Disponible
                  </div>
                )}
              </div>

              {/* Total + Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {hasItems && (
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total</span>
                    <span className={`text-sm font-black font-mono ${isBilling ? 'text-yellow-400' : 'text-amber-400'}`}>
                      ${totalAmount.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}

                {/* LIBRE */}
                {isAvailable && (
                  <button
                    onClick={() => openTableOrder(table.id)}
                    className="w-full flex items-center justify-center gap-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold py-1.5 rounded-xl text-[11px] transition-all border border-emerald-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Comanda</span>
                  </button>
                )}

                {/* OCCUPIED */}
                {isOccupied && (
                  <>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => openTableOrder(table.id)}
                        className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-1.5 rounded-xl text-[10px] transition-all border border-white/10 whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handlePrintKitchenTicket(table)}
                        className="flex items-center justify-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 rounded-xl text-[10px] transition-all whitespace-nowrap"
                      >
                        <Printer className="w-3 h-3" /> Cocina
                      </button>
                    </div>
                    <button
                      onClick={() => markTableServed(table.id)}
                      className="w-full flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl text-[10px] transition-all whitespace-nowrap"
                    >
                      <UtensilsCrossed className="w-3 h-3" /> Marcar Servida
                    </button>
                    <button onClick={() => clearTable(table.id)} className="flex items-center justify-center gap-1 text-slate-600 hover:text-red-400 text-[9px] transition-colors">
                      <Trash2 className="w-3 h-3" /> Cancelar
                    </button>
                  </>
                )}

                {/* SERVED */}
                {isServed && (
                  <>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => openTableOrder(table.id)}
                        className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-1.5 rounded-xl text-[10px] transition-all border border-white/10 whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" /> Ítems
                      </button>
                      <button
                        onClick={() => markTableBilling(table.id)}
                        className="flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-1.5 rounded-xl text-[10px] transition-all whitespace-nowrap"
                      >
                        <DollarSign className="w-3 h-3" /> Cobrar
                      </button>
                    </div>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => onOpenInvoice(table.id)}
                        className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-1.5 rounded-xl text-[10px] transition-all whitespace-nowrap"
                      >
                        <Receipt className="w-3 h-3" /> Cobrar &amp; Facturar
                      </button>
                    )}
                    <button onClick={() => clearTable(table.id)} className="flex items-center justify-center gap-1 text-slate-600 hover:text-red-400 text-[9px] transition-colors">
                      <Trash2 className="w-3 h-3" /> Cancelar
                    </button>
                  </>
                )}

                {/* BILLING */}
                {isBilling && (
                  <>
                    {userRole === 'ADMIN' ? (
                      <button
                        onClick={() => onOpenInvoice(table.id)}
                        className="w-full flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-2 rounded-xl text-[11px] shadow-lg shadow-yellow-400/20 transition-all animate-pulse whitespace-nowrap"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Cobrar &amp; Facturar
                      </button>
                    ) : (
                      <div className="w-full text-center bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 font-bold py-1.5 rounded-xl text-[10px] uppercase animate-pulse">
                        Pendiente de pago
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <button onClick={() => openTableOrder(table.id)} className="text-[9px] text-slate-500 hover:text-white underline font-semibold transition-colors">
                        + Modificar
                      </button>
                      <button onClick={() => clearTable(table.id)} title="Liberar mesa" className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
