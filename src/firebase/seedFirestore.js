/**
 * src/firebase/seedFirestore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed completo de Firestore para "Donde los Zambrano POS"
 *
 * COLECCIONES QUE GESTIONA:
 *   - menu_config/lunch_config  → Configuración de Almuerzos (sopas, proteínas, bebidas, etc.)
 *   - products                  → Todos los ítems del menú (Comidas Rápidas + Adicionales Almuerzo)
 *
 * USO:
 *   - seedAllIfEmpty()  → Se llama automáticamente al iniciar la app (no-op si ya existe data).
 *   - forceSeedAll()    → Borra y re-siembra todo. Solo usar en desarrollo para resetear.
 */
import { collection, getDocs, writeBatch, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { FAST_FOOD_MENU, LUNCH_MENU_DEFAULT } from '../data/menuData';

const PRODUCTS_COL    = 'products';
const MENU_CONFIG_COL = 'menu_config';
const LUNCH_DOC_ID    = 'lunch_config';

// ─────────────────────────────────────────────────────────────────────────────
// BUILDERS — Convierten menuData.js al formato Firestore estructurado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye todos los productos de Comidas Rápidas.
 * Cada item tiene: id, name, price, cost, description, category, categoryIcon,
 *                  session, type, active, sortOrder
 */
const buildFastFoodProducts = () => {
  const products = [];
  let sortOrder = 0;

  FAST_FOOD_MENU.forEach((categoryObj) => {
    categoryObj.items.forEach((item) => {
      products.push({
        id:           item.id,
        name:         item.name,
        price:        item.price,
        cost:         0,           // Costo real → editar desde Firebase Console o panel admin v2
        description:  item.description || '',
        category:     categoryObj.category,
        categoryIcon: categoryObj.icon?.trim() || '',
        session:      'FAST_FOOD', // 'FAST_FOOD' | 'LUNCH'
        type:         'product',   // 'product' | 'extra'
        active:       true,        // false → no aparece en menú del mesero
        sortOrder:    sortOrder++,
      });
    });
  });

  return products;
};

/**
 * Construye los Adicionales del Almuerzo como productos individuales.
 * type: 'extra' los distingue de productos normales.
 */
const buildLunchExtras = () => {
  return LUNCH_MENU_DEFAULT.extras.map((extra, idx) => ({
    id:           extra.id,
    name:         extra.name,
    price:        extra.price,
    cost:         0,
    description:  'Adición para Almuerzo',
    category:     'Adicionales Almuerzo',
    categoryIcon: '➕',
    session:      'LUNCH',
    type:         'extra',         // 'extra' → usado como adicional del almuerzo
    active:       true,
    sortOrder:    2000 + idx,      // Offset alto para separar de Comidas Rápidas
  }));
};

/**
 * Construye el documento de configuración del Almuerzo.
 * Guardado en menu_config/lunch_config
 */
const buildLunchConfig = () => ({
  priceBase:    LUNCH_MENU_DEFAULT.priceBase,
  soups:        LUNCH_MENU_DEFAULT.soups,
  proteins:     LUNCH_MENU_DEFAULT.proteins,
  sidesOptions: LUNCH_MENU_DEFAULT.sidesOptions,
  drinks:       LUNCH_MENU_DEFAULT.drinks,
  updatedAt:    new Date().toISOString(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Siembra la configuración del almuerzo en menu_config/lunch_config
 * si el documento aún no existe.
 */
const seedLunchConfigIfEmpty = async () => {
  const ref = doc(db, MENU_CONFIG_COL, LUNCH_DOC_ID);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    console.log('[Seed] lunch_config already exists. Skipping.');
    return false;
  }

  await setDoc(ref, buildLunchConfig());
  console.log('[Seed] ✅ lunch_config seeded in menu_config.');
  return true;
};

/**
 * Siembra todos los productos (Comidas Rápidas + Adicionales Almuerzo)
 * si la colección products está vacía.
 */
const seedProductsIfEmpty = async () => {
  const snap = await getDocs(collection(db, PRODUCTS_COL));

  if (!snap.empty) {
    console.log(`[Seed] products already seeded (${snap.size} docs). Skipping.`);
    return false;
  }

  const allProducts = [
    ...buildFastFoodProducts(),
    ...buildLunchExtras(),
  ];

  // Firestore batch writes (máx 500 por batch)
  const BATCH_SIZE = 490;
  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = allProducts.slice(i, i + BATCH_SIZE);
    chunk.forEach((product) => {
      const { id, ...data } = product;
      batch.set(doc(db, PRODUCTS_COL, id), data);
    });
    await batch.commit();
    console.log(`[Seed] Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} products)`);
  }

  console.log(`[Seed] ✅ Seeded ${allProducts.length} products.`);
  return true;
};

/**
 * Punto de entrada principal — se llama al iniciar la app.
 * Siembra tanto menu_config como products si están vacíos.
 */
export const seedAllIfEmpty = async () => {
  try {
    await seedLunchConfigIfEmpty();
    await seedProductsIfEmpty();
  } catch (err) {
    console.error('[Seed] Error during seed (non-critical):', err);
  }
};

/**
 * Fuerza un re-seed completo: borra TODO y re-inserta desde menuData.js.
 * ⚠️  SOLO PARA DESARROLLO. No usar en producción sin confirmación del usuario.
 */
export const forceSeedAll = async () => {
  try {
    console.log('[Seed] Force re-seed iniciado…');

    // 1. Borrar todos los products
    const prodSnap = await getDocs(collection(db, PRODUCTS_COL));
    if (!prodSnap.empty) {
      const batch = writeBatch(db);
      prodSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log(`[Seed] Deleted ${prodSnap.size} products.`);
    }

    // 2. Borrar lunch_config
    const lunchRef = doc(db, MENU_CONFIG_COL, LUNCH_DOC_ID);
    const lunchSnap = await getDoc(lunchRef);
    if (lunchSnap.exists()) {
      const batch = writeBatch(db);
      batch.delete(lunchRef);
      await batch.commit();
      console.log('[Seed] Deleted lunch_config.');
    }

    // 3. Re-sembrar todo
    await seedAllIfEmpty();
    console.log('[Seed] ✅ Force re-seed completado.');
    return true;
  } catch (err) {
    console.error('[Seed] Error en force re-seed:', err);
    return false;
  }
};

// Exportar también el anterior por compatibilidad con AppContext
export const seedProductsIfEmpty_legacy = seedProductsIfEmpty;
