
const SUPABASE_URL = "https://paubpmdvbebqjvjlvsee.supabase.co";
const SUPABASE_KEY = "sb_publishable_WTlJivfa5eaTZOvnqf113A_-zoV8LcZ";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const menuContainer = document.getElementById("menu-products");
const countElement = document.getElementById("product-count");

let allProducts = [];
let activeCategory = "all";

function toman(value) {
  return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function addText(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const info = document.createElement("div");
  info.className = "product-info";

  const heading = addText(info, "h3", "", product.name || "محصول");
  heading.style.marginBottom = "8px";

  if (product.tag) {
    const tag = addText(info, "span", "product-tag", product.tag);
    tag.style.display = "inline-block";
  }

  if (product.description) {
    addText(info, "p", "product-description", product.description);
  }

  const bottom = document.createElement("div");
  bottom.className = "product-bottom";

  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (variants.length > 0) {
    const prices = document.createElement("div");
    prices.className = "product-variant-prices";

    variants.forEach(variant => {
      const row = document.createElement("div");
      row.className = "variant-price-row";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      row.style.padding = "7px 0";
      row.style.borderBottom = "1px solid #333";

      addText(row, "span", "variant-name", variant.name);
      addText(row, "strong", "product-price", toman(variant.price));
      prices.appendChild(row);
    });

    bottom.appendChild(prices);
  } else {
    addText(bottom, "strong", "product-price", toman(product.price));
  }

  info.appendChild(bottom);
  card.appendChild(info);
  return card;
}

function renderMenu() {
  if (!menuContainer) return;

  menuContainer.replaceChildren();

  const filtered = allProducts.filter(product =>
    activeCategory === "all" || product.category === activeCategory
  );

  if (countElement) {
    countElement.textContent = filtered.length.toLocaleString("fa-IR");
  }

  if (!filtered.length) {
    addText(menuContainer, "p", "empty-menu", "فعلاً محصولی در این دسته موجود نیست.");
    return;
  }

  filtered.forEach(product => menuContainer.appendChild(createProductCard(product)));
}

async function loadMenu() {
  if (!menuContainer) return;

  menuContainer.textContent = "در حال بارگذاری منوی رومانو...";

  const { data, error } = await db
    .from("products")
    .select("id,name,category,description,price,tag,is_available,variants")
    .eq("is_available", true)
    .order("id", { ascending: true });

  if (error) {
    menuContainer.textContent = "بارگذاری منو با مشکل مواجه شد. لطفاً بعداً دوباره تلاش کنید.";
    console.error("Menu loading error:", error.message);
    return;
  }

  allProducts = data || [];
  renderMenu();
}

document.querySelectorAll(".category-button").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "all";

    document.querySelectorAll(".category-button").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderMenu();
  });
});

loadMenu();
