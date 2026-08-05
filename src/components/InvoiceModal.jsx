import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, FileText, User, DollarSign } from 'lucide-react';

export const InvoiceModal = ({ tableId, onClose }) => {
  const { tables, finalizeAndPayOrder, setCurrentView } = useApp();
  const table = tables.find((t) => t.id === tableId) || tables[0];

  const [customerName, setCustomerName] = useState(table.customerName || '');
  const [customerNit, setCustomerNit] = useState(table.customerNit || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const totalAmount = table.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const changeAmount = cashReceived ? Math.max(0, parseFloat(cashReceived) - totalAmount) : 0;

  const [formError, setFormError] = useState('');

  const handleFinalize = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName  = customerName.replace(/<[^>]*>?/gm, '').trim();
    const cleanNit   = customerNit.replace(/<[^>]*>?/gm, '').trim();
    const cleanPhone = customerPhone.replace(/\D/g, '').trim();

    if (!cleanName) {
      setFormError('⚠️ El Nombre Completo es obligatorio.');
      return;
    }
    if (!cleanNit) {
      setFormError('⚠️ La Cédula / NIT es obligatoria.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setFormError('⚠️ El número de Celular / WhatsApp es obligatorio (mínimo 7 dígitos).');
      return;
    }

    finalizeAndPayOrder(table.id, {
      method:       paymentMethod,
      customerName:  cleanName,
      customerNit:   cleanNit,
      customerPhone: cleanPhone,
    });
    setIsCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isCompleted ? (
          <>
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Facturación de Pedido</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">{table.name}</h2>
              <p className="text-xs text-slate-400">
                Total a cobrar:{' '}
                <span className="font-mono font-black text-amber-400">
                  ${totalAmount.toLocaleString('es-CO')} COP
                </span>
              </p>
            </div>

            {/* Order summary */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 max-h-32 overflow-y-auto space-y-1">
              {table.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-300">
                  <span>
                    <span className="font-bold text-amber-400">{item.qty}x</span> {item.name}
                  </span>
                  <span className="font-mono text-slate-400">${(item.price * item.qty).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>

            {formError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs font-bold text-red-300 animate-pulse">
                {formError}
              </div>
            )}

            <form onSubmit={handleFinalize} className="space-y-4">
              {/* Customer data */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Datos del Cliente para Facturación</span>
                  </span>
                  <span className="text-[10px] text-red-400 font-bold uppercase">* Todos obligatorios</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nombre Completo <span className="text-red-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="Ej. María Pérez"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Cédula / NIT <span className="text-red-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerNit}
                      onChange={(e) => {
                        setCustomerNit(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="Ej. 1098765432"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    📱 Celular / WhatsApp <span className="text-red-400 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Ej. 3001234567"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Nequi / Daviplata', 'Tarjeta'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash calculator */}
              {paymentMethod === 'Efectivo' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Paga Con</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Monto recibido"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Cambio</label>
                    <div className="text-lg font-black font-mono text-emerald-400 pt-2">
                      ${changeAmount.toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm payment */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-3.5 px-4 rounded-xl shadow-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRMAR PAGO Y REGISTRAR VENTA</span>
              </button>
            </form>
          </>
        ) : (
          /* ── Post-payment: only success message + back button ── */
          <div className="space-y-6 text-center py-6">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">¡Venta Registrada Exitosamente!</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                La mesa fue liberada y la venta ingresó al cierre diario.<br />
                <span className="text-xs text-slate-500">
                  Puedes imprimir o reenviar la factura desde el Dashboard de Ventas.
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                setCurrentView('TABLES');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Volver al Control de Mesas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
