async function checkSession() {
    const res = await fetch('/api/check-session');
    const data = await res.json();
    if (data.isAdmin) {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('panelView').style.display = 'block';
        cargarContenido();
        cargarUsuarios();
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('panelView').style.display = 'none';
    }
}

document.getElementById('loginBtnAdmin')?.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (res.ok) {
        checkSession();
        document.getElementById('loginError').innerText = '';
    } else {
        document.getElementById('loginError').innerText = 'Usuario o contraseña incorrectos';
    }
});

document.getElementById('logoutBtnAdmin')?.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    checkSession();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        if (tabId === 'manage') cargarContenido();
        if (tabId === 'users') cargarUsuarios();
    });
});

document.getElementById('uploadImageForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('tipo', 'imagen');
    formData.append('titulo', document.getElementById('imageTitle').value);
    formData.append('descripcion', document.getElementById('imageDesc').value);
    formData.append('autor', document.getElementById('imageAuthor').value);
    const file = document.getElementById('imageFile').files[0];
    if (!file) return alert('Selecciona una imagen');
    formData.append('imagen', file);
    
    const res = await fetch('/api/subir-contenido', { method: 'POST', body: formData });
    if (res.ok) {
        alert('Imagen subida correctamente');
        document.getElementById('uploadImageForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        cargarContenido();
    } else {
        alert('Error al subir la imagen');
    }
});

document.getElementById('uploadCommentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        tipo: 'comentario',
        titulo: document.getElementById('commentTitle').value,
        descripcion: document.getElementById('commentText').value,
        autor: document.getElementById('commentAuthor').value
    };
    const res = await fetch('/api/subir-contenido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        alert('Comentario publicado');
        document.getElementById('uploadCommentForm').reset();
        cargarContenido();
    } else {
        alert('Error al publicar comentario');
    }
});

document.getElementById('imageFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('imagePreview').innerHTML = `<img src="${ev.target.result}" alt="Vista previa">`;
        };
        reader.readAsDataURL(file);
    }
});

async function cargarContenido() {
    const res = await fetch('/api/contenido');
    const contenido = await res.json();
    const container = document.getElementById('contenidoList');
    if (!container) return;
    if (contenido.length === 0) {
        container.innerHTML = '<p>No hay contenido publicado</p>';
        return;
    }
    container.innerHTML = contenido.map(item => `
        <div class="contenido-card">
            <div>
                <strong>${escapeHtml(item.titulo || 'Sin título')}</strong><br>
                <small>${escapeHtml(item.descripcion || '')}</small><br>
                <small>Por: ${escapeHtml(item.autor)} - ${new Date(item.fecha).toLocaleString()}</small>
                ${item.imagenUrl ? `<img src="${item.imagenUrl}" alt="imagen">` : ''}
            </div>
            <button onclick="eliminarContenido('${item.id}')" class="delete-btn">Eliminar</button>
        </div>
    `).join('');
}

window.eliminarContenido = async (id) => {
    if (confirm('¿Eliminar este contenido?')) {
        await fetch(`/api/contenido/${id}`, { method: 'DELETE' });
        cargarContenido();
    }
};

async function cargarUsuarios() {
    const res = await fetch('/api/usuarios');
    const usuarios = await res.json();
    const container = document.getElementById('usersList');
    if (!container) return;
    if (usuarios.length === 0) {
        container.innerHTML = '<p>No hay usuarios registrados</p>';
        return;
    }
    container.innerHTML = usuarios.map(user => `
        <div class="user-card">
            <div>
                <strong>${escapeHtml(user.nombre || user.email)}</strong><br>
                <small>${user.email}</small>
            </div>
            <label class="admin-toggle">
                <input type="checkbox" ${user.isAdmin ? 'checked' : ''} onchange="toggleAdmin('${user.userId}', this.checked)">
                Administrador
            </label>
        </div>
    `).join('');
}

window.toggleAdmin = async (userId, isAdmin) => {
    await fetch('/api/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin })
    });
    alert('Privilegios actualizados');
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

checkSession();