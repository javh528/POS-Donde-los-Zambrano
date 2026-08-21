import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { changeAdminPassword } from '../services/authService';
import { KeyRound, AlertTriangle, CheckCircle, X, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export const ChangePasswordModal = () => {
  const {
    showPasswordModal,
    setShowPasswordModal,
    passError,
    setPassError,
    passSuccess,
    setPassSuccess,
  } = useApp();

  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  if (!showPasswordModal) return null;

  const handleClose = () => {
    setShowPasswordModal(false);
    setPassError('');
    setPassSuccess('');
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
  };

  const handleChangePassSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    const cleanCurrent = currentPassInput.trim();
    const cleanNew = newPassInput.trim();
    const cleanConfirm = confirmPassInput.trim();

    if (!cleanCurrent) {
      setPassError('Ingresa tu contraseña actual.');
      return;
    }

    if (!cleanNew || cleanNew.length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (cleanConfirm && cleanNew !== cleanConfirm) {
      setPassError('Las contraseñas no coinciden. Verifica la confirmación.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await changeAdminPassword(cleanCurrent, cleanNew);
      if (res.success) {
        setPassSuccess(res.message || '¡Contraseña actualizada exitosamente en la base de datos!');
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setPassError(res.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      console.error('[ChangePasswordModal] Error:', err);
      setPassError('Error de conexión al actualizar la contraseña en Firestore.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
          <KeyRound className="w-4 h-4" />
          <span>Seguridad de Administrador</span>
        </div>

        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>Cambiar Contraseña BD</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Actualiza la clave de acceso de <strong className="text-slate-200">Carlos Zambrano (Admin)</strong> en la base de datos Firestore.
          </p>
        </div>

        {/* Mensaje de error */}
        {passError && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {/* Mensaje de éxito */}
        {passSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleChangePassSubmit} className="space-y-3.5 pt-1">
          {/* Contraseña Actual */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Contraseña Actual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                required
                value={currentPassInput}
                onChange={(e) => setCurrentPassInput(e.target.value)}
                placeholder="Ingresa tu clave actual"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={showNewPass ? 'text' : 'password'}
              value={confirmPassInput}
              onChange={(e) => setConfirmPassInput(e.target.value)}
              placeholder="Vuelve a escribir la nueva clave"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO EN FIRESTORE...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ACTUALIZAR CONTRASEÑA EN BD</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
