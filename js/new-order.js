/**
 * new-order.js - New Order Form
 */

const NewOrder = {
  itemCount: 0,
  editId: null,

  render(prefillCustomerId = null, editId = null) {
    editId = editId || this.editId;
    const editingOrder = editId ? DB.getOrder(editId) : null;
    if (editId && !editingOrder) {
      Utils.toast('الطلب غير موجود', 'error');
      Router.navigate('orders');
      return;
    }
    this.editId = editId;
    const customers = DB.getCustomers();
    const customerOptions = customers.map(c =>
      `<option value="${c.id}" data-code="${c.code}" data-phone="${c.phone}" data-address="${c.address}">${c.name} (${c.code})</option>`
    ).join('');

    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>${editingOrder ? 'تعديل الطلب' : 'إضافة طلب جديد'}</h1>
          <p>${editingOrder ? `تعديل بيانات الطلب ${editingOrder.number}` : 'أدخل تفاصيل الطلب الجديد'}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 بيانات الطلب</span>
        </div>
        <div class="card-body">

          <!-- Customer Section -->
          <p class="section-title">بيانات العميل</p>
          <div class="form-row-3">
            <div class="form-group" style="grid-column: span 1">
              <label class="form-label">العميل <span class="required">*</span></label>
              <select id="o-customer" class="form-control" onchange="NewOrder.onCustomerChange()">
                <option value="">-- اختر العميل --</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">كود العميل</label>
              <input type="text" id="o-customer-code" class="form-control" placeholder="CUS-0001" readonly style="background:var(--gray-50)">
            </div>
            <div class="form-group">
              <label class="form-label">رقم الهاتف</label>
              <input type="tel" id="o-phone" class="form-control" placeholder="01xxxxxxxxx">
            </div>
          </div>

          <!-- Order Details -->
          <p class="section-title">تفاصيل الطلب</p>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">منصة الطلب</label>
              <select id="o-platform" class="form-control">
                <option value="whatsapp">💬 واتساب</option>
                <option value="instagram">📸 إنستجرام</option>
                <option value="facebook">👍 فيسبوك</option>
                <option value="other">📦 أخرى</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">تاريخ الطلب</label>
              <input type="date" id="o-date" class="form-control" value="${Utils.today()}">
            </div>
            <div class="form-group">
              <label class="form-label">عنوان التسليم</label>
              <input type="text" id="o-address" class="form-control" placeholder="العنوان الكامل">
            </div>
          </div>

          <!-- Products -->
          <p class="section-title">المنتجات</p>
          <div id="order-items-container"></div>
          <button class="btn btn-ghost btn-sm" onclick="NewOrder.addItem()" style="margin-bottom:var(--space-4)">
            ➕ إضافة منتج
          </button>

          <!-- Financial Summary -->
          <p class="section-title">الملخص المالي</p>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">الخصم (ج.م)</label>
              <input type="number" id="o-discount" class="form-control" value="0" min="0" oninput="NewOrder.recalc()">
            </div>
            <div class="form-group">
              <label class="form-label">تكلفة الشحن (ج.م)</label>
              <input type="number" id="o-shipping" class="form-control" value="0" min="0" oninput="NewOrder.recalc()">
            </div>
            <div class="form-group">
              <label class="form-label">المبلغ المدفوع (ج.م)</label>
              <input type="number" id="o-paid" class="form-control" value="0" min="0" oninput="NewOrder.recalc()">
            </div>
          </div>

          <!-- Total Bar -->
          <div class="order-total-bar">
            <div class="order-total-item">
              <label>المجموع الفرعي</label>
              <span id="o-subtotal">0 ج.م</span>
            </div>
            <div class="order-total-item">
              <label>الخصم</label>
              <span id="o-discount-display" style="color:var(--danger)">0 ج.م</span>
            </div>
            <div class="order-total-item">
              <label>الشحن</label>
              <span id="o-shipping-display">0 ج.م</span>
            </div>
            <div class="order-total-item">
              <label>الإجمالي</label>
              <span id="o-total" style="font-size:1.4rem">0 ج.م</span>
            </div>
            <div class="order-total-item">
              <label>المتبقي</label>
              <span id="o-remaining" class="profit">0 ج.م</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group mt-4">
            <label class="form-label">ملاحظات</label>
            <textarea id="o-notes" class="form-control" rows="3" placeholder="أي ملاحظات على الطلب..."></textarea>
          </div>
        </div>

        <div class="card-footer" style="display:flex;justify-content:flex-end;gap:var(--space-3)">
          <button class="btn btn-ghost" onclick="NewOrder.editId=null;Router.navigate('orders')">إلغاء</button>
          <button class="btn btn-primary btn-lg" onclick="NewOrder.save()">
            💾 ${editingOrder ? 'تحديث الطلب' : 'حفظ الطلب'}
          </button>
        </div>
      </div>
    `);

    this.itemCount = 0;
    this.addItem();

    if (editingOrder) {
      this.loadOrder(editingOrder);
    } else if (prefillCustomerId) {
      const sel = document.getElementById('o-customer');
      if (sel) {
        sel.value = prefillCustomerId;
        this.onCustomerChange();
      }
    }
  },

  loadOrder(order) {
    const customer = document.getElementById('o-customer');
    customer.value = order.customerId;
    document.getElementById('o-customer-code').value = order.customerCode || '';
    document.getElementById('o-phone').value = order.phone || '';
    document.getElementById('o-platform').value = order.platform || 'other';
    document.getElementById('o-date').value = order.date || Utils.today();
    document.getElementById('o-address').value = order.address || '';
    document.getElementById('o-discount').value = order.discount || 0;
    document.getElementById('o-shipping').value = order.shippingCost || 0;
    document.getElementById('o-paid').value = order.paidAmount || 0;
    document.getElementById('o-notes').value = order.notes || '';

    const container = document.getElementById('order-items-container');
    container.innerHTML = '';
    this.itemCount = 0;
    (order.items || []).forEach(item => {
      this.addItem();
      const row = container.lastElementChild;
      const select = row.querySelector('.item-product');
      const nameInput = row.querySelector('.item-product-name');
      const option = Array.from(select.options).find(option => option.value === item.productName);
      if (option) {
        select.value = item.productName;
      } else {
        select.value = '__custom__';
        nameInput.style.display = '';
        nameInput.value = item.productName;
      }
      row.querySelector('.item-qty').value = item.qty || 1;
      row.querySelector('.item-price').value = item.price || 0;
      row.querySelector('.item-disc').value = item.discount || 0;
    });
    this.recalc();
  },

  onCustomerChange() {
    const sel = document.getElementById('o-customer');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('o-customer-code').value = opt?.dataset?.code || '';
    document.getElementById('o-phone').value         = opt?.dataset?.phone || '';
    document.getElementById('o-address').value       = opt?.dataset?.address || '';
  },

  addItem() {
    const idx = ++this.itemCount;
    const container = document.getElementById('order-items-container');
    const div = document.createElement('div');
    div.className = 'product-item-row';
    div.id = `item-${idx}`;
    div.innerHTML = `
      <div class="form-group">
        <label class="form-label">المنتج</label>
        <select class="form-control item-product" onchange="NewOrder.onProductSelect(this, ${idx})">
          <option value="">-- اختر أو اكتب --</option>
          ${Utils.productOptions()}
          <option value="__custom__">✏️ إدخال يدوي</option>
        </select>
        <input type="text" class="form-control item-product-name mt-2" placeholder="اسم المنتج يدوياً" style="display:none">
      </div>
      <div class="form-group">
        <label class="form-label">الكمية</label>
        <input type="number" class="form-control item-qty" value="1" min="1" oninput="NewOrder.recalc()">
      </div>
      <div class="form-group">
        <label class="form-label">سعر البيع</label>
        <input type="number" class="form-control item-price" value="0" min="0" oninput="NewOrder.recalc()">
      </div>

      <div class="form-group">
        <label class="form-label">خصم المنتج</label>
        <input type="number" class="form-control item-disc" value="0" min="0" oninput="NewOrder.recalc()">
      </div>
      <div style="padding-top:1.6rem">
        <button class="btn btn-danger btn-icon btn-sm" onclick="NewOrder.removeItem(${idx})" title="حذف">🗑️</button>
      </div>
    `;
    container.appendChild(div);
    this.recalc();
  },


  onProductSelect(sel, idx) {
    const nameInput  = sel.closest('.product-item-row').querySelector('.item-product-name');
    const priceInput = sel.closest('.product-item-row').querySelector('.item-price');
    if (sel.value === '__custom__') {
      nameInput.style.display = '';
      nameInput.focus();
    } else {
      nameInput.style.display = 'none';
      nameInput.value = '';
      const opt   = sel.options[sel.selectedIndex];
      const price = parseFloat(opt?.dataset?.price || 0);
      if (price) priceInput.value = price;
    }
    this.recalc();
  },


  removeItem(idx) {
    const el = document.getElementById(`item-${idx}`);
    if (el) el.remove();
    this.recalc();
  },

  getItems() {
    const rows = document.querySelectorAll('.product-item-row');
    return Array.from(rows).map(row => {
      const sel      = row.querySelector('.item-product');
      const nameInp  = row.querySelector('.item-product-name');
      let productName = '';
      if (sel.value === '__custom__') {
        productName = nameInp.value.trim();
      } else {
        productName = sel.value;
      }
      return {
        productName,
        qty:       parseFloat(row.querySelector('.item-qty').value) || 1,
        price:     parseFloat(row.querySelector('.item-price').value) || 0,
        discount:  parseFloat(row.querySelector('.item-disc').value) || 0,
      };
    }).filter(i => i.productName);
  },

  recalc() {
    const items    = this.getItems();
    const subtotal = items.reduce((s, i) => s + (i.qty * i.price - i.discount), 0);
    const discount = parseFloat(document.getElementById('o-discount')?.value) || 0;
    const shipping = parseFloat(document.getElementById('o-shipping')?.value) || 0;
    const paid     = parseFloat(document.getElementById('o-paid')?.value) || 0;
    const total    = subtotal - discount + shipping;
    const remaining = DB.calculateOrderRemaining(total, paid);

    const fmt = v => Utils.formatCurrency(v);
    const s = id => document.getElementById(id);
    if (s('o-subtotal'))         s('o-subtotal').textContent         = fmt(subtotal);
    if (s('o-discount-display')) s('o-discount-display').textContent = fmt(discount);
    if (s('o-shipping-display')) s('o-shipping-display').textContent = fmt(shipping);
    if (s('o-total'))            s('o-total').textContent            = fmt(total);
    if (s('o-remaining'))        s('o-remaining').textContent        = fmt(remaining);
  },

  save() {
    const customerId = document.getElementById('o-customer').value;
    const customerOpt = document.getElementById('o-customer').options[document.getElementById('o-customer').selectedIndex];
    if (!customerId) {
      Utils.toast('يرجى اختيار العميل', 'error');
      return;
    }
    const items = this.getItems();
    if (!items.length) {
      Utils.toast('يرجى إضافة منتج واحد على الأقل', 'error');
      return;
    }
    const subtotal = items.reduce((s, i) => s + (i.qty * i.price - i.discount), 0);
    const discount = parseFloat(document.getElementById('o-discount').value) || 0;
    const shipping = parseFloat(document.getElementById('o-shipping').value) || 0;
    const paid     = parseFloat(document.getElementById('o-paid').value) || 0;
    const total    = subtotal - discount + shipping;
    const remaining = DB.calculateOrderRemaining(total, paid);

    const orderData = {
      customerId,
      customerName: customerOpt.text.split(' (')[0],
      customerCode: document.getElementById('o-customer-code').value,
      phone:        document.getElementById('o-phone').value,
      platform:     document.getElementById('o-platform').value,
      date:         document.getElementById('o-date').value,
      address:      document.getElementById('o-address').value,
      items,
      subtotal,
      discount,
      shippingCost: shipping,
      totalAmount:  total,
      paidAmount:   paid,
      remaining,
      notes:        document.getElementById('o-notes').value.trim(),
    };
    const order = this.editId
      ? DB.updateOrder(this.editId, orderData)
      : DB.addOrder(orderData);

    Utils.toast(`✅ تم ${this.editId ? 'تحديث' : 'إنشاء'} الطلب ${order.number} بنجاح`);
    this.editId = null;
    Router.navigate('orders');
  },
};
