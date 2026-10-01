/**
 * Dashboard.js - Dashboard Page
 */

const Dashboard = {
  render() {
    const stats = DB.getStats();
    const recentOrders = DB.filterOrders({}).slice(0, 6);

    Utils.renderPage(`
      <div class="page-header">
        <div class="page-header-title">
          <h1>مرحباً بك 👋</h1>
          <p>نظرة عامة على أداء البراند اليوم</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon blue">👥</div>
          <div class="kpi-info">
            <div class="kpi-value">${stats.totalCustomers}</div>
            <div class="kpi-label">إجمالي العملاء</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange">🆕</div>
          <div class="kpi-info">
            <div class="kpi-value">${stats.newOrders}</div>
            <div class="kpi-label">طلبات جديدة</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon teal">⚙️</div>
          <div class="kpi-info">
            <div class="kpi-value">${stats.inProduction}</div>
            <div class="kpi-label">قيد التنفيذ</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple">📦</div>
          <div class="kpi-info">
            <div class="kpi-value">${stats.readyToShip}</div>
            <div class="kpi-label">جاهزة للشحن</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green">💰</div>
          <div class="kpi-info">
            <div class="kpi-value" style="font-size:1.3rem">${Utils.formatCurrency(stats.totalSales)}</div>
            <div class="kpi-label">إجمالي المبيعات</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon red">📉</div>
          <div class="kpi-info">
            <div class="kpi-value" style="font-size:1.3rem">${Utils.formatCurrency(stats.totalCosts)}</div>
            <div class="kpi-label">إجمالي التكاليف</div>
          </div>
        </div>
        <div class="kpi-card" style="border-color: var(--success); background: var(--success-light);">
          <div class="kpi-icon green">✨</div>
          <div class="kpi-info">
            <div class="kpi-value" style="font-size:1.3rem; color: var(--success)">${Utils.formatCurrency(stats.netProfit)}</div>
            <div class="kpi-label">صافي الأرباح</div>
          </div>
        </div>
      </div>

      <!-- Recent Orders + Quick Actions -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 أحدث الطلبات</span>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('orders')">عرض الكل</button>
          </div>
          <div class="card-body">
            ${recentOrders.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>لا توجد طلبات بعد</h3>
                <p>ابدأ بإضافة أول طلب</p>
              </div>
            ` : `
              <div class="recent-orders-list">
                ${recentOrders.map(o => `
                  <div class="recent-order-item" style="cursor:pointer" onclick="Orders.openDetail('${o.id}')">
                    <div class="recent-order-num">${o.number}</div>
                    <div class="recent-order-customer">${o.customerName}</div>
                    ${Utils.statusBadge(o.status)}
                    <div class="recent-order-amount">${Utils.formatCurrency(o.totalAmount)}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">⚡ إجراءات سريعة</span>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              <button class="btn btn-primary btn-lg btn-block" onclick="Router.navigate('new-order')">
                ➕ إضافة طلب جديد
              </button>
              <button class="btn btn-accent btn-lg btn-block" onclick="Router.navigate('customers')">
                👤 إضافة عميل جديد
              </button>
              <button class="btn btn-outline btn-lg btn-block" onclick="Router.navigate('production')">
                ⚙️ متابعة التنفيذ
              </button>
              <button class="btn btn-ghost btn-lg btn-block" onclick="Router.navigate('shipping')">
                🚚 إدارة الشحن
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
  },
};
