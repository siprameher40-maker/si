const products = [
  {
    id: "linen-throw",
    name: "The Sipra Linen Throw",
    category: "Home",
    price: 88,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
    alt: "Soft neutral linen throw draped across a warm, sunlit sofa",
  },
  {
    id: "stoneware-mug",
    name: "Slow Morning Mug",
    category: "Rituals",
    price: 32,
    badge: "Made by hand",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    alt: "Handmade ceramic mug in a warm, natural glaze",
  },
  {
    id: "everyday-vase",
    name: "Everyday Object No. 04",
    category: "Objects",
    price: 64,
    badge: "",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=80",
    alt: "Sculptural ceramic vase with understated organic lines",
  },
  {
    id: "linen-cushion",
    name: "The Sipra Cushion",
    category: "Home",
    price: 56,
    badge: "Nearly gone",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
    alt: "Textured neutral cushion on a comfortable lounge chair",
  },
  {
    id: "incense-set",
    name: "A Quiet Moment Incense",
    category: "Rituals",
    price: 28,
    badge: "A daily ritual",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
    alt: "A calming incense ritual with natural botanicals",
  },
  {
    id: "ceramic-bowl",
    name: "Sipra Ceramic Bowl",
    category: "Objects",
    price: 42,
    badge: "",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80",
    alt: "Hand-finished ceramic bowl in a softly speckled glaze",
  },
  {
    id: "table-lamp",
    name: "The Golden Hour Lamp",
    category: "Home",
    price: 124,
    badge: "Just landed",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    alt: "Warm sculptural table lamp casting a gentle evening glow",
  },
  {
    id: "daily-journal",
    name: "A Little Daily Journal",
    category: "Rituals",
    price: 24,
    badge: "",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
    alt: "Open notebook ready for a quiet moment of writing",
  },
];

const productGrid = document.querySelector(".product-grid");
const cart = new Map();
let activeCategory = "All";
let searchQuery = "";
let toastTimeout;

productGrid.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement) {
    event.target.alt = "Product image unavailable";
    event.target.style.visibility = "hidden";
  }
}, true);

const formatPrice = (amount) => `$${amount.toFixed(2)}`;

function renderProducts() {
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy" />
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-info">
        <div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-category">${product.category}</p>
        </div>
        <p class="product-price">${formatPrice(product.price)}</p>
      </div>
    </article>
  `).join("");

  document.querySelector(".results-count span").textContent = visibleProducts.length;
  document.querySelector(".empty-state").hidden = visibleProducts.length !== 0;
  productGrid.hidden = visibleProducts.length === 0;
}

function renderCart() {
  const itemCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  document.querySelector(".cart-count").textContent = itemCount;
  document.querySelector(".drawer-count").textContent = `(${itemCount})`;
  document.querySelector(".cart-subtotal").textContent = formatPrice(subtotal);
  document.querySelector(".cart-empty").hidden = itemCount !== 0;
  document.querySelector(".drawer-footer").hidden = itemCount === 0;
  document.querySelector(".cart-items").innerHTML = [...cart.entries()].map(([id, item]) => `
    <div class="cart-item">
      <img src="${item.product.image}" alt="${item.product.alt}" />
      <div class="cart-item-info">
        <strong>${item.product.name}</strong>
        <span>${formatPrice(item.product.price)}</span>
        <div class="quantity-control" aria-label="Quantity for ${item.product.name}">
          <button type="button" data-quantity="${id}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-quantity="${id}" data-change="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-item" type="button" data-remove="${id}">Remove</button>
      </div>
      <span class="cart-item-price">${formatPrice(item.product.price * item.quantity)}</span>
    </div>
  `).join("");
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function setCartOpen(isOpen) {
  const drawer = document.querySelector(".cart-drawer");
  const backdrop = document.querySelector(".drawer-backdrop");
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("body-locked", isOpen);
  backdrop.hidden = !isOpen;
  if (isOpen) {
    requestAnimationFrame(() => backdrop.classList.add("is-visible"));
    document.querySelector(".drawer-close").focus();
  } else {
    backdrop.classList.remove("is-visible");
  }
}

document.querySelector(".category-filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const isActive = chip === button;
    chip.classList.toggle("is-active", isActive);
    chip.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
});

document.querySelector(".main-nav").addEventListener("click", (event) => {
  const link = event.target.closest("[data-nav-category]");
  if (!link) return;
  event.preventDefault();
  activeCategory = link.dataset.navCategory;
  document.querySelector(`.filter-chip[data-category="${activeCategory}"]`).click();
  document.querySelector(".main-nav").classList.remove("is-open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.add);
  const item = cart.get(product.id);
  cart.set(product.id, { product, quantity: (item?.quantity ?? 0) + 1 });
  renderCart();
  showToast(`${product.name} added to your bag`);
});

document.querySelector(".cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
  } else if (quantityButton) {
    const item = cart.get(quantityButton.dataset.quantity);
    const quantity = item.quantity + Number(quantityButton.dataset.change);
    if (quantity === 0) cart.delete(quantityButton.dataset.quantity);
    else cart.set(quantityButton.dataset.quantity, { ...item, quantity });
  } else {
    return;
  }
  renderCart();
});

document.querySelector(".cart-button").addEventListener("click", () => setCartOpen(true));
document.querySelector(".drawer-close").addEventListener("click", () => setCartOpen(false));
document.querySelector(".continue-shopping").addEventListener("click", () => setCartOpen(false));
document.querySelector(".drawer-backdrop").addEventListener("click", () => setCartOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setCartOpen(false);
});

const searchField = document.querySelector(".search-field");
document.querySelector(".search-toggle").addEventListener("click", () => {
  searchField.hidden = !searchField.hidden;
  if (!searchField.hidden) searchField.querySelector("input").focus();
});
searchField.querySelector("input").addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderProducts();
});
document.querySelector(".clear-search").addEventListener("click", () => {
  searchQuery = "";
  searchField.querySelector("input").value = "";
  searchField.hidden = true;
  renderProducts();
});

document.querySelector(".menu-toggle").addEventListener("click", (event) => {
  const menu = document.querySelector(".main-nav");
  const isOpen = menu.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  showToast("Thanks for stopping by — checkout is a demo.");
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#newsletter-email");
  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }
  document.querySelector(".newsletter-feedback").textContent = "You're on the list. Keep an eye on your inbox.";
  event.currentTarget.reset();
});

renderProducts();
renderCart();
