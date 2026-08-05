import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateInvoicePDF, shareInvoiceViaWhatsApp } from '../utils/pdfGenerator';
import { changeAdminPassword } from '../services/authService';
import {
  BarChart3, DollarSign, ShoppingBag, Sun, Moon, Printer,
  TrendingUp, TrendingDown, Award, AlertTriangle, Star,
  Zap, Package, Clock, Filter, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownRight, Minus as MinusIcon, KeyRound, Lock, X, CheckCircle, Loader2, Search
} from 'lucide-react';

/* ── WhatsApp Icon ── */
const WhatsAppIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

/* ── KPI Card Component ── */
const KpiCard = ({ icon: Icon, label, value, sub, color = 'amber', trend = null, trendLabel = '' }) => {
  const colors = {
    amber: { bg: 'from-amber-950/60 to-slate-900', border: 'border-amber-500/30', icon: 'text-amber-400', val: 'text-amber-300' },
    blue: { bg: 'from-blue-950/60 to-slate-900', border: 'border-blue-500/30', icon: 'text-blue-400', val: 'text-blue-300' },
    emerald: { bg: 'from-emerald-950/60 to-slate-900', border: 'border-emerald-500/30', icon: 'text-emerald-400', val: 'text-emerald-300' },
    red: { bg: 'from-red-950/60 to-slate-900', border: 'border-red-500/30', icon: 'text-red-400', val: 'text-red-300' },
    violet: { bg: 'from-violet-950/60 to-slate-900', border: 'border-violet-500/30', icon: 'text-violet-400', val: 'text-violet-300' },
  };
  const c = colors[color] || colors.amber;
  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-4 shadow-lg relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-[10px] font-black uppercase tracking-widest ${c.icon}`}>{label}</p>
        <Icon className={`w-4 h-4 ${c.icon} opacity-70`} />
      </div>
      <div className={`text-2xl font-black ${c.val} font-mono leading-tight`}>{value}</div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-slate-400">{sub}</p>
        {trend !== null && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
            trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <MinusIcon className="w-3 h-3" />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Alert Badge ── */
const AlertBadge = ({ type, message }) => {
  const styles = {
    warning: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
    danger: 'bg-red-500/10 border-red-500/40 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    info: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
  };
  const icons = {
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    danger: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    success: <TrendingUp className="w-3.5 h-3.5 shrink-0" />,
    info: <Zap className="w-3.5 h-3.5 shrink-0" />,
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

/* ── Bar Chart (simple CSS bars) ── */
const SimpleBar = ({ label, value, max, color = 'bg-red-500' }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-8 shrink-0 text-right font-mono">{label}h</span>
      <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1.5`}
          style={{ width: `${pct}%` }}
        >
          {pct > 20 && (
            <span className="text-[9px] font-black text-white">{value}</span>
          )}
        </div>
      </div>
      {pct <= 20 && value > 0 && (
        <span className="text-[10px] font-mono text-slate-400 w-6">{value}</span>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════ */
export const DailyDashboard = () => {
  const { salesHistory } = useApp();
  const [filterShift, setFilterShift] = useState('ALL');
  const [showHistory, setShowHistory] = useState(false);

  /* ── Dates ── */
  const now = new Date();
  const todayStr = now.toLocaleDateString('es-CO');
  const yesterdayStr = new Date(now - 86400000).toLocaleDateString('es-CO');

  /* ── Helper: Smart classification of Lunch vs Fast Food ── */
  const isLunchItem = (item) =>
    item.category === 'Almuerzos Caseros' ||
    item.category === 'Adicionales Almuerzo' ||
    (item.id && String(item.id).startsWith('almuerzo-')) ||
    (item.notes && String(item.notes).includes('Sopa:'));

  const isLunchSale = (sale) =>
    sale.shiftMode === 'LUNCH' || (sale.items || []).some(isLunchItem);

  const isFastFoodSale = (sale) =>
    sale.shiftMode === 'FAST_FOOD' || (sale.items || []).some((i) => !isLunchItem(i));

  /* ── Filter sales by shift ── */
  const filteredSales = useMemo(
    () =>
      salesHistory.filter((s) => {
        if (filterShift === 'ALL') return true;
        if (filterShift === 'LUNCH') return isLunchSale(s);
        if (filterShift === 'FAST_FOOD') return isFastFoodSale(s);
        return true;
      }),
    [salesHistory, filterShift]
  );

  const [historySearchTerm, setHistorySearchTerm] = useState('');

  /* ── Sorted & Search-Filtered Sales History (Descending: Most Recent First) ── */
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : (parseInt(String(a.saleId || '').replace(/\D/g, '')) || 0);
      const tB = b.date ? new Date(b.date).getTime() : (parseInt(String(b.saleId || '').replace(/\D/g, '')) || 0);
      return tB - tA; // Descending (newest first)
    });
  }, [filteredSales]);

  const searchedSales = useMemo(() => {
    if (!historySearchTerm.trim()) return sortedSales;
    const term = historySearchTerm.trim().toLowerCase();
    return sortedSales.filter((sale) => {
      const nameMatch  = (sale.customerName || '').toLowerCase().includes(term);
      const nitMatch   = (sale.customerNit || '').toLowerCase().includes(term);
      const phoneMatch = (sale.customerPhone || '').toLowerCase().includes(term);
      const idMatch    = (sale.saleId || '').toLowerCase().includes(term);
      const tableMatch = (sale.tableName || '').toLowerCase().includes(term);
      const itemMatch  = (sale.items || []).some((i) => (i.name || '').toLowerCase().includes(term));
      return nameMatch || nitMatch || phoneMatch || idMatch || tableMatch || itemMatch;
    });
  }, [sortedSales, historySearchTerm]);

  /* ── Today's sales ── */
  const todaySales = useMemo(
    () =>
      filteredSales.filter((s) => {
        const sDate = new Date(s.date).toLocaleDateString('es-CO');
        return sDate === todayStr;
      }),
    [filteredSales, todayStr]
  );

  /* ── Yesterday's sales ── */
  const yesterdaySales = useMemo(
    () =>
      filteredSales.filter((s) => {
        const sDate = new Date(s.date).toLocaleDateString('es-CO');
        return sDate === yesterdayStr;
      }),
    [filteredSales, yesterdayStr]
  );

  /* ── Compute KPIs ── */
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const yesterdayRevenue = yesterdaySales.reduce((acc, s) => acc + s.total, 0);
  const totalOrders = filteredSales.length;
  const todayOrders = todaySales.length;
  const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const todayAvgTicket = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;

  /* ── Separate Metrics for Almuerzos vs Comidas Rápidas (calculadas sobre TODO el historial) ── */
  const lunchSales = useMemo(() => salesHistory.filter(isLunchSale), [salesHistory]);
  const fastFoodSales = useMemo(
    () => salesHistory.filter((s) => !isLunchSale(s) || (s.shiftMode === 'FAST_FOOD' && !isLunchSale(s))),
    [salesHistory]
  );

  // Item-level revenue calculation for pinpoint accuracy
  const lunchRevenue = useMemo(() => {
    let sum = 0;
    salesHistory.forEach((sale) => {
      if (sale.shiftMode === 'LUNCH') {
        sum += sale.total;
      } else {
        (sale.items || []).forEach((i) => {
          if (isLunchItem(i)) sum += (i.price * i.qty);
        });
      }
    });
    return sum;
  }, [salesHistory]);

  const fastFoodRevenue = useMemo(() => {
    let sum = 0;
    salesHistory.forEach((sale) => {
      if (sale.shiftMode === 'FAST_FOOD' && !isLunchSale(sale)) {
        sum += sale.total;
      } else {
        (sale.items || []).forEach((i) => {
          if (!isLunchItem(i)) sum += (i.price * i.qty);
        });
      }
    });
    return sum;
  }, [salesHistory]);

  /* ── vs Yesterday trend ── */
  const revenueTrend = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : null;

  /* ── Weekly avg (last 7 days) ── */
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const weekSales = filteredSales.filter((s) => new Date(s.date) >= sevenDaysAgo);
  const weekDailyAvg = weekSales.length > 0
    ? Math.round(weekSales.reduce((acc, s) => acc + s.total, 0) / 7)
    : 0;

  /* ── Product Metrics ── */
  const productMetrics = useMemo(() => {
    const map = {};
    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!map[item.name]) {
          map[item.name] = { name: item.name, qty: 0, revenue: 0, price: item.price };
        }
        map[item.name].qty += item.qty;
        map[item.name].revenue += item.price * item.qty;
      });
    });
    return Object.values(map);
  }, [filteredSales]);

  const sortedByQty = [...productMetrics].sort((a, b) => b.qty - a.qty);
  const sortedByRevenue = [...productMetrics].sort((a, b) => b.revenue - a.revenue);
  const topSeller = sortedByQty[0] || null;
  const topRevenue = sortedByRevenue[0] || null;
  const leastSold = sortedByQty.length > 0 ? sortedByQty[sortedByQty.length - 1] : null;

  /* ── Hourly Distribution for Bar Chart ── */
  const hourlyLunch = Array(12).fill(0); // 10h-21h → index 0=10, 1=11, ...
  const hourlyFastFood = Array(12).fill(0);
  salesHistory.forEach((s) => {
    const h = new Date(s.date).getHours();
    const idx = Math.min(Math.max(h - 10, 0), 11);
    if (s.shiftMode === 'LUNCH') hourlyLunch[idx]++;
    else hourlyFastFood[idx]++;
  });
  const maxHourly = Math.max(...hourlyLunch, ...hourlyFastFood, 1);

  /* ── Smart Alerts ── */
  const alerts = useMemo(() => {
    const list = [];
    if (todaySales.length === 0) {
      list.push({ type: 'warning', message: 'Sin pedidos registrados hoy todavía' });
    }
    if (revenueTrend !== null && revenueTrend < -20) {
      list.push({ type: 'danger', message: `Ventas hoy ${Math.abs(revenueTrend)}% por debajo de ayer` });
    }
    if (revenueTrend !== null && revenueTrend > 20) {
      list.push({ type: 'success', message: `🚀 Ventas hoy ${revenueTrend}% por encima de ayer` });
    }
    if (todayRevenue > weekDailyAvg && weekDailyAvg > 0) {
      list.push({ type: 'success', message: `Hoy supera el promedio semanal ($${weekDailyAvg.toLocaleString('es-CO')})` });
    }
    if (leastSold && leastSold.qty <= 1 && productMetrics.length > 3) {
      list.push({ type: 'info', message: `Poca rotación: "${leastSold.name}" (solo ${leastSold.qty} vendido)` });
    }
    if (avgTicket > 0 && todayAvgTicket > 0 && todayAvgTicket > avgTicket * 1.2) {
      list.push({ type: 'success', message: `Ticket promedio hoy ($${todayAvgTicket.toLocaleString('es-CO')}) supera el histórico` });
    }
    return list;
  }, [todaySales, revenueTrend, todayRevenue, weekDailyAvg, leastSold, productMetrics, avgTicket, todayAvgTicket]);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassInput, setCurrentPassInput]   = useState('');
  const [newPassInput, setNewPassInput]           = useState('');
  const [passError, setPassError]                 = useState('');
  const [passSuccess, setPassSuccess]             = useState('');
  const [isUpdatingPass, setIsUpdatingPass]       = useState(false);

  const handleChangePassSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassInput.trim()) {
      setPassError('Ingresa la contraseña actual.');
      return;
    }
    if (!newPassInput.trim() || newPassInput.length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await changeAdminPassword(currentPassInput, newPassInput);
      if (res.success) {
        setPassSuccess(res.message);
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassSuccess('');
          setCurrentPassInput('');
          setNewPassInput('');
        }, 2000);
      } else {
        setPassError(res.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      setPassError('Error al actualizar la contraseña en Firestore.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-5 space-y-5 z-10 relative">

      {/* ── TOP HEADER + SHIFT FILTER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>DASHBOARD DE VENTAS</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Decisiones en tiempo real · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>

        {/* Global Shift Filter + Admin Settings */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPassError('');
              setPassSuccess('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cambiar Clave BD</span>
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
            <button
              onClick={() => setFilterShift('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterShift === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambas ({salesHistory.length})
            </button>
            <button
              onClick={() => setFilterShift('LUNCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterShift === 'LUNCH' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ☀️ Almuerzos
            </button>
            <button
              onClick={() => setFilterShift('FAST_FOOD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterShift === 'FAST_FOOD' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌙 Rápidas
            </button>
          </div>
        </div>
      </div>

      {/* ── SMART ALERTS ── */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {alerts.map((a, i) => (
            <AlertBadge key={i} type={a.type} message={a.message} />
          ))}
        </div>
      )}

      {/* ── KPI CARDS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Ventas Totales"
          value={`$${totalRevenue.toLocaleString('es-CO')}`}
          sub={`${totalOrders} pedidos en total`}
          color="amber"
        />
        <KpiCard
          icon={TrendingUp}
          label="Ventas Hoy"
          value={`$${todayRevenue.toLocaleString('es-CO')}`}
          sub={`${todayOrders} pedidos hoy`}
          color="emerald"
          trend={revenueTrend}
          trendLabel={revenueTrend !== null ? `${revenueTrend > 0 ? '+' : ''}${revenueTrend}% vs ayer` : ''}
        />
        <KpiCard
          icon={Clock}
          label="Ticket Promedio"
          value={`$${avgTicket.toLocaleString('es-CO')}`}
          sub={`Hoy: $${todayAvgTicket.toLocaleString('es-CO')}`}
          color="violet"
        />
        <KpiCard
          icon={Sun}
          label="Almuerzos"
          value={`$${lunchRevenue.toLocaleString('es-CO')}`}
          sub={`${lunchSales.length} comandas`}
          color="amber"
        />
        <KpiCard
          icon={Moon}
          label="Comidas Rápidas"
          value={`$${fastFoodRevenue.toLocaleString('es-CO')}`}
          sub={`${fastFoodSales.length} comandas`}
          color="red"
        />
      </div>

      {/* ── COMPARISON ROW: Hoy vs Ayer vs Promedio Semanal ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Comparativa de Rendimiento
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '🗓️ Hoy', value: todayRevenue, orders: todayOrders, color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-950/20' },
            { label: '📅 Ayer', value: yesterdayRevenue, orders: yesterdaySales.length, color: 'text-slate-300', border: 'border-slate-700 bg-slate-900/40' },
            { label: '📊 Prom. Semanal', value: weekDailyAvg, orders: Math.round(weekSales.length / 7), color: 'text-blue-300', border: 'border-blue-500/30 bg-blue-950/20' },
          ].map((item) => (
            <div key={item.label} className={`${item.border} border rounded-xl p-3 text-center`}>
              <p className="text-[10px] text-slate-400 font-bold mb-1">{item.label}</p>
              <p className={`text-lg font-black font-mono ${item.color}`}>
                ${item.value.toLocaleString('es-CO')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.orders} pedidos</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID: Products + Hourly Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── PRODUCT CLASSIFICATION ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Package className="w-4 h-4 text-amber-400" />
            Clasificación de Productos
          </h3>

          {productMetrics.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Sin ventas registradas aún.</div>
          ) : (
            <div className="space-y-3">
              {/* 🏆 Más Vendido */}
              {topSeller && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">🏆 Más Vendido</p>
                    <p className="text-xs font-bold text-white truncate">{topSeller.name}</p>
                    <p className="text-[10px] text-slate-400">{topSeller.qty} und · ${topSeller.revenue.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-amber-400 font-mono">{topSeller.qty}u</div>
                  </div>
                </div>
              )}

              {/* 💰 Más Rentable */}
              {topRevenue && topRevenue.name !== topSeller?.name && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">💰 Más Rentable</p>
                    <p className="text-xs font-bold text-white truncate">{topRevenue.name}</p>
                    <p className="text-[10px] text-slate-400">{topRevenue.qty} und · ${topRevenue.revenue.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-emerald-400 font-mono">${topRevenue.revenue.toLocaleString('es-CO')}</div>
                  </div>
                </div>
              )}

              {/* 🐢 Menos Vendido */}
              {leastSold && leastSold.name !== topSeller?.name && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">🐢 Menos Vendido</p>
                    <p className="text-xs font-bold text-white truncate">{leastSold.name}</p>
                    <p className="text-[10px] text-slate-400">{leastSold.qty} und · ${leastSold.revenue.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-red-400 font-mono">{leastSold.qty}u</div>
                  </div>
                </div>
              )}

              {/* Full Product List (mini table) */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/60 px-3 py-1.5 grid grid-cols-12 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Producto</span>
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-4 text-right">Revenue</span>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {sortedByQty.map((prod, idx) => (
                    <div
                      key={prod.name}
                      className="px-3 py-1.5 grid grid-cols-12 items-center border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="col-span-1 text-[10px] text-slate-500 font-mono">{idx + 1}</span>
                      <span className="col-span-5 text-[11px] font-bold text-white truncate pr-1">{prod.name}</span>
                      <span className="col-span-2 text-center">
                        <span className="text-[11px] font-mono font-black text-amber-400">{prod.qty}</span>
                      </span>
                      <span className="col-span-4 text-right text-[10px] font-mono text-emerald-400 font-bold">
                        ${prod.revenue.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── HOURLY PEAK CHART ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            Gráfico de Horas Pico por Jornada
          </h3>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-[10px] text-slate-400 font-semibold">☀️ Almuerzos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-[10px] text-slate-400 font-semibold">🌙 Comidas Rápidas</span>
            </div>
          </div>

          {salesHistory.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-xs">Sin datos de horas pico aún.</div>
          ) : (
            <div className="space-y-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 10).map((h, idx) => (
                <div key={h} className="space-y-0.5">
                  {hourlyLunch[idx] > 0 && (
                    <SimpleBar label={h} value={hourlyLunch[idx]} max={maxHourly} color="bg-amber-500" />
                  )}
                  {hourlyFastFood[idx] > 0 && (
                    <SimpleBar label={h} value={hourlyFastFood[idx]} max={maxHourly} color="bg-red-500" />
                  )}
                  {hourlyLunch[idx] === 0 && hourlyFastFood[idx] === 0 && (
                    <SimpleBar label={h} value={0} max={maxHourly} color="bg-slate-700" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center">
              <p className="text-[9px] text-amber-400 font-black uppercase">Hora Pico Almuerzo</p>
              <p className="text-sm font-black text-amber-300 font-mono">
                {(() => {
                  const maxIdx = hourlyLunch.indexOf(Math.max(...hourlyLunch));
                  return hourlyLunch[maxIdx] > 0 ? `${maxIdx + 10}:00` : 'N/A';
                })()}
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-center">
              <p className="text-[9px] text-red-400 font-black uppercase">Hora Pico Noche</p>
              <p className="text-sm font-black text-red-300 font-mono">
                {(() => {
                  const maxIdx = hourlyFastFood.indexOf(Math.max(...hourlyFastFood));
                  return hourlyFastFood[maxIdx] > 0 ? `${maxIdx + 10}:00` : 'N/A';
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORIAL DE FACTURAS (Collapsible) ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-800/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Historial de Facturas para Impresión
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-mono">
              {searchedSales.length} {searchedSales.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
            showHistory ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {showHistory ? '−' : '+'}
          </div>
        </button>

        {showHistory && (
          <div className="p-4 border-t border-slate-800 space-y-3">
            {/* 🔍 Buscador de Facturas */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                placeholder="🔍 Buscar factura por nombre de cliente, teléfono, NIT, # de factura o mesa..."
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              {historySearchTerm && (
                <button
                  onClick={() => setHistorySearchTerm('')}
                  className="absolute right-3 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {searchedSales.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                {historySearchTerm
                  ? `No se encontraron facturas que coincidan con "${historySearchTerm}".`
                  : 'No hay facturas registradas en el filtro seleccionado.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {searchedSales.map((sale) => (
                  <div
                    key={sale.saleId}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-amber-400">#{sale.saleId}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          sale.shiftMode === 'LUNCH'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {sale.shiftMode === 'LUNCH' ? '☀️' : '🌙'} {sale.tableName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{sale.dateFormatted}</span>
                      </div>
                      <div className="text-xs text-white font-semibold mt-1">
                        {sale.customerName} · <span className="text-slate-400 font-normal">{sale.customerNit}</span>
                        {sale.customerPhone && (
                          <span className="text-slate-400 font-normal"> · Tel: {sale.customerPhone}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-md mt-0.5">
                        {(sale.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-mono font-black text-amber-400">
                          ${sale.total.toLocaleString('es-CO')}
                        </div>
                        <div className="text-[10px] text-slate-500">{sale.paymentMethod}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const doc = generateInvoicePDF(sale);
                            doc.save(`Factura_${sale.saleId}.pdf`);
                          }}
                          title="Reimprimir Factura PDF"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => shareInvoiceViaWhatsApp(sale, sale.customerPhone || '')}
                          title="Enviar por WhatsApp"
                          className="p-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl transition-colors border border-[#25D366]/40 cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
              <KeyRound className="w-4 h-4" />
              <span>Configuración de Administrador</span>
            </div>

            <h3 className="text-xl font-black text-white">Cambiar Contraseña en Firestore</h3>
            <p className="text-xs text-slate-400">
              Actualiza la contraseña del Administrador (Carlos Zambrano) directamente en la base de datos de la plataforma.
            </p>

            {passError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Ingresa tu clave actual"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Escribe la nueva clave"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPass}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO EN FIRESTORE...</span>
                  </>
                ) : (
                  <span>ACTUALIZAR CONTRASEÑA EN BD</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
