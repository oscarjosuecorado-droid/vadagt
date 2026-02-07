import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaCz52lh8uU8y-oS4muCeIPVroPdLs2ws",
  authDomain: "vada-gt.firebaseapp.com",
  projectId: "vada-gt",
  storageBucket: "vada-gt.firebasestorage.app",
  messagingSenderId: "412863431800",
  appId: "1:412863431800:web:34af7878daba6f70ca198d"
};

// Inicialización para evitar errores de duplicado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exportamos db apuntando a la base de datos 'default' (Enterprise)
export const db = getFirestore(app);
