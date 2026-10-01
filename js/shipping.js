/**
 * shipping.js - Shipping Page
 */

const Shipping = {
  render() {
    const orders = DB.filterOrders({ status: 'done' });

    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>الشحن</h1>
          <p>الطلبات الجاهزة للشحن</p>
        </div>
        <span class="badge badge-shipping" style="padding:8px 16px;font-size:var(--text-sm)">
          ${orders.length} طلب جاهز
        </span>
      </div>

      ${orders.length === 0 ? `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🚚</div>
              <h3>لا توجد طلبات جاهزة للشحن</h3>
              <p>الطلبات المنتهي تنفيذها ستظهر هنا تلقائياً</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="shipping-grid">
          ${orders.map(o => this._renderCard(o)).join('')}
        </div>
      `}
    `);
  },

  _renderCard(o) {
    return `
      <div class="shipping-card" id="ship-card-${o.id}">
        <div class="shipping-card-header">
          <div>
            <div style="font-weight:700;font-size:var(--text-lg)">${o.number}</div>
            <div style="font-size:var(--text-sm);opacity:0.8">${Utils.formatDate(o.date)}</div>
          </div>
          <span class="badge" style="background:rgba(255,255,255,0.2);color:white">جاهز</span>
        </div>
        <div class="card-body">
          <div class="shipping-info-row">
            <span class="shipping-info-label">👤 العميل</span>
            <span class="shipping-info-value">${o.customerName}</span>
          </div>
          <div class="shipping-info-row">
            <span class="shipping-info-label">📱 الهاتف</span>
            <span class="shipping-info-value" dir="ltr">${o.phone}</span>
          </div>
          <div class="shipping-info-row">
            <span class="shipping-info-label">📍 العنوان</span>
            <span class="shipping-info-value">${o.address || '—'}</span>
          </div>
          <div class="shipping-info-row">
            <span class="shipping-info-label">💰 المبلغ</span>
            <span class="shipping-info-value" style="color:var(--primary);font-weight:700">${Utils.formatCurrency(o.totalAmount)}</span>
          </div>
          <div class="shipping-info-row">
            <span class="shipping-info-label">🚚 تكلفة الشحن</span>
            <span class="shipping-info-value">${Utils.formatCurrency(o.shippingCost)}</span>
          </div>
          ${o.remaining > 0 ? `
            <div class="shipping-info-row">
              <span class="shipping-info-label">⚠️ المتبقي</span>
              <span class="shipping-info-value" style="color:var(--danger);font-weight:700">${Utils.formatCurrency(o.remaining)}</span>
            </div>
          ` : ''}
          ${o.notes ? `
            <div style="margin-top:var(--space-3);padding:var(--space-2) var(--space-3);background:var(--gray-50);border-radius:var(--radius-sm);font-size:var(--text-sm)">
              📝 ${o.notes}
            </div>
          ` : ''}
        </div>
        <div class="card-footer" style="display:flex;gap:var(--space-3)">
          <button class="btn btn-success" style="flex:1" onclick="Shipping.markShipped('${o.id}')">
            🚚 تم الشحن
          </button>
        </div>
      </div>
    `;
  },

  markShipped(id) {
    Utils.confirm('تأكيد شحن هذا الطلب؟', () => {
      DB.updateOrderStatus(id, 'shipped');
      Utils.toast('تم تسجيل الشحن بنجاح 🚚');
      this.render();
    });
  },
};
