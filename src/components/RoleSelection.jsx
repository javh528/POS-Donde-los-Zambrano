import React from 'react';
import { LogoZ } from './LogoZ';
import { UserCheck, ShieldCheck } from 'lucide-react';

/**
 * RoleSelection Component (Pantalla 1 - Paso 1)
 * UX/UI Minimalista enfocado exclusivamente en la selección del rol.
 * Completamente responsive — mobile-first.
 */
export const RoleSelection = ({ onSelectRole }) => {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-5 animate-fadeIn px-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex justify-center">
          <LogoZ size="large" className="drop-shadow-2xl" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans leading-tight">
            DONDE LOS <span className="text-[#E5A93C]">ZAMBRANO</span>
          </h1>
          <p className="text-xs font-semibold text-amber-400/90 tracking-wide uppercase mt-1">
            "Listos para atender"
          </p>
        </div>
      </div>

      {/* Pregunta Central */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-200">
          ¿Quién eres?
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Selecciona tu rol para continuar
        </p>
      </div>

      {/* Botones Grandes de Rol */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-1">
        {/* Mesero / Caja */}
        <button
          type="button"
          onClick={() => onSelectRole('MESERO')}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-[#2A1625]/80 text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 mb-2 sm:mb-3 shadow-[0_8px_25px_rgba(220,38,38,0.25)] border border-red-500/20 group-hover:border-red-500/50">
            <UserCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <span className="font-extrabold text-white text-sm sm:text-base tracking-wide group-hover:text-red-400 transition-colors">
            Mesero / Caja
          </span>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
            Toma de comandas
          </span>
        </button>

        {/* Administrador */}
        <button
          type="button"
          onClick={() => onSelectRole('ADMIN')}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-[#292215]/80 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 mb-2 sm:mb-3 shadow-[0_8px_25px_rgba(245,158,11,0.25)] border border-amber-500/20 group-hover:border-amber-500/50">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <span className="font-extrabold text-white text-sm sm:text-base tracking-wide group-hover:text-amber-400 transition-colors">
            Administrador
          </span>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
            Métricas &amp; Cierre
          </span>
        </button>
      </div>
    </div>
  );
};
