import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { StarryBackground } from './components/StarryBackground';
import { Navbar } from './components/Navbar';
import { PortalIndex } from './components/PortalIndex';
import { TableGrid } from './components/TableGrid';
import { OrderConsole } from './components/OrderConsole';
import { DailyDashboard } from './components/DailyDashboard';
import { MenuAdmin } from './components/MenuAdmin';
import { CorporateAccounts } from './components/CorporateAccounts';
import { InvoiceModal } from './components/InvoiceModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Footer } from './components/Footer';
import './App.css';

function MainApp() {
  const { userRole, currentView } = useApp();
  const [activeInvoiceTableId, setActiveInvoiceTableId] = useState(null);

  const handleOpenInvoice = (tableId) => {
    setActiveInvoiceTableId(tableId);
  };

  const handleCloseInvoice = () => {
    setActiveInvoiceTableId(null);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative bg-[#090D18] bg-gradient-to-br from-[#090D18] via-[#0D1426] to-[#080C16]">
      {/* Subtle Starry Cosmic Background */}
      <StarryBackground />

      {/* Persistent Navigation Header */}
      <Navbar />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {userRole === 'NONE' || currentView === 'PORTAL' ? (
          <div className="flex-1 overflow-auto flex flex-col"><PortalIndex /></div>
        ) : currentView === 'TABLES' ? (
          <div className="flex-1 overflow-auto"><TableGrid onOpenInvoice={handleOpenInvoice} /></div>
        ) : currentView === 'ORDER' ? (
          <OrderConsole onOpenInvoice={handleOpenInvoice} />
        ) : currentView === 'MENU_ADMIN' ? (
          userRole === 'ADMIN' ? (
            <div className="flex-1 overflow-auto"><MenuAdmin /></div>
          ) : (
            <div className="flex-1 overflow-auto"><TableGrid onOpenInvoice={handleOpenInvoice} /></div>
          )
        ) : currentView === 'CORPORATE' ? (
          userRole === 'ADMIN' ? (
            <div className="flex-1 overflow-auto"><CorporateAccounts /></div>
          ) : (
            <div className="flex-1 overflow-auto"><TableGrid onOpenInvoice={handleOpenInvoice} /></div>
          )
        ) : currentView === 'DASHBOARD' ? (
          userRole === 'ADMIN' ? (
            <div className="flex-1 overflow-auto"><DailyDashboard /></div>
          ) : (
            <div className="flex-1 overflow-auto"><TableGrid onOpenInvoice={handleOpenInvoice} /></div>
          )
        ) : (
          <div className="flex-1 overflow-auto"><TableGrid onOpenInvoice={handleOpenInvoice} /></div>
        )}
      </main>

      {/* Persistent Footer with Developer Credentials */}
      <Footer />

      {/* Invoice Modal Overlay */}
      {activeInvoiceTableId && (
        <InvoiceModal
          tableId={activeInvoiceTableId}
          onClose={handleCloseInvoice}
        />
      )}

      {/* Global Change Password Modal Overlay */}
      <ChangePasswordModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
