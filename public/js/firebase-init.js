import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ⚠️ REEMPLAZAR CON TUS CREDENCIALES REALES DE FIREBASE (PASO 1 DEL MANUAL)
const firebaseConfig = {
    apiKey: "AIzaSyD_EJjXzDgE9Xx5VvDkqEjemplo123456",
    authDomain: "colegio-amigos.firebaseapp.com",
    projectId: "colegio-amigos",
    storageBucket: "colegio-amigos.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcd1234efgh5678"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);