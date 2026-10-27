/**
 * Auth Manager for PromptVault SaaS
 * Handles JWT tokens, user sessions, and API request headers.
 */

const Auth = {
  TOKEN_KEY: 'pv_auth_token',
  USER_KEY: 'pv_auth_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  isPaid() {
    const user = this.getUser();
    return user && (user.status === 'active_paid' || user.role === 'admin');
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.reload();
  },

  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async fetchCurrentUser() {
    if (!this.getToken()) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { ...this.getAuthHeader() }
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        return data.user;
      } else {
        this.clearSession();
        return null;
      }
    } catch (e) {
      return this.getUser();
    }
  },

  updateNavbarAuthUI() {
    const container = document.getElementById('navAuthContainer');
    if (!container) return;

    const user = this.getUser();
    if (user) {
      const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
      const displayName = user.name || user.email.split('@')[0];
      
      let roleBadge = '';
      if (user.role === 'admin') {
        roleBadge = '<span class="user-role-badge role-admin">ADMIN</span>';
      } else if (user.status === 'active_paid') {
        roleBadge = '<span class="user-role-badge role-vip">⭐ VIP</span>';
      } else if (user.status === 'pending') {
        roleBadge = '<span class="user-role-badge role-pending">🕒 PENDING</span>';
      } else {
        roleBadge = '<span class="user-role-badge role-free">FREE</span>';
      }

      container.innerHTML = `
        <div class="nav-user-cluster">
          ${user.role === 'admin' ? `
            <a href="admin.html" class="nav-admin-btn" title="Open Creator & Admin Portal">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              <span>Admin Panel</span>
            </a>
          ` : `
            ${user.status !== 'active_paid' ? `
              <button onclick="openPricingModal()" class="btn btn-primary nav-vip-btn">
                ⭐ Upgrade VIP
              </button>
            ` : ''}
          `}
          
          <div class="user-profile-capsule" title="${user.email}">
            <div class="user-avatar-circle">${initial}</div>
            <div class="user-info-text">
              <span class="user-name-label">${displayName}</span>
              ${roleBadge}
            </div>
          </div>

          <button onclick="Auth.clearSession()" class="nav-logout-btn" title="Sign Out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="nav-guest-cluster">
          <a href="login.html" class="btn btn-secondary nav-login-btn">Sign In</a>
          <a href="login.html?tab=signup" class="btn btn-primary nav-signup-btn">Sign Up</a>
        </div>
      `;
    }
  }
};

window.Auth = Auth;
