import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2, Plus, ArrowLeft, Calendar, FileText, Download,
  Printer, MessageSquare, Trash2, Edit3, CheckCircle2, DollarSign,
  PackageCheck, X, User, Phone, MapPin, AlertCircle, Check, Utensils, Sun
} from 'lucide-react';
import { generateCuentaCobroPDF, DEFAULT_BILLING_REPRESENTATIVE } from '../utils/cuentaCobroPDF';
import { numberToWordsColombianPesos } from '../utils/numberToWordsEs';

export const CorporateAccounts = () => {
  const {
    companies,
    corporateConsumptions,
    saveCompany,
    deleteCompany,
    addCorporateConsumption,
    deleteCorporateConsumption,
    settleCorporateAccount,
    getCorporateInvoicesByCompanyFromFirestore,
    setCurrentView,
  } = useApp();

  // Active Selected Company
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return companies[0]?.id || 'comp-electrificadora';
  });

  // Modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  
  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'partial'
  const [paymentAmount, setPaymentAmount] = useState('');

  // Form State: Company Create / Edit
  const [companyForm, setCompanyForm] = useState({
    id: '',
    name: '',
    nit: '',
    phone: '',
    contactPerson: '',
    city: 'Popayán',
    pendingBalance: 0,
  });

  // Direct Inline Add Form State (Strictly Desayuno or Almuerzo)
  const todayIso = new Date().toISOString().slice(0, 10);
  const dateInputRef = useRef(null);
  const [inlineDate, setInlineDate] = useState(todayIso);
  const [inlineConceptType, setInlineConceptType] = useState('Desayuno'); // 'Desayuno' | 'Almuerzo'
  const [inlineQty, setInlineQty] = useState(1);
  const [inlineUnitPrice, setInlineUnitPrice] = useState(12000);
  const [inlineIsTakeout, setInlineIsTakeout] = useState(false);

  // Billing Config Form for PDF Generation
  const [billingConfig, setBillingConfig] = useState({
    city: 'Popayán',
    dateFormatted: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    payeeName: DEFAULT_BILLING_REPRESENTATIVE.payeeName,
    payeeCC: DEFAULT_BILLING_REPRESENTATIVE.payeeCC,
    signatureName: DEFAULT_BILLING_REPRESENTATIVE.signatureName,
    phone: DEFAULT_BILLING_REPRESENTATIVE.phone,
    address: DEFAULT_BILLING_REPRESENTATIVE.address,
    bankAccount: DEFAULT_BILLING_REPRESENTATIVE.bankAccount,
  });

  // Selected company object
  const activeCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Consumptions for active company
  const companyConsumptions = useMemo(() => {
    if (!activeCompany) return [];
    return corporateConsumptions
      .filter((c) => c.companyId === activeCompany.id)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [corporateConsumptions, activeCompany]);

  // Unpaid/Pending consumptions
  const pendingConsumptions = useMemo(() => {
    return companyConsumptions.filter((c) => c.status !== 'BILLED');
  }, [companyConsumptions]);

  // Grand Total of all pending consumptions + pending balance
  const grandTotal = useMemo(() => {
    const consumptionsTotal = pendingConsumptions.reduce((acc, c) => acc + (Number(c.totalPrice) || 0), 0);
    const prevBalance = Number(activeCompany?.pendingBalance) || 0;
    return consumptionsTotal + prevBalance;
  }, [pendingConsumptions, activeCompany]);

  // Total plates count
  const totalPlatesCount = useMemo(() => {
    return pendingConsumptions.reduce((acc, c) => acc + (Number(c.qty) || 1), 0);
  }, [pendingConsumptions]);

  // Inline calculated item total
  const calculatedInlineItemTotal = useMemo(() => {
    const unit = parseFloat(inlineUnitPrice) || 0;
    const extra = inlineIsTakeout ? 2000 : 0;
    const q = parseInt(inlineQty) || 1;
    return (unit + extra) * q;
  }, [inlineUnitPrice, inlineIsTakeout, inlineQty]);

  // Handle Concept selection: Desayuno vs Almuerzo
  const handleSelectConcept = (type) => {
    setInlineConceptType(type);
    if (type === 'Desayuno') {
      setInlineUnitPrice(12000);
    } else if (type === 'Almuerzo') {
      setInlineUnitPrice(10000);
    }
  };

  // Submit direct inline consumption
  const handleDirectAddConsumption = async (e) => {
    e.preventDefault();
    if (!activeCompany) return;

    const qty = parseInt(inlineQty) || 1;
    const baseUnit = parseFloat(inlineUnitPrice) || 0;
    const takeoutFee = inlineIsTakeout ? 2000 : 0;
    const effectiveUnitPrice = baseUnit + takeoutFee;
    const totalPrice = effectiveUnitPrice * qty;

    // Concept formatting: "1 Desayuno" vs "4 Desayunos" / "1 Almuerzo" vs "3 Almuerzos"
    const conceptPlural =
      inlineConceptType === 'Desayuno'
        ? (qty === 1 ? 'Desayuno' : 'Desayunos')
        : (qty === 1 ? 'Almuerzo' : 'Almuerzos');

    const dateParts = (inlineDate || todayIso).split('-');
    const shortDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}` : inlineDate;

    await addCorporateConsumption({
      companyId: activeCompany.id,
      companyName: activeCompany.name,
      date: inlineDate || todayIso,
      dateFormatted: shortDate,
      concept: conceptPlural,
      qty,
      unitPrice: effectiveUnitPrice,
      baseUnitPrice: baseUnit,
      isTakeout: inlineIsTakeout,
      takeoutExtra: takeoutFee,
      totalPrice,
      status: 'PENDING',
    });
  };

  // Open Company Modal
  const handleOpenCompanyModal = (company = null) => {
    if (company) {
      setCompanyToEdit(company);
      setCompanyForm({
        id: company.id,
        name: company.name,
        nit: company.nit || '',
        phone: company.phone || '',
        contactPerson: company.contactPerson || '',
        city: company.city || 'Popayán',
      });
    } else {
      setCompanyToEdit(null);
      setCompanyForm({
        id: '',
        name: '',
        nit: '',
        phone: '',
        contactPerson: '',
        city: 'Popayán',
      });
    }
    setShowCompanyModal(true);
  };

  // Save Company Submit
  const handleSaveCompanySubmit = async (e) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    const newCompany = await saveCompany({
      id: companyForm.id || `comp-${Date.now()}`,
      name: companyForm.name.trim().toUpperCase(),
      nit: companyForm.nit.trim(),
      phone: companyForm.phone.trim(),
      contactPerson: companyForm.contactPerson.trim(),
      city: companyForm.city.trim() || 'Popayán',
    });

    setSelectedCompanyId(newCompany.id);
    setShowCompanyModal(false);
  };

  // Open Preview Modal for Cuenta de Cobro
  const handleOpenCuentaCobroPreview = () => {
    if (!activeCompany) return;
    setBillingConfig({
      city: activeCompany.city || 'Popayán',
      dateFormatted: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      payeeName: DEFAULT_BILLING_REPRESENTATIVE.payeeName,
      payeeCC: DEFAULT_BILLING_REPRESENTATIVE.payeeCC,
      signatureName: DEFAULT_BILLING_REPRESENTATIVE.signatureName,
      phone: DEFAULT_BILLING_REPRESENTATIVE.phone,
      address: DEFAULT_BILLING_REPRESENTATIVE.address,
      bankAccount: DEFAULT_BILLING_REPRESENTATIVE.bankAccount,
    });
    setShowInvoicePreviewModal(true);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!activeCompany) return;

    const doc = generateCuentaCobroPDF({
      companyName: activeCompany.name,
      companyNit: activeCompany.nit,
      city: billingConfig.city,
      dateFormatted: billingConfig.dateFormatted,
      payeeName: billingConfig.payeeName,
      payeeCC: billingConfig.payeeCC,
      signatureName: billingConfig.signatureName,
      phone: billingConfig.phone,
      address: billingConfig.address,
      bankAccount: billingConfig.bankAccount,
      items: pendingConsumptions,
    });

    const sanitizedName = activeCompany.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
    doc.save(`Cuenta_de_Cobro_${sanitizedName}_${billingConfig.dateFormatted}.pdf`);
  };

  // Print PDF directly
  const handlePrintPDF = () => {
    if (!activeCompany) return;

    const doc = generateCuentaCobroPDF({
      companyName: activeCompany.name,
      companyNit: activeCompany.nit,
      city: billingConfig.city,
      dateFormatted: billingConfig.dateFormatted,
      payeeName: billingConfig.payeeName,
      payeeCC: billingConfig.payeeCC,
      signatureName: billingConfig.signatureName,
      phone: billingConfig.phone,
      address: billingConfig.address,
      bankAccount: billingConfig.bankAccount,
      items: pendingConsumptions,
      pendingBalance: Number(activeCompany.pendingBalance) || 0,
    });

    doc.autoPrint();
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  // Open Payment Modal instead of settling directly
  const handleSettleAccount = () => {
    if (!activeCompany || grandTotal === 0) return;
    setPaymentType('full');
    setPaymentAmount(grandTotal.toString());
    setShowPaymentModal(true);
  };

  // Confirm and execute settlement (full or partial)
  const handleConfirmPayment = async () => {
    if (!activeCompany) return;

    let newPendingBalance = 0;
    
    if (paymentType === 'partial') {
      const amountPaid = parseFloat(paymentAmount) || 0;
      if (amountPaid > grandTotal) {
        alert('El pago no puede ser mayor al total a liquidar.');
        return;
      }
      newPendingBalance = grandTotal - amountPaid;
    }

    const cuentaId = `CC-${Date.now().toString().slice(-6)}`;
    const ids = pendingConsumptions.map((c) => c.id);
    const amountPaid = paymentType === 'full' ? grandTotal : (parseFloat(paymentAmount) || 0);
    
    // Sanitizar consumos a JSON puro para evitar errores con Timestamps de Firestore
    const safeItems = pendingConsumptions.map((item) => ({
      id: item.id || '',
      companyId: item.companyId || '',
      companyName: item.companyName || '',
      date: item.date || '',
      dateFormatted: item.dateFormatted || item.date || '',
      concept: item.concept || item.name || 'Servicio',
      qty: Number(item.qty) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      baseUnitPrice: Number(item.baseUnitPrice) || 0,
      totalPrice: Number(item.totalPrice) || 0,
      isTakeout: Boolean(item.isTakeout),
      takeoutExtra: Number(item.takeoutExtra) || 0,
      status: 'BILLED',
    }));

    const invoiceData = {
      id: cuentaId,
      companyId: activeCompany.id,
      companyName: activeCompany.name,
      companyNit: activeCompany.nit,
      date: new Date().toISOString(),
      dateFormatted: billingConfig.dateFormatted,
      items: safeItems,
      pendingBalanceAtGeneration: Number(activeCompany.pendingBalance) || 0,
      grandTotal: grandTotal,
      amountPaid: amountPaid,
      pendingBalance: newPendingBalance,
    };
    
    await settleCorporateAccount(activeCompany.id, ids, cuentaId, newPendingBalance, invoiceData);
    
    setShowPaymentModal(false);
    setShowInvoicePreviewModal(false);
  };

  // Send WhatsApp breakdown
  const handleSendWhatsAppBreakdown = () => {
    if (!activeCompany) return;

    let msg = `*CUENTA DE COBRO - DONDE LOS ZAMBRANO*\n`;
    msg += `*Cliente:* ${activeCompany.name}\n`;
    msg += `*NIT:* ${activeCompany.nit}\n`;
    msg += `*Lugar y Fecha:* ${billingConfig.city} ${billingConfig.dateFormatted}\n\n`;
    msg += `*POR CONCEPTO DE:*\n`;

    const prevBalance = Number(activeCompany.pendingBalance) || 0;
    if (prevBalance > 0) {
      msg += `• Saldo pendiente anterior: *$${prevBalance.toLocaleString('es-CO')}*\n`;
    }

    pendingConsumptions.forEach((item) => {
      const dateText = item.dateFormatted || item.date;
      const takeoutText = item.isTakeout ? ' (Llevar)' : '';
      msg += `• ${dateText} | ${item.qty} ${item.concept}${takeoutText} - Vr. Unit: $${item.unitPrice.toLocaleString('es-CO')} | Total: *$${item.totalPrice.toLocaleString('es-CO')}*\n`;
    });

    msg += `\n*TOTAL A PAGAR: $${grandTotal.toLocaleString('es-CO')}*\n`;
    msg += `(${numberToWordsColombianPesos(grandTotal)})\n\n`;
    msg += `*Datos para Transferencia:*\n${billingConfig.bankAccount}\nTitular: ${billingConfig.payeeName}\nC.C.: ${billingConfig.payeeCC}\n`;

    const encoded = encodeURIComponent(msg);
    const phone = activeCompany.phone ? activeCompany.phone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/57${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 z-10 relative flex flex-col h-full min-h-0 overflow-y-auto pb-24">

      {/* ── HEADER PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Volver al Panel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              <span>Clientes Empresarios &amp; Cuentas de Cobro</span>
            </h1>
            <p className="text-xs text-slate-400">
              Registra consumos diarios de empresas (desayunos y almuerzos) y genera cuentas de cobro oficiales en PDF.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenCompanyModal(null)}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Empresa Cliente</span>
        </button>
      </div>

      {/* ── PESTAÑAS DE EMPRESAS ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
        {companies.map((company) => {
          const isSelected = activeCompany?.id === company.id;
          const compUnpaid = corporateConsumptions.filter((c) => c.companyId === company.id && c.status !== 'BILLED');
          const count = compUnpaid.length;
          const prevBalance = Number(company.pendingBalance) || 0;
          const sum = compUnpaid.reduce((acc, c) => acc + (Number(c.totalPrice) || 0), 0) + prevBalance;

          return (
            <button
              key={company.id}
              onClick={() => setSelectedCompanyId(company.id)}
              className={`px-4 py-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold truncate max-w-[220px]">{company.name}</div>
                  {prevBalance > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      Saldo: ${prevBalance.toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
                <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  NIT: {company.nit} · <span className={isSelected ? 'text-slate-950 font-black' : 'text-emerald-400 font-bold'}>${sum.toLocaleString('es-CO')}</span> ({count})
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeCompany && (
        <>
          {/* ── BANNER DE LA EMPRESA SELECCIONADA + RESUMEN ── */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Empresa Activa
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">NIT: {activeCompany.nit}</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-3">
                {activeCompany.name}
                {Number(activeCompany.pendingBalance) > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg">
                    Saldo Pendiente: ${Number(activeCompany.pendingBalance).toLocaleString('es-CO')}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                {activeCompany.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeCompany.phone}</span>
                  </span>
                )}
                {activeCompany.contactPerson && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeCompany.contactPerson}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activeCompany.city || 'Popayán'}</span>
                </span>
              </div>
            </div>

            {/* Gran Total a Cobrar + Botón Generar PDF */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
              <div className="text-left md:text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL A LIQUIDAR</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  ${grandTotal.toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-slate-400">{pendingConsumptions.length} consumos ({totalPlatesCount} platos)</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCompanyModal(activeCompany)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Editar Datos Empresa"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCompanyToDelete(activeCompany)}
                  className="p-2.5 bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                  title="Eliminar Empresa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    setIsHistoryLoading(true);
                    setShowHistoryModal(true);
                    const inv = await getCorporateInvoicesByCompanyFromFirestore(activeCompany.id);
                    setInvoiceHistory(inv);
                    setIsHistoryLoading(false);
                  }}
                  className="font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                >
                  <FileText className="w-4 h-4" />
                  <span>Historial</span>
                </button>
                <button
                  onClick={handleOpenCuentaCobroPreview}
                  disabled={grandTotal === 0}
                  className={`font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg ${
                    grandTotal > 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Generar Cuenta de Cobro (PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── FORMULARIO DIRECTO EN PANTALLA: REGISTRAR CONSUMO ── */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>+ Agregar Consumo / Pedido a la Cuenta</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">{activeCompany.name}</span>
            </div>

            <form onSubmit={handleDirectAddConsumption} className="space-y-3.5">
              
              {/* 1. Selector de Concepto: Solo Desayuno o Almuerzo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  1. Selecciona el Concepto *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectConcept('Desayuno')}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      inlineConceptType === 'Desayuno'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>☀️ DESAYUNO ($12.000)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectConcept('Almuerzo')}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      inlineConceptType === 'Almuerzo'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>🍲 ALMUERZO ($10.000)</span>
                  </button>
                </div>
              </div>

              {/* 2. Fila de Detalles: Fecha + Cantidad + Precio Unitario + Para Llevar + Botón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end pt-1">
                
                {/* Fecha */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                  <div className="relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      required
                      value={inlineDate}
                      onChange={(e) => setInlineDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          if (e.target.showPicker) {
                            e.target.showPicker();
                          }
                        } catch (err) {
                          // Fallback if not supported
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono cursor-pointer"
                    />
                  </div>
                </div>

                {/* Cantidad (Cuántos) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">¿Cuántos? (Cantidad)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inlineQty}
                    onChange={(e) => setInlineQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-black"
                  />
                </div>

                {/* Precio Unitario */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Unitario ($)</label>
                  <input
                    type="number"
                    required
                    value={inlineUnitPrice}
                    onChange={(e) => setInlineUnitPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                {/* Switch Para Llevar (+ $2.000) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empaque</label>
                  <button
                    type="button"
                    onClick={() => setInlineIsTakeout(!inlineIsTakeout)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      inlineIsTakeout
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>🥡 Llevar (+$2.000)</span>
                    <span className={`w-3.5 h-3.5 rounded-full ${inlineIsTakeout ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  </button>
                </div>

                {/* Botón Agregar con Total Calculado */}
                <div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar (${calculatedInlineItemTotal.toLocaleString('es-CO')})</span>
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* ── TABLA COMPLETA DE CONSUMOS REGISTRADOS ── */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            
            {/* Header de la Tabla */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/60">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Detalle de Consumos para la Cuenta de Cobro ({pendingConsumptions.length} registros)</span>
                </h3>
                <p className="text-[11px] text-slate-400">Todos estos ítems aparecerán en el PDF generado para la empresa.</p>
              </div>
            </div>

            {/* Listado / Tabla */}
            {pendingConsumptions.length === 0 && (Number(activeCompany.pendingBalance) || 0) === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No hay consumos registrados para liquidar</p>
                <p className="text-xs text-slate-500">Usa el panel de arriba para agregar los desayunos o almuerzos de la semana.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Fecha.</th>
                      <th className="py-3 px-4">Concepto.</th>
                      <th className="py-3 px-4 text-right">Valor unitario.</th>
                      <th className="py-3 px-4 text-right">Valor total.</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {/* Fila Especial: Saldo Pendiente */}
                    {(Number(activeCompany.pendingBalance) || 0) > 0 && (
                      <tr className="bg-red-500/10 hover:bg-red-500/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                          Anterior.
                        </td>
                        <td className="py-3 px-4 text-red-300 font-semibold">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>Saldo Pendiente de Factura Anterior.</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-red-300 whitespace-nowrap">
                          -
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-red-400 whitespace-nowrap text-sm">
                          ${Number(activeCompany.pendingBalance).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] text-red-400/50">Bloqueado</span>
                        </td>
                      </tr>
                    )}
                    
                    {pendingConsumptions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                          {item.dateFormatted || item.date}.
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{item.qty} {item.concept}.</span>
                            {item.isTakeout && (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                                🥡 Llevar (+${item.takeoutExtra || 2000})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                          ${item.unitPrice?.toLocaleString('es-CO')}.
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400 whitespace-nowrap text-sm">
                          ${item.totalPrice?.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => deleteCorporateConsumption(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar este consumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 border-t-2 border-slate-800 font-black text-sm text-white">
                      <td colSpan="3" className="py-4 px-4 text-right uppercase tracking-wider text-slate-400 text-xs">
                        TOTAL CUENTA DE COBRO ({totalPlatesCount} platos):
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-lg text-emerald-400 whitespace-nowrap">
                        ${grandTotal.toLocaleString('es-CO')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL: CREAR / EDITAR EMPRESA ── */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{companyToEdit ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</span>
              </h2>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Razón Social / Nombre Empresa *</label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="Ej. ELECTRIFICADORA DE ALTA Y BAJA TENSIÓN DEL CAUCA SAS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">NIT / Cédula Empresa *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.nit}
                    onChange={(e) => setCompanyForm({ ...companyForm, nit: e.target.value })}
                    placeholder="Ej. 901743121-1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="Ej. 3116834930"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    value={companyForm.contactPerson}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                    placeholder="Ej. Administración / Pagos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    placeholder="Ej. Popayán"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VISTA PREVIA Y GENERACIÓN DE CUENTA DE COBRO (DOCUMENTO OFICIAL) ── */}
      {showInvoicePreviewModal && activeCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Generador Oficial de Cuenta de Cobro</span>
              </h2>
              <button
                onClick={() => setShowInvoicePreviewModal(false)}
                className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Box (Estilo Papel Oficial) */}
            <div className="bg-white text-slate-900 p-5 sm:p-7 rounded-2xl shadow-inner font-sans text-xs space-y-4 border border-slate-300 max-h-[420px] overflow-y-auto">
              
              {/* Título y Lugar/Fecha */}
              <div className="text-center space-y-1">
                <h3 className="font-bold text-sm tracking-wide text-black">CUENTA DE COBRO</h3>
                <p className="font-bold text-xs text-slate-700">Lugar y Fecha: {billingConfig.city} {billingConfig.dateFormatted}</p>
              </div>

              {/* Empresa Deudora */}
              <div className="text-center space-y-0.5 pt-2">
                <h4 className="font-black text-xs text-black uppercase">{activeCompany.name}</h4>
                <p className="font-bold text-xs text-slate-800">NIT: {activeCompany.nit}</p>
              </div>

              {/* Acreedor */}
              <div className="space-y-0.5 pt-1">
                <p className="font-bold text-xs text-black">DEBE A: {billingConfig.payeeName}</p>
                <p className="font-bold text-xs text-black">C.C.: {billingConfig.payeeCC}</p>
              </div>

              {/* Suma en Letras */}
              <div className="space-y-1 pt-1">
                <p className="font-bold text-xs text-black">La suma de:</p>
                <p className="font-bold text-xs text-black leading-relaxed">
                  {numberToWordsColombianPesos(grandTotal)} (${grandTotal.toLocaleString('es-CO')})
                </p>
              </div>

              {/* Tabla de Conceptos */}
              <div className="space-y-2 pt-1">
                <p className="font-bold text-xs text-black">POR CONCEPTO DE:</p>

                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold text-left">
                      <th className="py-1">Fecha.</th>
                      <th className="py-1">Concepto.</th>
                      <th className="py-1 text-right">Valor unitario.</th>
                      <th className="py-1 text-right">Valor total.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Number(activeCompany.pendingBalance) > 0 && (
                      <tr className="py-1">
                        <td className="py-1 font-medium">-</td>
                        <td className="py-1">Saldo Pendiente de Factura Anterior.</td>
                        <td className="py-1 text-right font-mono">-</td>
                        <td className="py-1 text-right font-mono font-bold">${Number(activeCompany.pendingBalance).toLocaleString('es-CO')}</td>
                      </tr>
                    )}
                    {pendingConsumptions.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 font-medium">{item.dateFormatted || item.date}.</td>
                        <td className="py-1">{item.qty} {item.concept}{item.isTakeout ? ' (Llevar)' : ''}.</td>
                        <td className="py-1 text-right font-mono">${item.unitPrice?.toLocaleString('es-CO')}.</td>
                        <td className="py-1 text-right font-mono font-bold">${item.totalPrice?.toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black font-black text-xs">
                      <td colSpan="3" className="py-1.5 text-right uppercase">TOTAL:</td>
                      <td className="py-1.5 text-right font-mono font-black text-sm">${grandTotal.toLocaleString('es-CO')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pie de Firma */}
              <div className="pt-4 space-y-1 text-[11px] text-black">
                <p>Cordialmente,</p>
                <div className="pt-3 font-bold space-y-0.5">
                  <p>Nombre: {billingConfig.signatureName}</p>
                  <p>C.C.: {billingConfig.payeeCC}</p>
                  <p>TEL: {billingConfig.phone}</p>
                  <p>Dirección: {billingConfig.address}</p>
                  <p>{billingConfig.bankAccount}</p>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSettleAccount}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Marcar como Cobrada / Liquidar Ciclo</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSendWhatsAppBreakdown}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  onClick={handlePrintPDF}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN DE EMPRESA ── */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">¿Eliminar Empresa?</h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Estás seguro de eliminar a <span className="text-white font-bold">"{companyToDelete.name}"</span>? Esto eliminará todos sus consumos asociados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setCompanyToDelete(null)}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (companyToDelete) {
                    await deleteCompany(companyToDelete.id);
                    setCompanyToDelete(null);
                    if (selectedCompanyId === companyToDelete.id) {
                      setSelectedCompanyId(companies[0]?.id || null);
                    }
                  }
                }}
                className="py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PAGO DE CUENTA Y SALDO PENDIENTE ── */}
      {showPaymentModal && activeCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Registrar Pago</span>
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-bold mb-1">TOTAL A LIQUIDAR</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">${grandTotal.toLocaleString('es-CO')}</p>
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-800/50 ${paymentType === 'full' ? 'bg-slate-800 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={() => {
                      setPaymentType('full');
                      setPaymentAmount(grandTotal.toString());
                    }}
                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">✅ Pagado Completo</p>
                    <p className="text-[10px] text-slate-400">El saldo pendiente de la empresa quedará en $0.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-800/50 ${paymentType === 'partial' ? 'bg-slate-800 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={() => setPaymentType('partial')}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">💛 Pago Parcial (Abono)</p>
                    <p className="text-[10px] text-slate-400">Ingresar abono y el resto quedará como saldo pendiente.</p>
                  </div>
                </label>
              </div>

              {paymentType === 'partial' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Valor Abonado / Pagado ($)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-black"
                  />
                  
                  {parseFloat(paymentAmount) >= 0 && parseFloat(paymentAmount) <= grandTotal && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400">Saldo que quedará pendiente:</span>
                      <span className="text-sm font-black text-red-400 font-mono">
                        ${(grandTotal - (parseFloat(paymentAmount) || 0)).toLocaleString('es-CO')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Confirmar Pago y Liquidar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HISTORIAL DE FACTURAS ── */}
      {showHistoryModal && activeCompany && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Historial de Cuentas de Cobro</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">{activeCompany.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 min-h-[200px]">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : invoiceHistory.length === 0 ? (
                <div className="text-center text-slate-500 space-y-2 py-10">
                  <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No hay facturas registradas</p>
                  <p className="text-xs text-slate-500">Cuando liquides un ciclo de consumos, aparecerá aquí.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceHistory.map((invoice) => (
                    <div key={invoice.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center hover:border-slate-700 transition-colors">
                      <div className="space-y-1 w-full md:w-auto text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <span className="text-xs font-mono font-bold text-slate-300">ID: {invoice.id}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">
                            {new Date(invoice.createdAt?.toMillis ? invoice.createdAt.toMillis() : invoice.date).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {invoice.items?.length || 0} consumos liquidados. 
                          {invoice.pendingBalance > 0 && <span className="text-red-400 font-bold ml-1">Quedó saldo: ${invoice.pendingBalance.toLocaleString('es-CO')}</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Facturado</p>
                          <p className="text-lg font-black font-mono text-emerald-400">${(invoice.grandTotal || 0).toLocaleString('es-CO')}</p>
                        </div>
                        <button
                          onClick={() => {
                            try {
                              // Extraer SOLO los campos que necesita el PDF, sin spread para evitar
                              // problemas con Firestore Timestamps u otros objetos no serializables
                              const safeItems = (invoice.items || []).map((item) => {
                                const rawDate = item.date || '';
                                const rawFmt = item.dateFormatted || rawDate;
                                return {
                                  date: String(rawDate),
                                  dateFormatted: String(rawFmt),
                                  concept: String(item.concept || item.name || 'Servicio'),
                                  qty: Number(item.qty) || 1,
                                  unitPrice: Number(item.unitPrice) || 0,
                                  totalPrice: Number(item.totalPrice) || (Number(item.unitPrice) * (Number(item.qty) || 1)),
                                  isTakeout: Boolean(item.isTakeout),
                                };
                              });

                              const dateStr = invoice.dateFormatted
                                || (invoice.date
                                  ? new Date(invoice.date).toLocaleDateString('es-CO').replace(/\//g, '-')
                                  : billingConfig.dateFormatted);

                              const pdfDoc = generateCuentaCobroPDF({
                                companyName: String(invoice.companyName || activeCompany.name),
                                companyNit: String(invoice.companyNit || activeCompany.nit),
                                city: billingConfig.city,
                                dateFormatted: String(dateStr),
                                payeeName: billingConfig.payeeName,
                                payeeCC: billingConfig.payeeCC,
                                signatureName: billingConfig.signatureName,
                                phone: billingConfig.phone,
                                address: billingConfig.address,
                                bankAccount: billingConfig.bankAccount,
                                items: safeItems,
                                pendingBalance: Number(invoice.pendingBalanceAtGeneration) || 0,
                              });
                              const sanitizedName = (invoice.companyName || activeCompany.name).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
                              pdfDoc.save(`Cuenta_Cobro_${sanitizedName}_${invoice.id}.pdf`);
                            } catch (err) {
                              console.error('[PDF Historial] Error generando PDF:', err);
                              alert(`Error en PDF: ${err?.message || err}`);
                            }
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                          title="Descargar PDF nuevamente"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-xs font-bold hidden sm:inline">PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
