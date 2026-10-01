/**
 * router.js - Simple hash-based SPA Router
 */

const Router = {
  routes: {},
  currentPage: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  },

  _handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const handler = this.routes[hash];
    if (handler) {
      this.currentPage = hash;
      handler();
      // Update sidebar active state
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === hash);
      });
      // Update topbar title
      const titleMap = {
        dashboard: { title: 'لوحة التحكم', sub: 'نظرة عامة على البراند' },
        customers: { title: 'العملاء', sub: 'إدارة بيانات العملاء' },
        orders:    { title: 'الطلبات', sub: 'جميع الطلبات وحالاتها' },
        'new-order': { title: 'إضافة طلب', sub: 'إنشاء طلب جديد' },
        production:  { title: 'التنفيذ', sub: 'الطلبات قيد التنفيذ' },
        accounting:  { title: 'الحسابات', sub: 'تكاليف وأرباح الطلبات' },
        shipping:    { title: 'الشحن', sub: 'الطلبات الجاهزة للشحن' },
        history:     { title: 'سجل الطلبات', sub: 'جميع الطلبات السابقة' },
        products:    { title: 'المنتجات', sub: 'إدارة المنتجات والأسعار' },
      };
      const info = titleMap[hash] || { title: '', sub: '' };
      const titleEl = document.getElementById('topbar-title');
      const subEl   = document.getElementById('topbar-subtitle');
      if (titleEl) titleEl.textContent = info.title;
      if (subEl)   subEl.textContent   = info.sub;
    } else {
      this.navigate('dashboard');
    }
  },
};
