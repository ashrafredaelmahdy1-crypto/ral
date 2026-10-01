/**
 * utils.js - Shared Utility Functions
 */

const Utils = {
  // ─── Format currency ──────────────────────────────────────
  formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0) + ' ج.م';
  },

  // ─── Format date ──────────────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
      }).format(new Date(dateStr));
    } catch { return dateStr; }
  },

  // ─── Today's date as YYYY-MM-DD ──────────────────────────
  today() {
    return new Date().toISOString().split('T')[0];
  },

  // ─── Status translation & badge ───────────────────────────
  statusLabel(status) {
    const map = {
      new:        'جديد',
      confirmed:  'مؤكد',
      production: 'قيد التنفيذ',
      done:       'تم التنفيذ',
      shipping:   'جاهز للشحن',
      shipped:    'تم الشحن',
      cancelled:  'ملغي',
    };
    return map[status] || status;
  },

  statusBadge(status) {
    const classMap = {
      new:        'badge-new',
      confirmed:  'badge-confirmed',
      production: 'badge-production',
      done:       'badge-done',
      shipping:   'badge-shipping',
      shipped:    'badge-shipped',
      cancelled:  'badge-cancelled',
    };
    return `<span class="badge ${classMap[status] || ''}">${this.statusLabel(status)}</span>`;
  },

  // ─── Platform badge ───────────────────────────────────────
  platformLabel(p) {
    const map = { whatsapp: 'واتساب', instagram: 'إنستجرام', facebook: 'فيسبوك', other: 'أخرى' };
    return map[p] || p;
  },

  platformBadge(platform) {
    const classMap = {
      whatsapp:  'platform-wa',
      instagram: 'platform-ig',
      facebook:  'platform-fb',
      other:     'platform-oth',
    };
    const icons = {
      whatsapp:  '💬',
      instagram: '📸',
      facebook:  '👍',
      other:     '📦',
    };
    return `<span class="badge ${classMap[platform] || 'platform-oth'}">${icons[platform] || '📦'} ${this.platformLabel(platform)}</span>`;
  },

  // ─── Toast notifications ──────────────────────────────────
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  // ─── Confirm dialog ───────────────────────────────────────
  confirm(message, onConfirm) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal confirm-dialog">
        <div class="modal-header">
          <h3 class="modal-title">تأكيد العملية</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--gray-700)">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="confirm-cancel">إلغاء</button>
          <button class="btn btn-danger" id="confirm-ok">تأكيد</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector('#confirm-cancel').onclick = () => backdrop.remove();
    backdrop.querySelector('#confirm-ok').onclick = () => {
      backdrop.remove();
      onConfirm();
    };
  },

  // ─── Render main content ─────────────────────────────────
  renderPage(html) {
    document.getElementById('page-content').innerHTML = html;
  },

  // ─── Products dropdown options ───────────────────────────
  productOptions() {
    const products = DB.getProducts();
    if (!products.length) return '<option value="">-- لا توجد منتجات --</option>';
    return products.map(p =>
      `<option value="${p.name}" data-price="${p.price}">${p.name}${p.size ? ' - ' + p.size : ''}${p.color ? ' - ' + p.color : ''}</option>`
    ).join('');
  },
};
