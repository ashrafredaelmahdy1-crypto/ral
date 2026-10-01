/**
 * customers.js - Customers Page
 */

const Customers = {
  render() {
    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>إدارة العملاء</h1>
          <p>إضافة وتعديل وعرض بيانات العملاء</p>
        </div>
        <button class="btn btn-primary" onclick="Customers.openAddModal()">
          ➕ عميل جديد
        </button>
      </div>

      <!-- Search Bar -->
      <div class="card mb-4">
        <div class="card-body" style="padding:var(--space-4)">
          <div class="search-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="customer-search" class="form-control search-input"
                placeholder="ابحث بالاسم أو الهاتف أو الكود..."
                oninput="Customers.search(this.value)">
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">قائمة العملاء</span>
          <span class="badge badge-new" id="customers-count">0 عميل</span>
        </div>
        <div class="table-wrapper">
          <table class="table" id="customers-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>المحافظة</th>
                <th>المدينة</th>
                <th>الطلبات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody id="customers-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" id="customer-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="customer-modal-title">إضافة عميل جديد</h3>
            <button class="modal-close" onclick="Customers.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="edit-customer-id">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">الاسم <span class="required">*</span></label>
                <input type="text" id="c-name" class="form-control" placeholder="الاسم الكامل">
              </div>
              <div class="form-group">
                <label class="form-label">رقم الهاتف <span class="required">*</span></label>
                <input type="tel" id="c-phone" class="form-control" placeholder="01xxxxxxxxx">
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">المحافظة</label>
                <input type="text" id="c-gov" class="form-control" placeholder=" ">
              </div>
              <div class="form-group">
                <label class="form-label">المدينة</label>
                <input type="text" id="c-city" class="form-control" placeholder=" ">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">العنوان التفصيلي</label>
              <input type="text" id="c-address" class="form-control" placeholder="الشارع والمبنى والشقة">
            </div>
            <div class="form-group">
              <label class="form-label">ملاحظات</label>
              <textarea id="c-notes" class="form-control" rows="3" placeholder="أي ملاحظات إضافية..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Customers.closeModal()">إلغاء</button>
            <button class="btn btn-primary" onclick="Customers.save()">💾 حفظ العميل</button>
          </div>
        </div>
      </div>

      <!-- Orders History Modal -->
      <div class="modal-backdrop" id="customer-orders-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" id="co-modal-title">طلبات العميل</h3>
            <button class="modal-close" onclick="Customers.closeOrdersModal()">✕</button>
          </div>
          <div class="modal-body" id="co-modal-body"></div>
        </div>
      </div>
    `);
    this.loadTable(DB.getCustomers());
  },

  loadTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    const count = document.getElementById('customers-count');
    if (count) count.textContent = `${customers.length} عميل`;
    if (!tbody) return;
    if (!customers.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><h3>لا يوجد عملاء</h3><p>اضغط "عميل جديد" لإضافة أول عميل</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = customers.map(c => {
      const orderCount = DB.getOrdersByCustomer(c.id).length;
      return `
        <tr>
          <td><span class="customer-code-badge">${c.code}</span></td>
          <td><strong>${c.name}</strong></td>
          <td dir="ltr">${c.phone}</td>
          <td>${c.governorate || '—'}</td>
          <td>${c.city || '—'}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="Customers.viewOrders('${c.id}')">
              📋 ${orderCount} طلب
            </button>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="Customers.openEditModal('${c.id}')">✏️ تعديل</button>
              <button class="btn btn-danger btn-sm" onclick="Customers.delete('${c.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  search(query) {
    this.loadTable(DB.searchCustomers(query));
  },

  openAddModal() {
    document.getElementById('customer-modal-title').textContent = 'إضافة عميل جديد';
    document.getElementById('edit-customer-id').value = '';
    ['name','phone','gov','city','address','notes'].forEach(f => {
      const el = document.getElementById(`c-${f}`);
      if (el) el.value = '';
    });
    document.getElementById('customer-modal').classList.add('open');
  },

  openEditModal(id) {
    const c = DB.getCustomer(id);
    if (!c) return;
    document.getElementById('customer-modal-title').textContent = 'تعديل بيانات العميل';
    document.getElementById('edit-customer-id').value = id;
    document.getElementById('c-name').value    = c.name;
    document.getElementById('c-phone').value   = c.phone;
    document.getElementById('c-gov').value     = c.governorate;
    document.getElementById('c-city').value    = c.city;
    document.getElementById('c-address').value = c.address;
    document.getElementById('c-notes').value   = c.notes;
    document.getElementById('customer-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('customer-modal').classList.remove('open');
  },

  save() {
    const name  = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    if (!name || !phone) {
      Utils.toast('الاسم ورقم الهاتف مطلوبان', 'error');
      return;
    }
    const data = {
      name,
      phone,
      governorate: document.getElementById('c-gov').value.trim(),
      city:        document.getElementById('c-city').value.trim(),
      address:     document.getElementById('c-address').value.trim(),
      notes:       document.getElementById('c-notes').value.trim(),
    };
    const editId = document.getElementById('edit-customer-id').value;
    if (editId) {
      DB.updateCustomer(editId, data);
      Utils.toast('تم تحديث بيانات العميل');
    } else {
      DB.addCustomer(data);
      Utils.toast('تم إضافة العميل بنجاح');
    }
    this.closeModal();
    this.loadTable(DB.getCustomers());
  },

  delete(id) {
    Utils.confirm('هل أنت متأكد من حذف هذا العميل؟', () => {
      DB.deleteCustomer(id);
      Utils.toast('تم حذف العميل', 'info');
      this.loadTable(DB.getCustomers());
    });
  },

  viewOrders(customerId) {
    const c = DB.getCustomer(customerId);
    const orders = DB.getOrdersByCustomer(customerId);
    const modal = document.getElementById('customer-orders-modal');
    document.getElementById('co-modal-title').textContent = `طلبات: ${c?.name || ''}`;
    document.getElementById('co-modal-body').innerHTML = orders.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">📋</div><h3>لا توجد طلبات لهذا العميل</h3></div>
    ` : `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>${o.number}</strong></td>
                <td>${Utils.formatDate(o.date)}</td>
                <td>${Utils.formatCurrency(o.totalAmount)}</td>
                <td>${Utils.statusBadge(o.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    modal.classList.add('open');
  },

  closeOrdersModal() {
    document.getElementById('customer-orders-modal').classList.remove('open');
  },
};
