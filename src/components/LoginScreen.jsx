import React, { useState } from 'react';
import { LogoZ } from './LogoZ';
import { authenticateAdmin, authenticateWaitstaff, recoverAdminPassword } from '../services/authService';
import { ArrowLeft, Sun, Moon, Lock, User, AlertCircle, Loader2, ShieldCheck, KeyRound, CheckCircle, X } from 'lucide-react';

/**
 * LoginScreen Component (Paso 2 de Autenticación)
 * - Rol Mesero: Solo nombre (OBLIGATORIO) + Selección de Jornada.
 * - Rol Admin: Usuario Carlos Zambrano + Clave en Firestore con opción de Recuperación.
 */
export const LoginScreen = ({ selectedRole, onBack, onLoginSuccess }) => {
  // State for Waitstaff / Mesero
  const [waitstaffName, setWaitstaffName] = useState('');
  const [shiftMode, setShiftMode]         = useState('FAST_FOOD'); // 'FAST_FOOD' (Noche) | 'LUNCH' (Tarde)

  // State for Admin
  const [username, setUsername] = useState('carlos.zambrano');
  const [password, setPassword] = useState('');

  // Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPin, setRecoveryPin]             = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [recoveryError, setRecoveryError]         = useState('');
  const [recoverySuccess, setRecoverySuccess]     = useState('');
  const [isRecovering, setIsRecovering]           = useState(false);

  // UI Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  // Submit Handler for Mesero
  const handleWaitstaffSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!waitstaffName.trim()) {
      setErrorMsg('Debes ingresar tu nombre obligatoriamente para iniciar turno.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authenticateWaitstaff(waitstaffName, shiftMode);
      if (response.success) {
        onLoginSuccess(response.user, shiftMode);
      } else {
        setErrorMsg(response.error || 'No se pudo iniciar el turno.');
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Admin
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Ingresa el usuario de administrador.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Ingresa la contraseña de administrador.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authenticateAdmin(username, password);
      if (response.success) {
        onLoginSuccess(response.user, 'FAST_FOOD');
      } else {
        setErrorMsg(response.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for Password Recovery
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryPin.trim()) {
      setRecoveryError('Ingresa tu número de Cédula o PIN de recuperación.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setRecoveryError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsRecovering(true);

    try {
      const res = await recoverAdminPassword(recoveryPin, newPassword);
      if (res.success) {
        setRecoverySuccess(res.message);
        setPassword(newPassword); // Pre-llenar clave nueva
        setTimeout(() => {
          setShowRecoveryModal(false);
          setRecoverySuccess('');
          setRecoveryPin('');
          setNewPassword('');
        }, 2200);
      } else {
        setRecoveryError(res.error || 'No se pudo verificar el PIN de recuperación.');
      }
    } catch (err) {
      setRecoveryError('Error de conexión al procesar la solicitud.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fadeIn relative">
      {/* Header Navigation & Role Status */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Cambiar de rol</span>
        </button>

        <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
          selectedRole === 'ADMIN'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-red-500/20 text-red-300 border-red-500/40'
        }`}>
          {selectedRole === 'ADMIN' ? '👑 Administrador' : '🍽️ Mesero / Turno'}
        </span>
      </div>

      {/* Title Header */}
      <div className="text-center space-y-1">
        <LogoZ size="small" className="mx-auto mb-2" />
        <h2 className="text-2xl font-black text-white">
          {selectedRole === 'ADMIN' ? 'Acceso Administrador' : 'Ingreso de Mesero'}
        </h2>
        <p className="text-xs text-slate-400">
          {selectedRole === 'ADMIN'
            ? 'Panel de control de Carlos Zambrano'
            : 'Escribe tu nombre y selecciona la jornada para empezar'}
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 bg-red-950/90 border border-red-500/60 p-3.5 rounded-xl text-red-200 text-xs font-semibold animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* ── FORM FOR MESERO ── */}
      {selectedRole === 'MESERO' && (
        <form onSubmit={handleWaitstaffSubmit} className="space-y-5">
          {/* Input Nombre Obligatorio */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tu Nombre</span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-normal">* Obligatorio</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={waitstaffName}
                onChange={(e) => {
                  setWaitstaffName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ej. Julián (Ingresa tu nombre)"
                disabled={isSubmitting}
                autoFocus
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Selector de Jornada */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Jornada de Trabajo en este Turno
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShiftMode('LUNCH')}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                  shiftMode === 'LUNCH'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>☀️ Almuerzos</span>
              </button>

              <button
                type="button"
                onClick={() => setShiftMode('FAST_FOOD')}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                  shiftMode === 'FAST_FOOD'
                    ? 'bg-red-600/20 border-red-500 text-red-300 shadow-md ring-1 ring-red-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                <Moon className="w-4 h-4 text-red-400" />
                <span>🌙 Comidas Rápidas</span>
              </button>
            </div>
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-4 px-6 rounded-2xl shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-base uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>INICIANDO TURNO...</span>
              </>
            ) : (
              <span>EMPEZAR TURNO COMO MESERO</span>
            )}
          </button>
        </form>
      )}

      {/* ── FORM FOR ADMINISTRADOR ── */}
      {selectedRole === 'ADMIN' && (
        <form onSubmit={handleAdminSubmit} className="space-y-5">
          {/* Card del Administrador Único */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Administrador General</div>
              <div className="text-sm font-black text-white truncate">Carlos Zambrano</div>
            </div>
          </div>

          {/* Input Usuario */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Usuario de Administrador
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="carlos.zambrano"
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Input Contraseña + Enlace de Recuperación */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(true);
                  setRecoveryError('');
                  setRecoverySuccess('');
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                <span>¿Olvidaste tu clave?</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ingresa tu contraseña"
                disabled={isSubmitting}
                autoFocus
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Botón Principal Admin */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>VALIDANDO ACCESO...</span>
              </>
            ) : (
              <span>INGRESAR AL PANEL ADMIN</span>
            )}
          </button>
        </form>
      )}

      {/* ── RECOVERY MODAL FOR ADMIN ── */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
              <KeyRound className="w-4 h-4" />
              <span>Restablecer Contraseña — Admin</span>
            </div>

            <h3 className="text-xl font-black text-white">Recuperar Clave de Carlos Zambrano</h3>
            <p className="text-xs text-slate-400">
              Ingresa tu número de cédula registrado o PIN maestro para restablecer la contraseña en la base de datos Firestore.
            </p>

            {recoveryError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Número de Cédula o PIN de Recuperación
                </label>
                <input
                  type="text"
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  placeholder="Ej. 76320887"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Escribe tu nueva clave"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isRecovering}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRecovering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>RESTABLECIENDO...</span>
                  </>
                ) : (
                  <span>ACTUALIZAR CLAVE EN BASE DE DATOS</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
