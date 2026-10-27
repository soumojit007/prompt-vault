/**
 * Admin Dashboard Controller
 * Handles user approvals by email, category creation, and prompt uploading.
 */

let allUsers = [];
let allCategories = [];
let allPrompts = [];
let currentUserFilter = 'all';

// Protect Admin Route
document.addEventListener('DOMContentLoaded', async () => {
  const user = Auth.getUser();
  if (!user || user.role !== 'admin') {
    alert('Access restricted to Administrators. Please sign in with your admin account.');
    window.location.href = 'login.html';
    return;
  }

  const badge = document.getElementById('adminEmailBadge');
  if (badge) badge.textContent = `${user.email} (Admin)`;

  await loadDashboardData();

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    switchAdminTab('prompts');
    setTimeout(() => editPromptItem(editId), 100);
  }
});

async function loadDashboardData() {
  await Promise.all([
    fetchStats(),
    fetchUsers(),
    fetchCategories(),
    fetchPrompts(),
    fetchPaymentSettings(),
    fetchGoogleSheetSettings(),
    fetchCommunitySubmissions()
  ]);
}

// Fetch Admin Stats
async function fetchStats() {
  try {
    const res = await fetch('/api/admin/stats', { headers: Auth.getAuthHeader() });
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('statTotalUsers').textContent = stats.totalUsers;
      document.getElementById('statPendingApprovals').textContent = stats.pendingApprovals;
      document.getElementById('statActivePaid').textContent = stats.activePaidUsers;
      document.getElementById('statTotalPrompts').textContent = stats.totalPrompts;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// USERS & APPROVALS MANAGEMENT
// ─────────────────────────────────────────────────────────────
async function fetchUsers() {
  try {
    const res = await fetch('/api/admin/users', { headers: Auth.getAuthHeader() });
    if (res.ok) {
      allUsers = await res.json();
      renderUsersTable();
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const search = (document.getElementById('userSearchInput')?.value || '').toLowerCase();

  const filtered = allUsers.filter(u => {
    const matchesFilter = currentUserFilter === 'all' || u.status === currentUserFilter;
    const matchesSearch = !search || 
      u.email.toLowerCase().includes(search) || 
      (u.name && u.name.toLowerCase().includes(search)) ||
      (u.paymentRef && u.paymentRef.toLowerCase().includes(search));
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isPending = u.status === 'pending';
    const isPaid = u.status === 'active_paid';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(u.name || 'User')}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(u.email)}</div>
          ${u.role === 'admin' ? '<span style="font-size:10px; background:#FA0505; color:#fff; padding:1px 6px; border-radius:4px;">ADMIN</span>' : ''}
        </td>
        <td>
          <span class="user-status-pill ${u.status}">
            ${u.status === 'active_paid' ? '⭐ ACTIVE PAID' : (u.status === 'pending' ? '🕒 PENDING APPROVAL' : 'FREE USER')}
          </span>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase;">
            ${(u.plan === '30_days' || u.plan === 'premium_vip') ? '⭐ 30 Days Plan' : (u.plan === 'lifetime' ? '👑 Lifetime' : escapeHtml(u.plan || 'Free'))}
          </span>
          ${u.status === 'active_paid' && u.planExpiresAt ? `
            <div style="font-size: 11px; color: ${new Date(u.planExpiresAt) > new Date() ? '#10B981' : '#EF4444'}; font-weight: 600;">
              ${Math.max(0, Math.ceil((new Date(u.planExpiresAt) - new Date()) / 86400000))} days remaining
            </div>
          ` : ''}
        </td>
        <td>
          ${u.paymentRef ? `
            <div style="font-family: monospace; font-size: 12px; color: #10B981; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 4px; display: inline-block;">
              🧾 ${escapeHtml(u.paymentRef)}
            </div>
          ` : '<span style="color: var(--text-faint); font-size: 12px;">None</span>'}
        </td>
        <td>
          ${u.paymentScreenshot ? `
            <button class="btn btn-secondary btn-sm" onclick="viewPaymentProof('${encodeURIComponent(u.paymentScreenshot)}')">
              📸 View Proof
            </button>
          ` : '<span style="color: var(--text-faint); font-size: 12px;">No screenshot</span>'}
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">
          ${new Date(u.createdAt).toLocaleDateString()}
        </td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${!isPaid ? `
              <button class="btn btn-success btn-sm" onclick="approveUserAccess('${u.id}')">
                ✅ Approve (30 Days)
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="revokeUserAccess('${u.id}')">
                🔒 Revoke to Free
              </button>
            `}
            ${u.role !== 'admin' ? `
              <button class="btn btn-danger btn-sm" style="font-size: 11px;" onclick="deleteUserAccount('${u.id}')">
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Approve User Access
window.approveUserAccess = async function(id) {
  try {
    const res = await fetch('/api/admin/users/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ emailOrId: id, plan: '30_days' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'User approved for Premium VIP access!');
      await loadDashboardData();
    } else {
      alert(data.error || 'Failed to approve user.');
    }
  } catch (err) {
    alert('Server error.');
  }
};

// Quick Approve by Email ID
window.handleQuickApprove = async function() {
  const email = document.getElementById('quickApproveEmail').value.trim();
  const plan = document.getElementById('quickApprovePlan').value;
  if (!email) {
    alert('Please enter a user email address.');
    return;
  }

  try {
    const res = await fetch('/api/admin/users/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ emailOrId: email, plan })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`🎉 Access approved for ${email}!`);
      document.getElementById('quickApproveEmail').value = '';
      await loadDashboardData();
    } else {
      alert(data.error || 'User not found. Make sure user has signed up first.');
    }
  } catch (err) {
    alert('Server error.');
  }
};

// Revoke Access
window.revokeUserAccess = async function(id) {
  if (!confirm('Are you sure you want to revoke VIP access for this user?')) return;
  try {
    const res = await fetch('/api/admin/users/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ emailOrId: id })
    });
    if (res.ok) {
      showToast('Access revoked.');
      await loadDashboardData();
    }
  } catch (err) {
    alert('Server error.');
  }
};

// Delete User
window.deleteUserAccount = async function(id) {
  if (!confirm('Permanently delete this user from the database?')) return;
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeader()
    });
    if (res.ok) {
      showToast('User deleted.');
      await loadDashboardData();
    }
  } catch (err) {
    alert('Server error.');
  }
};

// Filter user table
window.filterUserTable = function(filter) {
  currentUserFilter = filter;
  ['All', 'Pending', 'Paid', 'Free'].forEach(f => {
    const btn = document.getElementById(`userFilter${f}`);
    if (btn) btn.classList.toggle('active', f.toLowerCase() === filter || (filter === 'active_paid' && f === 'Paid'));
  });
  renderUsersTable();
};

window.handleUserSearch = function() {
  renderUsersTable();
};

// ─────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT
// ─────────────────────────────────────────────────────────────
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      allCategories = await res.json();
      renderCategoriesTable();
      populateCategoryDropdown();
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  tbody.innerHTML = allCategories.map(cat => `
    <tr>
      <td style="font-size: 24px;">${cat.icon}</td>
      <td style="font-weight: 700;">${escapeHtml(cat.name)}</td>
      <td>
        <span class="aspect-badge">${cat.count || 0} prompts</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCategoryItem('${cat.id}')">
          🗑️ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

function populateCategoryDropdown() {
  const select = document.getElementById('pCategory');
  if (!select) return;
  select.innerHTML = allCategories.map(c => `
    <option value="${c.name}">${c.icon} ${c.name}</option>
  `).join('');
}

// Add Category
window.handleAddCategory = async function(e) {
  e.preventDefault();
  const icon = document.getElementById('newCatIcon').value.trim() || '📁';
  const name = document.getElementById('newCatName').value.trim();

  try {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ icon, name })
    });
    if (res.ok) {
      showToast(`Category "${name}" created!`);
      document.getElementById('addCategoryForm').reset();
      await fetchCategories();
      await fetchStats();
    }
  } catch (err) {
    alert('Error adding category.');
  }
};

window.deleteCategoryItem = async function(id) {
  if (!confirm('Delete this category?')) return;
  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeader()
    });
    if (res.ok) {
      showToast('Category deleted.');
      await fetchCategories();
      await fetchStats();
    }
  } catch (err) {
    alert('Error deleting category.');
  }
};

// ─────────────────────────────────────────────────────────────
// PROMPT MANAGEMENT (TEXT FORMAT UPLOADS)
// ─────────────────────────────────────────────────────────────
async function fetchPrompts() {
  try {
    const res = await fetch('/api/prompts', { headers: Auth.getAuthHeader() });
    if (res.ok) {
      allPrompts = await res.json();
      renderPromptsTable();
    }
  } catch (err) {
    console.error('Error fetching prompts:', err);
  }
}

function renderPromptsTable() {
  const tbody = document.getElementById('promptsTableBody');
  if (!tbody) return;

  tbody.innerHTML = allPrompts.map(p => `
    <tr>
      <td>
        <img src="${p.thumbnail}" alt="" style="width: 70px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'">
      </td>
      <td>
        <div style="font-weight: 700; max-width: 340px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(p.title)}
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">Aspect: ${p.aspect || '16:9'}</div>
      </td>
      <td>
        <span style="font-size: 12px; color: var(--primary); font-weight: 600;">${escapeHtml(p.category)}</span>
      </td>
      <td>
        <span class="tier-badge ${p.tier}">${p.tier === 'free' ? '🎁 FREE' : '⭐ PREMIUM'}</span>
      </td>
      <td style="font-size: 12px; color: var(--text-muted);">${p.updatedAt || 'Recent'}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="editPromptItem('${p.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePromptItem('${p.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Handle Form Submission (Add or Update)
window.handleAdminPromptSubmit = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('adminEditPromptId').value;

  const payload = {
    title: document.getElementById('pTitle').value.trim(),
    category: document.getElementById('pCategory').value,
    tier: document.getElementById('pTier').value,
    aspect: document.getElementById('pAspect').value,
    tags: document.getElementById('pTags').value,
    thumbnail: document.getElementById('pThumbnail').value.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: document.getElementById('pDesc').value.trim(),
    masterPrompt: document.getElementById('pMasterPrompt').value.trim(),
    camera: document.getElementById('pCamera').value.trim(),
    negativePrompt: document.getElementById('pNegative').value.trim(),
    beats: document.getElementById('pBeats').value.trim()
  };

  try {
    const url = editId ? `/api/admin/prompts/${editId}` : '/api/admin/prompts';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast(editId ? 'Prompt updated successfully!' : '🎉 New Master Prompt published!');
      resetPromptForm();
      await fetchPrompts();
      await fetchStats();
      await fetchCategories();
    } else {
      alert('Failed to save prompt.');
    }
  } catch (err) {
    alert('Server error.');
  }
};

window.editPromptItem = function(id) {
  const p = allPrompts.find(item => item.id === id);
  if (!p) return;

  document.getElementById('adminEditPromptId').value = p.id;
  document.getElementById('promptFormHeaderTitle').textContent = `✏️ Edit Master Prompt (${p.title})`;
  document.getElementById('pTitle').value = p.title;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pTier').value = p.tier;
  document.getElementById('pAspect').value = p.aspect || '16:9';
  document.getElementById('pTags').value = (p.tags || []).join(', ');
  document.getElementById('pThumbnail').value = p.thumbnail;
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pMasterPrompt').value = p.masterPrompt;
  document.getElementById('pCamera').value = p.camera || '';
  document.getElementById('pNegative').value = p.negativePrompt || '';
  document.getElementById('pBeats').value = p.beats || '';
  document.getElementById('pSubmitBtn').textContent = 'Update Prompt';

  if (p.thumbnail) {
    const img = document.getElementById('pImgPreview');
    img.src = p.thumbnail;
    img.style.display = 'block';
  }

  // Scroll to form
  window.scrollTo({ top: 350, behavior: 'smooth' });
};

window.resetPromptForm = function() {
  document.getElementById('adminPromptForm').reset();
  document.getElementById('adminEditPromptId').value = '';
  document.getElementById('promptFormHeaderTitle').textContent = 'Upload Master Prompt Engine (Text Format)';
  document.getElementById('pSubmitBtn').textContent = 'Publish to Library';
  document.getElementById('pImgPreview').style.display = 'none';
};

window.deletePromptItem = async function(id) {
  if (!confirm('Delete this prompt permanently?')) return;
  try {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeader()
    });
    if (res.ok) {
      showToast('Prompt deleted.');
      await fetchPrompts();
      await fetchStats();
    }
  } catch (err) {
    alert('Server error.');
  }
};

window.handleImagePick = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    document.getElementById('pThumbnail').value = evt.target.result;
    const img = document.getElementById('pImgPreview');
    img.src = evt.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
};

// Tab Switching
window.switchAdminTab = function(tab) {
  document.getElementById('tabBtnUsers').classList.toggle('active', tab === 'users');
  document.getElementById('tabBtnCategories').classList.toggle('active', tab === 'categories');
  document.getElementById('tabBtnPrompts').classList.toggle('active', tab === 'prompts');
  const payBtn = document.getElementById('tabBtnPayment');
  if (payBtn) payBtn.classList.toggle('active', tab === 'payment');
  const sheetBtn = document.getElementById('tabBtnSheets');
  if (sheetBtn) sheetBtn.classList.toggle('active', tab === 'sheets');
  const subBtn = document.getElementById('tabBtnSubmissions');
  if (subBtn) subBtn.classList.toggle('active', tab === 'submissions');

  document.getElementById('sectionUsers').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('sectionCategories').style.display = tab === 'categories' ? 'block' : 'none';
  document.getElementById('sectionPrompts').style.display = tab === 'prompts' ? 'block' : 'none';
  const paySec = document.getElementById('sectionPayment');
  if (paySec) paySec.style.display = tab === 'payment' ? 'block' : 'none';
  const sheetSec = document.getElementById('sectionSheets');
  if (sheetSec) sheetSec.style.display = tab === 'sheets' ? 'block' : 'none';
  const subSec = document.getElementById('sectionSubmissions');
  if (subSec) subSec.style.display = tab === 'submissions' ? 'block' : 'none';

  if (tab === 'submissions') fetchCommunitySubmissions();
};

// ─────────────────────────────────────────────────────────────
// PAYMENT & UPI SETTINGS CONTROLLER
// ─────────────────────────────────────────────────────────────
async function fetchPaymentSettings() {
  try {
    const res = await fetch('/api/payment-settings');
    if (res.ok) {
      const s = await res.json();
      const nameInput = document.getElementById('settingPayeeName');
      const upiInput = document.getElementById('settingUpiId');
      const priceInput = document.getElementById('settingVipPrice');
      const waInput = document.getElementById('settingWhatsapp');
      const qrInput = document.getElementById('settingUpiQr');
      const instrInput = document.getElementById('settingInstructions');
      const previewImg = document.getElementById('upiQrPreviewImg');

      if (nameInput) nameInput.value = s.payeeName || '';
      if (upiInput) upiInput.value = s.upiId || '';
      if (priceInput) priceInput.value = s.vipPrice || '499';
      if (waInput) waInput.value = s.whatsappNumber || '+91 6289357399';
      if (qrInput) qrInput.value = s.upiQrImage || '';
      if (instrInput) instrInput.value = s.paymentInstructions || '';
      if (previewImg && s.upiQrImage) previewImg.src = s.upiQrImage;
    }
  } catch (err) {
    console.error('Error fetching payment settings:', err);
  }
}

window.handleUpiQrFilePick = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    document.getElementById('settingUpiQr').value = evt.target.result;
    document.getElementById('upiQrPreviewImg').src = evt.target.result;
    showToast('UPI QR image uploaded! Remember to click Save.');
  };
  reader.readAsDataURL(file);
};

window.generateDynamicQr = function() {
  const upiId = (document.getElementById('settingUpiId')?.value || '6289357399@upi').trim();
  const name = (document.getElementById('settingPayeeName')?.value || 'PromptVault').trim();
  const price = (document.getElementById('settingVipPrice')?.value || '499').trim();

  const dynamicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${name}&am=${price}&cu=INR`)}`;
  document.getElementById('settingUpiQr').value = dynamicUrl;
  document.getElementById('upiQrPreviewImg').src = dynamicUrl;
  showToast('Dynamic UPI QR generated!');
};

window.handlePaymentSettingsSubmit = async function(e) {
  e.preventDefault();

  const payload = {
    payeeName: document.getElementById('settingPayeeName').value.trim(),
    upiId: document.getElementById('settingUpiId').value.trim(),
    vipPrice: document.getElementById('settingVipPrice').value.trim(),
    whatsappNumber: document.getElementById('settingWhatsapp').value.trim(),
    upiQrImage: document.getElementById('settingUpiQr').value.trim(),
    paymentInstructions: document.getElementById('settingInstructions').value.trim()
  };

  try {
    const res = await fetch('/api/admin/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('💳 UPI & Payment Settings saved successfully!');
    } else {
      alert('Failed to save payment settings.');
    }
  } catch (err) {
    alert('Server connection error.');
  }
};

window.viewPaymentProof = function(encodedSrc) {
  const src = decodeURIComponent(encodedSrc);
  const modal = document.getElementById('proofModal');
  const img = document.getElementById('proofModalImg');
  if (modal && img) {
    img.src = src;
    modal.classList.add('active');
  }
};

window.closeProofModal = function() {
  const modal = document.getElementById('proofModal');
  if (modal) modal.classList.remove('active');
};

window.showToast = function(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>⚡</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 3200);
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
// GOOGLE SHEETS LIVE SYNC CONTROLLER
// ─────────────────────────────────────────────────────────────
let googleSheetSettings = null;

async function fetchGoogleSheetSettings() {
  try {
    const res = await fetch('/api/admin/google-sheet-settings', { headers: Auth.getAuthHeader() });
    if (res.ok) {
      googleSheetSettings = await res.json();
      const input = document.getElementById('sheetUrlInput');
      const toggle = document.getElementById('sheetAutoSyncToggle');
      const interval = document.getElementById('sheetAutoSyncInterval');
      const badge = document.getElementById('sheetStatusBadge');
      const metricTime = document.getElementById('syncMetricTime');
      const metricTotal = document.getElementById('syncMetricSheetTotal');
      const metricCU = document.getElementById('syncMetricCreatedUpdated');
      const metricCats = document.getElementById('syncMetricCategories');

      if (input && googleSheetSettings.googleSheetUrl) {
        input.value = googleSheetSettings.googleSheetUrl;
      }
      if (toggle) {
        toggle.checked = !!googleSheetSettings.autoSyncEnabled;
      }
      if (interval && googleSheetSettings.autoSyncInterval) {
        interval.value = String(googleSheetSettings.autoSyncInterval);
      }

      if (googleSheetSettings.googleSheetUrl) {
        if (badge) {
          badge.className = 'user-badge badge-active';
          badge.innerHTML = '🟢 Connected &amp; Synced';
        }
      } else {
        if (badge) {
          badge.className = 'user-badge badge-free';
          badge.innerHTML = '⚪ Not Connected';
        }
      }

      if (googleSheetSettings.lastSyncedAt) {
        const d = new Date(googleSheetSettings.lastSyncedAt);
        if (metricTime) metricTime.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (googleSheetSettings.lastSyncStats) {
        const s = googleSheetSettings.lastSyncStats;
        if (metricTotal) metricTotal.textContent = `${s.totalInSheet || s.totalPromptsNow} Prompts`;
        if (metricCU) metricCU.textContent = `+${s.createdCount} new / ${s.updatedCount} updated`;
        if (metricCats) metricCats.textContent = `+${s.categoriesAdded} new`;
      }
    }
  } catch (err) {
    console.error('Error fetching sheet settings:', err);
  }
}

window.handleSaveSheetSettings = async function(e) {
  if (e) e.preventDefault();
  const url = (document.getElementById('sheetUrlInput')?.value || '').trim();
  const autoSync = !!document.getElementById('sheetAutoSyncToggle')?.checked;
  const interval = parseInt(document.getElementById('sheetAutoSyncInterval')?.value, 10) || 15;

  try {
    const res = await fetch('/api/admin/google-sheet-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({
        googleSheetUrl: url,
        autoSyncEnabled: autoSync,
        autoSyncInterval: interval
      })
    });
    if (res.ok) {
      showToast('Settings saved successfully!');
      await fetchGoogleSheetSettings();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to save settings.');
    }
  } catch (err) {
    alert('Server connection error.');
  }
};

window.handleManualSheetSync = async function() {
  const urlInput = document.getElementById('sheetUrlInput');
  const url = (urlInput?.value || '').trim();

  if (!url) {
    alert('Please enter your Google Sheet shareable link first.');
    urlInput?.focus();
    return;
  }

  const btn = document.getElementById('btnSyncNow');
  const spinner = document.getElementById('syncSpinner');
  const label = document.getElementById('syncBtnLabel');

  try {
    if (btn) btn.disabled = true;
    if (spinner) spinner.style.display = 'inline';
    if (label) label.textContent = 'Syncing from Google...';

    const res = await fetch('/api/admin/sync-google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ sheetUrl: url })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast(data.message || 'Sheet synced successfully!');
      // Refresh all lists
      await Promise.all([
        fetchStats(),
        fetchCategories(),
        fetchPrompts(),
        fetchGoogleSheetSettings()
      ]);
    } else {
      alert(`⚠️ Sync Failed: ${data.error || 'Could not fetch Google Sheet.'}\n\nPlease make sure:\n1. The Google Sheet General Access is set to "Anyone with the link can view"\n2. Or use File > Share > Publish to web as CSV`);
    }
  } catch (err) {
    alert('Failed to connect to server for syncing.');
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (label) label.textContent = '⚡ Sync Prompts Now';
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN CREDENTIALS & SECURITY
// ─────────────────────────────────────────────────────────────
window.openCredentialsModal = function() {
  const user = Auth.getUser();
  const emailInput = document.getElementById('newAdminEmail');
  if (emailInput && user) {
    emailInput.value = user.email || '';
  }
  const passInput = document.getElementById('newAdminPassword');
  if (passInput) passInput.value = '';
  const confirmInput = document.getElementById('confirmAdminPassword');
  if (confirmInput) confirmInput.value = '';

  const modal = document.getElementById('credentialsModal');
  if (modal) modal.classList.add('active');
};

window.closeCredentialsModal = function() {
  const modal = document.getElementById('credentialsModal');
  if (modal) modal.classList.remove('active');
};

window.handleChangeCredentials = async function(e) {
  e.preventDefault();
  const newEmail = (document.getElementById('newAdminEmail')?.value || '').trim();
  const newPassword = (document.getElementById('newAdminPassword')?.value || '').trim();
  const confirmPassword = (document.getElementById('confirmAdminPassword')?.value || '').trim();

  if (newPassword && newPassword !== confirmPassword) {
    alert('Passwords do not match. Please re-enter.');
    return;
  }

  const btn = document.getElementById('btnSaveCredentials');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/change-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({ newEmail, newPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token && data.user) {
        Auth.setSession(data.token, data.user);
      }
      const badge = document.getElementById('adminEmailBadge');
      if (badge && data.user) {
        badge.textContent = `${data.user.email} (Admin)`;
      }
      closeCredentialsModal();
      showToast('Admin email & password updated successfully!');
    } else {
      alert(data.error || 'Failed to update credentials.');
    }
  } catch (err) {
    alert('Server connection error.');
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ─────────────────────────────────────────────────────────────
// COMMUNITY PROMPT SUBMISSION CONTROLLER
// ─────────────────────────────────────────────────────────────

let allSubmissions = [];

async function fetchCommunitySubmissions() {
  try {
    const res = await fetch('/api/admin/community-submissions', { headers: Auth.getAuthHeader() });
    if (res.ok) {
      allSubmissions = await res.json();
      const badge = document.getElementById('submissionsCountBadge');
      const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
      if (badge) badge.textContent = pendingCount;
      renderSubmissionsTable();
    }
  } catch (err) {
    console.error('Error fetching submissions:', err);
  }
}

function renderSubmissionsTable() {
  const tbody = document.getElementById('submissionsTableBody');
  if (!tbody) return;

  if (allSubmissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No community submissions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = allSubmissions.map(s => {
    const isPending = s.status === 'pending';
    const isApproved = s.status === 'approved';

    return `
      <tr>
        <td>
          <div style="font-weight: 700;">${escapeHtml(s.creatorName || 'Anonymous')}</div>
          ${s.creatorSocial ? `<a href="${escapeHtml(s.creatorSocial)}" target="_blank" style="font-size: 11.5px; color: #10B981;">🔗 Link</a>` : '<span style="font-size:11.5px; color:var(--text-muted);">No link</span>'}
        </td>
        <td>
          <div style="font-weight: 700; font-size: 13.5px;">${escapeHtml(s.title)}</div>
          <span style="font-size: 11.5px; color: var(--primary);">📁 ${escapeHtml(s.category)}</span>
        </td>
        <td>
          <div style="max-width: 320px; font-size: 12px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted);" title="${escapeHtml(s.masterPrompt)}">
            ${escapeHtml(s.masterPrompt)}
          </div>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">${(s.submittedAt || '').split('T')[0] || 'Recent'}</td>
        <td>
          <span class="user-status-pill ${s.status === 'approved' ? 'active_paid' : (s.status === 'pending' ? 'pending' : 'free')}">
            ${s.status.toUpperCase()}
          </span>
        </td>
        <td>
          ${isPending ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-primary btn-sm" onclick="approveCommunityPrompt('${s.id}')" style="padding: 4px 10px; font-size: 12px;">✅ Approve</button>
              <button class="btn btn-secondary btn-sm" onclick="rejectCommunityPrompt('${s.id}')" style="padding: 4px 10px; font-size: 12px; color: #F87171;">❌ Reject</button>
            </div>
          ` : `<span style="font-size: 12px; color: var(--text-muted);">${isApproved ? 'Live on Site' : 'Declined'}</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

window.approveCommunityPrompt = async function(id) {
  try {
    const res = await fetch(`/api/admin/community-submissions/${id}/approve`, {
      method: 'POST',
      headers: Auth.getAuthHeader()
    });
    if (res.ok) {
      alert('Prompt approved and published live to website!');
      await fetchCommunitySubmissions();
      await fetchPrompts();
    }
  } catch (err) {
    alert('Failed to approve prompt.');
  }
};

window.rejectCommunityPrompt = async function(id) {
  if (!confirm('Reject this community prompt submission?')) return;
  try {
    const res = await fetch(`/api/admin/community-submissions/${id}/reject`, {
      method: 'POST',
      headers: Auth.getAuthHeader()
    });
    if (res.ok) {
      await fetchCommunitySubmissions();
    }
  } catch (err) {
    alert('Failed to reject submission.');
  }
};
