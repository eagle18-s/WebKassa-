let allKassas = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Loader gizlət
  setTimeout(() => UI.hide("loader"), 600);

  // Session yoxla
  const sess = Auth.restore();
  if (sess) {
    await goToKassaSelect();
  } else {
    UI.show("login-screen");
  }

  // ---------- LOGIN ----------
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("login-error");
    err.textContent = "";
    try {
      await Auth.login(
        document.getElementById("username").value.trim(),
        document.getElementById("password").value
      );
      UI.hide("login-screen");
      await goToKassaSelect();
    } catch (e) {
      err.textContent = e.message;
    }
  });

  // ---------- LOGOUT ----------
  document.getElementById("logout-btn").addEventListener("click", () => {
    Auth.logout();
    location.reload();
  });

  // ---------- KASSA SEÇ ----------
  document.getElementById("kassa-list").addEventListener("click", async (e) => {
    const card = e.target.closest(".kassa-card");
    if (!card) return;
    const id = card.dataset.id;
    try {
      const k = await Kassa.open(id);
      UI.hide("kassa-select-screen");
      UI.show("main-screen");
      document.getElementById("kassa-name").textContent = k.name;
      UI.updateBalance(k.balance);
      UI.updateStats();
      UI.renderCart();
    } catch (err) {
      UI.toast(err.message, "error");
    }
  });

  // ---------- SCANNER ----------
  document.getElementById("scan-btn").addEventListener("click", async () => {
    UI.show("scanner-modal");
    await Scanner.start((code) => {
      UI.hide("scanner-modal");
      handleBarcode(code);
    });
  });
  document.getElementById("close-scanner").addEventListener("click", () => {
    Scanner.stop();
    UI.hide("scanner-modal");
  });

  // ---------- CART ----------
  document.getElementById("cart-panel").querySelector(".panel-header").id = "cart-header-tmp";
  // Səbət aç
  document.querySelector('[data-page="cart"]').addEventListener("click", () => {
    UI.renderCart();
    UI.show("cart-panel");
  });
  document.getElementById("close-cart").addEventListener("click", () => UI.hide("cart-panel"));

  // ---------- PAY ----------
  document.getElementById("pay-btn").addEventListener("click", async () => {
    try {
      const sale = await Kassa.pay();
      UI.renderCart();
      UI.updateBalance(Kassa.current.balance);
      UI.updateStats();
      UI.hide("cart-panel");
      UI.confetti();
      UI.toast(`✅ Ödəniş uğurlu: ${sale.total.toFixed(2)} ₼`, "success");
    } catch (e) {
      UI.toast(e.message, "error");
    }
  });

  // ---------- NAV ----------
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const page = btn.dataset.page;
      if (page === "scan") return;
      if (page === "cart") return;
      if (page === "stock") showStock();
      if (page === "reports") showReports();
    });
  });
});

async function goToKassaSelect() {
  try {
    const { kassas } = await GitHubAPI.read("kassas.json");
    allKassas = kassas;
    UI.renderKassaList(kassas);
    UI.show("kassa-select-screen");
  } catch (e) {
    UI.toast("Kassalar yüklənmədi: " + e.message, "error");
  }
}

async function handleBarcode(code) {
  const product = Kassa.findProductByBarcode(code);
  if (!product) {
    UI.toast(`Barkod tapılmadı: ${code}`, "error");
    return;
  }
  Kassa.addToCart(product);
  UI.renderCart();
  const last = document.getElementById("last-scan");
  last.classList.remove("hidden");
  document.getElementById("last-scan-name").textContent = product.name;
  document.getElementById("last-scan-price").textContent = product.price.toFixed(2) + " ₼";
  UI.toast(`➕ ${product.name}`, "success");
}

async function showStock() {
  UI.toast("Anbar yüklənir...");
  try {
    const { products } = await GitHubAPI.read("products.json");
    const html = products.map(p => `
      <div class="stock-item">
        <span>${p.name}</span>
        <span class="${p.stock < (p.minStock || 10) ? 'low' : ''}">${p.stock} ${p.unit || ''}</span>
      </div>
    `).join("");
    showOverlay("📦 Anbar", html);
  } catch (e) { UI.toast(e.message, "error"); }
}

async function showReports() {
  try {
    const { sales } = await GitHubAPI.read("sales.json");
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(s => s.timestamp.startsWith(today) && s.kassaId === Kassa.current.id);
    const total = todaySales.reduce((a, s) => a + s.total, 0);
    const html = `
      <div class="report-item"><span>Bu gün satış</span><strong>${todaySales.length}</strong></div>
      <div class="report-item"><span>Bu gün cəm</span><strong>${total.toFixed(2)} ₼</strong></div>
      <div class="report-item"><span>Kassa balansı</span><strong>${Kassa.current.balance.toFixed(2)} ₼</strong></div>
    `;
    showOverlay("📊 Hesabat", html);
  } catch (e) { UI.toast(e.message, "error"); }
}

function showOverlay(title, html) {
  const existing = document.getElementById("generic-overlay");
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.id = "generic-overlay";
  div.className = "modal";
  div.innerHTML = `
    <div class="modal-content">
      <div class="panel-header">
        <h3>${title}</h3>
        <button class="btn-ghost" onclick="this.closest('.modal').remove()">✕</button>
      </div>
      <div style="padding:18px;overflow-y:auto">${html}</div>
    </div>
  `;
  document.body.appendChild(div);
}
