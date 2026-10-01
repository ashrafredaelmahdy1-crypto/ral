/**
 * history.js - Order History Page
 */

const History = {
  render() {
    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>سجل الطلبات</h1>
          <p>جميع الطلبات والبحث والتصفية</p>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div class="card mb-4">
        <div class="card-body" style="padding:var(--space-4)">
          <div class="form-row">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="h-query" class="form-control search-input"
                placeholder="ابحث برقم الطلب أو العميل أو الهاتف..."
                oninput="History.applyFilters()">
            </div>
            <select id="h-status" class="form-control" onchange="History.applyFilters()">
              <option value="">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="confirmed">مؤكد</option>
              <option value="production">قيد التنفيذ</option>
              <option value="done">تم التنفيذ</option>
              <option value="shipping">جاهز للشحن</option>
              <option value="shipped">تم الشحن</option>
              <option value="cancelled">ملغي</option>
            </select>
            <select id="h-platform" class="form-control" onchange="History.applyFilters()">
              <option value="">كل المنصات</option>
              <option value="whatsapp">واتساب</option>
              <option value="instagram">إنستجرام</option>
              <option value="facebook">فيسبوك</option>
              <option value="other">أخرى</option>
            </select>
            <input type="date" id="h-from" class="form-control" placeholder="من تاريخ" onchange="History.applyFilters()">
            <input type="date" id="h-to" class="form-control" placeholder="إلى تاريخ" onchange="History.applyFilters()">
            <button class="btn btn-ghost btn-sm" onclick="History.resetFilters()">🔄 إعادة تعيين</button>
          </div>
        </div>
      </div>

      <!-- Results grouped by month -->
      <div id="history-container"></div>

      <!-- Detail Modal -->
      <div class="modal-backdrop" id="history-detail-modal">
        <div class="modal modal-xl">
          <div class="modal-header">
            <h3 class="modal-title" id="hist-modal-title">تفاصيل الطلب</h3>
            <button class="modal-close" onclick="History.closeDetail()">✕</button>
          </div>
          <div class="modal-body" id="hist-modal-body"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="History.closeDetail()">إغلاق</button>
          </div>
        </div>
      </div>
    `);
    this.applyFilters();
  },

  applyFilters() {
    const filters = {
      query:    document.getElementById('h-query')?.value || '',
      status:   document.getElementById('h-status')?.value || '',
      platform: document.getElementById('h-platform')?.value || '',
      dateFrom: document.getElementById('h-from')?.value || '',
      dateTo:   document.getElementById('h-to')?.value || '',
    };
    const orders = DB.filterOrders(filters);
    const count = document.getElementById('history-count');
    if (count) count.textContent = `${orders.length} طلب`;

    const container = document.getElementById('history-container');
    if (!container) return;

    if (!orders.length) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>لا توجد نتائج</h3>
            </div>
          </div>
        </div>`;
      return;
    }

    const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                       'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    const groups = {};
    orders.forEach(o => {
      const d   = new Date(o.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    container.innerHTML = sortedKeys.map((key, idx) => {
      const [year, month] = key.split('-');
      const monthName  = `${MONTHS_AR[parseInt(month) - 1]} ${year}`;
      const grp        = groups[key];
      const monthTotal = grp.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const isOpen     = idx === 0;

      const rows = grp.map(o => `
        <tr>
          <td><strong style="color:var(--primary)">${o.number}</strong></td>
          <td>
            <div>${o.customerName}</div>
            <div style="font-size:var(--text-xs);color:var(--gray-500)" dir="ltr">${o.phone}</div>
          </td>
          <td>${Utils.platformBadge(o.platform)}</td>
          <td>${Utils.formatDate(o.date)}</td>
          <td>${Utils.formatCurrency(o.totalAmount)}</td>
          <td>${Utils.statusBadge(o.status)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="History.openDetail('${o.id}')">👁️ عرض</button>
              <button class="btn btn-outline btn-sm" onclick="History.edit('${o.id}')">✏️ تعديل</button>
              <button class="btn btn-danger btn-sm" onclick="History.delete('${o.id}')">🗑️ حذف</button>
            </div>
          </td>
        </tr>
      `).join('');

      return `
        <div class="month-group card mb-4">
          <div class="month-group-header" onclick="History.toggleMonth('${key}')">
            <div class="month-group-title">
              <span class="month-icon">📅</span>
              <span class="month-name">${monthName}</span>
              <span class="badge badge-new">${grp.length} طلب</span>
            </div>
            <div class="month-group-summary">
              <span class="month-total">${Utils.formatCurrency(monthTotal)}</span>
              <span class="month-chevron ${isOpen ? 'open' : ''}" id="chev-${key}">▾</span>
            </div>
          </div>
          <div class="month-group-body ${isOpen ? 'open' : ''}" id="body-${key}">
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>المنصة</th>
                    <th>التاريخ</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>التفاصيل</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  toggleMonth(key) {
    const body = document.getElementById(`body-${key}`);
    const chev = document.getElementById(`chev-${key}`);
    if (!body) return;
    body.classList.toggle('open');
    chev.classList.toggle('open');
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


  resetFilters() {
    ['h-query','h-status','h-platform','h-from','h-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.applyFilters();
  },

  openDetail(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    document.getElementById('hist-modal-title').textContent = `طلب: ${o.number}`;
    document.getElementById('hist-modal-body').innerHTML = `
      <div class="detail-grid mb-6">
        <div class="detail-item"><label>رقم الطلب</label><p>${o.number}</p></div>
        <div class="detail-item"><label>العميل</label><p>${o.customerName} (${o.customerCode})</p></div>
        <div class="detail-item"><label>الهاتف</label><p dir="ltr">${o.phone}</p></div>
        <div class="detail-item"><label>المنصة</label><p>${Utils.platformBadge(o.platform)}</p></div>
        <div class="detail-item"><label>التاريخ</label><p>${Utils.formatDate(o.date)}</p></div>
        <div class="detail-item"><label>الحالة</label><p>${Utils.statusBadge(o.status)}</p></div>
        <div class="detail-item" style="grid-column:span 2"><label>العنوان</label><p>${o.address || '—'}</p></div>
      </div>

      <p class="section-title">المنتجات</p>
      <div class="table-wrapper mb-6">
        <table class="table">
          <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
          <tbody>
            ${(o.items || []).map(i => `
              <tr>
                <td>${i.productName}</td>
                <td>${i.qty}</td>
                <td>${Utils.formatCurrency(i.price)}</td>
                <td>${Utils.formatCurrency(i.discount)}</td>
                <td><strong>${Utils.formatCurrency(i.qty * i.price - i.discount)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
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
          ${o.costs?.length ? `
            <div class="card">
              <div class="card-header"><span class="card-title">💸 التكاليف والربح</span></div>
              <div class="card-body">
                ${o.costs.map(c => `
                  <div class="cost-row"><span>${c.label}</span><strong>${Utils.formatCurrency(c.amount)}</strong></div>
                `).join('')}
                <hr class="divider">
                <div class="cost-row" style="font-size:var(--text-base)">
                  <span><strong>إجمالي التكاليف:</strong></span>
                  <strong style="color:var(--danger)">${Utils.formatCurrency(o.totalCost)}</strong>
                </div>
                <div class="cost-row" style="font-size:var(--text-base)">
                  <span><strong>صافي الربح:</strong></span>
                  <strong style="color:${(o.profit||0)>=0?'var(--success)':'var(--danger)'}">${Utils.formatCurrency(o.profit)}</strong>
                </div>
              </div>
            </div>
          ` : '<div class="empty-state" style="padding:var(--space-6)"><p>لم يتم تسجيل تكاليف بعد</p></div>'}
          ${o.notes ? `
            <div class="card mt-4">
              <div class="card-header"><span class="card-title">📝 ملاحظات</span></div>
              <div class="card-body"><p>${o.notes}</p></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    document.getElementById('history-detail-modal').classList.add('open');
  },

  closeDetail() {
    document.getElementById('history-detail-modal').classList.remove('open');
  },
};
