const products = [
        { id: 1, name: "Смартфон Poco", price: 24990, stock: 7, addedDate: "10-02-2024", category: "phones", img: "./images/Poco.png" },
        { id: 2, name: "Ноутбук Osio", price: 58990, stock: 3, addedDate: "15-01-2025", category: "laptops", img: "./images/Osio.jpg" },
        { id: 3, name: "Беспроводные наушники", price: 4990, stock: 12, addedDate: "20-02-2023", category: "audio", img: "./images/audio.jpg" },
        { id: 4, name: "Умные часы Rolex", price: 19990, stock: 2, addedDate: "28-01-2026", category: "wearables", img: "./images/Rolex.png" },
        { id: 5, name: "Игровая клавиатура RGB", price: 6990, stock: 12, addedDate: "01-12-2024", category: "accessories", img: "./images/Keyboard.png" },
        { id: 6, name: "Монитор 4K", price: 32990, stock: 5, addedDate: "05-02-2025", category: "monitors", img: "./images/Monitor.jpg" },
        { id: 7, name: "Планшет Huawey", price: 18990, stock: 4, addedDate: "20-01-2025", category: "tablets", img: "./images/Tablet.jpg" },
        { id: 8, name: "Батарейки", price: 3590, stock: 15, addedDate: "18-02-2025", category: "chargers", img: "./images/Batarey.jpg" },
        { id: 9, name: "Мышь", price: 2490, stock: 8, addedDate: "01-03-2024", category: "accessories", img: "./images/Mouse.jpg" }
    ];

    let currentUser = null;
    let cart = [];
    let filteredSortedProducts = [...products];

    const productsContainer = document.getElementById("productsContainer");
    const authStatusSpan = document.getElementById("authStatus");
    const loginBtn = document.getElementById("loginBtn");
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

    function showToast(message, isError = false) {
        const toast = document.createElement("div");
        toast.className = "message-toast";
        toast.style.background = isError ? "#b91c1c" : "#0f172a";
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }


    function updateCartCounter() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.innerText = totalItems;
    }

    function saveCart() {
        if (currentUser) {
            localStorage.setItem(`cart_${currentUser.username}`, JSON.stringify(cart));
        } else {
            localStorage.setItem("cart_guest", JSON.stringify(cart));
        }
    }

    function loadCartForUser() {
        let stored = null;
        if (currentUser) {
            stored = localStorage.getItem(`cart_${currentUser.username}`);
        } else {
            stored = localStorage.getItem("cart_guest");
        }
        if (stored) {
            try {
                cart = JSON.parse(stored);
                if (!Array.isArray(cart)) cart = [];
            } catch(e) { cart = []; }
        } else {
            cart = [];
        }
        cart = cart.filter(cartItem => products.some(p => p.id === cartItem.id));
        updateCartCounter();
        saveCart();
    }

    function applyFiltersAndSort() {
        let filtered = [...products];

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
        switch(sortBy) {
            case "price_asc": filtered.sort((a,b) => a.price - b.price); break;
            case "price_desc": filtered.sort((a,b) => b.price - a.price); break;
            case "stock_asc": filtered.sort((a,b) => a.stock - b.stock); break;
            default: filtered.sort((a,b) => a.id - b.id);
        }
        filteredSortedProducts = filtered;
        renderCatalog();
    }

    function renderCatalog() {
    if (!productsContainer) return;
    if (filteredSortedProducts.length === 0) {
        productsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px;"> Товары не найдены. Измените фильтры.</div>`;
        return;
    }
    productsContainer.innerHTML = filteredSortedProducts.map(product => {
        const stockText = product.stock > 0 ? ` В наличии: ${product.stock} шт.` : ` Нет в наличии`;
        const stockClass = "product-stock";
        const disabledAttr = (!currentUser || product.stock <= 0) ? 'disabled' : '';
        const buttonText = (!currentUser) ? 'Войдите для покупки' : (product.stock <=0 ? 'Нет в наличии' : 'В корзину');
        return `
            <div class="product-card">
                <div class="product-img"><img src="${product.img}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">${product.price.toLocaleString()} ₽</div>
                    <div class="${stockClass}">${stockText}</div>
                    <div class="product-date"> добавлен: ${product.addedDate}</div>
                </div>
                <button class="btn btn-add" data-id="${product.id}" ${disabledAttr} style="${!currentUser || product.stock<=0 ? 'opacity:0.6; cursor:not-allowed;' : ''}">${buttonText}</button>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-add[data-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
        });
    });
}

    function addToCart(productId) {
        if (!currentUser) {
            showToast(" Необходимо войти в аккаунт для покупок!", true);
            openLoginModal();
            return;
        }
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (product.stock <= 0) {
            showToast("Товар закончился", true);
            return;
        }

        const existing = cart.find(item => item.id === productId);
        if (existing) {
            if (existing.quantity + 1 > product.stock) {
                showToast(`Нельзя добавить больше чем в наличии (${product.stock} шт)`, true);
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
            cartItemsList.innerHTML = "<p>Корзина пуста. Добавьте товары!</p>";
            cartTotalSpan.innerText = "Итого: 0 ₽";
            return;
        }
        let total = 0;
        let html = '';
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (!product) return;
            const subtotal = product.price * cartItem.quantity;
            total += subtotal;
            html += `
                <div class="cart-item">
                    <div><strong>${product.name}</strong> x ${cartItem.quantity}<br><span style="font-size:0.75rem;">${product.price.toLocaleString()} ₽/шт</span></div>
                    <div>${subtotal.toLocaleString()} ₽ 
                        <button class="btn-outline" style="padding: 4px 10px; margin-left: 8px;" data-remove="${product.id}"></button>
                        <button class="btn-outline" style="padding: 4px 10px;" data-dec="${product.id}">-1</button>
                        <button class="btn-outline" style="padding: 4px 10px;" data-inc="${product.id}">+1</button>
                    </div>
                </div>
            `;
        });
        cartItemsList.innerHTML = html;
        cartTotalSpan.innerText = `Итого: ${total.toLocaleString()} ₽`;

        
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.remove);
                cart = cart.filter(item => item.id !== id);
                updateCartCounter();
                saveCart();
                renderCartModal();
                renderCatalog(); 
            });
        });
        document.querySelectorAll('[data-dec]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.dec);
                const item = cart.find(i => i.id === id);
                if (item) {
                    if (item.quantity > 1) {
                        item.quantity--;
                    } else {
                        cart = cart.filter(i => i.id !== id);
                    }
                    updateCartCounter();
                    saveCart();
                    renderCartModal();
                    renderCatalog();
                }
            });
        });
        document.querySelectorAll('[data-inc]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.inc);
                const product = products.find(p => p.id === id);
                const item = cart.find(i => i.id === id);
                if (item && product) {
                    if (item.quantity + 1 <= product.stock) {
                        item.quantity++;
                    } else {
                        showToast(`Нельзя добавить больше ${product.stock} шт.`, true);
                    }
                    updateCartCounter();
                    saveCart();
                    renderCartModal();
                    renderCatalog();
                }
            });
        });
    }

    
    function checkout() {
        if (!currentUser) {
            showToast("Сначала войдите в систему!", true);
            openLoginModal();
            return;
        }
        if (cart.length === 0) {
            showToast("Корзина пуста, нечего оформлять", true);
            return;
        }
        
        let canBuy = true;
        for (let cartItem of cart) {
            const product = products.find(p => p.id === cartItem.id);
            if (!product || product.stock < cartItem.quantity) {
                showToast(`Недостаточно "${product?.name || 'товара'}" на складе. Обновите корзину.`, true);
                canBuy = false;
                break;
            }
        }
        if (!canBuy) return;
        for (let cartItem of cart) {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                product.stock -= cartItem.quantity;
            }
        }
        const totalSum = cart.reduce((sum, item) => {
            const prod = products.find(p => p.id === item.id);
            return sum + (prod ? prod.price * item.quantity : 0);
        }, 0);
        
        cart = [];
        updateCartCounter();
        saveCart();
        cartModal.style.display = "none";
        renderCatalog();
        renderCartModal();
        showToast(` Заказ успешно оформлен! Списано ${totalSum.toLocaleString()} ₽. Спасибо за покупку!`);
        applyFiltersAndSort();
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
        const password = document.getElementById("loginPassword").value;
        if (username === "" || password === "") {
            showToast("Введите логин и пароль", true);
            return;
        }
        currentUser = { username: username };
        authStatusSpan.innerHTML = ` ${username} | Аккаунт`;
        loginBtn.innerText = "Выйти";
        closeLoginModal();
        loadCartForUser();
        renderCatalog();
        showToast(`Добро пожаловать, ${username}!`);
        if (cartModal.style.display === "flex") renderCartModal();
        applyFiltersAndSort(); 
    }

    function logout() {
        if (currentUser) {
            saveCart(); 
        }
        currentUser = null;
        authStatusSpan.innerHTML = " Не авторизован";
        loginBtn.innerText = "Войти";
        loadCartForUser(); 
        renderCatalog();
        applyFiltersAndSort();
        showToast("Вы вышли из системы");
        if (cartModal.style.display === "flex") {
            renderCartModal();
        }
    }

    function handleAuthClick() {
        if (currentUser) {
            logout();
        } else {
            openLoginModal();
        }
    }

    function init() {
        loadCartForUser();
        applyFiltersAndSort();
        priceFilter.addEventListener("change", () => applyFiltersAndSort());
        stockFilter.addEventListener("change", () => applyFiltersAndSort());
        sortSelect.addEventListener("change", () => applyFiltersAndSort());
        loginBtn.addEventListener("click", handleAuthClick);
        document.getElementById("doLoginBtn").addEventListener("click", performLogin);
        document.getElementById("closeLoginBtn").addEventListener("click", closeLoginModal);
        openCartBtn.addEventListener("click", () => {
            renderCartModal();
            cartModal.style.display = "flex";
        });
        document.getElementById("closeCartBtn").addEventListener("click", () => cartModal.style.display = "none");
        checkoutBtn.addEventListener("click", () => checkout());
        window.onclick = (e) => {
            if (e.target === loginModal) closeLoginModal();
            if (e.target === cartModal) cartModal.style.display = "none";
        };
    }
    init();

    // Добавьте эту функцию в ваш существующий код
function initThemeToggle() {
    const toggleBtn = document.querySelector('.toggle_btn');
    const body = document.body;
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        toggleBtn.classList.add('active');
    }
    
    // Обработчик переключения
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        toggleBtn.classList.toggle('active');
        
        // Сохраняем выбор
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}

