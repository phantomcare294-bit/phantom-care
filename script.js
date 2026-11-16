function selectProductImage(button) {
  const image = document.getElementById("product-main-image");
  const thumbnailImage = button.querySelector("img");
  const thumbnails = document.querySelectorAll(".thumb");
  const source = thumbnailImage.getAttribute("src");

  if (image.getAttribute("src") !== source) {
    image.setAttribute("src", source);
  }
  image.style.objectPosition = `${button.dataset.position} center`;
  image.style.objectFit = button.dataset.fit || "cover";
  image.alt = button.dataset.description;

  thumbnails.forEach((thumbnail) => {
    const isSelected = thumbnail === button;
    thumbnail.classList.toggle("active", isSelected);
    thumbnail.setAttribute("aria-pressed", String(isSelected));
  });
}

function changeProductImage(direction) {
  const thumbnails = Array.from(document.querySelectorAll(".thumb"));
  const currentIndex = thumbnails.findIndex((thumbnail) =>
    thumbnail.classList.contains("active"),
  );
  if (thumbnails.length === 0) return;

  const nextIndex =
    (currentIndex + direction + thumbnails.length) % thumbnails.length;
  selectProductImage(thumbnails[nextIndex]);
}

function handleGalleryKeydown(event) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  changeProductImage(event.key === "ArrowRight" ? 1 : -1);
}

let zoomTrigger = null;

function openProductImageZoom() {
  const image = document.getElementById("product-main-image");
  const zoomModal = document.getElementById("imageZoomModal");
  const zoomedImage = document.getElementById("zoomedProductImage");

  zoomTrigger = document.activeElement;
  zoomedImage.src = image.src;
  zoomedImage.alt = image.alt;
  zoomModal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("closeImageZoom").focus();
}

function closeProductImageZoom() {
  const zoomModal = document.getElementById("imageZoomModal");
  if (zoomModal.hidden) return;

  zoomModal.hidden = true;
  document.body.style.overflow = "";
  if (zoomTrigger) zoomTrigger.focus();
}

const WHATSAPP_NUMBER = "201007697664";

// Product cards are plain HTML (see #productsGrid / #shopGrid).
// This only reads them so the cart, search and order form can use them.
const products = [];
let cart = [];

function selectedColorOf(card) {
  const checked = card && card.querySelector(".color-radio:checked");
  return checked ? checked.value : null;
}

function loadProductsFromDOM() {
  document.querySelectorAll("#productsGrid .product-card").forEach((card) => {
    products.push({
      id: Number(card.dataset.id),
      name: card.dataset.name,
      arSubtitle: card.dataset.subtitle || "",
      price: Number(card.dataset.price),
      selectedColor: selectedColorOf(card),
    });
  });
}

// Add Item to Cart
function addToCart(id) {
  const prod = products.find((p) => p.id === id);
  if (!prod) return;

  const cartKey = prod.selectedColor
    ? `${prod.id}-${prod.selectedColor}`
    : `${prod.id}`;
  const exist = cart.find((item) => item.cartKey === cartKey);

  if (exist) {
    exist.qty += 1;
  } else {
    cart.push({
      cartKey,
      id: prod.id,
      name: prod.name,
      selectedColor: prod.selectedColor || null,
      price: prod.price,
      qty: 1,
    });
  }
  updateCartData();
  openPanel("cartSidebar");
}

// Change Quantity in Cart
function changeQty(cartKey, delta) {
  const item = cart.find((i) => i.cartKey === cartKey);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.cartKey !== cartKey);
  }
  updateCartData();
}

// Remove Item from Cart
function removeFromCart(cartKey) {
  cart = cart.filter((item) => item.cartKey !== cartKey);
  updateCartData();
}

// Render Cart UI
function updateCartData() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p style="color:#777; text-align:center; margin-top:20px;" class="ar-text">Your cart is empty.</p>';
    cartCount.innerText = "0";
    cartTotal.innerText = "0";
    return;
  }

  let total = 0;
  let count = 0;

  cartItems.innerHTML = cart
    .map((item) => {
      total += item.price * item.qty;
      count += item.qty;
      const colorLabel = item.selectedColor ? ` (${item.selectedColor})` : "";

      return `
              <div class="cart-item">
                <div>
                  <h5>${item.name}${colorLabel}</h5>
                  <small style="color:#9ca3af;">${item.price} EGP × ${item.qty}</small>
                </div>
                <div class="cart-qty-controls">
                  <button type="button" class="qty-btn" data-cart-action="dec" data-key="${item.cartKey}">-</button>
                  <span style="font-size:13px; font-weight:bold;">${item.qty}</span>
                  <button type="button" class="qty-btn" data-cart-action="inc" data-key="${item.cartKey}">+</button>
                  <button
                    type="button"
                    data-cart-action="del"
                    data-key="${item.cartKey}"
                    style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; margin-left:6px;"
                    class="ar-text"
                  >Remove</button>
                </div>
              </div>
            `;
    })
    .join("");

  cartCount.innerText = count;
  cartTotal.innerText = total;
}

// Checkout: ask for customer details first, then go to WhatsApp
function checkoutViaWhatsApp() {
  if (cart.length === 0) {
    document.getElementById("cartItems").innerHTML =
      '<p style="color:#ef4444; text-align:center; margin-top:20px;" class="ar-text">Please add a product to your cart first!</p>';
    return;
  }
  closeAllPanels();
  openOrderModal(
    cart.map((i) => ({
      name: i.name,
      selectedColor: i.selectedColor,
      price: i.price,
      qty: i.qty,
    })),
  );
}

// ---- Order details modal ----
let pendingOrderItems = [];

function openOrderModal(items) {
  pendingOrderItems = items || [];
  const summary = document.getElementById("orderSummary");
  if (pendingOrderItems.length === 0) {
    summary.innerHTML = "<div>Custom bundle request</div>";
  } else {
    let total = 0;
    summary.innerHTML =
      pendingOrderItems
        .map((it) => {
          const line = it.price * it.qty;
          total += line;
          const color = it.selectedColor ? ` (${it.selectedColor})` : "";
          return `<div><span>${it.name}${color} × ${it.qty}</span><span>${line} EGP</span></div>`;
        })
        .join("") +
      `<div class="order-total"><span>Total</span><span>${total} EGP</span></div>`;
  }
  document
    .querySelectorAll("#orderForm .order-field")
    .forEach((f) => f.classList.remove("invalid"));
  document.getElementById("orderModal").classList.add("open");
  document.getElementById("ordName").focus();
}

function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("open");
}

function submitOrderForm(e) {
  e.preventDefault();
  const val = (id) => document.getElementById(id).value.trim();
  const name = val("ordName");
  const phone = val("ordPhone");
  const city = val("ordCity");
  const address = val("ordAddress");
  const notes = val("ordNotes");

  const digits = phone.replace(/[\s\-+()]/g, "");
  const checks = {
    name: name.length >= 2,
    phone: /^\d{10,15}$/.test(digits),
    city: city.length >= 2,
    address: address.length >= 5,
  };

  let valid = true;
  Object.keys(checks).forEach((key) => {
    const field = document.querySelector(
      `#orderForm .order-field[data-field="${key}"]`,
    );
    field.classList.toggle("invalid", !checks[key]);
    if (!checks[key]) valid = false;
  });
  if (!valid) return;

  let orderText;
  if (pendingOrderItems.length === 0) {
    orderText = "I would like to order a custom bundle.";
  } else {
    let total = 0;
    const lines = pendingOrderItems.map((it, index) => {
      const lineTotal = it.price * it.qty;
      total += lineTotal;
      const colorText = it.selectedColor ? ` [${it.selectedColor}]` : "";
      return `${index + 1}. ${it.name}${colorText} × ${it.qty} = ${lineTotal} EGP`;
    });
    orderText = `I would like to order the following:\n\n${lines.join("\n")}\n\nTotal: ${total} EGP`;
  }

  const message =
    `Hello PHANTOM SHOES CARE,\n${orderText}\n\n` +
    `Customer details:\n` +
    `Name: ${name}\n` +
    `Mobile: ${phone}\n` +
    `Governorate/City: ${city}\n` +
    `Address: ${address}` +
    (notes ? `\nNotes: ${notes}` : "");

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  closeOrderModal();
  document.getElementById("orderForm").reset();
  window.location.href = waUrl;
}

// ---- "All Products" page routing (#shop) ----
function routeView() {
  const hash = location.hash;
  const isShop = hash === "#shop";
  document
    .querySelectorAll("body > section:not(#shopPage)")
    .forEach((s) => (s.style.display = isShop ? "none" : ""));
  document.getElementById("shopPage").style.display = isShop ? "block" : "none";
  if (isShop) {
    window.scrollTo(0, 0);
  } else if (hash.length > 1) {
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

// Drawer & Search Controls
function closeAllPanels() {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("menuSidebar").classList.remove("open");
  document.getElementById("panelBackdrop").classList.remove("open");
}

function openPanel(panelId) {
  closeAllPanels();
  document.getElementById(panelId).classList.add("open");
  document.getElementById("panelBackdrop").classList.add("open");
}

function toggleSearchBar(forceState) {
  const overlay = document.getElementById("searchOverlay");
  const isOpen =
    typeof forceState === "boolean"
      ? forceState
      : !overlay.classList.contains("open");
  if (isOpen) {
    overlay.classList.add("open");
    const input = document.getElementById("liveSearchInput");
    input.focus();
    handleLiveSearch(input.value);
  } else {
    overlay.classList.remove("open");
  }
}

function handleLiveSearch(query) {
  const list = document.getElementById("searchResultsList");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.arSubtitle.toLowerCase().includes(q),
      )
    : products.slice(0, 3);

  if (filtered.length === 0) {
    list.innerHTML =
      '<p style="color:#888; font-size:0.85rem; grid-column:1/-1; text-align:center;" class="ar-text">No products match your search.</p>';
    return;
  }

  list.innerHTML = filtered
    .map(
      (p) => `
            <div class="search-result-card">
              <div>
                <div style="font-weight:700;">${p.name}</div>
                <div style="color:#9ca3af; font-size:0.75rem;">${p.price} EGP</div>
              </div>
              <button
                type="button"
                class="ar-text"
                data-search-add="${p.id}"
              >+ Add</button>
            </div>
          `,
    )
    .join("");
}

// Initialize Event Listeners cleanly after DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromDOM();

  const beforeAfterFrame = document.querySelector("[data-before-after]");
  const beforeAfterRange = beforeAfterFrame?.querySelector(
    ".before-after-range",
  );
  if (beforeAfterFrame && beforeAfterRange) {
    beforeAfterRange.addEventListener("input", () => {
      const split = Number(beforeAfterRange.value);
      beforeAfterFrame.style.setProperty("--split", `${split}%`);
      beforeAfterRange.setAttribute(
        "aria-valuetext",
        `Before cleaning: ${split}%, after cleaning: ${100 - split}%`,
      );
    });
  }

  // Header Buttons
  document
    .getElementById("menuBtn")
    .addEventListener("click", () => openPanel("menuSidebar"));
  document
    .getElementById("searchToggleBtn")
    .addEventListener("click", () => toggleSearchBar());
  document
    .getElementById("cartBtn")
    .addEventListener("click", () => openPanel("cartSidebar"));

  // Close Buttons & Backdrop
  document
    .getElementById("closeMenu")
    .addEventListener("click", closeAllPanels);
  document
    .getElementById("closeCart")
    .addEventListener("click", closeAllPanels);
  document
    .getElementById("panelBackdrop")
    .addEventListener("click", closeAllPanels);
  document
    .getElementById("closeSearchBtn")
    .addEventListener("click", () => toggleSearchBar(false));

  // Navigation Drawer Links
  document.querySelectorAll(".drawer-nav-link").forEach((link) => {
    link.addEventListener("click", closeAllPanels);
  });
  // Search Input & Quick Add
  document
    .getElementById("liveSearchInput")
    .addEventListener("input", (e) => handleLiveSearch(e.target.value));
  document
    .getElementById("searchResultsList")
    .addEventListener("click", (e) => {
      const btn = e.target.closest("[data-search-add]");
      if (btn) {
        const id = Number(btn.getAttribute("data-search-add"));
        const sp = products.find((p) => p.id === id);
        if (sp)
          sp.selectedColor = selectedColorOf(
            document.querySelector(
              `#productsGrid .product-card[data-id="${id}"]`,
            ),
          );
        addToCart(id);
        toggleSearchBar(false);
      }
    });

  // Product cards: Add to Cart / Order on WhatsApp
  ["productsGrid", "shopGrid"].forEach((gridId) => {
    document.getElementById(gridId).addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const prod = products.find(
        (p) => p.id === Number(btn.getAttribute("data-id")),
      );
      if (!prod) return;
      prod.selectedColor = selectedColorOf(btn.closest(".product-card"));

      if (btn.getAttribute("data-action") === "add-cart") {
        addToCart(prod.id);
      } else if (btn.getAttribute("data-action") === "order-now") {
        openOrderModal([
          {
            name: prod.name,
            selectedColor: prod.selectedColor,
            price: prod.price,
            qty: 1,
          },
        ]);
      }
    });
  });

  // Custom bundle -> details form
  const customBundleButton = document.getElementById("customBundleBtn");
  if (customBundleButton) {
    customBundleButton.addEventListener("click", (e) => {
      e.preventDefault();
      openOrderModal([]);
    });
  }

  // Order modal
  document
    .getElementById("orderForm")
    .addEventListener("submit", submitOrderForm);
  document
    .getElementById("closeOrderModal")
    .addEventListener("click", closeOrderModal);
  document.getElementById("orderModal").addEventListener("click", (e) => {
    if (e.target.id === "orderModal") closeOrderModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOrderModal();
  });

  // Page routing
  window.addEventListener("hashchange", routeView);
  routeView();

  // Cart Drawer Delegation (+ / - / Delete)
  document.getElementById("cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cart-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-cart-action");
    const key = btn.getAttribute("data-key");

    if (action === "inc") changeQty(key, 1);
    if (action === "dec") changeQty(key, -1);
    if (action === "del") removeFromCart(key);
  });

  // WhatsApp Checkout
  document
    .getElementById("checkoutWhatsappBtn")
    .addEventListener("click", checkoutViaWhatsApp);
});
