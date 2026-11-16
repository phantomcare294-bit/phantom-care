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
const productRoot = document.querySelector(".product-container");
if (!productRoot) {
  throw new Error("Product page is missing the .product-container element.");
}

const PRODUCT_NAME = productRoot.dataset.productName?.trim();
const PRODUCT_PRICE = Number(productRoot.dataset.productPrice);
if (!PRODUCT_NAME || !Number.isFinite(PRODUCT_PRICE) || PRODUCT_PRICE <= 0) {
  throw new Error("Product page must define a valid product name and price.");
}

const hasSizeOptions = document.querySelectorAll(".size-box").length > 0;
let selectedSize = "";
let cartQuantity = 0;
let pendingOrderQuantity = 1;

function selectSize(element) {
  let sizes = document.querySelectorAll(".size-box");
  sizes.forEach((s) => {
    s.classList.remove("selected");
    s.setAttribute("aria-pressed", "false");
  });
  element.classList.add("selected");
  element.setAttribute("aria-pressed", "true");
  selectedSize = element.textContent.trim();
}

function updateCart() {
  const hasItem = cartQuantity > 0;
  document.getElementById("productCartCount").textContent = cartQuantity;
  document.getElementById("productCartQuantity").textContent =
    cartQuantity;
  document.getElementById("cartQuantityLabel").textContent = cartQuantity;
  document.getElementById("productCartName").textContent = PRODUCT_NAME;
  document.getElementById("productCartPrice").textContent = PRODUCT_PRICE;
  document.getElementById("productCartTotal").textContent =
    PRODUCT_PRICE * cartQuantity;
  document.getElementById("productCartLine").hidden = !hasItem;
  document.getElementById("cartEmpty").hidden = hasItem;
  document.getElementById("checkoutWithWhatsApp").disabled = !hasItem;
}

function openCart() {
  document.getElementById("productCartPanel").classList.add("open");
  document.getElementById("cartBackdrop").classList.add("open");
  document
    .getElementById("productCartPanel")
    .setAttribute("aria-hidden", "false");
}

function closeCart() {
  document.getElementById("productCartPanel").classList.remove("open");
  document.getElementById("cartBackdrop").classList.remove("open");
  document
    .getElementById("productCartPanel")
    .setAttribute("aria-hidden", "true");
}

function openProductMenu() {
  closeCart();
  document.getElementById("productMenuPanel").classList.add("open");
  document.getElementById("productMenuBackdrop").classList.add("open");
  document
    .getElementById("productMenuPanel")
    .setAttribute("aria-hidden", "false");
  document
    .getElementById("productMenuButton")
    .setAttribute("aria-expanded", "true");
  document.getElementById("closeProductMenu").focus();
}

function closeProductMenu() {
  const menu = document.getElementById("productMenuPanel");
  if (!menu.classList.contains("open")) return;

  menu.classList.remove("open");
  document.getElementById("productMenuBackdrop").classList.remove("open");
  menu.setAttribute("aria-hidden", "true");
  document
    .getElementById("productMenuButton")
    .setAttribute("aria-expanded", "false");
  document.getElementById("productMenuButton").focus();
}

function addToCart() {
  if (hasSizeOptions && !selectedSize) {
    alert(
      "برجاء اختيار الحجم أولاً قبل الإضافة للسلة! / Please select a size first!",
    );
    return;
  }

  cartQuantity += 1;
  updateCart();
  openCart();
}

function openOrderModal(quantity) {
  if (hasSizeOptions && !selectedSize) {
    alert(
      "برجاء اختيار الحجم أولاً قبل الطلب! / Please select a size first!",
    );
    return;
  }

  pendingOrderQuantity = quantity;
  const lineTotal = PRODUCT_PRICE * pendingOrderQuantity;
  const selectedVariant = selectedSize ? ` (${selectedSize})` : "";
  document.getElementById("orderSummary").innerHTML =
    `<div><span>${PRODUCT_NAME}${selectedVariant} × ${pendingOrderQuantity}</span><span>${lineTotal} EGP</span></div>` +
    `<div class="order-total"><span>Total</span><span>${lineTotal} EGP</span></div>`;
  closeCart();
  document.getElementById("orderModal").classList.add("open");
  document.getElementById("ordName").focus();
}

function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("open");
}

function submitOrderForm(event) {
  event.preventDefault();
  const value = (id) => document.getElementById(id).value.trim();
  const name = value("ordName");
  const phone = value("ordPhone");
  const city = value("ordCity");
  const address = value("ordAddress");
  const notes = value("ordNotes");
  const digits = phone.replace(/[\s\-+()]/g, "");
  const checks = {
    name: name.length >= 2,
    phone: /^\d{10,15}$/.test(digits),
    city: city.length >= 2,
    address: address.length >= 5,
  };

  let valid = true;
  Object.entries(checks).forEach(([key, isValid]) => {
    const field = document.querySelector(
      `#orderForm .order-field[data-field="${key}"]`,
    );
    field.classList.toggle("invalid", !isValid);
    if (!isValid) valid = false;
  });
  if (!valid) return;

  const total = PRODUCT_PRICE * pendingOrderQuantity;
  const message = [
    "مرحبًا PHANTOM SHOES CARE، أود تأكيد طلبي:",
    "",
    `المنتج: ${PRODUCT_NAME}`,
    ...(selectedSize ? [`الحجم: ${selectedSize}`] : []),
    `الكمية: ${pendingOrderQuantity}`,
    `سعر القطعة: ${PRODUCT_PRICE} جنيه`,
    `الإجمالي: ${total} جنيه`,
    "",
    `اسم العميل: ${name}`,
    `رقم الهاتف: ${phone}`,
    `المحافظة / المدينة: ${city}`,
    `العنوان: ${address}`,
    ...(notes ? [`ملاحظات: ${notes}`] : []),
  ].join("\n");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.location.href = whatsappUrl;
}

document
  .getElementById("addToCartButton")
  .addEventListener("click", addToCart);
document
  .getElementById("productCartButton")
  .addEventListener("click", openCart);
document
  .getElementById("closeProductCart")
  .addEventListener("click", closeCart);
document
  .getElementById("cartBackdrop")
  .addEventListener("click", closeCart);
document
  .getElementById("productMenuButton")
  .addEventListener("click", openProductMenu);
document
  .getElementById("closeProductMenu")
  .addEventListener("click", closeProductMenu);
document
  .getElementById("productMenuBackdrop")
  .addEventListener("click", closeProductMenu);
document.querySelectorAll(".product-menu-nav a").forEach((link) => {
  link.addEventListener("click", closeProductMenu);
});
document
  .getElementById("increaseCartQuantity")
  .addEventListener("click", () => {
    cartQuantity += 1;
    updateCart();
  });
document
  .getElementById("decreaseCartQuantity")
  .addEventListener("click", () => {
    cartQuantity = Math.max(0, cartQuantity - 1);
    updateCart();
  });
document
  .getElementById("checkoutWithWhatsApp")
  .addEventListener("click", () => {
    if (cartQuantity > 0) openOrderModal(cartQuantity);
  });
document
  .getElementById("whatsapp-order-btn")
  .addEventListener("click", () => {
    openOrderModal(cartQuantity || 1);
  });
document
  .getElementById("orderForm")
  .addEventListener("submit", submitOrderForm);
document
  .getElementById("closeOrderModal")
  .addEventListener("click", closeOrderModal);
document
  .getElementById("orderModal")
  .addEventListener("click", (event) => {
    if (event.target.id === "orderModal") closeOrderModal();
  });
document
  .getElementById("closeImageZoom")
  .addEventListener("click", closeProductImageZoom);
document
  .getElementById("imageZoomModal")
  .addEventListener("click", (event) => {
    if (event.target.id === "imageZoomModal") closeProductImageZoom();
  });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProductMenu();
    closeCart();
    closeOrderModal();
    closeProductImageZoom();
  }
});

updateCart();
