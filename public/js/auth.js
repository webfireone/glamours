import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// Tu configuración real de Firebase (la copiaste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyDnNowPw4dS1pR2eMO4QAD9-_1QqL0MEqo",
  authDomain: "colegio-d5c21.firebaseapp.com",
  projectId: "colegio-d5c21",
  storageBucket: "colegio-d5c21.firebasestorage.app",
  messagingSenderId: "17640756505",
  appId: "1:17640756505:web:da09d0830af699bd9a6188",
  measurementId: "G-281D7DBRTC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Funciones para backend (verificar admin, registrar usuario)
async function checkIsAdmin(userId) {
    const res = await fetch('/api/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    const data = await res.json();
    return data.isAdmin;
}

async function registerUser(user) {
    await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            nombre: user.displayName || user.email,
            isAdmin: false
        })
    });
}

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        await registerUser(result.user);
        return result.user;
    } catch (error) {
        console.error("Error en login con Google:", error);
        alert("No se pudo iniciar sesión. Revisa la consola.");
        throw error;
    }
}

export async function logout() {
    await signOut(auth);
    window.location.reload();
}

export function onAuthChange(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const isAdmin = await checkIsAdmin(user.uid);
            callback({ user, isAdmin });
        } else {
            callback(null);
        }
    });
}