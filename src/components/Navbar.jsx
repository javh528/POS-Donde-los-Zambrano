import React from 'react';
import { useApp } from '../context/AppContext';
import { LogoZ } from './LogoZ';
import {
  Sun, Moon, LayoutGrid, BarChart3, LogOut,
  UserCheck, Bell, Cloud, CloudOff, Loader
} from 'lucide-react';

export const Navbar = () => {
  const {
    userRole,
    userName,
    shiftMode,
    currentView,
    setCurrentView,
    logoutUser,
    qrAlerts,
    firestoreStatus,
  } = useApp();

  if (userRole === 'NONE') return null;

  const isLunch = shiftMode === 'LUNCH';

  return (
    <header className="sticky top-0 z-40 bg-[#080C17]/95 backdrop-blur-lg border-b border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 gap-2 max-w-7xl mx-auto">

        {/* ── Brand ── */}
        <button
          onClick={() => setCurrentView('TABLES')}
          className="flex items-center gap-2 shrink-0 group"
        >
          <LogoZ size="small" />
          <div className="leading-none">
            {/* XS: solo "ZAMBRANO", sm+: full */}
            <div className="font-black tracking-tight text-white text-sm whitespace-nowrap">
              <span className="hidden xs:inline text-slate-300">DONDE LOS </span>
              <span className="text-[#E5A93C]">ZAMBRANO</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 whitespace-nowrap ${isLunch ? 'text-amber-400' : 'text-blue-400'}`}>
              {isLunch ? '☀️ Almuerzos' : '🌙 Rápidas'}
            </div>
          </div>
        </button>

        {/* ── Turno badge — desktop only ── */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shrink-0
          bg-slate-900/80 border-slate-700/60">
          {isLunch
            ? <><Sun className="w-3.5 h-3.5 text-amber-400" /><span className="text-[11px] font-black text-amber-400 uppercase tracking-wide">Almuerzos</span></>
            : <><Moon className="w-3.5 h-3.5 text-blue-400" /><span className="text-[11px] font-black text-blue-400 uppercase tracking-wide">Rápidas</span></>
          }
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-1 shrink-0">

          {/* QR Alert */}
          {qrAlerts.length > 0 && (
            <div className="relative p-2 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse text-red-400">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {qrAlerts.length}
              </span>
            </div>
          )}

          {/* Sync status */}
          {firestoreStatus === 'syncing' && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Loader className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}
          {firestoreStatus === 'synced' && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Cloud className="w-3.5 h-3.5" />
            </div>
          )}
          {firestoreStatus === 'error' && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <CloudOff className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Nav buttons */}
          <button
            onClick={() => setCurrentView('TABLES')}
            className={`p-2 rounded-lg transition-all ${
              currentView === 'TABLES' || currentView === 'ORDER'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Control de Mesas"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => setCurrentView('DASHBOARD')}
              className={`p-2 rounded-lg transition-all ${
                currentView === 'DASHBOARD'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Ventas y Métricas"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}

          {/* User — md+ */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-white">{userName}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logoutUser}
            title="Cerrar Sesión"
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
