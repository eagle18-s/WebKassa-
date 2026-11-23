const Kassa = {
  current: null,
  products: [],
  cart: [],
  todayTotal: 0,
  todayCount: 0,

  async open(kassaId) {
    const { kassas } = await GitHubAPI.read("kassas.json");
    this.current = kassas.find(k => k.id === kassaId);
    if (!this.current) throw new Error("Kassa tapılmadı");
    const p = await GitHubAPI.read("products.json");
    this.products = p.products;
    await this.loadTodayStats();
    return this.current;
  },

  async loadTodayStats() {
    try {
      const { sales } = await GitHubAPI.read("sales.json");
      const today = new Date().toISOString().slice(0, 10);
      const todaySales = sales.filter(s =>
        s.kassaId === this.current.id && s.timestamp.startsWith(today)
      );
      this.todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
      this.todayCount = todaySales.length;
    } catch { /* sales.json boş ola bilər */ }
  },

  findProductByBarcode(barcode) {
    return this.products.find(p => p.barcode === barcode);
  },

  addToCart(product) {
    if (!product) return null;
    const existing = this.cart.find(i => i.productId === product.id);
    if (existing) {
      existing.qty++;
      existing.total = existing.qty * existing.price;
    } else {
      this.cart.push({
        productId: product.id, name: product.name,
        qty: 1, price: product.price, total: product.price
      });
    }
    return product;
  },

  removeFromCart(productId) {
    const idx = this.cart.findIndex(i => i.productId === productId);
    if (idx > -1) {
      this.cart[idx].qty--;
      this.cart[idx].total = this.cart[idx].qty * this.cart[idx].price;
      if (this.cart[idx].qty <= 0) this.cart.splice(idx, 1);
    }
  },

  cartTotal() { return this.cart.reduce((a, i) => a + i.total, 0); },

  async pay() {
    if (this.cart.length === 0) throw new Error("Səbət boşdur");
    const total = this.cartTotal();
    const saleId = `SALE-${Date.now()}`;

    const sale = {
      id: saleId,
      kassaId: this.current.id,
      operatorId: Auth.user?.userId || "unknown",
      items: [...this.cart],
      total: parseFloat(total.toFixed(2)),
      paymentMethod: "cash",
      timestamp: new Date().toISOString()
    };

    // 1. Sales-ə yaz
    let salesData = { sales: [] };
    try { salesData = await GitHubAPI.read("sales.json"); } catch {}
    salesData.sales.unshift(sale);
    await GitHubAPI.write("sales.json", salesData);

    // 2. Balans artır
    const kassasData = await GitHubAPI.read("kassas.json");
    const k = kassasData.kassas.find(x => x.id === this.current.id);
    k.balance = parseFloat((k.balance + total).toFixed(2));
    await GitHubAPI.write("kassas.json", kassasData);

    // 3. Stok azalt
    for (const item of this.cart) {
      const p = this.products.find(x => x.id === item.productId);
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    }
    await GitHubAPI.write("products.json", { products: this.products });

    this.current.balance = k.balance;
    this.cart = [];
    this.todayTotal += total;
    this.todayCount++;
    return sale;
  }
};
