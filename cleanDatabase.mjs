/**
 * cleanDatabase.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Script de limpieza total para entrega al cliente.
 * Borra TODOS los documentos de las colecciones:
 *   - orders            (pedidos de prueba)
 *   - customers         (clientes de demo)
 *   - analytics_daily   (métricas del testing)
 *
 * USO:
 *   node cleanDatabase.mjs
 *
 * NOTA: El menú (products, menu_config) NO se borra — son datos del negocio.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// ── Configuración Firebase (misma que firebaseConfig.js) ──────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyC2tYeVmElAo5e1xj1JDP-Fh1cPc4lA9Hs",
  authDomain:        "pos-donde-los-zambrano.firebaseapp.com",
  projectId:         "pos-donde-los-zambrano",
  storageBucket:     "pos-donde-los-zambrano.firebasestorage.app",
  messagingSenderId: "147250852511",
  appId:             "1:147250852511:web:c66e836aafdbdfeb56e8aa",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Colecciones a vaciar ───────────────────────────────────────────────────────
const COLLECTIONS_TO_CLEAR = [
  'orders',
  'customers',
  'analytics_daily',
];

async function deleteAllDocsInCollection(colName) {
  const colRef  = collection(db, colName);
  const snap    = await getDocs(colRef);

  if (snap.empty) {
    console.log(`  ⚪ [${colName}] — ya está vacía.`);
    return 0;
  }

  const deletions = snap.docs.map((d) => deleteDoc(doc(db, colName, d.id)));
  await Promise.all(deletions);
  console.log(`  ✅ [${colName}] — ${snap.size} documento(s) eliminado(s).`);
  return snap.size;
}

async function main() {
  console.log('\n🧹 LIMPIEZA DE BASE DE DATOS — DONDE LOS ZAMBRANO POS\n');
  console.log('   Borrando datos de prueba de Firestore...\n');

  let total = 0;
  for (const col of COLLECTIONS_TO_CLEAR) {
    total += await deleteAllDocsInCollection(col);
  }

  console.log(`\n✅ Listo. ${total} documento(s) de prueba eliminado(s) de Firestore.`);
  console.log('   El menú (products, menu_config) permanece intacto.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error durante la limpieza:', err);
  process.exit(1);
});
