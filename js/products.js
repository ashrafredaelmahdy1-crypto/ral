/**
 * products.js - Products Management Page
 */

const Products = {
  render() {
    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>إدارة المنتجات</h1>
          <p>إضافة وتعديل وحذف المنتجات</p>
        </div>
        <button class="btn btn-primary" onclick="Products.openAddModal()">➕ منتج جديد</button>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">قائمة المنتجات</span>
          <span class="badge badge-new" id="products-count">0 منتج</span>
        </div>
        <div class="table-wrapper">
          <table class="table" id="products-table">
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>النوع</th>
                <th>سعر البيع</th>
                <th>المقاس</th>
                <th>اللون</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody id="products-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" id="product-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="product-modal-title">إضافة منتج جديد</h3>
            <button class="modal-close" onclick="Products.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="edit-product-id">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">اسم المنتج <span class="required">*</span></label>
                <input type="text" id="p-name" class="form-control" placeholder="اسم المنتج">
              </div>
              <div class="form-group">
                <label class="form-label">نوع المنتج</label>
                <select id="p-type" class="form-control" onchange="
                  var c=document.getElementById('p-type-custom');
                  if(this.value==='__new__'){c.style.display='';c.focus();}
                  else{c.style.display='none';c.value='';}
                ">
                  <option value="">-- اختر النوع --</option>
                
                  <option value="__new__">➕ إضافة نوع جديد</option>
                </select>
                <input type="text" id="p-type-custom" class="form-control mt-2"
                  placeholder="اكتب نوع المنتج الجديد..."
                  style="display:none">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">سعر البيع (ج.م) <span class="required">*</span></label>
                <input type="number" id="p-price" class="form-control" placeholder="0" min="0">
              </div>

              <div class="form-group">
                <label class="form-label">المقاس</label>
                <input type="text" id="p-size" class="form-control" placeholder="S / M / L / XL">
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">اللون</label>
                <input type="text" id="p-color" class="form-control" placeholder="">
              </div>
              <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea id="p-notes" class="form-control" rows="2" placeholder="أي تفاصيل إضافية..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Products.closeModal()">إلغاء</button>
            <button class="btn btn-primary" onclick="Products.save()">💾 حفظ المنتج</button>
          </div>
        </div>
      </div>
    `);
    this.loadTable();
  },

  loadTable() {
    const products = DB.getProducts();
    const count = document.getElementById('products-count');
    if (count) count.textContent = `${products.length} منتج`;
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📦</div><h3>لا توجد منتجات</h3><p>أضف منتجاتك لتظهر في نماذج الطلبات</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => {
      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.type || '—'}</td>
          <td><strong style="color:var(--primary)">${Utils.formatCurrency(p.price)}</strong></td>
          <td>${p.size || '—'}</td>
          <td>${p.color || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="Products.openEditModal('${p.id}')">✏️ تعديل</button>
              <button class="btn btn-danger btn-sm" onclick="Products.delete('${p.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  openAddModal() {
    document.getElementById('product-modal-title').textContent = 'إضافة منتج جديد';
    document.getElementById('edit-product-id').value = '';
    ['name','price','size','color','notes'].forEach(f => {
      const el = document.getElementById(`p-${f}`);
      if (el) el.value = '';
    });
    document.getElementById('p-type').value = '';
    document.getElementById('p-type-custom').style.display = 'none';
    document.getElementById('p-type-custom').value = '';
    document.getElementById('product-modal').classList.add('open');
  },

  openEditModal(id) {
    const p = DB.getProduct(id);
    if (!p) return;
    document.getElementById('product-modal-title').textContent = 'تعديل المنتج';
    document.getElementById('edit-product-id').value = id;
    document.getElementById('p-name').value  = p.name;

    document.getElementById('p-price').value = p.price;
    document.getElementById('p-size').value  = p.size;
    document.getElementById('p-color').value = p.color;
    document.getElementById('p-notes').value = p.notes;

    // Handle type: if it matches a preset show it, otherwise show custom input
    const presets = ['بالطو طبي', 'Scrubs', 'مج', 'استيكر'];
    const typeEl   = document.getElementById('p-type');
    const customEl = document.getElementById('p-type-custom');
    if (presets.includes(p.type)) {
      typeEl.value         = p.type;
      customEl.style.display = 'none';
      customEl.value       = '';
    } else if (p.type) {
      typeEl.value         = '__new__';
      customEl.style.display = '';
      customEl.value       = p.type;
    } else {
      typeEl.value         = '';
      customEl.style.display = 'none';
      customEl.value       = '';
    }
    document.getElementById('product-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('product-modal').classList.remove('open');
  },

  save() {
    const name      = document.getElementById('p-name').value.trim();
    const price     = parseFloat(document.getElementById('p-price').value);


    // Resolve type: preset or custom
    const typeSelect = document.getElementById('p-type').value;
    const type = typeSelect === '__new__'
      ? document.getElementById('p-type-custom').value.trim()
      : typeSelect;

    if (!name) {
      Utils.toast('اسم المنتج مطلوب', 'error');
      return;
    }
    const data = {
      name,
      type,
      price:     isNaN(price) ? 0 : price,

      size:      document.getElementById('p-size').value.trim(),
      color:     document.getElementById('p-color').value.trim(),
      notes:     document.getElementById('p-notes').value.trim(),
    };
    const editId = document.getElementById('edit-product-id').value;
    if (editId) {
      DB.updateProduct(editId, data);
      Utils.toast('تم تحديث المنتج ✅');
    } else {
      DB.addProduct(data);
      Utils.toast('تم إضافة المنتج بنجاح ✅');
    }
    this.closeModal();
    this.loadTable();
  },

  delete(id) {
    Utils.confirm('حذف هذا المنتج؟', () => {
      DB.deleteProduct(id);
      Utils.toast('تم حذف المنتج', 'info');
      this.loadTable();
    });
  },
};
