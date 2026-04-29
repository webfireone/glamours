
// Global state
let allProducts = [];
let currentUser = JSON.parse(localStorage.getItem('glamours_user')) || null;
let cart = []; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("GLAMOURS System Start");
    setupMobileMenu();
    setupModalClosing();
    setupAuthLogic();
    updateUIForUser();
    setupScrollAnimations();
    
    // Load products on start
    fetchProducts();

    if (currentUser) {
        syncCartFromServer();
    } else {
        updateCartCount(); 
    }

    // Dynamic Header Adjustment for Top Banner
    const banner = document.getElementById('top-banner-container');
    const header = document.getElementById('main-header');
    if (banner && header) {
        const updateHeaderPos = () => {
            if (!banner.classList.contains('hidden')) {
                header.style.top = banner.offsetHeight + 'px';
            } else {
                header.style.top = '0px';
            }
        };
        updateHeaderPos();
        // Watch for changes in banner visibility
        const observer = new MutationObserver(updateHeaderPos);
        observer.observe(banner, { attributes: true, attributeFilter: ['class'] });
    }
});

async function fetchProducts() {
    try {
        const res = await fetch('/api/productos');
        allProducts = await res.json();
        console.log("Products loaded:", allProducts.length);
    } catch (err) { console.error("Error cargando productos:", err); }
}

// --- AUTH LOGIC ---
function setupAuthLogic() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('[name="email"]').value;
            const password = loginForm.querySelector('[name="password"]').value;
            
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    loginUser(data.user);
                } else {
                    alert(data.error || "Credenciales incorrectas");
                }
            } catch (err) { alert("Error de conexión"); }
        };
    }
    
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const nombre = registerForm.querySelector('[name="nombre"]').value;
            const email = registerForm.querySelector('[name="email"]').value;
            const password = registerForm.querySelector('[name="password"]').value;
            
            console.log("Intentando registro para:", email);
            
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });
                const data = await res.json();
                if (data.success) {
                    alert("¡Cuenta creada con éxito! Ahora puedes comprar.");
                    loginUser(data.user);
                } else {
                    alert(data.error || "Error al registrar cuenta");
                }
            } catch (err) {
                console.error("Error en el fetch de registro:", err);
                alert("Error técnico al intentar registrarse");
            }
        };
    }
}

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('glamours_user', JSON.stringify(user));
    updateUIForUser();
    syncCartFromServer();
    closeAuthModal();
    console.log("Sesión iniciada:", user.email);
}

function logoutUser() {
    if(!confirm("¿Deseas cerrar sesión?")) return;
    currentUser = null;
    cart = [];
    localStorage.removeItem('glamours_user');
    updateUIForUser();
    updateCartCount();
    location.reload(); // Refresh to clear states
}

function updateUIForUser() {
    const userBtn = document.getElementById('user-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (currentUser) {
        if (userBtn) {
            userBtn.innerHTML = `<i class="fa-solid fa-user-check text-[#00d2ff]"></i> <span class="hidden md:inline ml-1 text-white">${currentUser.nombre.split(' ')[0]}</span>`;
            userBtn.onclick = () => { if(confirm("¿Cerrar sesión?")) logoutUser(); };
        }
        if (signupBtn) {
            signupBtn.innerText = 'Logout';
            signupBtn.onclick = logoutUser;
            signupBtn.className = "hidden lg:block pill-button bg-red-500 text-white px-6 py-2.5 font-semibold hover:bg-red-600 transition cursor-pointer";
        }
    } else {
        if (userBtn) {
            userBtn.innerHTML = `<i class="fa-solid fa-user text-[#00d2ff]"></i> <span class="hidden md:inline ml-1 text-white">Login</span>`;
            userBtn.onclick = openAuthModal;
        }
        if (signupBtn) {
            signupBtn.innerText = 'Sign Up';
            signupBtn.onclick = () => { 
                openAuthModal(); 
                const regSection = document.getElementById('register-section');
                if(regSection && regSection.classList.contains('hidden')) toggleAuthMode(); 
            };
            signupBtn.className = "hidden lg:block pill-button bg-brand-orange text-white px-6 py-2.5 font-semibold hover:bg-orange-600 transition cursor-pointer";
        }
    }
}

// --- CART LOGIC ---
async function syncCartFromServer() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/cart/${currentUser.id}`);
        cart = await res.json();
        updateCartCount();
        const cartModal = document.getElementById('cart-modal');
        if(cartModal && !cartModal.classList.contains('hidden')) openCartView();
    } catch (err) { console.error("Error sincronizando carrito:", err); }
}

async function addToCart(id) {
    if (!currentUser) { 
        alert("Inicia sesión para añadir productos.");
        openAuthModal(); 
        return; 
    }
    try {
        await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId: id })
        });
        syncCartFromServer();
        // Feedback
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('scale-125');
            setTimeout(() => cartBtn.classList.remove('scale-125'), 300);
        }
    } catch (err) { console.error(err); }
}

async function updateQuantity(productId, cantidad) {
    try {
        await fetch('/api/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId, cantidad })
        });
        syncCartFromServer();
    } catch (err) { console.error(err); }
}

async function removeFromCart(productId) {
    if(!confirm("¿Eliminar del carrito?")) return;
    try {
        await fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId })
        });
        syncCartFromServer();
    } catch (err) { console.error(err); }
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((acc, item) => acc + item.cantidad, 0);
}

function openCartView() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    const listEl = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    listEl.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        listEl.innerHTML = '<p class="text-center py-12 text-gray-400">Carrito vacío</p>';
    } else {
        cart.forEach(item => {
            total += item.precio * item.cantidad;
            listEl.innerHTML += `
                <div class="flex items-center gap-4 py-4 border-b border-blue-900/10">
                    <img src="${item.imagenes[0]}" class="w-16 h-16 object-cover rounded-xl border border-blue-900/5">
                    <div class="flex-1">
                        <h4 class="font-bold text-sm text-[#0c1c4d] leading-tight">${item.nombre}</h4>
                        <p class="text-[#00d2ff] font-black text-sm">$${item.precio}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button onclick="updateQuantity('${item.id}', ${item.cantidad - 1})" class="w-6 h-6 rounded-full bg-[#0c1c4d] text-white hover:bg-[#00d2ff] hover:text-[#0c1c4d] transition">-</button>
                            <span class="text-xs font-bold w-4 text-center text-[#0c1c4d]">${item.cantidad}</span>
                            <button onclick="updateQuantity('${item.id}', ${item.cantidad + 1})" class="w-6 h-6 rounded-full bg-[#0c1c4d] text-white hover:bg-[#00d2ff] hover:text-[#0c1c4d] transition">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-blue-900/30 hover:text-red-500 transition">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
        });
    }
    totalEl.innerText = '$' + total.toFixed(2);
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeCartView() { 
    const m = document.getElementById('cart-modal'); 
    if(m) { m.classList.add('hidden'); m.style.display = 'none'; } 
}

// --- CHECKOUT ---
function checkout() {
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    const businessPhone = "5491122618116"; // Número de GLAMOURS
    let message = `¡Hola GLAMOURS! 👋 Quiero realizar el siguiente pedido:\n\n`;
    
    let total = 0;
    cart.forEach(item => {
        message += `• ${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}\n`;
        total += item.precio * item.cantidad;
    });

    message += `\n*Total estimado: $${total.toFixed(2)}*\n`;
    if (currentUser) {
        message += `\nCliente: ${currentUser.nombre}`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// --- UI UTILS ---
function setupHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('bg-white/95', 'shadow-lg', 'py-4', 'top-0');
            header.classList.remove('top-6', 'max-w-7xl', 'mx-auto');
            header.style.width = '100%';
            header.style.maxWidth = '100%';
            header.style.left = '0';
            header.style.right = '0';
            header.style.paddingLeft = '5%';
            header.style.paddingRight = '5%';
        } else {
            header.classList.remove('bg-white/95', 'shadow-lg', 'py-4', 'top-0');
            header.classList.add('top-6', 'max-w-7xl', 'mx-auto');
            header.style.width = '';
            header.style.maxWidth = '';
            header.style.left = '';
            header.style.right = '';
            header.style.paddingLeft = '';
            header.style.paddingRight = '';
        }
    });
}

// --- MODALS ---
function quickView(id) {
    let p = allProducts.find(x => x.id === id);
    if (p) showModal(p);
}

function showModal(product) {
    window.currentViewedId = product.id;
    const m = document.getElementById('quick-view-modal');
    if (!m) return;
    document.getElementById('quick-view-image').src = product.imagenes[0];
    document.getElementById('quick-view-image').style.objectFit = 'contain';
    document.getElementById('quick-view-image').style.backgroundColor = '#f9f9f9';
    document.getElementById('quick-view-name').innerText = product.nombre;
    document.getElementById('quick-view-price').innerText = '$' + product.precio;
    document.getElementById('quick-view-description').innerText = product.descripcion || 'Elegancia y estilo en cada detalle.';
    
    // Talles
    const sizesContainer = document.getElementById('quick-view-sizes-container');
    const sizesList = document.getElementById('quick-view-sizes');
    if (sizesContainer && sizesList) {
        if (product.talles) {
            const talles = product.talles.split(',').map(t => t.trim());
            sizesList.innerHTML = talles.map(t => `<span class="px-3 py-1 border rounded-md text-xs font-bold hover:bg-black hover:text-white transition cursor-pointer">${t}</span>`).join('');
            sizesContainer.classList.remove('hidden');
        } else {
            sizesContainer.classList.add('hidden');
        }
    }

    // Colores
    const colorsContainer = document.getElementById('quick-view-colors-container');
    const colorsList = document.getElementById('quick-view-colors');
    if (colorsContainer && colorsList) {
        if (product.colores) {
            const colores = product.colores.split(',').map(c => c.trim());
            colorsList.innerHTML = colores.map(c => `<span class="px-3 py-1 border rounded-md text-xs font-bold hover:bg-black hover:text-white transition cursor-pointer">${c}</span>`).join('');
            colorsContainer.classList.remove('hidden');
        } else {
            colorsContainer.classList.add('hidden');
        }
    }

    m.classList.remove('hidden'); m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const m = document.getElementById('quick-view-modal');
    if (m) { m.classList.add('hidden'); m.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

function setupModalClosing() {
    document.addEventListener('click', e => {
        if (e.target.id === 'quick-view-modal') closeModal();
        if (e.target.id === 'auth-modal') closeAuthModal();
        if (e.target.id === 'cart-modal') closeCartView();
    });
}

function openAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) { m.classList.remove('hidden'); m.style.display = 'flex'; }
}

function closeAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
}

function toggleAuthMode() {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    if(loginSec && regSec) {
        loginSec.classList.toggle('hidden');
        regSec.classList.toggle('hidden');
    }
}

function setupMobileMenu() {
    const b = document.getElementById('mobile-menu-btn');
    const c = document.getElementById('close-menu-btn');
    const m = document.getElementById('mobile-menu');
    if(b && m) b.onclick = () => m.classList.remove('translate-x-full');
    if(c && m) c.onclick = () => m.classList.add('translate-x-full');
}

function addToCartFromModal() {
    if (window.currentViewedId) { addToCart(window.currentViewedId); closeModal(); }
}

function toggleWishlist(btn) { btn.classList.toggle('text-red-500'); }

/**
 * Generates the HTML for a product card with consistent design.
 */
function createProductCard(product, isPromo = false) {
    const badgeText = product.descuento ? `-${product.descuento}%` : (isPromo ? 'OFERTA' : '');
    const badge = badgeText ? `<span class="absolute top-4 left-4 bg-[#0c1c4d] text-white text-[9px] font-bold px-3 py-1 z-20 tracking-widest uppercase rounded-full shadow-lg">${badgeText}</span>` : '';
    const imgUrl = product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : 'https://via.placeholder.com/400x500?text=Glamours';
    return `
        <div class="product-card group cursor-pointer fade-in-up" onclick="quickView('${product.id}')">
            <div class="image-frame relative overflow-hidden aspect-[3/4] mb-4">
                ${badge}
                <img src="${imgUrl}" alt="${product.nombre}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                <div class="absolute inset-0 bg-[#0c1c4d]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                    <button class="bg-white text-[#0c1c4d] text-[10px] font-bold py-3 px-6 tracking-widest uppercase rounded-full shadow-xl" onclick="event.stopPropagation(); quickView('${product.id}')">Ver Detalle</button>
                </div>
            </div>
            <div class="text-center px-1">
                <p class="text-[10px] text-[#0c1c4d]/50 uppercase tracking-widest mb-1 font-bold">${product.marca || 'Glamours'}</p>
                <h3 class="text-sm font-bold text-[#0c1c4d] mb-1 truncate">${product.nombre}</h3>
                <p class="text-lg font-black text-[#0c1c4d]">$${product.precio}</p>
            </div>
        </div>
    `;
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Seleccionar elementos que no sean del Hero (que ya se animan solos al cargar)
    // Para el resto del sitio (Categorías, Productos), pausamos la animación hasta que se vean.
    const scrollElements = document.querySelectorAll('.fade-in-up:not(.hero-container .fade-in-up)');
    scrollElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        el.style.opacity = '0';
        observer.observe(el);
    });
}
