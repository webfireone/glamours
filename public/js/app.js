// Global state
window.allProducts = [];
let cart = JSON.parse(localStorage.getItem('glamours_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('glamours_user')) || null;
let siteConfig = {};

async function loadSiteConfig() {
    try {
        const res = await fetch('/api/config');
        siteConfig = await res.json();
        
        // Populate Top Banner
        const banner = document.getElementById('top-banner');
        if (banner && siteConfig.topBanner) {
            banner.innerText = siteConfig.topBanner;
            banner.classList.remove('hidden');
        } else if (banner) {
            banner.classList.add('hidden');
        }

        // Home specific config (if on index.html)
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            if (siteConfig.heroTitle) document.getElementById('hero-title').innerHTML = siteConfig.heroTitle;
            if (siteConfig.heroDesc) document.getElementById('hero-desc').innerText = siteConfig.heroDesc;
            if (siteConfig.heroImage) document.getElementById('hero-image').src = siteConfig.heroImage;
            
            // Categories
            for (let i = 1; i <= 4; i++) {
                const name = siteConfig[`cat${i}Name`];
                const img = siteConfig[`cat${i}Img`];
                const elName = document.getElementById(`cat${i}-name`);
                const elImg = document.getElementById(`cat${i}-img`);
                const container = document.getElementById(`cat${i}-container`);
                
                if (name && img && elName && elImg) {
                    elName.innerText = name;
                    elImg.src = img;
                    if(container) container.classList.remove('hidden');
                } else if (container) {
                    container.classList.add('hidden');
                }
            }
        }
    } catch (e) {
        console.error("Error cargando configuración:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSiteConfig();
    fetchProducts();
    updateCartCount();
    updateUIForUser();
    
    // Banner rotativo
    const banner = document.getElementById('top-banner-container');
    const bannerText = document.getElementById('top-banner-text');
    if (banner && bannerText) {
        const ads = [
            "✨ 3 CUOTAS SIN INTERÉS EN TODA LA TIENDA ✨",
            "🚀 ENVÍOS GRATIS EN COMPRAS MAYORES A $50.000 🚀",
            "💎 NUEVA COLECCIÓN SAIL & LEGACY YA DISPONIBLE 💎"
        ];
        let i = 0;
        bannerText.innerText = ads[0];
        banner.classList.remove('hidden');
        setInterval(() => {
            i = (i + 1) % ads.length;
            bannerText.innerText = ads[i];
        }, 5000);
    }
});

async function fetchProducts() {
    try {
        const res = await fetch('/api/productos');
        window.allProducts = await res.json();
        console.log("Productos cargados:", window.allProducts.length);
        
        // Renderizar si estamos en la home
        const gridPortada = document.getElementById('grid-portada');
        if (gridPortada) {
            const featured = window.allProducts.filter(p => p.portada);
            gridPortada.innerHTML = featured.map(p => createProductCard(p)).join('');
        }
    } catch (err) { console.error("Error cargando productos:", err); }
}

// --- CARRITO ---
function addToCart(productId) {
    // Robust finding by ID (string or number)
    const product = window.allProducts.find(p => String(p.id) === String(productId));
    if (!product) {
        console.warn("Producto no encontrado:", productId);
        return;
    }

    const existing = cart.find(item => String(item.id) === String(productId));
    if (existing) {
        existing.cantidad += 1;
    } else {
        cart.push({ ...product, cantidad: 1 });
    }
    
    saveCart();
    updateCartCount();
    
    // Provide visual feedback
    const btn = document.getElementById('cart-btn');
    if(btn) {
        btn.classList.add('scale-125', 'text-brand-orange');
        setTimeout(() => btn.classList.remove('scale-125', 'text-brand-orange'), 300);
    }
    
    openCartView();
}

function addToCartFromModal() {
    if (window.currentViewedId) {
        addToCart(window.currentViewedId);
        closeModal();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    openCartView();
}

function updateQuantity(productId, newQty) {
    if (newQty < 1) return removeFromCart(productId);
    const item = cart.find(i => i.id === productId);
    if (item) item.cantidad = newQty;
    saveCart();
    updateCartCount();
    openCartView();
}

function saveCart() {
    localStorage.setItem('glamours_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) {
        const count = cart.reduce((acc, item) => acc + item.cantidad, 0);
        el.innerText = count;
    }
}

function openCartView() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    const listEl = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    if (!listEl || !totalEl) return;
    
    listEl.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        listEl.innerHTML = '<div class="text-center py-20"><i class="fa-solid fa-basket-shopping text-4xl text-gray-200 mb-4 block"></i><p class="text-gray-400 font-medium">Tu carrito está vacío</p></div>';
    } else {
        cart.forEach(item => {
            total += item.precio * item.cantidad;
            listEl.innerHTML += `
                <div class="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
                    <div class="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <img src="${item.imagenes[0]}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-sm text-gray-900 leading-tight mb-1">${item.nombre}</h4>
                        <p class="text-brand-orange font-black text-sm">$${item.precio}</p>
                        <div class="flex items-center gap-3 mt-3">
                            <button onclick="updateQuantity('${item.id}', ${item.cantidad - 1})" class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-orange hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <span class="text-xs font-bold w-4 text-center">${item.cantidad}</span>
                            <button onclick="updateQuantity('${item.id}', ${item.cantidad + 1})" class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-orange hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-gray-300 hover:text-red-500 transition p-2">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
        });
    }
    totalEl.innerText = '$' + total.toFixed(2);
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

window.toggleCart = openCartView;

function closeCartView() {
    const m = document.getElementById('cart-modal');
    if (m) {
        m.classList.add('hidden');
        m.style.display = 'none';
    }
}

// --- AUTH ---
function openAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) m.classList.remove('hidden');
}

function closeAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) m.classList.add('hidden');
}

function toggleAuthMode() {
    const login = document.getElementById('login-section');
    const register = document.getElementById('register-section');
    login.classList.toggle('hidden');
    register.classList.toggle('hidden');
}

function updateUIForUser() {
    const userBtn = document.getElementById('user-btn');
    if (!userBtn) return;
    
    if (currentUser) {
        userBtn.innerHTML = `<i class="fa-solid fa-user-check text-brand-orange"></i> <span class="hidden md:inline ml-1">${currentUser.nombre.split(' ')[0]}</span>`;
        userBtn.onclick = () => { if(confirm("¿Cerrar sesión?")) logoutUser(); };
        
        // Update Sign Up button to logout if present
        const signUpBtn = document.querySelector('button[onclick*="openAuthModal"]');
        if (signUpBtn) {
            signUpBtn.innerText = "Logout";
            signUpBtn.onclick = () => { if(confirm("¿Cerrar sesión?")) logoutUser(); };
        }
    } else {
        userBtn.innerHTML = `<i class="fa-solid fa-user"></i> <span class="hidden md:inline ml-1">Login</span>`;
        userBtn.onclick = openAuthModal;
    }
}

function logoutUser() {
    localStorage.removeItem('glamours_user');
    currentUser = null;
    location.reload();
}

// --- MODALS ---
window.quickView = function(id) {
    let p = window.allProducts.find(x => x.id === id);
    if (p) showModal(p);
};

function showModal(product) {
    window.currentViewedId = product.id;
    const m = document.getElementById('quick-view-modal');
    if (!m) return;
    
    document.getElementById('quick-view-image').src = product.imagenes[0];
    document.getElementById('quick-view-brand').innerText = product.marca || 'GLAMOURS';
    document.getElementById('quick-view-name').innerText = product.nombre;
    document.getElementById('quick-view-price').innerText = '$' + product.precio;
    document.getElementById('quick-view-description').innerText = product.descripcion || 'Diseño exclusivo de temporada.';
    
    // Talles
    const sizesCont = document.getElementById('quick-view-sizes-container');
    const sizesList = document.getElementById('quick-view-sizes');
    if (sizesList) {
        if (product.talles) {
            sizesList.innerHTML = product.talles.split(',').map(t => `
                <span class="px-3 py-1 border border-blue-900/10 rounded-lg text-[10px] font-bold uppercase text-[#0c1c4d]">${t.trim()}</span>
            `).join('');
            if(sizesCont) sizesCont.classList.remove('hidden');
        } else {
            if(sizesCont) sizesCont.classList.add('hidden');
        }
    }

    m.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const m = document.getElementById('quick-view-modal');
    if (m) {
        m.classList.add('hidden');
        m.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

window.toggleWishlist = function(btn) {
    const icon = btn.querySelector('i');
    icon.classList.toggle('fa-regular');
    icon.classList.toggle('fa-solid');
    icon.classList.toggle('text-red-500');
};

// --- HELPERS ---
function createProductCard(product, isPromo = false) {
    const badge = product.descuento ? `<span class="absolute top-4 left-4 bg-brand-orange text-white text-[9px] font-bold px-3 py-1 z-20 rounded-full shadow-lg">-${product.descuento}%</span>` : '';
    const imgUrl = product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : 'https://via.placeholder.com/400x500?text=Glamours';
    
    return `
        <div class="product-card group cursor-pointer fade-in-up" onclick="window.quickView('${product.id}')">
            <div class="image-frame relative aspect-[3/4] mb-4 overflow-hidden rounded-xl bg-white/50 border border-white/20 shadow-sm">
                ${badge}
                <img src="${imgUrl}" alt="${product.nombre}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                <div class="absolute inset-0 bg-brand-orange/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-50">
                    <button class="bg-white text-brand-orange text-[10px] font-bold py-3 px-6 uppercase rounded-full shadow-xl hover:scale-110 transition-transform" 
                            onclick="event.stopPropagation(); window.quickView('${product.id}')">
                        Ver Detalle
                    </button>
                </div>
            </div>
            <div class="text-center">
                <p class="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">${product.marca || 'Glamours'}</p>
                <h3 class="text-sm font-bold text-gray-900 mb-1 truncate">${product.nombre}</h3>
                <p class="text-lg font-black text-brand-orange">$${product.precio}</p>
            </div>
        </div>
    `;
}

function checkout() {
    if (cart.length === 0) return alert("Tu carrito está vacío");
    let msg = "¡Hola Glamours! Me gustaría realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
        msg += `- ${item.nombre} (x${item.cantidad}) - $${item.precio}\n`;
    });
    msg += `\nTotal: ${document.getElementById('cart-total').innerText}`;
    window.open(`https://wa.me/5491122618116?text=${encodeURIComponent(msg)}`, '_blank');
}
