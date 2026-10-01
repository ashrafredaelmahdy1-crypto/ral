/**
 * accounting.js - Accounting Page
 */

const Accounting = {
  COST_PRESETS: [
    'تكلفة القماش',
    'تكلفة التفصيل',
    'تكلفة الطباعة',
    'تكلفة التطريز',
    'تكلفة التغليف',
    'تكلفة إضافية',
  ],

  render() {
    const allOrders  = DB.filterOrders({}).filter(o => o.status !== 'cancelled');
    const expenses   = DB.getExpenses();

    const totalSales    = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalOrderCosts = allOrders.reduce((s, o) => {
      const manualCost = (o.costs || []).reduce((cs, c) => cs + (parseFloat(c.amount) || 0), 0);
      return s + manualCost + (o.shippingCost || 0);
    }, 0);
    const totalExpenses = expenses.reduce((s, e) => s + ((e.amount || 0) * (e.qty || 1)), 0);
    const totalCosts    = totalOrderCosts + totalExpenses;
    const netProfit     = totalSales - totalCosts;

    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>الحسابات</h1>
          <p>تسجيل التكاليف والمصروفات وحساب الأرباح</p>
        </div>
      </div>

      <!-- Summary -->
      <div class="accounting-summary">
        <div class="acc-sum-card">
          <div class="acc-sum-value" style="color:var(--primary)">${Utils.formatCurrency(totalSales)}</div>
          <div class="acc-sum-label">إجمالي المبيعات</div>
        </div>
        <div class="acc-sum-card">
          <div class="acc-sum-value" style="color:var(--danger)">${Utils.formatCurrency(totalCosts)}</div>
          <div class="acc-sum-label">إجمالي المصروفات</div>
        </div>
        <div class="acc-sum-card" style="border-color:var(--${netProfit >= 0 ? 'success' : 'danger'});background:var(--${netProfit >= 0 ? 'success' : 'danger'}-light)">
          <div class="acc-sum-value" style="color:var(--${netProfit >= 0 ? 'success' : 'danger'})">${Utils.formatCurrency(netProfit)}</div>
          <div class="acc-sum-label">صافي الأرباح</div>
        </div>
      </div>

      <!-- Expenses Section -->
      <div class="card mb-4">
        <div class="card-header">
          <span class="card-title">💸 سجل المصروفات</span>
          <button class="btn btn-primary btn-sm" onclick="Accounting.openExpenseModal()">➕ تسجيل مصروف</button>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>التاريخ</th>
                <th>الكمية</th>
                <th>المكان</th>
                <th>المبلغ (للوحدة)</th>
                <th>الإجمالي</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody id="expenses-tbody">
              ${this._renderExpensesRows(expenses)}
            </tbody>
          </table>
        </div>
        ${expenses.length > 0 ? `
          <div style="padding:var(--space-3) var(--space-5);text-align:left;border-top:1px solid var(--border-color)">
            <strong style="color:var(--danger)">إجمالي المصروفات: ${Utils.formatCurrency(totalExpenses)}</strong>
          </div>` : ''}
      </div>

      <!-- Cost Modal (for order costs) -->
      <div class="modal-backdrop" id="cost-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" id="cost-modal-title">تسجيل تكاليف الطلب</h3>
            <button class="modal-close" onclick="Accounting.closeCostModal()">✕</button>
          </div>
          <div class="modal-body" id="cost-modal-body"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Accounting.closeCostModal()">إلغاء</button>
            <button class="btn btn-primary" onclick="Accounting.saveCosts()">💾 حفظ التكاليف</button>
          </div>
        </div>
      </div>

      <!-- Expense Modal -->
      <div class="modal-backdrop" id="expense-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="expense-modal-title">تسجيل مصروف جديد</h3>
            <button class="modal-close" onclick="Accounting.closeExpenseModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="expense-edit-id">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">اسم المصروف <span class="required">*</span></label>
                <input type="text" id="exp-name" class="form-control" placeholder="مثال: قماش، طباعة، شحن...">
              </div>
              <div class="form-group">
                <label class="form-label">التاريخ <span class="required">*</span></label>
                <input type="date" id="exp-date" class="form-control">
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">الكمية</label>
                <input type="number" id="exp-qty" class="form-control" placeholder="1" min="1" value="1">
              </div>
              <div class="form-group">
                <label class="form-label">المبلغ (للوحدة) <span class="required">*</span></label>
                <input type="number" id="exp-amount" class="form-control" placeholder="0" min="0">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">المكان / المورد</label>
              <input type="text" id="exp-place" class="form-control" placeholder="مثال: محل القماش، شركة الشحن...">
            </div>
            <div class="form-group">
              <label class="form-label">ملاحظات</label>
              <textarea id="exp-notes" class="form-control" rows="2" placeholder="أي تفاصيل إضافية..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Accounting.closeExpenseModal()">إلغاء</button>
            <button class="btn btn-primary" id="expense-save-btn" onclick="Accounting.saveExpense()">💾 حفظ</button>
          </div>
        </div>
      </div>
    `);
  },

  _renderExpensesRows(expenses) {
    if (!expenses.length) {
      return `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">💸</div><h3>لا توجد مصروفات مسجلة</h3><p>اضغط "تسجيل مصروف" لإضافة أول مصروف</p></div></td></tr>`;
    }
    // Sort newest first
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.map(e => {
      const total = (e.amount || 0) * (e.qty || 1);
      return `
        <tr>
          <td><strong>${e.name}</strong></td>
          <td>${Utils.formatDate(e.date)}</td>
          <td>${e.qty || 1}</td>
          <td>${e.place || '—'}</td>
          <td>${Utils.formatCurrency(e.amount)}</td>
          <td><strong style="color:var(--danger)">${Utils.formatCurrency(total)}</strong></td>
          <td style="color:var(--gray-500);font-size:var(--text-sm)">${e.notes || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="Accounting.openExpenseModal('${e.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="Accounting.deleteExpense('${e.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ── Expense Modal ────────────────────────────────────────────
  openExpenseModal(id) {
    const isEdit = !!id;
    document.getElementById('expense-modal-title').textContent = isEdit ? 'تعديل المصروف' : 'تسجيل مصروف جديد';
    document.getElementById('expense-save-btn').textContent    = isEdit ? '💾 تحديث' : '💾 حفظ';
    document.getElementById('expense-edit-id').value = id || '';

    if (isEdit) {
      const e = DB.getExpenses().find(x => x.id === id);
      if (!e) return;
      document.getElementById('exp-name').value   = e.name;
      document.getElementById('exp-date').value   = e.date;
      document.getElementById('exp-qty').value    = e.qty || 1;
      document.getElementById('exp-amount').value = e.amount;
      document.getElementById('exp-place').value  = e.place || '';
      document.getElementById('exp-notes').value  = e.notes || '';
    } else {
      document.getElementById('exp-name').value   = '';
      document.getElementById('exp-date').value   = new Date().toISOString().split('T')[0];
      document.getElementById('exp-qty').value    = '1';
      document.getElementById('exp-amount').value = '';
      document.getElementById('exp-place').value  = '';
      document.getElementById('exp-notes').value  = '';
    }
    document.getElementById('expense-modal').classList.add('open');
    document.getElementById('exp-name').focus();
  },

  closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('open');
  },

  saveExpense() {
    const name   = document.getElementById('exp-name').value.trim();
    const date   = document.getElementById('exp-date').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);

    if (!name) { Utils.toast('اسم المصروف مطلوب', 'error'); return; }
    if (!date) { Utils.toast('التاريخ مطلوب', 'error'); return; }
    if (!amount || isNaN(amount)) { Utils.toast('المبلغ مطلوب', 'error'); return; }

    const data = {
      name,
      date,
      qty:    parseFloat(document.getElementById('exp-qty').value) || 1,
      amount,
      place:  document.getElementById('exp-place').value.trim(),
      notes:  document.getElementById('exp-notes').value.trim(),
    };

    const editId = document.getElementById('expense-edit-id').value;
    if (editId) {
      DB.updateExpense(editId, data);
      Utils.toast('تم تحديث المصروف ✅');
    } else {
      DB.addExpense(data);
      Utils.toast('تم تسجيل المصروف ✅');
    }
    this.closeExpenseModal();
    this.render();
  },

  deleteExpense(id) {
    Utils.confirm('حذف هذا المصروف؟', () => {
      DB.deleteExpense(id);
      Utils.toast('تم حذف المصروف', 'info');
      this.render();
    });
  },

  // ── Order Cost Modal ─────────────────────────────────────────
  _currentOrderId: null,

  openCostModal(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    this._currentOrderId = id;
    document.getElementById('cost-modal-title').textContent = `تكاليف الطلب: ${o.number}`;

    const existingCosts = o.costs || [];

    document.getElementById('cost-modal-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">
        <div>
          <p class="section-title">معلومات الطلب</p>
          <div class="summary-box" style="margin-bottom:var(--space-4)">
            <div class="summary-box-row"><span>إجمالي الإيراد</span><span><strong style="color:var(--primary)">${Utils.formatCurrency(o.totalAmount)}</strong></span></div>
            <div class="summary-box-row"><span>تكلفة الشحن (مشمولة)</span><span>${Utils.formatCurrency(o.shippingCost)}</span></div>
            <div class="summary-box-row"><span>خصم العميل (مشمول)</span><span>${Utils.formatCurrency(o.discount)}</span></div>
          </div>

          <p class="section-title">إضافة تكاليف</p>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${this.COST_PRESETS.map(preset => `
              <button class="btn btn-ghost btn-sm" style="justify-content:flex-start" onclick="Accounting.addCostRow('${preset}')">
                ➕ ${preset}
              </button>
            `).join('')}
            <button class="btn btn-ghost btn-sm" style="justify-content:flex-start;color:var(--accent)" onclick="Accounting.addCostRow('')">
              ✏️ تكلفة مخصصة
            </button>
          </div>
        </div>

        <div>
          <p class="section-title">التكاليف المسجلة</p>
          <div id="costs-list">
            ${existingCosts.map((c, i) => this._costRowHtml(i, c.label, c.amount)).join('')}
          </div>
          <hr class="divider">
          <div id="cost-profit-summary" style="font-size:var(--text-sm)"></div>
        </div>
      </div>
    `;

    this._recalcCostModal(o);
    document.getElementById('cost-modal').classList.add('open');
  },

  _costRowHtml(idx, label = '', amount = '') {
    return `
      <div class="cost-row" id="cost-row-${idx}" data-idx="${idx}">
        <input type="text" class="form-control cost-label" placeholder="اسم التكلفة" value="${label}" oninput="Accounting._recalcCostModal()">
        <input type="number" class="form-control cost-amount" placeholder="المبلغ" value="${amount}" min="0" oninput="Accounting._recalcCostModal()">
        <button class="btn btn-danger btn-icon btn-sm" onclick="this.closest('.cost-row').remove();Accounting._recalcCostModal()">🗑️</button>
      </div>
    `;
  },

  addCostRow(label) {
    const list = document.getElementById('costs-list');
    const idx  = list.children.length;
    list.insertAdjacentHTML('beforeend', this._costRowHtml(idx, label));
    this._recalcCostModal();
  },

  _recalcCostModal(order) {
    if (!order) order = DB.getOrder(this._currentOrderId);
    if (!order) return;
    const rows = document.querySelectorAll('#costs-list .cost-row');
    let totalCost = 0;
    rows.forEach(row => {
      totalCost += parseFloat(row.querySelector('.cost-amount').value) || 0;
    });
    const totalWithShipping = totalCost + (order.shippingCost || 0);
    const profit = (order.totalAmount || 0) - totalWithShipping;
    const profitColor = profit >= 0 ? 'var(--success)' : 'var(--danger)';
    const el = document.getElementById('cost-profit-summary');
    if (el) {
      el.innerHTML = `
        <div class="cost-row">
          <span>تكاليف التنفيذ:</span>
          <strong style="color:var(--danger)">${Utils.formatCurrency(totalCost)}</strong>
        </div>
        <div class="cost-row">
          <span>تكلفة الشحن:</span>
          <strong style="color:var(--gray-600)">${Utils.formatCurrency(order.shippingCost || 0)}</strong>
        </div>
        <div class="cost-row">
          <span>الخصم:</span>
          <strong style="color:var(--warning)">${Utils.formatCurrency(order.discount || 0)}</strong>
        </div>
        <div class="cost-row" style="border-top:2px solid var(--border-color);padding-top:var(--space-3);font-size:var(--text-base)">
          <span><strong>إجمالي التكاليف:</strong></span>
          <strong style="color:var(--danger)">${Utils.formatCurrency(totalWithShipping)}</strong>
        </div>
        <div class="cost-row" style="font-size:var(--text-base)">
          <span><strong>صافي الربح:</strong></span>
          <strong style="color:${profitColor}">${Utils.formatCurrency(profit)}</strong>
        </div>
      `;
    }
  },

  saveCosts() {
    const rows = document.querySelectorAll('#costs-list .cost-row');
    const costs = [];
    rows.forEach(row => {
      const label  = row.querySelector('.cost-label').value.trim();
      const amount = parseFloat(row.querySelector('.cost-amount').value) || 0;
      if (label) costs.push({ label, amount });
    });
    DB.updateOrderCosts(this._currentOrderId, costs);
    Utils.toast('تم حفظ التكاليف بنجاح ✅');
    this.closeCostModal();
    this.render();
  },

  closeCostModal() {
    this._currentOrderId = null;
    document.getElementById('cost-modal').classList.remove('open');
  },
};
