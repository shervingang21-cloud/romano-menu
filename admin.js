
const SUPABASE_URL = "https://paubpmdvbebqjvjlvsee.supabase.co";
const SUPABASE_KEY = "sb_publishable_WTlJivfa5eaTZOvnqf113A_-zoV8LcZ";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);

const loginPanel = $("login-panel");
const adminContent = $("admin-content");
const productForm = $("product-form");
const productList = $("admin-product-list");
const categoryInput = $("product-category");

let products = [];

function money(value) {
  return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function showMessage(id, message, success = false) {
  const el = $(id);
  el.textContent = message;
  el.style.color = success ? "#86efac" : "#fca5a5";
}

function variantsFor(product) {
  if (Array.isArray(product.variants)) return product.variants;
  return [];
}

function variantsSummary(product) {
  const variants = variantsFor(product);
  if (variants.length) {
    return variants.map(v => `${v.name}: ${money(v.price)}`).join(" | ");
  }
  return money(product.price);
}

function updatePriceFields() {
  const category = categoryInput.value;
  $("pizza-prices").classList.toggle("hidden", category !== "pizza");
  $("sandwich-prices").classList.toggle("hidden", category !== "sandwich");
  $("drink-price-field").classList.toggle("hidden", category !== "drink");
}

categoryInput.addEventListener("change", updatePriceFields);

function readPrice(id, label) {
  const raw = $(id).value.trim();
  if (raw === "" || !Number.isFinite(Number(raw)) || Number(raw) < 0) {
    throw new Error(`قیمت «${label}» را درست وارد کن.`);
  }
  return Math.round(Number(raw));
}

function readFormData() {
  const category = $("product-category").value;
  let variants = [];
  let price = 0;

  if (category === "pizza") {
    variants = [
      { name: "کوچک", price: readPrice("pizza-small", "کوچک") },
      { name: "متوسط", price: readPrice("pizza-medium", "متوسط") },
      { name: "بزرگ", price: readPrice("pizza-large", "بزرگ") }
    ];
    price = variants[0].price;
  } else if (category === "sandwich") {
    variants = [
      { name: "بدون قارچ و پنیر", price: readPrice("sandwich-plain", "بدون قارچ و پنیر") },
      { name: "با قارچ و پنیر", price: readPrice("sandwich-extra", "با قارچ و پنیر") }
    ];
    price = variants[0].price;
  } else {
    price = readPrice("product-price", "نوشیدنی");
  }

  return {
    name: $("product-name").value.trim(),
    category,
    description: $("product-description").value.trim(),
    tag: $("product-tag").value.trim(),
    price,
    variants,
    is_available: $("product-available").value === "true"
  };
}

function resetForm() {
  productForm.reset();
  $("product-id").value = "";
  $("form-title").textContent = "افزودن محصول";
  $("save-product").textContent = "ذخیره محصول";
  $("cancel-edit").classList.add("hidden");
  $("product-available").value = "true";
  updatePriceFields();
  showMessage("form-message", "");
}

function fillForm(product) {
  resetForm();
  $("product-id").value = product.id;
  $("product-name").value = product.name || "";
  $("product-category").value = product.category;
  $("product-description").value = product.description || "";
  $("product-tag").value = product.tag || "";
  $("product-price").value = product.price ?? 0;
  $("product-available").value = String(product.is_available !== false);

  const variants = variantsFor(product);
  if (product.category === "pizza") {
    $("pizza-small").value = variants.find(v => v.name === "کوچک")?.price ?? "";
    $("pizza-medium").value = variants.find(v => v.name === "متوسط")?.price ?? "";
    $("pizza-large").value = variants.find(v => v.name === "بزرگ")?.price ?? "";
  } else if (product.category === "sandwich") {
    $("sandwich-plain").value = variants.find(v => v.name === "بدون قارچ و پنیر")?.price ?? "";
    $("sandwich-extra").value = variants.find(v => v.name === "با قارچ و پنیر")?.price ?? "";
  }

  $("form-title").textContent = "ویرایش محصول";
  $("save-product").textContent = "ذخیره تغییرات";
  $("cancel-edit").classList.remove("hidden");
  updatePriceFields();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("cancel-edit").addEventListener("click", resetForm);

async function loadProducts() {
  productList.textContent = "در حال بارگذاری...";
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    productList.textContent = "خطا در دریافت محصولات: " + error.message;
    return;
  }

  products = data || [];
  $("admin-product-count").textContent = products.length.toLocaleString("fa-IR");
  productList.replaceChildren();

  if (!products.length) {
    productList.textContent = "هنوز محصولی ثبت نشده.";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "admin-item";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = {
      pizza: "پیتزا",
      sandwich: "ساندویچ",
      drink: "نوشیدنی"
    }[product.category] || product.category;

    const price = document.createElement("p");
    price.textContent = variantsSummary(product);

    const status = document.createElement("p");
    status.textContent = product.is_available ? "وضعیت: موجود" : "وضعیت: ناموجود";

    const edit = document.createElement("button");
    edit.className = "admin-button secondary";
    edit.type = "button";
    edit.textContent = "ویرایش";
    edit.addEventListener("click", () => fillForm(product));

    const remove = document.createElement("button");
    remove.className = "admin-button";
    remove.type = "button";
    remove.textContent = "حذف";
    remove.addEventListener("click", async () => {
      if (!confirm(`محصول «${product.name}» حذف شود؟`)) return;

      const { error } = await db.from("products").delete().eq("id", product.id);
      if (error) {
        alert("حذف انجام نشد: " + error.message);
        return;
      }
      if ($("product-id").value === String(product.id)) resetForm();
      await loadProducts();
    });

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";
    actions.append(edit, remove);
    card.append(title, category, price, status, actions);
    productList.append(card);
  });
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("form-message", "");

  let payload;
  try {
    payload = readFormData();
    if (!payload.name) throw new Error("نام محصول را وارد کن.");
  } catch (error) {
    showMessage("form-message", error.message);
    return;
  }

  const id = $("product-id").value;
  const button = $("save-product");
  button.disabled = true;
  button.textContent = "در حال ذخیره...";

  let result;
  if (id) {
    result = await db.from("products").update(payload).eq("id", id);
  } else {
    result = await db.from("products").insert(payload);
  }

  button.disabled = false;
  button.textContent = id ? "ذخیره تغییرات" : "ذخیره محصول";

  if (result.error) {
    showMessage("form-message", "ذخیره انجام نشد: " + result.error.message);
    return;
  }

  showMessage("form-message", "محصول با موفقیت ذخیره شد.", true);
  resetForm();
  await loadProducts();
});

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("login-button").disabled = true;
  showMessage("login-message", "در حال ورود...");

  const { error } = await db.auth.signInWithPassword({
    email: $("login-email").value.trim(),
    password: $("login-password").value
  });

  $("login-button").disabled = false;

  if (error) {
    showMessage("login-message", "ورود ناموفق بود: " + error.message);
    return;
  }
  await checkSession();
});

$("logout-button").addEventListener("click", async () => {
  await db.auth.signOut();
  await checkSession();
});

async function checkSession() {
  const { data } = await db.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    loginPanel.classList.remove("hidden");
    adminContent.classList.add("hidden");
    return;
  }

  loginPanel.classList.add("hidden");
  adminContent.classList.remove("hidden");
  $("admin-user-email").textContent = user.email || "";
  await loadProducts();
}

db.auth.onAuthStateChange(() => {
  setTimeout(checkSession, 0);
});

updatePriceFields();
checkSession();
