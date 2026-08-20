import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LogoZ } from './LogoZ';
import {
  Sun, Moon, LayoutGrid, BarChart3, LogOut,
  UserCheck, Bell, Cloud, CloudOff, Loader, Utensils, Building2,
  KeyRound, ChevronDown,
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
    setShowPasswordModal,
    setPassError,
    setPassSuccess,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar el dropdown si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (userRole === 'NONE') return null;

  const isLunch = shiftMode === 'LUNCH';

  return (
    <header className="sticky top-0 z-40 bg-[#080C17]/95 backdrop-blur-lg border-b border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 gap-2 max-w-7xl mx-auto">

        {/* ── Brand ── */}
        <button
          onClick={() => setCurrentView('TABLES')}
          className="flex items-center gap-2 shrink-0 group cursor-pointer"
        >
          <LogoZ size="small" />
          <div className="leading-none text-left">
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
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              currentView === 'TABLES' || currentView === 'ORDER'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Control de Mesas"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {userRole === 'ADMIN' && (
            <>
              <button
                onClick={() => setCurrentView('DASHBOARD')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  currentView === 'DASHBOARD'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Ventas y Métricas"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ── User Dropdown ── */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">{userName}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Menú de Administración</p>
                </div>
                {userRole === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => { setCurrentView('CORPORATE'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-blue-600/20 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>🏢 Cuentas Empresariales</span>
                    </button>
                    <button
                      onClick={() => { setCurrentView('MENU_ADMIN'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <span>⚙️ Menú y Disponibilidad</span>
                    </button>
                    <button
                      onClick={() => {
                        if (setShowPasswordModal) {
                          setShowPasswordModal(true);
                          if (setPassError) setPassError('');
                          if (setPassSuccess) setPassSuccess('');
                        }
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      <span>🔑 Cambiar Clave BD</span>
                    </button>
                    <div className="border-t border-slate-800 my-1" />
                  </>
                )}
                <button
                  onClick={() => { logoutUser(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout — visible solo en mobile donde no hay dropdown */}
          <button
            onClick={logoutUser}
            title="Cerrar Sesión"
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all md:hidden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
