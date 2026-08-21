/**
 * src/context/AppContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Estado global de la aplicación "Donde los Zambrano POS".
 *
 * FUENTE DEL MENÚ (v2):
 * ─────────────────────────────────────────────────────────────────────────────
 *   - fastFoodMenu   ← Firestore: colección `products` (session == "FAST_FOOD")
 *   - lunchMenu      ← Firestore: menu_config/lunch_config (sopas, proteínas, etc.)
 *                       + colección `products` (session == "LUNCH", type == "extra")
 *
 *   Si Firestore falla o está offline → fallback a menuData.js (sin interrupciones).
 *
 * DATOS OPERATIVOS (en memoria + localStorage):
 *   - Mesas, pedidos activos, historial de ventas → velocidad máxima de UI.
 *   - Cada venta finalizada se persiste en Firestore async (no bloquea la UI).
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FAST_FOOD_MENU, LUNCH_MENU_DEFAULT, RESTAURANT_INFO } from '../data/menuData';
import {
  saveOrder,
  updateAnalyticsDaily,
  upsertCustomer,
  upsertProduct,
  toggleProductAvailabilityInFirestore,
  deleteProductFromFirestore,
  upsertCompanyInFirestore,
  deleteCompanyFromFirestore,
  upsertCorporateConsumptionInFirestore,
  deleteCorporateConsumptionFromFirestore,
  markConsumptionsBilledInFirestore,
  saveCorporateInvoiceInFirestore,
  getCorporateInvoicesByCompanyFromFirestore,
} from '../firebase/firestoreService';
import { seedAllIfEmpty } from '../firebase/seedFirestore';

const AppContext = createContext();

// Helper para construir la lista inicial de productos para el administrador
const buildInitialAdminProducts = () => {
  const products = [];
  FAST_FOOD_MENU.forEach((catObj) => {
    catObj.items.forEach((item) => {
      products.push({
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost || Math.round(item.price * 0.5),
        description: item.description || '',
        category: catObj.category,
        categoryIcon: catObj.icon || '',
        image: item.image || '',
        session: 'FAST_FOOD',
        type: 'product',
        active: true,
        disponible_hoy: true,
        sortOrder: products.length,
      });
    });
  });
  return products;
};

// ── Helpers para transformar documentos Firestore al formato que usa la UI ──

/**
 * Convierte la colección `products` (session="FAST_FOOD") al formato
 * de array de categorías que usa OrderConsole.jsx:
 * SOLO incluye productos disponibles hoy (disponible_hoy !== false && active !== false)
 */
const buildFastFoodMenuFromDocs = (docs) => {
  const categoryMap = new Map();

  docs
    .filter((d) => (d.active ?? true) !== false && (d.disponible_hoy ?? true) !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .forEach((item) => {
      const cat = item.category || 'Otros';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          icon:     item.categoryIcon || '',
          items:    [],
        });
      }
      categoryMap.get(cat).items.push({
        id:          item.id || item._id,
        name:        item.name,
        price:       item.price,
        cost:        item.cost || 0,
        description: item.description || '',
        image:       item.image || '',
        disponible_hoy: true,
      });
    });

  return Array.from(categoryMap.values());
};

/**
 * Convierte los extras de Firestore (session="LUNCH", type="extra")
 * al formato: [ { id, name, price } ]
 * SOLO incluye extras disponibles hoy
 */
const buildLunchExtrasFromDocs = (docs) =>
  docs
    .filter((d) => (d.active ?? true) !== false && (d.disponible_hoy ?? true) !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => ({
      id:    item.id || item._id,
      name:  item.name,
      price: item.price,
      cost:  item.cost || 0,
      disponible_hoy: true,
    }));

// ─────────────────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  // ── Navigation & User State ──────────────────────────────────────────────
  const [userRole, setUserRole]           = useState('NONE');
  const [userName, setUserName]           = useState('');
  const [shiftMode, setShiftMode]         = useState('FAST_FOOD');
  const [currentView, setCurrentView]     = useState('PORTAL');
  const [activeTableId, setActiveTableId] = useState(null);

  // ── Firestore sync status ────────────────────────────────────────────────
  const [firestoreStatus, setFirestoreStatus] = useState('idle');

  // ── Menu State (cargado desde Firestore en tiempo real) ──────────────────
  const [allAdminProducts, setAllAdminProducts] = useState(buildInitialAdminProducts);
  const [fastFoodMenu, setFastFoodMenu]         = useState(FAST_FOOD_MENU);     // fallback inmediato
  const [lunchMenu, setLunchMenu]               = useState(LUNCH_MENU_DEFAULT);  // fallback inmediato
  const [menuLoading, setMenuLoading]           = useState(true);

  // Ref para evitar actualizar estado si el componente desmontó
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Tables ───────────────────────────────────────────────────────────────
  const initialTables = [
    ...Array.from({ length: 12 }, (_, i) => ({
      id:           i + 1,
      name:         `Mesa ${i + 1}`,
      status:       'AVAILABLE',
      items:        [],
      customerName: '',
      customerNit:  '',
      openedAt:     null,
    })),
    {
      id:           'TAKEAWAY',
      name:         'Para Llevar / Domicilio',
      status:       'AVAILABLE',
      items:        [],
      customerName: '',
      customerNit:  '',
      openedAt:     null,
    },
  ];

  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem('zambrano_tables');
      return saved ? JSON.parse(saved) : initialTables;
    } catch { return initialTables; }
  });

  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('zambrano_sales');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── Corporate Accounts State (Clientes Empresarios & Consumos) ───────────
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem('zambrano_companies');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'comp-electrificadora',
        name: 'ELECTRIFICADORA DE ALTA Y BAJA TENSIÓN DEL CAUCA SAS',
        nit: '901743121-1',
        phone: '3116834930',
        contactPerson: 'Administración / Pagos',
        city: 'Popayán',
        createdAt: '2026-08-01T08:00:00.000Z',
      }
    ];
  });

  const [corporateConsumptions, setCorporateConsumptions] = useState(() => {
    try {
      const saved = localStorage.getItem('zambrano_corporate_consumptions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'cons-1', companyId: 'comp-electrificadora', date: '2026-08-03', dateFormatted: '03-08', concept: 'Desayunos', qty: 4, unitPrice: 10500, isTakeout: false, takeoutExtra: 0, totalPrice: 42000, notes: '', status: 'PENDING' },
      { id: 'cons-2', companyId: 'comp-electrificadora', date: '2026-08-03', dateFormatted: '03-08', concept: 'Almuerzo', qty: 1, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 10000, notes: '', status: 'PENDING' },
      { id: 'cons-3', companyId: 'comp-electrificadora', date: '2026-08-05', dateFormatted: '05-08', concept: 'Desayunos', qty: 3, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 30000, notes: '', status: 'PENDING' },
      { id: 'cons-4', companyId: 'comp-electrificadora', date: '2026-08-05', dateFormatted: '05-08', concept: 'Almuerzos', qty: 3, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 30000, notes: '', status: 'PENDING' },
      { id: 'cons-5', companyId: 'comp-electrificadora', date: '2026-08-06', dateFormatted: '06-08', concept: 'Desayuno', qty: 1, unitPrice: 12000, isTakeout: false, takeoutExtra: 0, totalPrice: 12000, notes: '', status: 'PENDING' },
      { id: 'cons-6', companyId: 'comp-electrificadora', date: '2026-08-06', dateFormatted: '06-08', concept: 'Almuerzos', qty: 8, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 80000, notes: '', status: 'PENDING' },
      { id: 'cons-7', companyId: 'comp-electrificadora', date: '2026-08-06', dateFormatted: '06-08', concept: 'Almuerzo', qty: 1, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 10000, notes: '', status: 'PENDING' },
      { id: 'cons-8', companyId: 'comp-electrificadora', date: '2026-08-07', dateFormatted: '07-08', concept: 'Desayuno', qty: 1, unitPrice: 12000, isTakeout: false, takeoutExtra: 0, totalPrice: 12000, notes: '', status: 'PENDING' },
      { id: 'cons-9', companyId: 'comp-electrificadora', date: '2026-08-08', dateFormatted: '08-08', concept: 'Desayuno', qty: 1, unitPrice: 12000, isTakeout: false, takeoutExtra: 0, totalPrice: 12000, notes: '', status: 'PENDING' },
      { id: 'cons-10', companyId: 'comp-electrificadora', date: '2026-08-08', dateFormatted: '08-08', concept: 'Almuerzo', qty: 1, unitPrice: 10000, isTakeout: false, takeoutExtra: 0, totalPrice: 10000, notes: '', status: 'PENDING' },
    ];
  });

  // ── QR Alerts (pedidos reales via QR — inicia vacío) ──────────────────────
  const [qrAlerts, setQrAlerts] = useState([]);

  // ── Change Password Modal — estado global para que Navbar y Dashboard lo compartan ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passError, setPassError]                 = useState('');
  const [passSuccess, setPassSuccess]             = useState('');

  // ── Persist tables & sales & companies to localStorage ────────────────────
  useEffect(() => {
    localStorage.setItem('zambrano_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('zambrano_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('zambrano_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('zambrano_corporate_consumptions', JSON.stringify(corporateConsumptions));
  }, [corporateConsumptions]);

  // ── Firestore: Seed inicial + Listeners en Tiempo Real ───────────────────
  useEffect(() => {
    // 1. Seed si la BD está vacía (solo la primera vez)
    seedAllIfEmpty().catch((err) =>
      console.warn('[AppContext] Seed error (non-critical):', err)
    );

    // 2. Listener general de todos los productos para el Panel Administrador + Menú Comanda
    const allProductsQuery = collection(db, 'products');

    const unsubProducts = onSnapshot(
      allProductsQuery,
      (snap) => {
        if (!mounted.current) return;
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        if (docs.length > 0) {
          docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

          const formattedAll = docs.map((item) => ({
            id:             item.id,
            name:           item.name,
            price:          item.price,
            cost:           item.cost || 0,
            description:    item.description || '',
            category:       item.category || 'Otros',
            categoryIcon:   item.categoryIcon || '',
            image:          item.image || '',
            session:        item.session || 'FAST_FOOD',
            type:           item.type || 'product',
            active:         (item.active ?? true) !== false,
            disponible_hoy: (item.disponible_hoy ?? item.active ?? true) !== false,
            sortOrder:      item.sortOrder ?? 0,
          }));

          setAllAdminProducts(formattedAll);

          const fastFoodDocs = docs.filter((d) => d.session !== 'LUNCH' || d.type !== 'extra');
          setFastFoodMenu(buildFastFoodMenuFromDocs(fastFoodDocs));

          const lunchExtraDocs = docs.filter((d) => d.session === 'LUNCH' && d.type === 'extra');
          setLunchMenu((prev) => ({
            ...prev,
            extras: buildLunchExtrasFromDocs(lunchExtraDocs),
          }));
        }
        setMenuLoading(false);
      },
      (err) => {
        console.warn('[AppContext] products snapshot error (using fallback):', err);
        if (mounted.current) setMenuLoading(false);
      }
    );

    // 4. Listener: configuración del almuerzo (soups, proteins, sides, drinks, priceBase)
    const lunchConfigRef = doc(db, 'menu_config', 'lunch_config');

    const unsubLunchConfig = onSnapshot(
      lunchConfigRef,
      (snap) => {
        if (!mounted.current) return;
        if (snap.exists()) {
          const data = snap.data();
          setLunchMenu((prev) => ({
            ...prev,
            priceBase:    data.priceBase    ?? prev.priceBase,
            soups:        data.soups        ?? prev.soups,
            proteins:     data.proteins     ?? prev.proteins,
            sidesOptions: data.sidesOptions ?? prev.sidesOptions,
            drinks:       data.drinks       ?? prev.drinks,
          }));
        }
      },
      (err) => {
        console.warn('[AppContext] lunchConfig snapshot error (using fallback):', err);
      }
    );

    // 5. Listener: Empresas Clientes en Tiempo Real
    const companiesColRef = collection(db, 'companies');
    const unsubCompanies = onSnapshot(
      companiesColRef,
      (snap) => {
        if (!mounted.current) return;
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCompanies(list);
        }
      },
      (err) => {
        console.warn('[AppContext] companies snapshot error (using fallback):', err);
      }
    );

    // 6. Listener: Consumos Corporativos en Tiempo Real
    const consumptionsColRef = collection(db, 'corporate_consumptions');
    const unsubConsumptions = onSnapshot(
      consumptionsColRef,
      (snap) => {
        if (!mounted.current) return;
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCorporateConsumptions(list);
        }
      },
      (err) => {
        console.warn('[AppContext] corporate_consumptions snapshot error (using fallback):', err);
      }
    );

    // Cleanup: desuscribir listeners al desmontar
    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubLunchConfig) unsubLunchConfig();
      if (unsubCompanies) unsubCompanies();
      if (unsubConsumptions) unsubConsumptions();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper Functions ──────────────────────────────────────────────────────

  const loginUser = (role, name = 'Usuario') => {
    setUserRole(role);
    setUserName(name);
    setCurrentView('TABLES');
  };

  const logoutUser = () => {
    setUserRole('NONE');
    setUserName('');
    setCurrentView('PORTAL');
    setActiveTableId(null);
  };

  const selectShiftMode = (mode) => setShiftMode(mode);

  const openTableOrder = (tableId) => {
    setActiveTableId(tableId);
    setCurrentView('ORDER');
  };

  const addItemToTable = (tableId, itemToAdd) => {
    setTables((prevTables) =>
      prevTables.map((t) => {
        if (t.id !== tableId) return t;

        // Los almuerzos siempre se agregan como ítems únicos (no se acumulan por id)
        // Los demás ítems se acumulan si tienen el mismo id y notas
        const isAlmuerzo = (itemToAdd.id || '').startsWith('almuerzo-');
        const existingIdx = isAlmuerzo
          ? -1
          : t.items.findIndex(
              (i) => i.id === itemToAdd.id && i.notes === (itemToAdd.notes || '')
            );

        let updatedItems = [...t.items];
        if (existingIdx >= 0) {
          updatedItems[existingIdx] = {
            ...updatedItems[existingIdx],
            qty: updatedItems[existingIdx].qty + (itemToAdd.qty || 1),
          };
        } else {
          updatedItems.push({
            ...itemToAdd,
            qty:     itemToAdd.qty || 1,
            notes:   itemToAdd.notes || '',
            addedAt: new Date().toISOString(),
          });
        }

        return {
          ...t,
          status:   'OCCUPIED',
          items:    updatedItems,
          openedAt: t.openedAt || new Date().toISOString(),
        };
      })
    );
  };

  const updateItemQty = (tableId, itemIndex, delta) => {
    setTables((prevTables) =>
      prevTables.map((t) => {
        if (t.id !== tableId) return t;
        let updatedItems = [...t.items];
        const newQty = updatedItems[itemIndex].qty + delta;
        if (newQty <= 0) {
          updatedItems.splice(itemIndex, 1);
        } else {
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], qty: newQty };
        }
        return {
          ...t,
          items:  updatedItems,
          status: updatedItems.length === 0 ? 'AVAILABLE' : 'OCCUPIED',
        };
      })
    );
  };

  const updateTableCustomer = (tableId, name, nit) => {
    setTables((prevTables) =>
      prevTables.map((t) =>
        t.id === tableId ? { ...t, customerName: name, customerNit: nit } : t
      )
    );
  };

  const clearTable = (tableId) => {
    setTables((prevTables) =>
      prevTables.map((t) =>
        t.id === tableId
          ? { ...t, status: 'AVAILABLE', items: [], customerName: '', customerNit: '', openedAt: null }
          : t
      )
    );
  };

  const markTableServed = (tableId) => {
    setTables((prevTables) =>
      prevTables.map((t) =>
        t.id === tableId && t.status === 'OCCUPIED'
          ? { ...t, status: 'SERVED', servedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const markTableBilling = (tableId) => {
    setTables((prevTables) =>
      prevTables.map((t) => (t.id === tableId ? { ...t, status: 'BILLING' } : t))
    );
  };

  /**
   * Finaliza y paga un pedido.
   *  1. Crea el registro de venta en memoria (inmediato → UI no bloquea).
   *  2. Limpia la mesa (inmediato).
   *  3. Persiste en Firestore async (fire-and-forget).
   */
  const finalizeAndPayOrder = (tableId, paymentDetails) => {
    const tableObj = tables.find((t) => t.id === tableId);
    if (!tableObj || tableObj.items.length === 0) return null;

    const total = tableObj.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

    const saleRecord = {
      saleId:        `ZAM-${Date.now().toString().slice(-6)}`,
      date:          new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      tableId:       tableObj.id,
      tableName:     tableObj.name,
      shiftMode,
      items:         [...tableObj.items],
      subtotal:      total,
      total,
      paymentMethod: paymentDetails?.method       || 'Efectivo',
      customerName:  paymentDetails?.customerName || tableObj.customerName || 'Cliente General',
      customerNit:   paymentDetails?.customerNit  || tableObj.customerNit  || '222222222222',
      customerPhone: paymentDetails?.customerPhone || '',
      processedBy:   userName || 'Mesero',
    };

    setSalesHistory((prev) => [saleRecord, ...prev]);
    clearTable(tableId);

    // Async Firestore sync
    setFirestoreStatus('syncing');
    Promise.allSettled([
      saveOrder(saleRecord),
      updateAnalyticsDaily(saleRecord),
      (saleRecord.customerName !== 'Cliente General' || saleRecord.customerPhone)
        ? upsertCustomer({
            name:  saleRecord.customerName,
            phone: saleRecord.customerPhone,
            nit:   saleRecord.customerNit,
            total: saleRecord.total,
          })
        : Promise.resolve(),
    ]).then((results) => {
      const allOk = results.every((r) => r.status === 'fulfilled' && r.value !== false);
      if (mounted.current) setFirestoreStatus(allOk ? 'synced' : 'error');
      if (!allOk) console.warn('[AppContext] Some Firestore writes failed — data safe in localStorage.');
      setTimeout(() => { if (mounted.current) setFirestoreStatus('idle'); }, 3000);
    });

    return saleRecord;
  };

  const acceptQrAlert = (alertId) => {
    const alertObj = qrAlerts.find((a) => a.id === alertId);
    if (alertObj) {
      alertObj.items.forEach((item) => {
        addItemToTable(alertObj.tableId, {
          id:    `qr-${item.name}`,
          name:  item.name,
          price: item.price,
          qty:   item.qty,
          notes: 'Pedido enviado por QR Cliente',
        });
      });
    }
    setQrAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const dismissQrAlert = (alertId) => {
    setQrAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // ── Admin Menu CRUD & Availability Actions ──────────────────────────────

  const syncPublicMenus = (updatedList) => {
    const fastFoodDocs = updatedList.filter((d) => d.session !== 'LUNCH' || d.type !== 'extra');
    setFastFoodMenu(buildFastFoodMenuFromDocs(fastFoodDocs));

    const lunchExtraDocs = updatedList.filter((d) => d.session === 'LUNCH' && d.type === 'extra');
    setLunchMenu((prev) => ({
      ...prev,
      extras: buildLunchExtrasFromDocs(lunchExtraDocs),
    }));
  };

  const toggleProductAvailability = async (productId, available) => {
    setAllAdminProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId ? { ...p, active: available, disponible_hoy: available } : p
      );
      syncPublicMenus(updated);
      return updated;
    });
    await toggleProductAvailabilityInFirestore(productId, available);
  };

  const saveAdminProduct = async (productData) => {
    const prodId = productData.id || `prod-${Date.now()}`;
    const payload = {
      ...productData,
      id: prodId,
      active: productData.disponible_hoy ?? productData.active ?? true,
      disponible_hoy: productData.disponible_hoy ?? productData.active ?? true,
    };

    setAllAdminProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prodId);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = payload;
      } else {
        updated = [...prev, payload];
      }
      syncPublicMenus(updated);
      return updated;
    });

    await upsertProduct(prodId, payload);
  };

  const deleteAdminProduct = async (productId) => {
    setAllAdminProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      syncPublicMenus(updated);
      return updated;
    });
    await deleteProductFromFirestore(productId);
  };

  const bulkToggleCategoryAvailability = async (categoryName, available) => {
    const categoryProducts = allAdminProducts.filter((p) => p.category === categoryName);
    setAllAdminProducts((prev) => {
      const updated = prev.map((p) =>
        p.category === categoryName ? { ...p, active: available, disponible_hoy: available } : p
      );
      syncPublicMenus(updated);
      return updated;
    });
    await Promise.all(
      categoryProducts.map((p) => toggleProductAvailabilityInFirestore(p.id, available))
    );
  };

  const updateLunchConfig = async (newConfig) => {
    setLunchMenu((prev) => ({
      ...prev,
      ...newConfig,
    }));
    try {
      await setDoc(doc(db, 'menu_config', 'lunch_config'), newConfig, { merge: true });
    } catch (err) {
      console.warn('[AppContext] updateLunchConfig error:', err);
    }
  };

  // ── Corporate Accounts Actions (Empresas & Cuentas de Cobro) ─────────────

  const saveCompany = async (companyData) => {
    const compId = companyData.id || `comp-${Date.now()}`;
    const payload = {
      ...companyData,
      id: compId,
      updatedAt: new Date().toISOString(),
    };
    setCompanies((prev) => {
      const idx = prev.findIndex((c) => c.id === compId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload;
        return copy;
      }
      return [payload, ...prev];
    });
    try {
      await upsertCompanyInFirestore(compId, payload);
    } catch (e) {
      console.warn('[AppContext] saveCompany Firestore error:', e);
    }
    return payload;
  };

  const deleteCompany = async (companyId) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    setCorporateConsumptions((prev) => prev.filter((c) => c.companyId !== companyId));
    try {
      await deleteCompanyFromFirestore(companyId);
    } catch (e) {
      console.warn('[AppContext] deleteCompany Firestore error:', e);
    }
  };

  const addCorporateConsumption = async (consumptionData) => {
    const consId = consumptionData.id || `cons-${Date.now()}`;
    const dateFormatted = consumptionData.date
      ? consumptionData.date.slice(5).replace('-', '/')
      : new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });

    const payload = {
      ...consumptionData,
      id: consId,
      dateFormatted: consumptionData.dateFormatted || dateFormatted,
      status: consumptionData.status || 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setCorporateConsumptions((prev) => [payload, ...prev]);
    try {
      await upsertCorporateConsumptionInFirestore(consId, payload);
    } catch (e) {
      console.warn('[AppContext] addCorporateConsumption Firestore error:', e);
    }
    return payload;
  };

  const deleteCorporateConsumption = async (consumptionId) => {
    setCorporateConsumptions((prev) => prev.filter((c) => c.id !== consumptionId));
    try {
      await deleteCorporateConsumptionFromFirestore(consumptionId);
    } catch (e) {
      console.warn('[AppContext] deleteCorporateConsumption Firestore error:', e);
    }
  };

  const settleCorporateAccount = async (companyId, consumptionIds, cuentaCobroId, newPendingBalance = 0, invoiceData = null) => {
    // 1. Marcar consumos como pagados
    setCorporateConsumptions((prev) =>
      prev.map((c) =>
        consumptionIds.includes(c.id)
          ? { ...c, status: 'BILLED', cuentaCobroId, billedAt: new Date().toISOString() }
          : c
      )
    );
    
    // 2. Actualizar saldo pendiente en la empresa
    setCompanies((prev) => 
      prev.map(c => c.id === companyId ? { ...c, pendingBalance: newPendingBalance } : c)
    );

    try {
      // 3. Persistir en Firestore
      await markConsumptionsBilledInFirestore(consumptionIds, cuentaCobroId);
      
      const companyToUpdate = companies.find(c => c.id === companyId);
      if (companyToUpdate) {
        await upsertCompanyInFirestore(companyId, { ...companyToUpdate, pendingBalance: newPendingBalance });
      }
      
      // 4. Guardar factura en el historial
      if (invoiceData) {
        await saveCorporateInvoiceInFirestore(invoiceData);
      }
    } catch (e) {
      console.warn('[AppContext] settleCorporateAccount Firestore error:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Datos del restaurante
        restaurantInfo: RESTAURANT_INFO,

        // Menú (tiempo real desde Firestore, fallback a menuData.js)
        allAdminProducts,
        fastFoodMenu,
        lunchMenu,
        menuLoading,   // true mientras se carga la primera vez

        // Estado de usuario & navegación
        userRole,
        userName,
        shiftMode,
        currentView,
        activeTableId,

        // Datos operativos
        tables,
        salesHistory,
        qrAlerts,
        firestoreStatus,

        // Cuentas Empresariales (Empresas & Consumos)
        companies,
        corporateConsumptions,
        getCorporateInvoicesByCompanyFromFirestore,

        // Acciones
        loginUser,
        logoutUser,
        selectShiftMode,
        setCurrentView,
        setActiveTableId,
        openTableOrder,
        addItemToTable,
        updateItemQty,
        updateTableCustomer,
        clearTable,
        finalizeAndPayOrder,
        markTableServed,
        markTableBilling,
        acceptQrAlert,
        dismissQrAlert,

        // Change Password Modal (estado global compartido entre Navbar y DailyDashboard)
        showPasswordModal,
        setShowPasswordModal,
        passError,
        setPassError,
        passSuccess,
        setPassSuccess,

        // Acciones CRUD & Disponibilidad de Menú para Administrador
        toggleProductAvailability,
        saveAdminProduct,
        deleteAdminProduct,
        bulkToggleCategoryAvailability,
        updateLunchConfig,

        // Acciones de Cuentas Empresariales
        saveCompany,
        deleteCompany,
        addCorporateConsumption,
        deleteCorporateConsumption,
        settleCorporateAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
