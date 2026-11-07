const state = { products: [], categories: [], sales: [], salesChart: null, analyticsChart: null };
const currency = value => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value || 0));
const byId = id => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed.");
  return body;
}
function toast(message) {
  const element = byId("toast");
  element.textContent = message;
  element.classList.add("show");
  window.setTimeout(() => element.classList.remove("show"), 2800);
}
function showView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  const titles = { dashboard: "Overview", products: "Products", sales: "Sales", inventory: "Inventory", analytics: "Analytics" };
  byId("page-title").textContent = titles[name] || "Overview";
  if (name === "analytics") loadAnalytics();
}
function stockStatus(product) {
  return Number(product.stock_quantity) <= Number(product.reorder_level)
    ? '<span class="pill pill-low">Low stock</span>'
    : '<span class="pill pill-ok">In stock</span>';
}
async function loadProducts() {
  const result = await api("/products");
  state.products = result.data || [];
  renderProducts();
  renderInventory();
  populateProductSelects();
}
async function loadCategories() {
  const result = await api("/categories");
  state.categories = result.data || [];
  byId("product-category").innerHTML = state.categories.map(category =>
    `<option value="${category.category_id}">${escapeHtml(category.category_name)}</option>`).join("");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function renderProducts() {
  const query = byId("product-search").value.toLowerCase();
  const filtered = state.products.filter(product => product.product_name.toLowerCase().includes(query) || product.category_name.toLowerCase().includes(query));
  byId("product-count").textContent = `${filtered.length} products`;
  byId("products-table").innerHTML = filtered.length ? filtered.map(product => `
    <tr><td class="product-name">${escapeHtml(product.product_name)}</td><td>${escapeHtml(product.category_name)}</td>
    <td>${currency(product.unit_price)}</td><td>${product.stock_quantity}</td><td>${stockStatus(product)}</td>
    <td><button class="table-action" data-edit="${product.product_id}">Edit</button><button class="table-action delete" data-delete-product="${product.product_id}">Delete</button></td></tr>`).join("") :
    '<tr><td colspan="6" class="table-empty">No matching products found.</td></tr>';
}
function renderInventory() {
  const low = state.products.filter(product => Number(product.stock_quantity) <= Number(product.reorder_level));
  const units = state.products.reduce((sum, product) => sum + Number(product.stock_quantity), 0);
  byId("inventory-units").textContent = units.toLocaleString();
  byId("inventory-alerts").textContent = low.length;
  byId("inventory-table").innerHTML = state.products.length ? state.products.map(product => `
    <tr><td class="product-name">${escapeHtml(product.product_name)}</td><td>${escapeHtml(product.category_name)}</td>
    <td>${product.stock_quantity}</td><td>${product.reorder_level}</td><td>${stockStatus(product)}</td></tr>`).join("") :
    '<tr><td colspan="5" class="table-empty">No inventory records yet.</td></tr>';
}
function populateProductSelects() {
  byId("sale-product").innerHTML = '<option value="">Select a product</option>' + state.products.map(product =>
    `<option value="${product.product_id}" data-price="${product.unit_price}" data-stock="${product.stock_quantity}" ${Number(product.stock_quantity) < 1 ? "disabled" : ""}>${escapeHtml(product.product_name)} · ${currency(product.unit_price)} · Stock: ${product.stock_quantity}</option>`).join("");
  updateSaleEstimate();
}
function updateSaleEstimate() {
  const option = byId("sale-product").selectedOptions[0];
  const price = Number(option?.dataset.price || 0);
  const quantity = Number(byId("sale-quantity").value || 0);
  byId("sale-estimate").textContent = currency(price * quantity);
}
async function loadSales() {
  const result = await api("/sales");
  state.sales = result.data || [];
  byId("sales-table").innerHTML = state.sales.length ? state.sales.map(sale => `
    <tr><td>#${sale.sale_id}</td><td>${new Date(sale.transaction_date).toLocaleString("en-PH")}</td>
    <td>${sale.item_count}</td><td>${currency(sale.total_amount)}</td>
    <td><button class="table-action delete" data-delete-sale="${sale.sale_id}">Void</button></td></tr>`).join("") :
    '<tr><td colspan="5" class="table-empty">No transactions recorded yet.</td></tr>';
}
async function loadDashboard() {
  const [overview, monthly, recommendations] = await Promise.all([
    api("/analytics/overview"), api("/analytics/monthly-sales"), api("/analytics/recommendations")
  ]);
  const data = overview.data;
  byId("stat-revenue").textContent = currency(data.total_sales);
  byId("stat-transactions").textContent = Number(data.transaction_count).toLocaleString();
  byId("stat-products").textContent = Number(data.product_count).toLocaleString();
  byId("stat-lowstock").textContent = Number(data.low_stock_count).toLocaleString();
  renderTopProducts(data.top_products || []);
  renderRecommendations("dashboard-recommendations", recommendations.data || []);
  drawChart("sales-chart", "sales-chart-empty", monthly.data || [], "salesChart");
}
function renderTopProducts(products) {
  byId("top-products").innerHTML = products.length ? products.map((product, index) => `
    <div class="rank-row"><span class="rank-number">${index + 1}</span><div><div class="rank-name">${escapeHtml(product.product_name)}</div><div class="rank-detail">${product.units_sold} units sold</div></div><span class="rank-value">${currency(product.revenue)}</span></div>`).join("") :
    '<p class="muted">No sales recorded yet.</p>';
}
function renderRecommendations(target, items) {
  byId(target).innerHTML = items.length ? items.slice(0, 6).map(item => `
    <div class="recommendation-item"><span class="recommendation-bullet">!</span><div><strong>${escapeHtml(item.type)} · ${escapeHtml(item.product)}</strong><p>${escapeHtml(item.reason)} ${escapeHtml(item.action)}</p></div></div>`).join("") :
    '<p class="muted">No urgent actions based on the current records.</p>';
}
function drawChart(canvasId, emptyId, rows, stateKey) {
  const canvas = byId(canvasId);
  const empty = byId(emptyId);
  if (!rows.length) { canvas.style.display = "none"; empty.style.display = "block"; return; }
  canvas.style.display = "block"; empty.style.display = "none";
  if (state[stateKey]) state[stateKey].destroy();
  state[stateKey] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(row => row.month),
      datasets: [{ label: "Sales", data: rows.map(row => Number(row.sales)), backgroundColor: "#8175df", borderRadius: 6, maxBarThickness: 38 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: value => "₱" + Number(value).toLocaleString() }, grid: { color: "#edf0f5" } }, x: { grid: { display: false } } } }
  });
}
async function loadAnalytics() {
  const [overview, monthly, forecast, recommendations] = await Promise.all([
    api("/analytics/overview"), api("/analytics/monthly-sales"), api("/analytics/forecast"), api("/analytics/recommendations")
  ]);
  byId("descriptive-summary").textContent = `The store has ${overview.data.transaction_count} recorded transactions and ${currency(overview.data.total_sales)} in total sales. There are ${overview.data.product_count} products in the catalog.`;
  byId("forecast-value").textContent = currency(forecast.predicted_next_month_sales);
  byId("forecast-note").textContent = forecast.months_used ? `Based on ${forecast.months_used} available monthly total(s), using a simple moving average.` : "Add sales across different months to build a forecast.";
  renderRecommendations("analytics-recommendations", recommendations.data || []);
  drawChart("analytics-chart", "analytics-chart-empty", monthly.data || [], "analyticsChart");
}
function openProductDialog(product = null) {
  byId("product-form").reset();
  byId("product-id").value = product?.product_id || "";
  byId("product-dialog-title").textContent = product ? "Edit product" : "Add product";
  byId("product-name").value = product?.product_name || "";
  byId("product-category").value = product?.category_id || state.categories[0]?.category_id || "";
  byId("product-price").value = product?.unit_price ?? "";
  byId("product-stock").value = product?.stock_quantity ?? 0;
  byId("product-reorder").value = product?.reorder_level ?? 5;
  byId("product-dialog").showModal();
}
async function refreshAll() {
  await Promise.all([loadProducts(), loadSales()]);
  await loadDashboard();
}
document.addEventListener("click", async event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) showView(viewButton.dataset.view);
  if (event.target.closest('[data-action="go-sales"]')) showView("sales");
  const editButton = event.target.closest("[data-edit]");
  if (editButton) openProductDialog(state.products.find(item => item.product_id === Number(editButton.dataset.edit)));
  const deleteProduct = event.target.closest("[data-delete-product]");
  if (deleteProduct && confirm("Delete this product? Products already used in sales cannot be deleted.")) {
    try { await api(`/products/${deleteProduct.dataset.deleteProduct}`, { method: "DELETE" }); toast("Product deleted."); await refreshAll(); }
    catch (error) { toast(error.message); }
  }
  const deleteSale = event.target.closest("[data-delete-sale]");
  if (deleteSale && confirm("Void this sale? Its quantities will be returned to inventory.")) {
    try { await api(`/sales/${deleteSale.dataset.deleteSale}`, { method: "DELETE" }); toast("Sale voided and stock restored."); await refreshAll(); }
    catch (error) { toast(error.message); }
  }
});
byId("add-product-button").addEventListener("click", () => openProductDialog());
byId("close-product-dialog").addEventListener("click", () => byId("product-dialog").close());
byId("cancel-product").addEventListener("click", () => byId("product-dialog").close());
byId("product-search").addEventListener("input", renderProducts);
byId("sale-product").addEventListener("change", updateSaleEstimate);
byId("sale-quantity").addEventListener("input", updateSaleEstimate);
byId("product-form").addEventListener("submit", async event => {
  event.preventDefault();
  const id = byId("product-id").value;
  const payload = {
    product_name: byId("product-name").value.trim(),
    category_id: Number(byId("product-category").value),
    unit_price: Number(byId("product-price").value),
    stock_quantity: Number(byId("product-stock").value),
    reorder_level: Number(byId("product-reorder").value)
  };
  try {
    await api(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    byId("product-dialog").close(); toast(id ? "Product updated." : "Product added."); await refreshAll();
  } catch (error) { toast(error.message); }
});
byId("sale-form").addEventListener("submit", async event => {
  event.preventDefault();
  const productId = Number(byId("sale-product").value);
  const quantity = Number(byId("sale-quantity").value);
  if (!productId || quantity < 1) return toast("Choose a product and valid quantity.");
  try {
    await api("/sales", { method: "POST", body: JSON.stringify({ items: [{ product_id: productId, quantity }] }) });
    byId("sale-form").reset(); updateSaleEstimate(); toast("Sale saved. Inventory updated."); await refreshAll();
  } catch (error) { toast(error.message); }
});
byId("today-label").textContent = new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

(async function init() {
  try {
    await loadCategories();
    await refreshAll();
  } catch (error) {
    toast(`Setup needed: ${error.message}`);
    console.error(error);
  }
})();
