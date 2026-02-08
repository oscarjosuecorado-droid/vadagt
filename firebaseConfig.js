import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...", // Tu API Key real
  authDomain: "vada-gt.firebaseapp.com",
  projectId: "vada-gt", // <--- Debe coincidir con tu ID de proyecto
  storageBucket: "vada-gt.firebasestorage.app",
  messagingSenderId: "412863431800", // El número que me pasaste
  appId: "1:412863431800:web:..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);