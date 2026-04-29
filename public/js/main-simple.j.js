const galleryGrid = document.getElementById('galleryGrid');
const commentsList = document.getElementById('commentsList');

async function cargarContenido() {
    try {
        const response = await fetch('/api/contenido');
        const contenido = await response.json();
        const imagenes = contenido.filter(i => i.tipo === 'imagen');
        const comentarios = contenido.filter(i => i.tipo === 'comentario');
        
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
        console.error(error);
        if (galleryGrid) galleryGrid.innerHTML = '<div class="loading">❌ Error al cargar las fotos. Asegúrate de que el servidor esté corriendo.</div>';
        if (commentsList) commentsList.innerHTML = '<div class="loading">❌ Error al cargar comentarios.</div>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

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

cargarContenido();