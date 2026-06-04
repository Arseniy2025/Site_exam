
const products = [
    { id: 1, name: "Смартфон Poco", price: 24990, stock: 7, addedDate: "10-02-2024", category: "phones", img: "./images/Poco.png" },
    { id: 2, name: "Ноутбук Osio", price: 58990, stock: 3, addedDate: "15-01-2025", category: "laptops", img: "./images/Osio.png" },
    { id: 3, name: "Беспроводные наушники", price: 4990, stock: 12, addedDate: "20-02-2023", category: "audio", img: "./images/audio.png" },
    { id: 4, name: "Умные часы Rolex", price: 19990, stock: 2, addedDate: "28-01-2026", category: "wearables", img: "./images/Rolex.png" },
    { id: 5, name: "Игровая клавиатура RGB", price: 6990, stock: 12, addedDate: "01-12-2024", category: "accessories", img: "./images/Keyboard.png" },
    { id: 6, name: "Монитор 4K", price: 32990, stock: 5, addedDate: "05-02-2025", category: "monitors", img: "./images/Monitor.png" },
    { id: 7, name: "Планшет Huawey", price: 18990, stock: 4, addedDate: "20-01-2025", category: "tablets", img: "./images/Tablet.png" },
    { id: 8, name: "Батарейки", price: 3590, stock: 15, addedDate: "18-02-2025", category: "chargers", img: "./images/Batarey.png" },
    { id: 9, name: "Мышь", price: 2490, stock: 8, addedDate: "01-03-2024", category: "accessories", img: "./images/Mouse.png" }
    ];

const extendedProducts = products.map(p => ({
    ...p,
    hasEnglish: /[a-zA-Z]/.test(p.name)
}));

let currentUser = null;
let cart = [];
let filteredSortedProducts = [...extendedProducts];

const productsContainer = document.getElementById("productsContainer");
const authNameSpan = document.getElementById("authName");
const loginModal = document.getElementById("loginModal");
const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const cartCountSpan = document.getElementById("cartCount");
const cartItemsList = document.getElementById("cartItemsList");
const cartTotalSpan = document.getElementById("cartTotalAmount");
const checkoutBtn = document.getElementById("checkoutBtn");
const priceFilter = document.getElementById("priceFilter");
const stockFilter = document.getElementById("stockFilter");
const sortSelect = document.getElementById("sortSelect");
const adminPanelDiv = document.getElementById("adminPanel");
const jsonDumpDiv = document.getElementById("jsonDump");
const logoutBtn = document.getElementById("logoutBtn");

function showToast(msg, isError = false) {
    const toast = document.createElement("div");
    toast.className = "message-toast";
    toast.style.background = isError ? "#b91c1c" : "#667eea";
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function updateCartCounter() {
    const total = cart.reduce((sum, i) => sum + i.quantity, 0);
    cartCountSpan.innerText = total;
}

function saveCart() {
    const key = currentUser ? `cart_${currentUser.username}` : "cart_guest";
    localStorage.setItem(key, JSON.stringify(cart));
}

function loadCartForUser() {
    const key = currentUser ? `cart_${currentUser.username}` : "cart_guest";
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            cart = JSON.parse(stored);
            if (!Array.isArray(cart)) cart = [];
        } catch (e) { cart = []; }
    } else { cart = []; }
    cart = cart.filter(item => extendedProducts.some(p => p.id === item.id));
    updateCartCounter();
    saveCart();
}

function updateAdminJson() {
    if (!currentUser || currentUser.username !== "admin") return;
    const exportData = extendedProducts.map(({ id, name, price, stock, addedDate, category }) => ({
        id, name, price, stock, addedDate, category
    }));
    jsonDumpDiv.innerHTML = JSON.stringify(exportData, null, 2);
}

function applyFiltersAndSort() {
    let filtered = [...extendedProducts];

    const priceVal = priceFilter.value;
    if (priceVal !== "all") {
        if (priceVal === "0-5000") filtered = filtered.filter(p => p.price < 5000);
        else if (priceVal === "5000-20000") filtered = filtered.filter(p => p.price >= 5000 && p.price <= 20000);
        else if (priceVal === "20000+") filtered = filtered.filter(p => p.price > 20000);
    }

    const stockVal = stockFilter.value;
    if (stockVal === "inStock") filtered = filtered.filter(p => p.stock > 0);
    else if (stockVal === "lowStock") filtered = filtered.filter(p => p.stock <= 5 && p.stock > 0);

    const sortBy = sortSelect.value;
    if (sortBy === "price_asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "stock_asc") filtered.sort((a, b) => a.stock - b.stock);
    else filtered.sort((a, b) => a.id - b.id);

    const russianFirst = filtered.filter(p => !p.hasEnglish);
    const englishLast = filtered.filter(p => p.hasEnglish);
    filteredSortedProducts = [...russianFirst, ...englishLast];

    renderCatalog();
    updateAdminJson();
}

function renderCatalog() {
    if (!productsContainer) return;
    if (filteredSortedProducts.length === 0) {
        productsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fas fa-box-open"></i> Товары не найдены. Измените фильтры.</div>`;
        return;
    }
    productsContainer.innerHTML = filteredSortedProducts.map(product => {
        const stockText = product.stock > 0 ? `${product.stock} шт.` : `Нет`;
        const disabled = (!currentUser || product.stock <= 0);
        const buttonClass = disabled ? 'btn-add' : 'btn-add enabled';
        const buttonText = (!currentUser) ? '<i class="fas fa-lock"></i> Требуется вход' : (product.stock <= 0 ? '<i class="fas fa-times"></i> Нет' : '<i class="fas fa-cart-plus"></i> В корзину');
        return `
            <div class="product-card">
                <div class="product-img"><img src="${product.img}" alt="${product.name}"></div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">${product.price.toLocaleString()} ₽</div>
                    <div class="product-stock"><i class="fas fa-box"></i> ${stockText}</div>
                    <div class="product-date"><i class="fas fa-calendar-alt"></i> ${product.addedDate}</div>
                </div>
                <button class="${buttonClass}" data-id="${product.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-add.enabled[data-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

function addToCart(productId) {
    if (!currentUser) {
        showToast(" Для покупок необходимо войти в аккаунт", true);
        return;
    }
    const product = extendedProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        showToast(" Товар недоступен", true);
        return;
    }
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        if (existing.quantity + 1 > product.stock) {
            showToast(` Не более ${product.stock} шт.`, true);
            return;
        }
        existing.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    updateCartCounter();
    saveCart();
    showToast(` ${product.name} добавлен в корзину`);
    renderCatalog();
}

function renderCartModal() {
    if (!cartItemsList) return;
    if (cart.length === 0) {
        cartItemsList.innerHTML = "<p><i class='fas fa-shopping-basket'></i> Корзина пуста. Добавьте товары!</p>";
        cartTotalSpan.innerText = "Итого: 0 ₽";
        return;
    }
    let total = 0;
    let html = '';
    cart.forEach(cartItem => {
        const product = extendedProducts.find(p => p.id === cartItem.id);
        if (!product) return;
        const subtotal = product.price * cartItem.quantity;
        total += subtotal;
        html += `
            <div class="cart-item">
                <div><strong>${product.name}</strong> x ${cartItem.quantity}<br><span style="font-size:0.7rem;">${product.price.toLocaleString()} ₽/шт</span></div>
                <div>${subtotal.toLocaleString()} ₽ 
                    <button class="btn-outline" style="padding: 4px 10px; margin:2px;" data-remove="${product.id}"><i class="fas fa-trash-alt"></i></button>
                    <button class="btn-outline" data-dec="${product.id}">-1</button>
                    <button class="btn-outline" data-inc="${product.id}">+1</button>
                </div>
            </div>
        `;
    });
    cartItemsList.innerHTML = html;
    cartTotalSpan.innerText = `Итого: ${total.toLocaleString()} ₽`;

    document.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.remove);
            cart = cart.filter(i => i.id !== id);
            updateCartCounter();
            saveCart();
            renderCartModal();
            renderCatalog();
        });
    });
    document.querySelectorAll('[data-dec]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.dec);
            const item = cart.find(i => i.id === id);
            if (item) {
                if (item.quantity > 1) item.quantity--;
                else cart = cart.filter(i => i.id !== id);
                updateCartCounter();
                saveCart();
                renderCartModal();
                renderCatalog();
            }
        });
    });
    document.querySelectorAll('[data-inc]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.inc);
            const product = extendedProducts.find(p => p.id === id);
            const item = cart.find(i => i.id === id);
            if (item && product && item.quantity + 1 <= product.stock) {
                item.quantity++;
                updateCartCounter();
                saveCart();
                renderCartModal();
                renderCatalog();
            } else if (product) showToast(`Макс. ${product.stock} шт`, true);
        });
    });
}

function checkout() {
    if (!currentUser) {
        showToast(" Войдите в аккаунт для оформления заказа", true);
        openLoginModal();
        return;
    }
    if (cart.length === 0) {
        showToast("🛒 Корзина пуста", true);
        return;
    }
    let canBuy = true;
    for (let item of cart) {
        const prod = extendedProducts.find(p => p.id === item.id);
        if (!prod || prod.stock < item.quantity) {
            showToast(` Не хватает "${prod?.name}"`, true);
            canBuy = false;
            break;
        }
    }
    if (!canBuy) return;
    
    let totalSum = 0;
    for (let item of cart) {
        const prod = extendedProducts.find(p => p.id === item.id);
        if (prod) {
            prod.stock -= item.quantity;
            totalSum += prod.price * item.quantity;
        }
    }
    cart = [];
    updateCartCounter();
    saveCart();
    cartModal.style.display = "none";
    renderCatalog();
    renderCartModal();
    applyFiltersAndSort();
    showToast(` Заказ оформлен! Списано ${totalSum.toLocaleString()} ₽. Спасибо!`);
}

function openLoginModal() {
    loginModal.style.display = "flex";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
}

function closeLoginModal() {
    loginModal.style.display = "none";
}

function performLogin() {
    const username = document.getElementById("loginUsername").value.trim();
    const pwd = document.getElementById("loginPassword").value;
    if (!username || !pwd) {
        showToast(" Введите логин и пароль", true);
        return;
    }
    currentUser = { username: username };
    authNameSpan.innerText = username;
    logoutBtn.style.display = "flex";
    
    if (username === "admin") {
        adminPanelDiv.style.display = "block";
        updateAdminJson();
        showToast(" Добро пожаловать, администратор!");
    } else {
        adminPanelDiv.style.display = "none";
        showToast(` Добро пожаловать, ${username}!`);
    }
    closeLoginModal();
    loadCartForUser();
    renderCatalog();
    applyFiltersAndSort();
}

function logout() {
    if (currentUser) saveCart();
    currentUser = null;
    authNameSpan.innerText = "Гость";
    logoutBtn.style.display = "none";
    adminPanelDiv.style.display = "none";
    cart = [];
    updateCartCounter();
    loadCartForUser();
    renderCatalog();
    applyFiltersAndSort();
    showToast(" Вы вышли из системы");
}

function openCart() {
    if (!currentUser) {
        openLoginModal();
    } else {
        renderCartModal();
        cartModal.style.display = "flex";
    }
}

function initThemeToggle() {
    const toggle = document.querySelector('.toggle_btn');
    const body = document.body;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        body.classList.add('dark-theme');
        toggle.classList.add('active');
    }
    toggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        toggle.classList.toggle('active');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}

function init() {
    loadCartForUser();
    applyFiltersAndSort();
    
    priceFilter.addEventListener("change", () => applyFiltersAndSort());
    stockFilter.addEventListener("change", () => applyFiltersAndSort());
    sortSelect.addEventListener("change", () => applyFiltersAndSort());
    
    openCartBtn.addEventListener("click", openCart);
    logoutBtn.addEventListener("click", logout);
    document.getElementById("closeCartBtn").addEventListener("click", () => cartModal.style.display = "none");
    checkoutBtn.addEventListener("click", checkout);
    
    document.getElementById("doLoginBtn").addEventListener("click", performLogin);
    document.getElementById("closeLoginBtn").addEventListener("click", closeLoginModal);
    
    window.onclick = (e) => {
        if (e.target === loginModal) closeLoginModal();
        if (e.target === cartModal) cartModal.style.display = "none";
    };
    
    initThemeToggle();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}