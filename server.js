const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'promptvault_super_secret_jwt_key_2026';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// JWT Token Helper
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Optional Auth Middleware (attaches req.user if token valid)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid or expired, continue as guest
    }
  }
  next();
}

// Required Auth Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Required Admin Middleware
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

// ─────────────────────────────────────────────────────────────
// AUTH & USER ROUTES
// ─────────────────────────────────────────────────────────────

// Register new user
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    name: name || email.split('@')[0],
    email: email.trim().toLowerCase(),
    passwordHash
  });

  const token = generateToken(newUser);
  res.json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      plan: newUser.plan
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan
    }
  });
});

// Current user profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      plan: req.user.plan,
      paymentRef: req.user.paymentRef
    }
  });
});

// User submits payment verification info (e.g. UPI Transaction ID, UTR, Screenshot)
app.post('/api/payment/submit', requireAuth, (req, res) => {
  const { paymentRef, paymentScreenshot, plan } = req.body;
  if (!paymentRef && !paymentScreenshot) {
    return res.status(400).json({ error: 'Please provide either a Transaction Reference (UTR) or upload a payment screenshot.' });
  }

  const updatedUser = db.updatePaymentRef(req.user.id, paymentRef || 'Screenshot Submitted', plan || '30_days', paymentScreenshot || null);
  res.json({
    success: true,
    message: 'Payment verification submitted! Admin will verify and approve your 30-day VIP plan shortly.',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      plan: updatedUser.plan,
      planExpiresAt: updatedUser.planExpiresAt,
      paymentRef: updatedUser.paymentRef,
      paymentScreenshot: updatedUser.paymentScreenshot
    }
  });
});

// Public: Get current UPI & Payment Configuration
app.get('/api/payment-settings', (req, res) => {
  const settings = db.getSettings();
  res.json(settings);
});

// Admin: Update UPI & Payment Configuration
app.post('/api/admin/payment-settings', requireAdmin, (req, res) => {
  const { whatsappNumber, upiId, payeeName, upiQrImage, vipPrice, paymentInstructions } = req.body;
  const updated = db.updateSettings({
    ...(whatsappNumber && { whatsappNumber: whatsappNumber.trim() }),
    ...(upiId && { upiId: upiId.trim() }),
    ...(payeeName && { payeeName: payeeName.trim() }),
    ...(upiQrImage !== undefined && { upiQrImage: upiQrImage.trim() }),
    ...(vipPrice && { vipPrice: String(vipPrice).trim() }),
    ...(paymentInstructions && { paymentInstructions: paymentInstructions.trim() })
  });
  res.json({ success: true, settings: updated });
});

// Upload Image File to /public/uploads/ (Local & Web Accessible)
app.post('/api/upload-image', (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided.' });
  }

  try {
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const safeName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    res.json({ success: true, url: `/uploads/${safeName}` });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to save image.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GOOGLE SHEETS SYNC & CSV INTEGRATION ROUTES
// ─────────────────────────────────────────────────────────────

// Admin: Get Google Sheet sync settings and status
app.get('/api/admin/google-sheet-settings', requireAdmin, (req, res) => {
  const settings = db.getSettings();
  res.json({
    googleSheetUrl: settings.googleSheetUrl || '',
    autoSyncEnabled: !!settings.autoSyncEnabled,
    autoSyncInterval: settings.autoSyncInterval || 15,
    lastSyncedAt: settings.lastSyncedAt || null,
    lastSyncStats: settings.lastSyncStats || null
  });
});

// Admin: Save Google Sheet settings
app.post('/api/admin/google-sheet-settings', requireAdmin, (req, res) => {
  const { googleSheetUrl, autoSyncEnabled, autoSyncInterval } = req.body;
  const updated = db.updateSettings({
    ...(googleSheetUrl !== undefined && { googleSheetUrl: googleSheetUrl.trim() }),
    ...(autoSyncEnabled !== undefined && { autoSyncEnabled: Boolean(autoSyncEnabled) }),
    ...(autoSyncInterval !== undefined && { autoSyncInterval: Math.max(5, parseInt(autoSyncInterval, 10) || 15) })
  });
  setupAutoSync();
  res.json({ success: true, settings: updated });
});

// Admin: Trigger Google Sheet Sync Now
app.post('/api/admin/sync-google-sheet', requireAdmin, async (req, res) => {
  const { sheetUrl } = req.body;
  try {
    const stats = await db.syncGoogleSheet(sheetUrl);
    res.json({
      success: true,
      message: `Sync successful! ${stats.createdCount} new prompts added, ${stats.updatedCount} updated, ${stats.categoriesAdded} new categories created.`,
      stats
    });
  } catch (err) {
    console.error('[GoogleSheetSync Error]:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to sync Google Sheet. Check URL and sharing permissions.'
    });
  }
});

// Download starter CSV template for Google Sheets (Publicly accessible template)
app.get('/api/admin/google-sheet-template-csv', (req, res) => {
  const csv = db.getGoogleSheetTemplateCSV();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="PromptVault_GoogleSheet_Template.csv"');
  res.send(csv);
});

// Admin: Export current prompts database as CSV (supports auth header or ?token=)
app.get('/api/admin/export-prompts-csv', (req, res, next) => {
  // Check auth header or query token
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required to export database.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const csv = db.exportPromptsToCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="PromptVault_Prompts_Export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC PROMPTS & CATEGORIES ROUTES
// ─────────────────────────────────────────────────────────────

// Get categories
app.get('/api/categories', (req, res) => {
  const categories = db.getCategories();
  const prompts = db.getPrompts();
  const catsWithCount = categories.map(cat => ({
    ...cat,
    count: prompts.filter(p => p.category === cat.name).length
  }));
  res.json(catsWithCount);
});

// Get all prompts (with lock masking for premium items if unauthorized)
app.get('/api/prompts', optionalAuth, (req, res) => {
  const prompts = db.getPrompts();
  const isExpired = req.user && req.user.planExpiresAt && new Date() > new Date(req.user.planExpiresAt);
  const isPaidOrAdmin = req.user && (req.user.role === 'admin' || (req.user.status === 'active_paid' && !isExpired));

  const sanitized = prompts.map(p => {
    if (p.tier === 'premium' && !isPaidOrAdmin) {
      return {
        ...p,
        isLocked: true,
        masterPrompt: `🔒 [PREMIUM LOCKED ENGINE]\nTo access this full multi-stage generative prompt, camera motion specs, and quality controls, please subscribe and have your email approved by the administrator.`
      };
    }
    return {
      ...p,
      isLocked: false
    };
  });

  res.json(sanitized);
});

// Get single prompt
app.get('/api/prompts/:id', optionalAuth, (req, res) => {
  const prompt = db.findPromptById(req.params.id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found.' });
  }

  const isPaidOrAdmin = req.user && (req.user.role === 'admin' || req.user.status === 'active_paid');
  if (prompt.tier === 'premium' && !isPaidOrAdmin) {
    return res.json({
      ...prompt,
      isLocked: true,
      masterPrompt: `🔒 [PREMIUM LOCKED ENGINE]\nTo access this full multi-stage generative prompt, camera motion specs, and quality controls, please subscribe and have your email approved by the administrator.`
    });
  }

  res.json({ ...prompt, isLocked: false });
});

// ─────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT ROUTES (Categories, Prompts, User Approvals)
// ─────────────────────────────────────────────────────────────

// Get admin stats overview
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const users = db.getUsers();
  const prompts = db.getPrompts();
  const categories = db.getCategories();

  const totalUsers = users.length;
  const activePaidUsers = users.filter(u => u.status === 'active_paid' && u.role !== 'admin').length;
  const pendingApprovals = users.filter(u => u.status === 'pending').length;

  res.json({
    totalUsers,
    activePaidUsers,
    pendingApprovals,
    totalPrompts: prompts.length,
    totalCategories: categories.length
  });
});

// Admin: Update Admin Email and/or Password
app.post('/api/admin/change-credentials', requireAdmin, (req, res) => {
  const { newEmail, newPassword } = req.body;
  if (!newEmail && !newPassword) {
    return res.status(400).json({ error: 'Please provide either a new email or a new password.' });
  }

  try {
    const updated = db.updateUserCredentials(req.user.id, newEmail, newPassword);
    const token = generateToken(updated);
    res.json({
      success: true,
      message: 'Admin credentials updated successfully!',
      token,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users in database (for email approval)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    plan: u.plan,
    paymentRef: u.paymentRef || null,
    paymentScreenshot: u.paymentScreenshot || null,
    createdAt: u.createdAt,
    approvedAt: u.approvedAt || null
  }));
  res.json(users);
});

// Approve user access by Email ID or ID
app.post('/api/admin/users/approve', requireAdmin, (req, res) => {
  const { emailOrId, plan } = req.body;
  if (!emailOrId) {
    return res.status(400).json({ error: 'User Email or ID is required.' });
  }

  const user = db.updateUserStatus(emailOrId, 'active_paid', plan || '30_days');
  if (!user) {
    return res.status(404).json({ error: 'User with given email or ID not found.' });
  }

  res.json({
    success: true,
    message: `User ${user.email} has been approved for 30 Days VIP access!`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt
    }
  });
});

// Revoke user access (set back to free)
app.post('/api/admin/users/revoke', requireAdmin, (req, res) => {
  const { emailOrId } = req.body;
  if (!emailOrId) {
    return res.status(400).json({ error: 'User Email or ID is required.' });
  }

  const user = db.updateUserStatus(emailOrId, 'free', 'free');
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    success: true,
    message: `User ${user.email} access changed to Free.`,
    user: {
      id: user.id,
      email: user.email,
      status: user.status
    }
  });
});

// Delete user
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.deleteUser(req.params.id);
  res.json({ success: true, message: 'User deleted.' });
});

// Category Management
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, icon } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  const category = db.addCategory(name, icon);
  res.json({ success: true, category });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  db.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category removed.' });
});

// Prompt Upload & Management
app.post('/api/admin/prompts', requireAdmin, (req, res) => {
  const {
    title,
    category,
    tier,
    aspect,
    tags,
    thumbnail,
    description,
    masterPrompt,
    camera,
    negativePrompt,
    beats,
    tools
  } = req.body;

  if (!title || !masterPrompt) {
    return res.status(400).json({ error: 'Title and master generative prompt are required.' });
  }

  const prompt = db.createPrompt({
    title,
    category: category || 'Fantasy & Sci-Fi',
    tier: tier || 'premium',
    aspect: aspect || '16:9',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: description || '',
    masterPrompt,
    camera: camera || '',
    negativePrompt: negativePrompt || '',
    beats: beats || '',
    tools: Array.isArray(tools) ? tools : ['Runway Gen-3', 'Kling AI']
  });

  res.json({ success: true, prompt });
});

app.put('/api/admin/prompts/:id', requireAdmin, (req, res) => {
  const updated = db.updatePrompt(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Prompt not found.' });
  }
  res.json({ success: true, prompt: updated });
});

app.delete('/api/admin/prompts/:id', requireAdmin, (req, res) => {
  db.deletePrompt(req.params.id);
  res.json({ success: true, message: 'Prompt deleted.' });
});

// Catch-all fallback route to serve index.html for frontend navigation (Express 5 compatible)
app.use((req, res) => {
  const rootIndex = path.join(__dirname, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Background Google Sheet Auto-Sync Scheduler
let autoSyncTimer = null;

function setupAutoSync() {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
  const settings = db.getSettings();
  if (settings.googleSheetUrl && settings.autoSyncEnabled) {
    const intervalMinutes = Math.max(5, parseInt(settings.autoSyncInterval, 10) || 15);
    console.log(`⏱️ Google Sheet auto-sync scheduled every ${intervalMinutes} minutes`);
    autoSyncTimer = setInterval(async () => {
      try {
        console.log('[GoogleSheetSync] Executing scheduled background sync...');
        await db.syncGoogleSheet();
      } catch (err) {
        console.error('[GoogleSheetSync Scheduled Error]:', err.message);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Start Server
app.listen(PORT, () => {
  setupAutoSync();
  console.log(`=======================================================`);
  console.log(`🚀 PromptVault Server running on http://localhost:${PORT}`);
  console.log(`👑 Admin Credentials: admin@promptvault.com / admin123`);
  console.log(`=======================================================`);
});
