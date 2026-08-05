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
} from '../firebase/firestoreService';
import { seedAllIfEmpty } from '../firebase/seedFirestore';

const AppContext = createContext();

// ── Helpers para transformar documentos Firestore al formato que usa la UI ──

/**
 * Convierte la colección `products` (session="FAST_FOOD") al formato
 * de array de categorías que usa OrderConsole.jsx:
 * [ { category, icon, items: [ { id, name, price, description } ] } ]
 */
const buildFastFoodMenuFromDocs = (docs) => {
  const categoryMap = new Map();

  docs
    .filter((d) => d.active !== false)
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
        description: item.description || '',
      });
    });

  return Array.from(categoryMap.values());
};

/**
 * Convierte los extras de Firestore (session="LUNCH", type="extra")
 * al formato: [ { id, name, price } ]
 */
const buildLunchExtrasFromDocs = (docs) =>
  docs
    .filter((d) => d.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => ({
      id:    item.id || item._id,
      name:  item.name,
      price: item.price,
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
  const [fastFoodMenu, setFastFoodMenu] = useState(FAST_FOOD_MENU);     // fallback inmediato
  const [lunchMenu, setLunchMenu]       = useState(LUNCH_MENU_DEFAULT);  // fallback inmediato
  const [menuLoading, setMenuLoading]   = useState(true);

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

  // ── QR Alerts (pedidos reales via QR — inicia vacío) ──────────────────────
  const [qrAlerts, setQrAlerts] = useState([]);

  // ── Persist tables & sales to localStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem('zambrano_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('zambrano_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  // ── Firestore: Seed inicial + Listeners en Tiempo Real ───────────────────
  useEffect(() => {
    // 1. Seed si la BD está vacía (solo la primera vez)
    seedAllIfEmpty().catch((err) =>
      console.warn('[AppContext] Seed error (non-critical):', err)
    );

    // 2. Listener: productos de Comidas Rápidas (session == "FAST_FOOD")
    const fastFoodQuery = query(
      collection(db, 'products'),
      where('session', '==', 'FAST_FOOD'),
      orderBy('sortOrder', 'asc')
    );

    const unsubFastFood = onSnapshot(
      fastFoodQuery,
      (snap) => {
        if (!mounted.current) return;
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        if (docs.length > 0) {
          setFastFoodMenu(buildFastFoodMenuFromDocs(docs));
        }
        setMenuLoading(false);
      },
      (err) => {
        console.warn('[AppContext] fastFood snapshot error (using fallback):', err);
        if (mounted.current) setMenuLoading(false);
      }
    );

    // 3. Listener: extras del almuerzo (session == "LUNCH", type == "extra")
    const lunchExtrasQuery = query(
      collection(db, 'products'),
      where('session', '==', 'LUNCH'),
      where('type', '==', 'extra'),
      orderBy('sortOrder', 'asc')
    );

    const unsubLunchExtras = onSnapshot(
      lunchExtrasQuery,
      (snap) => {
        if (!mounted.current) return;
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        if (docs.length > 0) {
          setLunchMenu((prev) => ({
            ...prev,
            extras: buildLunchExtrasFromDocs(docs),
          }));
        }
      },
      (err) => {
        console.warn('[AppContext] lunchExtras snapshot error (using fallback):', err);
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

    // Cleanup: desuscribir listeners al desmontar
    return () => {
      unsubFastFood();
      unsubLunchExtras();
      unsubLunchConfig();
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

  return (
    <AppContext.Provider
      value={{
        // Datos del restaurante
        restaurantInfo: RESTAURANT_INFO,

        // Menú (tiempo real desde Firestore, fallback a menuData.js)
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
