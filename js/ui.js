const UI = {
  show(id) { document.getElementById(id)?.classList.remove("hidden"); },
  hide(id) { document.getElementById(id)?.classList.add("hidden"); },
  toggle(id) { document.getElementById(id)?.classList.toggle("hidden"); },

  toast(msg, type = "") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = `toast ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), 2500);
  },

  renderKassaList(kassas) {
    const el = document.getElementById("kassa-list");
    el.innerHTML = kassas.map(k => `
      <div class="glass-card kassa-card" data-id="${k.id}">
        <div class="icon">🏪</div>
        <div class="name">${k.name}</div>
        <div class="loc">${k.location}</div>
        <div class="state ${k.status}">${k.status === "open" ? "Açıq" : "Bağlı"}</div>
      </div>
    `).join("");
  },

  renderCart() {
    const el = document.getElementById("cart-items");
    if (Kassa.cart.length === 0) {
      el.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px 0">Səbət boşdur</p>`;
    } else {
      el.innerHTML = Kassa.cart.map(i => `
        <div class="cart-item">
          <span class="name">${i.name}</span>
          <span class="qty">x${i.qty}</span>
          <span class="price">${i.total.toFixed(2)} ₼</span>
        </div>
      `).join("");
    }
    document.getElementById("cart-total").textContent = Kassa.cartTotal().toFixed(2) + " ₼";
    document.getElementById("cart-count").textContent = Kassa.cart.reduce((a, i) => a + i.qty, 0);
  },

  updateBalance(v) {
    document.getElementById("balance").textContent = v.toFixed(2) + " ₼";
  },

  updateStats() {
    document.getElementById("today-total").textContent = Kassa.todayTotal.toFixed(2) + " ₼";
    document.getElementById("today-count").textContent = Kassa.todayCount;
  },

  confetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: ["#00d9ff", "#a855f7", "#00ff88", "#ffaa00"][Math.floor(Math.random() * 4)],
      rot: Math.random() * Math.PI
    }));
    let frames = 0;
    const anim = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      frames++;
      if (frames < 180) requestAnimationFrame(anim);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    anim();
  }
};
