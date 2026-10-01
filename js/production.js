/**
 * production.js - Production / Execution Page
 */

const Production = {
  render() {
    const orders = DB.filterOrders({ status: 'confirmed' }).concat(DB.filterOrders({ status: 'production' }));

    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>التنفيذ والإنتاج</h1>
          <p>الطلبات المؤكدة والجاري تنفيذها</p>
        </div>
        <span class="badge badge-production" style="padding:8px 16px;font-size:var(--text-sm)">
          ${orders.length} طلب نشط
        </span>
      </div>

      ${orders.length === 0 ? `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">⚙️</div>
              <h3>لا توجد طلبات قيد التنفيذ</h3>
              <p>بمجرد تأكيد الطلبات ستظهر هنا</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="production-grid" id="production-grid">
          ${orders.map(o => this._renderCard(o)).join('')}
        </div>
      `}
    `);
  },

  _renderCard(o) {
    const isInProd = o.status === 'production';
    const itemsHtml = (o.items || []).map(i => `
      <div class="production-product-item">
        <span>${i.productName}</span>
        <span class="badge badge-new">× ${i.qty}</span>
      </div>
    `).join('');

    return `
      <div class="production-card" id="prod-card-${o.id}">
        <div class="production-card-header">
          <div>
            <div style="font-weight:700;font-size:var(--text-lg)">${o.number}</div>
            <div style="font-size:var(--text-sm);opacity:0.8">${o.customerName}</div>
          </div>
          ${isInProd
            ? '<span class="badge badge-production">قيد التنفيذ</span>'
            : '<span class="badge badge-confirmed">مؤكد</span>'
          }
        </div>
        <div class="production-card-body">
          <div style="font-size:var(--text-xs);color:var(--gray-500);margin-bottom:var(--space-2)">
            📅 ${Utils.formatDate(o.date)}
          </div>
          <p class="section-title" style="margin-bottom:var(--space-2)">المنتجات</p>
          <div class="production-product-list">${itemsHtml}</div>
          ${o.notes ? `
            <div style="background:var(--warning-light);border-radius:var(--radius-sm);padding:var(--space-2) var(--space-3);font-size:var(--text-sm);color:var(--gray-700)">
              📝 ${o.notes}
            </div>
          ` : ''}
        </div>
        <div class="production-card-footer">
          ${!isInProd ? `
            <button class="btn btn-warning" style="flex:1" onclick="Production.startProduction('${o.id}')">
              ▶️ بدء التنفيذ
            </button>
          ` : `
            <button class="btn btn-success" style="flex:1" onclick="Production.markDone('${o.id}')">
              ✅ تم التنفيذ
            </button>
          `}
        </div>
      </div>
    `;
  },

  startProduction(id) {
    DB.updateOrderStatus(id, 'production');
    Utils.toast('تم بدء تنفيذ الطلب ▶️');
    this.render();
  },

  markDone(id) {
    Utils.confirm('تأكيد إتمام التنفيذ وإرسال الطلب للشحن؟', () => {
      DB.updateOrderStatus(id, 'done');
      Utils.toast('تم التنفيذ بنجاح! الطلب جاهز للشحن 📦');
      this.render();
    });
  },
};
