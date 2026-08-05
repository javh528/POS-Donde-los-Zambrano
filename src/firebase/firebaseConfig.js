// src/firebase/firebaseConfig.js
// Inicialización directa del SDK de Firebase para "Donde los Zambrano POS"
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyC2tYeVmElAo5e1xj1JDP-Fh1cPc4lA9Hs",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "pos-donde-los-zambrano.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID        || "pos-donde-los-zambrano",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "pos-donde-los-zambrano.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "147250852511",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:147250852511:web:c66e836aafdbdfeb56e8aa",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-QHH3M5VZN7",
};

// Initialize Firebase app (singleton)
const app = initializeApp(firebaseConfig);

// Initialize Firestore directly for instant real-time online syncing
export const db = getFirestore(app);

export default app;
