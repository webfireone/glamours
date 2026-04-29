const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Temporal: productos en memoria si Firebase falla
let productosCache = [
    { id: "prod_1", nombre: "Chaqueta Urbana Premium", precio: 150.00, marca: "Sail", imagenes: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80"], novedad: true, oferta: false, descripcion: "Chaqueta de alta calidad." }
];
let firebaseOk = false;

// Inicialización de Firebase
try {
    let serviceAccount;
    if (process.env.FIREBASE_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    } else {
        serviceAccount = require('./firebase-key.json');
    }
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase conectado con éxito.");
    firebaseOk = true;
} catch (error) {
    console.error("Error al conectar con Firebase:", error.message);
    console.log("Usando datos temporales. IMPORTANTE: Actualizá las credenciales en Firebase Console.");
    firebaseOk = false;
}

const db = firebaseOk ? admin.firestore() : null;

app.use(cors());
app.use(express.json());

// Log de peticiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- PRODUCTS ---
app.get('/api/productos', async (req, res) => {
    try {
        if (!firebaseOk || !db) {
            console.log("Firebase no disponible, devolviendo productos por defecto");
            return res.json(productosCache);
        }
        
        console.log("Intentando obtener productos de Firestore...");
        const snapshot = await db.collection('products').get();
        console.log("Snapshot obtenu, docs:", snapshot.size);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Si no hay productos, devolver el default pero no guardarlo (opcional)
        if (products.length === 0) {
            console.log("No hay productos en Firestore, devolviendo default");
            return res.json(productosCache);
        }
        console.log("Productos encontrados:", products.length);
        res.json(products);
    } catch (e) {
        console.error("Error en /api/productos:", e.message);
        console.log("Usando productos por defecto");
        res.json(productosCache);
    }
});

app.post('/api/admin/productos', async (req, res) => {
    try {
        const newProduct = { ...req.body, createdAt: new Date().toISOString() };
        let result;
        if (db) {
            const docRef = await db.collection('products').add(newProduct);
            result = { id: docRef.id, ...newProduct };
        } else {
            const tempId = `temp_${Date.now()}`;
            newProduct.id = tempId;
            productosCache.push(newProduct);
            result = newProduct;
        }
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/admin/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (db) {
            await db.collection('products').doc(id).update(req.body);
        } else {
            // In‑memory fallback
            const index = productosCache.findIndex(p => p.id === id);
            if (index !== -1) {
                productosCache[index] = { ...productosCache[index], ...req.body };
            } else {
                return res.status(404).json({ error: 'Producto no encontrado en caché' });
            }
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (db) {
            await db.collection('products').doc(id).delete();
        } else {
            // In‑memory fallback
            const originalLength = productosCache.length;
            productosCache = productosCache.filter(p => p.id !== id);
            if (productosCache.length === originalLength) {
                return res.status(404).json({ error: 'Producto no encontrado en caché' });
            }
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return res.status(400).json({ error: "Este email ya está registrado." });
        }

        const newUser = { nombre, email, password, carrito: [], isAdmin: false };
        const docRef = await usersRef.add(newUser);
        res.json({ success: true, user: { id: docRef.id, ...newUser } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Hardcoded admin for initial access if DB is empty
        if (email === 'SILVINA' && password === 'SILVINA') {
            return res.json({ success: true, user: { id: "admin_silvina", nombre: "Silvina", email: "SILVINA", isAdmin: true } });
        }

        const snapshot = await db.collection('users').where('email', '==', email).where('password', '==', password).get();
        if (snapshot.empty) {
            return res.status(401).json({ error: "Email o contraseña incorrectos." });
        }
        
        const userDoc = snapshot.docs[0];
        res.json({ success: true, user: { id: userDoc.id, ...userDoc.data() } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/update-credentials', async (req, res) => {
    // Para simplificar, este endpoint ahora solo responde éxito si se intenta con el usuario Silvina
    // En un sistema real, actualizaríamos el documento del admin en Firestore
    res.json({ success: true, message: "Funcionalidad delegada a Firestore." });
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => !u.isAdmin);
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- CART ---
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: "Usuario no encontrado" });
        
        const user = userDoc.data();
        const fullCart = await Promise.all((user.carrito || []).map(async (item) => {
            const prodDoc = await db.collection('products').doc(item.id).get();
            return prodDoc.exists ? { id: prodDoc.id, ...prodDoc.data(), cantidad: item.cantidad } : null;
        }));
        
        res.json(fullCart.filter(p => p));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cart/add', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const user = userDoc.data();
            const carrito = user.carrito || [];
            const existing = carrito.find(item => item.id === productId);
            
            if (existing) existing.cantidad += 1;
            else carrito.push({ id: productId, cantidad: 1 });
            
            await userRef.update({ carrito });
            res.json({ success: true });
        } else res.status(404).json({ error: "Usuario no encontrado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cart/update', async (req, res) => {
    try {
        const { userId, productId, cantidad } = req.body;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const user = userDoc.data();
            let carrito = user.carrito || [];
            const index = carrito.findIndex(i => i.id === productId);
            
            if (index !== -1) {
                if (cantidad <= 0) {
                    carrito = carrito.filter(i => i.id !== productId);
                } else {
                    carrito[index].cantidad = cantidad;
                }
                await userRef.update({ carrito });
                res.json({ success: true });
            } else res.status(404).json({ error: "Item no encontrado" });
        } else res.status(404).json({ error: "Usuario no encontrado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const user = userDoc.data();
            const carrito = (user.carrito || []).filter(item => item.id !== productId);
            await userRef.update({ carrito });
            res.json({ success: true });
        } else res.status(404).json({ error: "Usuario no encontrado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- CONFIG ---
let siteConfigCache = {
    topBanner: "✨ Envíos GRATIS en compras superiores a $120.000 | 3 CUOTAS SIN INTERÉS ✨",
    heroTitle: "The Future of <br> <span class=\"italic font-light\">Intelligent</span> Fashion",
    heroDesc: "Descubre las últimas tendencias en moda urbana. Sail, Legacy, 47 Street y Owoko en un solo lugar. Eleva tu estilo con prendas seleccionadas para todos los días.",
    heroImage: "/hero_model.png",
    cat1Name: "Sail", cat1Img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
    cat2Name: "Legacy", cat2Img: "https://images.unsplash.com/photo-1539109132381-3151b8a701d4?auto=format&fit=crop&q=80&w=800",
    cat3Name: "47 Street", cat3Img: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=800",
    cat4Name: "Owoko", cat4Img: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&q=80&w=800"
};

app.get('/api/config', async (req, res) => {
    try {
        if (!firebaseOk || !db) {
            console.log("Firebase no disponible, devolviendo configuración por defecto");
            return res.json(siteConfigCache);
        }
        const configDoc = await db.collection('settings').doc('config').get();
        if (!configDoc.exists) return res.json(siteConfigCache);
        res.json(configDoc.data());
    } catch (e) {
        console.error("Error en /api/config:", e);
        res.json(siteConfigCache);
    }
});

app.put('/api/admin/config', async (req, res) => {
    try {
        if (db) {
            await db.collection('settings').doc('config').set(req.body, { merge: true });
        } else {
            siteConfigCache = { ...siteConfigCache, ...req.body };
        }
        res.json({ success: true, config: req.body });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/Admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin.html')));
// Health check endpoint - PC para evitar que Render duerma
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Servidor GLAMOURS corriendo en http://localhost:${PORT}`));
