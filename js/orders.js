/**
 * orders.js - Orders Page
 */

const Orders = {
  render() {
    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>الطلبات</h1>
          <p>متابعة جميع الطلبات وتحديث حالاتها</p>
        </div>
        <button class="btn btn-primary" onclick="NewOrder.editId=null;Router.navigate('new-order')">➕ طلب جديد</button>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body" style="padding:var(--space-4)">
          <div class="search-bar">
            <div class="search-input-wrapper" style="flex:2">
              <span class="search-icon">🔍</span>
              <input type="text" id="order-search" class="form-control search-input"
                placeholder="ابحث برقم الطلب أو العميل أو الهاتف..."
                oninput="Orders.applyFilters()">
            </div>
            <select id="order-status-filter" class="form-control" style="min-width:160px" onchange="Orders.applyFilters()">
              <option value="">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="confirmed">مؤكد</option>
              <option value="production">قيد التنفيذ</option>
              <option value="done">تم التنفيذ</option>
              <option value="shipping">جاهز للشحن</option>
              <option value="shipped">تم الشحن</option>
              <option value="cancelled">ملغي</option>
            </select>
            <select id="order-platform-filter" class="form-control" style="min-width:140px" onchange="Orders.applyFilters()">
              <option value="">كل المنصات</option>
              <option value="whatsapp">واتساب</option>
              <option value="instagram">إنستجرام</option>
              <option value="facebook">فيسبوك</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">قائمة الطلبات</span>
          <span class="badge badge-new" id="orders-count">0 طلب</span>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>المنصة</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody id="orders-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div class="modal-backdrop" id="order-detail-modal">
        <div class="modal modal-xl">
          <div class="modal-header">
            <h3 class="modal-title" id="detail-modal-title">تفاصيل الطلب</h3>
            <button class="modal-close" onclick="Orders.closeDetail()">✕</button>
          </div>
          <div class="modal-body" id="detail-modal-body"></div>
          <div class="modal-footer" id="detail-modal-footer"></div>
        </div>
      </div>

      <!-- Complete Payment Modal -->
      <div class="modal-backdrop" id="payment-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">💰 تكملة الحساب</h3>
            <button class="modal-close" onclick="Orders.closePaymentModal()">✕</button>
          </div>
          <div class="modal-body" id="payment-modal-body"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Orders.closePaymentModal()">إلغاء</button>
            <button class="btn btn-primary" onclick="Orders.savePayment()">💾 حفظ الدفعة</button>
          </div>
        </div>
      </div>
    `);
    this.applyFilters();
  },

  applyFilters() {
    const query    = document.getElementById('order-search')?.value || '';
    const status   = document.getElementById('order-status-filter')?.value || '';
    const platform = document.getElementById('order-platform-filter')?.value || '';
    const orders   = DB.filterOrders({ query, status, platform });
    this.loadTable(orders);
  },

  loadTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    const count = document.getElementById('orders-count');
    if (count) count.textContent = `${orders.length} طلب`;
    if (!tbody) return;
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📋</div><h3>لا توجد طلبات</h3></div></td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong style="color:var(--primary)">${o.number}</strong></td>
        <td>
          <div>${o.customerName}</div>
          <div style="font-size:var(--text-xs);color:var(--gray-500)" dir="ltr">${o.phone}</div>
        </td>
        <td>${Utils.platformBadge(o.platform)}</td>
        <td>${Utils.formatDate(o.date)}</td>
        <td><strong>${Utils.formatCurrency(o.totalAmount)}</strong></td>
        <td>${o.remaining > 0
          ? `<span style="color:var(--danger);font-weight:bold">${Utils.formatCurrency(o.remaining)}</span>`
          : '<span style="color:var(--success)">&#x2714; مسدد</span>'}</td>
        <td>${Utils.statusBadge(o.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" onclick="Orders.openDetail('${o.id}')">&#x1F441;️ عرض</button>
            <button class="btn btn-outline btn-sm" onclick="Orders.edit('${o.id}')">✏️ تعديل</button>
            <button class="btn btn-danger btn-sm" onclick="Orders.delete('${o.id}')">🗑️ حذف</button>
            ${o.remaining > 0 ? `<button class="btn btn-success btn-sm" onclick="Orders.openPaymentModal('${o.id}')">&#x1F4B0; تكملة</button>` : ''}
            ${o.status === 'new' ? `<button class="btn btn-accent btn-sm" onclick="Orders.confirm('${o.id}')">&#x2705; تأكيد</button>` : ''}
            ${o.status === 'new' ? `<button class="btn btn-danger btn-sm" onclick="Orders.cancel('${o.id}')">&#x274C;</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  confirm(id) {
    Utils.confirm('تأكيد الطلب وإرساله للتنفيذ؟', () => {
      DB.updateOrderStatus(id, 'confirmed');
      Utils.toast('تم تأكيد الطلب وإرساله للتنفيذ ✅');
      this.applyFilters();
    });
  },

  edit(id) {
    if (DB.getOrder(id)) {
      NewOrder.editId = id;
      Router.navigate('new-order');
    }
  },

  delete(id) {
    const order = DB.getOrder(id);
    if (!order) return;
    Utils.confirm(`حذف الطلب ${order.number} نهائياً؟`, () => {
      DB.deleteOrder(id);
      Utils.toast('تم حذف الطلب', 'info');
      this.applyFilters();
    });
  },

  cancel(id) {
    Utils.confirm('إلغاء هذا الطلب؟', () => {
      DB.updateOrderStatus(id, 'cancelled');
      Utils.toast('تم إلغاء الطلب', 'info');
      this.applyFilters();
    });
  },

  openDetail(id) {
    const o = DB.getOrder(id);
    if (!o) return;

    const itemsHtml = (o.items || []).map(i => `
      <tr>
        <td>${i.productName}</td>
        <td>${i.qty}</td>
        <td>${Utils.formatCurrency(i.price)}</td>
        <td>${Utils.formatCurrency(i.discount)}</td>
        <td><strong>${Utils.formatCurrency(i.qty * i.price - i.discount)}</strong></td>
      </tr>
    `).join('');

    document.getElementById('detail-modal-title').textContent = `طلب رقم: ${o.number}`;
    document.getElementById('detail-modal-body').innerHTML = `
      <div class="detail-grid mb-6">
        <div class="detail-item"><label>رقم الطلب</label><p>${o.number}</p></div>
        <div class="detail-item"><label>العميل</label><p>${o.customerName} (${o.customerCode})</p></div>
        <div class="detail-item"><label>الهاتف</label><p dir="ltr">${o.phone}</p></div>
        <div class="detail-item"><label>المنصة</label><p>${Utils.platformLabel(o.platform)}</p></div>
        <div class="detail-item"><label>التاريخ</label><p>${Utils.formatDate(o.date)}</p></div>
        <div class="detail-item"><label>الحالة</label><p>${Utils.statusBadge(o.status)}</p></div>
        <div class="detail-item" style="grid-column:span 2"><label>العنوان</label><p>${o.address || '—'}</p></div>
      </div>

      <p class="section-title">المنتجات</p>
      <div class="table-wrapper mb-6">
        <table class="table">
          <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">
        <div class="summary-box">
          <div class="summary-box-row"><span>المجموع الفرعي</span><span>${Utils.formatCurrency(o.subtotal)}</span></div>
          <div class="summary-box-row"><span>الخصم</span><span>- ${Utils.formatCurrency(o.discount)}</span></div>
          <div class="summary-box-row"><span>تكلفة الشحن</span><span>${Utils.formatCurrency(o.shippingCost)}</span></div>
          <div class="summary-box-row"><span>الإجمالي</span><span>${Utils.formatCurrency(o.totalAmount)}</span></div>
          <div class="summary-box-row"><span>المدفوع</span><span>${Utils.formatCurrency(o.paidAmount)}</span></div>
          <div class="summary-box-row"><span>المتبقي</span><span>${Utils.formatCurrency(o.remaining)}</span></div>
        </div>
        <div>
          ${o.notes ? `<div class="card"><div class="card-header"><span class="card-title">ملاحظات</span></div><div class="card-body"><p style="color:var(--gray-700)">${o.notes}</p></div></div>` : ''}
          ${o.costs?.length ? `
            <div class="card mt-4">
              <div class="card-header"><span class="card-title">التكاليف المسجلة</span></div>
              <div class="card-body">
                ${o.costs.map(c => `<div class="cost-row"><span>${c.label}</span><strong>${Utils.formatCurrency(c.amount)}</strong></div>`).join('')}
                <div style="padding-top:var(--space-3);font-weight:bold;color:var(--success)">
                  صافي الربح: ${Utils.formatCurrency(o.profit)}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Footer actions
    let footerHtml = `<button class="btn btn-ghost" onclick="Orders.closeDetail()">إغلاق</button>`;
    if (o.status === 'new') {
      footerHtml += `<button class="btn btn-accent" onclick="Orders.confirm('${o.id}');Orders.closeDetail()">✅ تأكيد الطلب</button>`;
    }
    document.getElementById('detail-modal-footer').innerHTML = footerHtml;
    document.getElementById('order-detail-modal').classList.add('open');
  },

  closeDetail() {
    document.getElementById('order-detail-modal').classList.remove('open');
  },

  // ── Payment Modal ─────────────────────────────────────────────
  _currentPaymentId: null,

  openPaymentModal(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    this._currentPaymentId = id;

    document.getElementById('payment-modal-body').innerHTML = `
      <div class="summary-box mb-4">
        <div class="summary-box-row">
          <span>الإجمالي</span>
          <span><strong>${Utils.formatCurrency(o.totalAmount)}</strong></span>
        </div>
        <div class="summary-box-row">
          <span>المدفوع حتى الآن</span>
          <span style="color:var(--success)">${Utils.formatCurrency(o.paidAmount)}</span>
        </div>
        <div class="summary-box-row" style="border-top:2px solid var(--border-color);padding-top:var(--space-3)">
          <span><strong>المتبقي</strong></span>
          <span><strong style="color:var(--danger);font-size:var(--text-lg)">${Utils.formatCurrency(o.remaining)}</strong></span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">المبلغ المدفوع الآن <span class="required">*</span></label>
        <input type="number" id="payment-amount" class="form-control"
          placeholder="0" min="0" max="${o.remaining}"
          value="${o.remaining}" oninput="Orders._previewPayment('${o.id}')">
      </div>
      <div id="payment-preview" class="summary-box" style="margin-top:var(--space-3);display:none">
        <div class="summary-box-row">
          <span>سيصبح المدفوع</span>
          <span id="preview-paid" style="color:var(--success);font-weight:bold"></span>
        </div>
        <div class="summary-box-row">
          <span>سيصبح المتبقي</span>
          <span id="preview-remaining" style="font-weight:bold"></span>
        </div>
      </div>
    `;
    document.getElementById('payment-modal').classList.add('open');
    document.getElementById('payment-amount').focus();
    this._previewPayment(id);
  },

  _previewPayment(id) {
    const o = DB.getOrder(id || this._currentPaymentId);
    if (!o) return;
    const added     = parseFloat(document.getElementById('payment-amount')?.value) || 0;
    const newPaid   = Math.min(o.paidAmount + added, o.totalAmount);
    const newRemain = DB.calculateOrderRemaining(o.totalAmount, newPaid);
    const preview   = document.getElementById('payment-preview');
    if (!preview) return;
    preview.style.display = 'block';
    document.getElementById('preview-paid').textContent      = Utils.formatCurrency(newPaid);
    const remEl = document.getElementById('preview-remaining');
    remEl.textContent  = Utils.formatCurrency(newRemain);
    remEl.style.color  = newRemain === 0 ? 'var(--success)' : 'var(--danger)';
    remEl.textContent  = newRemain === 0 ? '✔ مسدد بالكامل' : Utils.formatCurrency(newRemain);
  },

  savePayment() {
    const o = DB.getOrder(this._currentPaymentId);
    if (!o) return;
    const added = parseFloat(document.getElementById('payment-amount').value) || 0;
    if (added <= 0) { Utils.toast('أدخل مبلغاً صحيحاً', 'error'); return; }

    const newPaid    = Math.min(o.paidAmount + added, o.totalAmount);
    const newRemain  = DB.calculateOrderRemaining(o.totalAmount, newPaid);
    DB.updateOrder(this._currentPaymentId, { paidAmount: newPaid, remaining: newRemain });

    const msg = newRemain === 0
      ? '✅ تم تسديد المبلغ كاملاً!'
      : `تم تسجيل الدفعة ✅ المتبقي: ${Utils.formatCurrency(newRemain)}`;
    Utils.toast(msg);
    this.closePaymentModal();
    this.applyFilters();
  },

  closePaymentModal() {
    this._currentPaymentId = null;
    document.getElementById('payment-modal').classList.remove('open');
  },
};
