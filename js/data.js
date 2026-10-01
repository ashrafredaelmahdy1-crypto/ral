/**
 * data.js - Data Layer
 * All data is stored in localStorage under the 'emera_' prefix.
 * This module provides CRUD helpers and auto-ID generation.
 */

const DB = {
  // ─── Keys ────────────────────────────────────────────────
  KEYS: {
    customers: 'emera_customers',
    orders:    'emera_orders',
    products:  'emera_products',
    expenses:  'emera_expenses',
    counters:  'emera_counters',
  },

  // ─── Generic helpers ──────────────────────────────────────
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  _getCounters() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.counters) || '{"customer":0,"order":0,"product":0}');
    } catch { return { customer: 0, order: 0, product: 0 }; }
  },

  _saveCounters(c) {
    localStorage.setItem(this.KEYS.counters, JSON.stringify(c));
  },

  _nextId(type) {
    const c = this._getCounters();
    c[type] = (c[type] || 0) + 1;
    this._saveCounters(c);
    return c[type];
  },

  // ─── Customers ────────────────────────────────────────────
  getCustomers() { return this._get(this.KEYS.customers); },

  getCustomer(id) {
    return this.getCustomers().find(c => c.id === id) || null;
  },

  addCustomer(data) {
    const customers = this.getCustomers();
    const num = this._nextId('customer');
    const customer = {
      id:          `cus_${Date.now()}`,
      code:        `CUS-${String(num).padStart(4, '0')}`,
      name:        data.name || '',
      phone:       data.phone || '',
      governorate: data.governorate || '',
      city:        data.city || '',
      address:     data.address || '',
      notes:       data.notes || '',
      createdAt:   new Date().toISOString(),
    };
    customers.push(customer);
    this._set(this.KEYS.customers, customers);
    return customer;
  },

  updateCustomer(id, data) {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    customers[idx] = { ...customers[idx], ...data, id, code: customers[idx].code };
    this._set(this.KEYS.customers, customers);
    return customers[idx];
  },

  deleteCustomer(id) {
    const customers = this.getCustomers().filter(c => c.id !== id);
    this._set(this.KEYS.customers, customers);
  },

  searchCustomers(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.getCustomers();
    return this.getCustomers().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  },

  // ─── Orders ───────────────────────────────────────────────
  getOrders() { return this._get(this.KEYS.orders); },

  getOrder(id) {
    return this.getOrders().find(o => o.id === id) || null;
  },

  calculateOrderRemaining(totalAmount = 0, paidAmount = 0) {
    const total = Number(totalAmount) || 0;
    const paid = Number(paidAmount) || 0;
    return Math.max(total - paid, 0);
  },

  addOrder(data) {
    const orders = this.getOrders();
    const num = this._nextId('order');
    const totalAmount = Number(data.totalAmount) || 0;
    const paidAmount = Number(data.paidAmount) || 0;
    const remaining = this.calculateOrderRemaining(totalAmount, paidAmount);

    const order = {
      id:           `ord_${Date.now()}`,
      number:       `ORD-${String(num).padStart(4, '0')}`,
      customerId:   data.customerId || '',
      customerName: data.customerName || '',
      customerCode: data.customerCode || '',
      phone:        data.phone || '',
      platform:     data.platform || 'other',
      date:         data.date || new Date().toISOString().split('T')[0],
      address:      data.address || '',
      items:        data.items || [],
      subtotal:     data.subtotal || 0,
      discount:     data.discount || 0,
      shippingCost: data.shippingCost || 0,
      totalAmount:  totalAmount,
      paidAmount:   paidAmount,
      remaining,
      notes:        data.notes || '',
      status:       'new',
      costs:        [],
      totalCost:    0,
      profit:       0,
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };
    orders.push(order);
    this._set(this.KEYS.orders, orders);
    return order;
  },

  updateOrder(id, data) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return null;

    const totalAmount = Number(data.totalAmount ?? orders[idx].totalAmount) || 0;
    const paidAmount = Number(data.paidAmount ?? orders[idx].paidAmount) || 0;
    const remaining = data.remaining ?? this.calculateOrderRemaining(totalAmount, paidAmount);

    orders[idx] = {
      ...orders[idx],
      ...data,
      totalAmount,
      paidAmount,
      remaining,
      id,
      number: orders[idx].number,
      updatedAt: new Date().toISOString(),
    };
    this._set(this.KEYS.orders, orders);
    return orders[idx];
  },

  updateOrderStatus(id, status) {
    return this.updateOrder(id, { status });
  },

  updateOrderCosts(id, costs) {
    const order = this.getOrder(id);
    if (!order) return null;
    const totalCost = costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    // profit = totalAmount (already contains: subtotal - discount + shipping) - costs - shipping
    const profit = (order.totalAmount || 0) - totalCost - (order.shippingCost || 0);
    return this.updateOrder(id, { costs, totalCost, profit });
  },

  deleteOrder(id) {
    const orders = this.getOrders().filter(o => o.id !== id);
    this._set(this.KEYS.orders, orders);
  },

  getOrdersByCustomer(customerId) {
    return this.getOrders().filter(o => o.customerId === customerId);
  },

  filterOrders(filters = {}) {
    let orders = this.getOrders();
    const q = (filters.query || '').toLowerCase().trim();
    if (q) {
      orders = orders.filter(o =>
        o.number.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    }
    if (filters.status)   orders = orders.filter(o => o.status === filters.status);
    if (filters.platform) orders = orders.filter(o => o.platform === filters.platform);
    if (filters.dateFrom) orders = orders.filter(o => o.date >= filters.dateFrom);
    if (filters.dateTo)   orders = orders.filter(o => o.date <= filters.dateTo);
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ─── Products ─────────────────────────────────────────────
  getProducts() { return this._get(this.KEYS.products); },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },

  addProduct(data) {
    const products = this.getProducts();
    const product = {
      id:        `pro_${Date.now()}`,
      name:      data.name || '',
      type:      data.type || '',
      price:     parseFloat(data.price) || 0,

      size:      data.size || '',
      color:     data.color || '',
      notes:     data.notes || '',
      createdAt: new Date().toISOString(),
    };
    products.push(product);
    this._set(this.KEYS.products, products);
    return product;
  },

  updateProduct(id, data) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = {
      ...products[idx],
      ...data,
      id,

    };
    this._set(this.KEYS.products, products);
    return products[idx];
  },

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this._set(this.KEYS.products, products);
  },

  // ─── Expenses ─────────────────────────────────────────
  getExpenses() { return this._get(this.KEYS.expenses); },

  addExpense(data) {
    const expenses = this.getExpenses();
    const expense = {
      id:        `exp_${Date.now()}`,
      name:      data.name      || '',
      date:      data.date      || new Date().toISOString().split('T')[0],
      qty:       parseFloat(data.qty)    || 1,
      place:     data.place     || '',
      amount:    parseFloat(data.amount) || 0,
      notes:     data.notes     || '',
      createdAt: new Date().toISOString(),
    };
    expenses.push(expense);
    this._set(this.KEYS.expenses, expenses);
    return expense;
  },

  updateExpense(id, data) {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) return null;
    expenses[idx] = { ...expenses[idx], ...data, id };
    this._set(this.KEYS.expenses, expenses);
    return expenses[idx];
  },

  deleteExpense(id) {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this._set(this.KEYS.expenses, expenses);
  },

  // ─── Statistics ───────────────────────────────────────────
  getStats() {
    const orders    = this.getOrders();
    const customers = this.getCustomers();
    const active    = orders.filter(o => o.status !== 'cancelled');

    // الإيراد = إجمالي totalAmount للطلبات غير الملغاة
    const totalSales = active.reduce((s, o) => s + (o.totalAmount || 0), 0);

    // التكاليف = تكاليف التنفيذ المسجلة + تكلفة الشحن
    // (نقرأ من costs array مباشرة بدلاً من o.totalCost المخزّنة)
    const totalCosts = active.reduce((s, o) => {
      const recorded = (o.costs || []).reduce((cs, c) => cs + (parseFloat(c.amount) || 0), 0);
      return s + recorded + (o.shippingCost || 0);
    }, 0);

    // صافي الربح = الإيراد - التكاليف
    const netProfit = totalSales - totalCosts;

    return {
      totalCustomers:   customers.length,
      newOrders:        orders.filter(o => o.status === 'new').length,
      inProduction:     orders.filter(o => ['confirmed','production'].includes(o.status)).length,
      readyToShip:      orders.filter(o => o.status === 'done').length,
      totalSales,
      totalCosts,
      netProfit,
    };
  },

  // ─── Clear all data ───────────────────────────────────────
  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },
};
