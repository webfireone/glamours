const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const publicPath = path.resolve(__dirname, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'colegio-secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.static(publicPath));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const CONTENIDO_FILE = path.join(__dirname, 'contenido.json');
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');

if (!fs.existsSync(CONTENIDO_FILE)) fs.writeFileSync(CONTENIDO_FILE, JSON.stringify([]));
if (!fs.existsSync(USUARIOS_FILE)) fs.writeFileSync(USUARIOS_FILE, JSON.stringify([]));

function leerContenido() {
    try { return JSON.parse(fs.readFileSync(CONTENIDO_FILE, 'utf8')); } catch { return []; }
}
function guardarContenido(data) {
    fs.writeFileSync(CONTENIDO_FILE, JSON.stringify(data, null, 2));
}
function leerUsuarios() {
    try { return JSON.parse(fs.readFileSync(USUARIOS_FILE, 'utf8')); } catch { return []; }
}
function guardarUsuarios(data) {
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(data, null, 2));
}

// ========== API ==========
app.get('/api/contenido', (req, res) => {
    const contenido = leerContenido();
    contenido.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(contenido);
});

app.post('/api/subir-contenido', (req, res, next) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: 'No autorizado' });
    next();
}, upload.single('imagen'), (req, res) => {
    try {
        const { tipo, titulo, descripcion, autor } = req.body;
        const nuevo = {
            id: Date.now().toString(),
            tipo,
            titulo: titulo || '',
            descripcion: descripcion || '',
            autor: autor || 'Anónimo',
            fecha: new Date().toISOString(),
            visible: true
        };
        if (tipo === 'imagen' && req.file) {
            nuevo.imagenUrl = `/uploads/${req.file.filename}`;
        }
        const contenido = leerContenido();
        contenido.push(nuevo);
        guardarContenido(contenido);
        res.json({ success: true, contenido: nuevo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/contenido/:id', (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    let contenido = leerContenido();
    contenido = contenido.filter(item => item.id !== id);
    guardarContenido(contenido);
    res.json({ success: true });
});

app.get('/api/usuarios', (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: 'No autorizado' });
    const usuarios = leerUsuarios();
    res.json(usuarios);
});

app.post('/api/set-admin', (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: 'No autorizado' });
    const { userId, isAdmin } = req.body;
    let usuarios = leerUsuarios();
    const index = usuarios.findIndex(u => u.userId === userId);
    if (index !== -1) {
        usuarios[index].isAdmin = isAdmin;
        guardarUsuarios(usuarios);
    }
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        req.session.username = username;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-session', (req, res) => {
    res.json({ isAdmin: req.session.isAdmin === true });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== RUTAS HTML ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    // Intenta con minúsculas primero, luego con mayúsculas por si acaso
    let adminPath = path.join(publicPath, 'admin.html');
    if (!fs.existsSync(adminPath)) {
        adminPath = path.join(publicPath, 'ADMIN.html');
    }
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send('admin.html no encontrado. Asegúrate de que el archivo se llame admin.html (minúsculas) en la carpeta public/');
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`📁 Panel admin: http://localhost:${PORT}/admin`);
    console.log(`🔑 Usuario: admin | Contraseña: admin123`);
});