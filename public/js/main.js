import { onAuthChange, loginWithGoogle, logout } from './auth.js';

const galleryGrid = document.getElementById('galleryGrid');
const commentsList = document.getElementById('commentsList');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userNameDisplay = document.getElementById('userNameDisplay');
const adminLink = document.getElementById('adminLink');

// Cargar el contenido (fotos y comentarios) desde el servidor
async function cargarContenido() {
    try {
        const response = await fetch('/api/contenido');
        const contenido = await response.json();
        const imagenes = contenido.filter(i => i.tipo === 'imagen');
        const comentarios = contenido.filter(i => i.tipo === 'comentario');
        
        // Galería
        if (galleryGrid) {
            if (imagenes.length === 0) {
                galleryGrid.innerHTML = '<div class="loading">📷 Aún no hay fotos. Los administradores pueden subir desde el panel de carga.</div>';
            } else {
                galleryGrid.innerHTML = imagenes.map(img => `
                    <div class="gallery-item">
                        <img src="${img.imagenUrl}" alt="${escapeHtml(img.titulo)}">
                        <div class="gallery-caption">
                            <strong>${escapeHtml(img.titulo)}</strong>
                            <p>${escapeHtml(img.descripcion)}</p>
                            <small>📸 ${escapeHtml(img.autor)} - ${new Date(img.fecha).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Comentarios
        if (commentsList) {
            if (comentarios.length === 0) {
                commentsList.innerHTML = '<div class="loading">💬 No hay comentarios destacados todavía.</div>';
            } else {
                commentsList.innerHTML = comentarios.map(com => `
                    <div class="comment-card">
                        <div class="comment-header">
                            <strong>${escapeHtml(com.titulo) || 'Comentario destacado'}</strong>
                            <span>⭐ Destacado</span>
                        </div>
                        <p class="comment-text">${escapeHtml(com.descripcion)}</p>
                        <small class="comment-author">— ${escapeHtml(com.autor)}</small>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar contenido:', error);
        if (galleryGrid) galleryGrid.innerHTML = '<div class="loading">❌ Error al cargar las fotos. ¿El servidor está corriendo?</div>';
        if (commentsList) commentsList.innerHTML = '<div class="loading">❌ Error al cargar comentarios.</div>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Estado de autenticación
onAuthChange((userData) => {
    if (userData) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userNameDisplay.innerText = userData.user.displayName || userData.user.email;
        adminLink.style.display = userData.isAdmin ? 'inline' : 'none';
    } else {
        loginBtn.style.display = 'inline-block';
        userInfo.style.display = 'none';
        adminLink.style.display = 'none';
    }
});

loginBtn?.addEventListener('click', () => {
    loginWithGoogle().catch(console.error);
});
logoutBtn?.addEventListener('click', logout);

// Scroll suave: los enlaces funcionan correctamente
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId !== '/admin') {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Cargar contenido al inicio
cargarContenido();