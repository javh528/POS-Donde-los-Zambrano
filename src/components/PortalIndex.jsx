import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleSelection } from './RoleSelection';
import { LoginScreen } from './LoginScreen';

/**
 * PortalIndex Component (Refactored 2-Step Architecture)
 * Coordinador del flujo UX de Inicio de Sesión:
 * - Paso 1: RoleSelection (Selección del Rol sin formularios)
 * - Paso 2: LoginScreen (Credenciales de Admin o Nombre/Jornada de Mesero)
 */
export const PortalIndex = () => {
  const { loginUser, selectShiftMode } = useApp();

  const [step, setStep] = useState(1); // 1: RoleSelection, 2: LoginScreen
  const [selectedRole, setSelectedRole] = useState(null); // 'MESERO' | 'ADMIN'

  // Handler: Role Selection in Step 1
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  // Handler: Back to Step 1
  const handleBackToRoleSelection = () => {
    setStep(1);
    setSelectedRole(null);
  };

  // Handler: Login Success from Step 2
  const handleLoginSuccess = (user, shiftMode) => {
    if (shiftMode) {
      selectShiftMode(shiftMode);
    }
    loginUser(user.role, user.name);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 relative z-10 overflow-y-auto">
      {/* Seamless Floating Container — no card box, directly on starry background */}
      <div className="w-full max-w-lg relative transition-all duration-300">
        {/* Subtle Background Accent Orbs */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <RoleSelection onSelectRole={handleSelectRole} />
        )}

        {/* Step 2: Login Screen */}
        {step === 2 && (
          <LoginScreen
            selectedRole={selectedRole}
            onBack={handleBackToRoleSelection}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </div>
  );
};
