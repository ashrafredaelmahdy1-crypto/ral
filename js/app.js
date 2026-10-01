/**
 * app.js - Main Application Entry Point
 * Initializes the SPA: auth guard, sidebar, router, and page registration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── Auth Guard ──────────────────────────────────────────
  if (!Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // ─── One-time reset: wipe demo data on first launch ──────
  // The flag 'emera_v2_clean' is set after the first clear,
  // so real data added later is never touched.
  if (!localStorage.getItem('emera_v2_clean')) {
    DB.clearAll();
    localStorage.setItem('emera_v2_clean', '1');
  }

  // ─── Update live date in topbar ──────────────────────────
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date());
  }

  // ─── CEO celebration ────────────────────────────────────
  const ceoEl = document.getElementById('topbar-ceo');
  if (ceoEl) {
    ceoEl.addEventListener('click', () => {
      document.querySelector('.ceo-celebration')?.remove();

      const celebration = document.createElement('div');
      celebration.className = 'ceo-celebration';
      celebration.setAttribute('aria-hidden', 'true');

      const symbols = ['🌸', '🌷', '🌼', '🦋', '🦋', '🌺', '🦋', '🌻', '🌸', '🦋'];
      symbols.forEach((symbol, index) => {
        const element = document.createElement('span');
        element.className = symbol === '🦋' ? 'ceo-butterfly' : 'ceo-flower';
        element.textContent = symbol;
        element.style.setProperty('--delay', `${index * 90}ms`);
        element.style.setProperty('--x', `${8 + (index * 9) % 84}%`);
        element.style.setProperty('--drift', `${(index % 2 ? 1 : -1) * (20 + index * 4)}px`);
        celebration.appendChild(element);
      });

      document.body.appendChild(celebration);
      window.setTimeout(() => celebration.remove(), 3600);
    });
  }

  // ─── Sidebar toggle (mobile) ─────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);

  // ─── Sidebar nav clicks ──────────────────────────────────
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      Router.navigate(item.dataset.page);
      closeSidebar();
    });
  });

  // ─── Logout ───────────────────────────────────────────────
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Utils.confirm('هل تريد تسجيل الخروج؟', () => Auth.logout());
  });

  // ─── Register Pages ───────────────────────────────────────
  Router.register('dashboard',  () => Dashboard.render());
  Router.register('customers',  () => Customers.render());
  Router.register('orders',     () => Orders.render());
  Router.register('new-order',  () => NewOrder.render());
  Router.register('production', () => Production.render());
  Router.register('accounting', () => Accounting.render());
  Router.register('shipping',   () => Shipping.render());
  Router.register('history',    () => History.render());
  Router.register('products',   () => Products.render());

  // ─── Init Router ──────────────────────────────────────────
  Router.init();
});
