require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

const DEFAULT_MONGO_URI = 'mongodb+srv://soumojitkarmakar533_db_user:OItvvNjY6T3Ct7TB@soumo.6brgu8w.mongodb.net/promptvault?retryWrites=true&w=majority';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

// MongoDB Cloud Persistence Schema
const storeSchema = new mongoose.Schema({ key: { type: String, unique: true }, data: mongoose.Schema.Types.Mixed });
let Store;
try {
  Store = mongoose.model('Store', storeSchema);
} catch (e) {
  Store = mongoose.model('Store');
}

const imageSchema = new mongoose.Schema({
  filename: { type: String, unique: true },
  mimeType: String,
  data: String
});
let ImageModel;
try {
  ImageModel = mongoose.model('Image', imageSchema);
} catch (e) {
  ImageModel = mongoose.model('Image');
}

let isMongoConnected = false;

// Default UPI & Payment Configuration
const DEFAULT_SETTINGS = {
  whatsappNumber: '+91 6289357399',
  upiId: '6289357399@upi',
  payeeName: 'PromptVault Creator',
  vipPrice: '499',
  currency: 'INR',
  paymentInstructions: 'Scan the UPI QR Code with Google Pay, PhonePe, or Paytm. Submit your transaction reference or screenshot for instant verification.',
  upiQrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=6289357399@upi&pn=PromptVault&am=499&cu=INR',
  googleSheetUrl: '',
  autoSyncEnabled: false,
  autoSyncInterval: 15,
  lastSyncedAt: null,
  lastSyncStats: null,
  whatsappCommunityUrl: 'https://chat.whatsapp.com/invite',
  telegramCommunityUrl: 'https://t.me/promptvault_vip',
  dailyDropPromptId: ''
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Connect to MongoDB Atlas (both Local and Live Cloud)
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('⚡ Connected to MongoDB Atlas Cloud Database!');
    // Hydrate local files from MongoDB if available
    const keys = ['users', 'prompts', 'categories', 'settings'];
    for (const k of keys) {
      try {
        const doc = await Store.findOne({ key: k });
        if (doc && doc.data) {
          const filePath = path.join(DATA_DIR, `${k}.json`);
          fs.writeFileSync(filePath, JSON.stringify(doc.data, null, 2), 'utf8');
        }
      } catch (e) {}
    }

    // Real-time Cloud Sync: continuously keep server files synchronized with MongoDB Atlas
    setInterval(async () => {
      if (!isMongoConnected || !Store) return;
      const syncKeys = ['prompts', 'categories', 'settings', 'users'];
      for (const k of syncKeys) {
        try {
          const doc = await Store.findOne({ key: k });
          if (doc && doc.data) {
            const filePath = path.join(DATA_DIR, `${k}.json`);
            fs.writeFileSync(filePath, JSON.stringify(doc.data, null, 2), 'utf8');
          }
        } catch (e) {}
      }
    }, 8000);
  })
  .catch(err => {
    console.warn('⚠️ MongoDB Atlas connection notice (using local storage fallback):', err.message);
  });

// Atomic file reading and writing with MongoDB Cloud Sync
function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) {
      writeJson(file, fallback);
      return fallback;
    }
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

const { exec } = require('child_process');
let gitPushTimeout = null;

function triggerAutoGitSync() {
  if (gitPushTimeout) clearTimeout(gitPushTimeout);
  gitPushTimeout = setTimeout(() => {
    try {
      const gitCmd = `git add data/ public/uploads/ && git commit -m "Auto-sync prompts & library data" && git push origin main`;
      const envPath = `C:\\Users\\soumo\\AppData\\Local\\Programs\\Git\\cmd;${process.env.PATH || ''}`;
      exec(gitCmd, { cwd: __dirname, env: { ...process.env, PATH: envPath } }, (error, stdout, stderr) => {
        if (!error) {
          console.log('[AutoGitSync] ✓ Automatically synchronized data with GitHub repository!');
        }
      });
    } catch (e) {}
  }, 4000);
}

function writeJson(file, data) {
  const tempFile = `${file}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, file);

  // Sync to MongoDB Atlas asynchronously
  if (isMongoConnected && Store) {
    const key = path.basename(file, '.json');
    Store.findOneAndUpdate({ key }, { key, data }, { upsert: true, returnDocument: 'after' })
      .catch(err => console.error(`[MongoDB] Error syncing ${key}:`, err.message));
  }

  // Automatically sync to GitHub repository
  const fileName = path.basename(file);
  if (fileName === 'prompts.json' || fileName === 'categories.json') {
    triggerAutoGitSync();
  }
}

// Initial Seeds
function initializeDatabase() {
  // Seed Users
  let users = readJson(USERS_FILE, []);
  if (users.length === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user123', 10);

    users = [
      {
        id: 'usr_admin_1',
        name: 'Master Admin',
        email: 'admin@promptvault.com',
        passwordHash: adminHash,
        role: 'admin',
        status: 'active_paid',
        plan: 'lifetime',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_paid_2',
        name: 'Rahul Sharma',
        email: 'rahul.ai@example.com',
        passwordHash: userHash,
        role: 'user',
        status: 'active_paid',
        plan: 'premium_vip',
        paymentRef: 'UPI-TXN-9841284912',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'usr_pending_3',
        name: 'Sarah Jenkins',
        email: 'sarah.creations@example.com',
        passwordHash: userHash,
        role: 'user',
        status: 'pending',
        plan: 'premium_vip',
        paymentRef: 'STRIPE-PAY-8721948',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ];
    writeJson(USERS_FILE, users);
    console.log('✓ Users database initialized with Admin: admin@promptvault.com / admin123');
  }

  // Seed Categories
  let categories = readJson(CATEGORIES_FILE, []);
  if (categories.length === 0) {
    categories = [
      { id: 'cat_1', name: 'Animal & Pets', icon: '🐾' },
      { id: 'cat_2', name: 'Art & Animation', icon: '🎨' },
      { id: 'cat_3', name: 'ASMR & Satisfying', icon: '🫧' },
      { id: 'cat_4', name: 'Comedy & Entertainment', icon: '😂' },
      { id: 'cat_5', name: 'DIY & Crafts', icon: '🔨' },
      { id: 'cat_6', name: 'Emotional & Inspirational', icon: '🌟' },
      { id: 'cat_7', name: 'Fantasy & Sci-Fi', icon: '🚀' },
      { id: 'cat_8', name: 'Food & Cooking', icon: '🍳' },
      { id: 'cat_9', name: 'Nature & Wildlife', icon: '🌿' },
      { id: 'cat_10', name: 'Sports & Action', icon: '⚡' },
      { id: 'cat_11', name: 'Historical & Nostalgia', icon: '🏛️' },
      { id: 'cat_12', name: 'Tools & AI', icon: '🤖' }
    ];
    writeJson(CATEGORIES_FILE, categories);
    console.log('✓ Categories database initialized');
  }

  // Prompts are user-managed (do not auto-seed demo prompts)
}

// Database Operations
const db = {
  // Users
  getUsers: () => readJson(USERS_FILE, []),
  findUserByEmail: (email) => {
    const users = readJson(USERS_FILE, []);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id) => {
    const users = readJson(USERS_FILE, []);
    return users.find(u => u.id === id);
  },
  createUser: (userData) => {
    const users = readJson(USERS_FILE, []);
    const newUser = {
      id: 'usr_' + Date.now(),
      status: 'free', // 'free', 'pending', 'active_paid'
      role: 'user',   // 'user', 'admin'
      plan: 'free',
      createdAt: new Date().toISOString(),
      ...userData
    };
    users.unshift(newUser);
    writeJson(USERS_FILE, users);
    return newUser;
  },
  updateUserStatus: (emailOrId, status, plan = '30_days') => {
    const users = readJson(USERS_FILE, []);
    const user = users.find(u => u.id === emailOrId || u.email.toLowerCase() === emailOrId.toLowerCase());
    if (!user) return null;
    user.status = status;
    if (status === 'active_paid') {
      user.plan = plan || '30_days';
      user.approvedAt = new Date().toISOString();
      if (plan !== 'lifetime') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        user.planExpiresAt = expires.toISOString();
      } else {
        delete user.planExpiresAt;
      }
    } else if (status === 'free') {
      user.plan = 'free';
      delete user.planExpiresAt;
    }
    writeJson(USERS_FILE, users);
    return user;
  },
  updatePaymentRef: (userId, paymentRef, plan, paymentScreenshot = null) => {
    const users = readJson(USERS_FILE, []);
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    user.paymentRef = paymentRef;
    if (paymentScreenshot) {
      user.paymentScreenshot = paymentScreenshot;
    }
    user.status = 'pending';
    user.plan = plan || '30_days';
    user.paymentSubmittedAt = new Date().toISOString();
    writeJson(USERS_FILE, users);
    return user;
  },
  deleteUser: (id) => {
    let users = readJson(USERS_FILE, []);
    users = users.filter(u => u.id !== id);
    writeJson(USERS_FILE, users);
    return true;
  },
  updateUserCredentials: (userId, newEmail, newPassword) => {
    const users = readJson(USERS_FILE, []);
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    if (newEmail && newEmail.trim()) {
      const trimmedEmail = newEmail.trim().toLowerCase();
      const existing = users.find(u => u.email.toLowerCase() === trimmedEmail && u.id !== userId);
      if (existing) {
        throw new Error('This email address is already in use by another account.');
      }
      user.email = trimmedEmail;
      user.name = user.name || trimmedEmail.split('@')[0];
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        throw new Error('Password must be at least 4 characters long.');
      }
      user.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
    }

    user.updatedAt = new Date().toISOString();
    writeJson(USERS_FILE, users);
    return user;
  },

  // Payment & Site Settings
  getSettings: () => {
    return readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  },
  updateSettings: (newSettings) => {
    const current = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
    const updated = { ...current, ...newSettings };
    writeJson(SETTINGS_FILE, updated);
    return updated;
  },

  // Categories
  getCategories: () => readJson(CATEGORIES_FILE, []),
  addCategory: (name, icon = '📁') => {
    const categories = readJson(CATEGORIES_FILE, []);
    const newCat = {
      id: 'cat_' + Date.now(),
      name: name.trim(),
      icon: icon || '📁'
    };
    categories.push(newCat);
    writeJson(CATEGORIES_FILE, categories);
    return newCat;
  },
  deleteCategory: (id) => {
    let categories = readJson(CATEGORIES_FILE, []);
    categories = categories.filter(c => c.id !== id);
    writeJson(CATEGORIES_FILE, categories);
    return true;
  },

  // Prompts
  getPrompts: () => readJson(PROMPTS_FILE, []),
  findPromptById: (id) => {
    const prompts = readJson(PROMPTS_FILE, []);
    return prompts.find(p => p.id === id);
  },
  createPrompt: (promptData) => {
    const prompts = readJson(PROMPTS_FILE, []);
    const newPrompt = {
      id: 'p_' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0],
      aspect: '16:9',
      tier: 'premium',
      tags: [],
      tools: ['Runway Gen-3', 'Kling AI', 'Luma'],
      ...promptData
    };
    prompts.unshift(newPrompt);
    writeJson(PROMPTS_FILE, prompts);
    return newPrompt;
  },
  updatePrompt: (id, updateData) => {
    const prompts = readJson(PROMPTS_FILE, []);
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return null;
    prompts[index] = {
      ...prompts[index],
      ...updateData,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    writeJson(PROMPTS_FILE, prompts);
    return prompts[index];
  },
  deletePrompt: (id) => {
    let prompts = readJson(PROMPTS_FILE, []);
    prompts = prompts.filter(p => p.id !== id);
    writeJson(PROMPTS_FILE, prompts);
    return true;
  },

  // Cloud Image Storage in MongoDB Atlas
  saveImageToCloud: async (filename, mimeType, base64Data) => {
    if (!isMongoConnected || !ImageModel) return false;
    try {
      await ImageModel.findOneAndUpdate(
        { filename },
        { filename, mimeType, data: base64Data },
        { upsert: true }
      );
      return true;
    } catch (e) {
      console.error('Error saving image to MongoDB:', e.message);
      return false;
    }
  },
  getImageFromCloud: async (filename) => {
    if (!isMongoConnected || !ImageModel) return null;
    try {
      return await ImageModel.findOne({ filename });
    } catch (e) {
      return null;
    }
  },

  // Community Prompts & User Submissions
  getSubmissions: () => readJson(SUBMISSIONS_FILE, []),
  createSubmission: (data) => {
    const list = readJson(SUBMISSIONS_FILE, []);
    const newSub = {
      id: 'sub_' + Date.now(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...data
    };
    list.unshift(newSub);
    writeJson(SUBMISSIONS_FILE, list);
    return newSub;
  },
  approveSubmission: (id) => {
    const list = readJson(SUBMISSIONS_FILE, []);
    const sub = list.find(s => s.id === id);
    if (!sub) return null;
    sub.status = 'approved';
    sub.approvedAt = new Date().toISOString();
    writeJson(SUBMISSIONS_FILE, list);

    return db.createPrompt({
      title: sub.title,
      category: sub.category || 'General',
      tier: 'free',
      aspect: sub.aspect || '16:9',
      tags: sub.tags || ['Community', 'Creator Spotlight'],
      thumbnail: sub.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      description: sub.description || sub.title,
      masterPrompt: sub.masterPrompt,
      camera: sub.camera || '',
      negativePrompt: sub.negativePrompt || '',
      tools: sub.tools || ['Runway Gen-3', 'Kling AI'],
      beats: sub.beats || '',
      creatorName: sub.creatorName || 'Anonymous Creator',
      creatorSocial: sub.creatorSocial || ''
    });
  },
  rejectSubmission: (id) => {
    const list = readJson(SUBMISSIONS_FILE, []);
    const sub = list.find(s => s.id === id);
    if (!sub) return null;
    sub.status = 'rejected';
    writeJson(SUBMISSIONS_FILE, list);
    return sub;
  },

  // ─────────────────────────────────────────────────────────────
  // GOOGLE SHEETS SYNC & CSV INTEGRATION ENGINE
  // ─────────────────────────────────────────────────────────────
  convertGoogleSheetUrl,
  parseCSV,
  getEmojiForCategory,

  exportPromptsToCSV: () => {
    const prompts = readJson(PROMPTS_FILE, []);
    const headers = ['Title', 'Category', 'Tier', 'Aspect', 'Tags', 'Thumbnail', 'Description', 'MasterPrompt', 'Camera', 'NegativePrompt', 'Tools', 'Beats'];
    
    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      if (Array.isArray(val)) val = val.join(', ');
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const lines = [
      headers.map(h => `"${h}"`).join(',')
    ];

    for (const p of prompts) {
      const row = [
        escapeCell(p.title),
        escapeCell(p.category),
        escapeCell(p.tier),
        escapeCell(p.aspect),
        escapeCell(p.tags),
        escapeCell(p.thumbnail),
        escapeCell(p.description),
        escapeCell(p.masterPrompt),
        escapeCell(p.camera),
        escapeCell(p.negativePrompt),
        escapeCell(p.tools),
        escapeCell(p.beats)
      ];
      lines.push(row.join(','));
    }

    return lines.join('\r\n');
  },

  getGoogleSheetTemplateCSV: () => {
    return [
      `"Title","Category","Tier","Aspect","Tags","Thumbnail","Description","MasterPrompt","Camera","NegativePrompt","Tools","Beats"`,
      `"ULTRA MASTER PROMPT — 30-SEC CYBERPUNK CHASE","Fantasy & Sci-Fi","premium","16:9","Cyberpunk, Neon, 8K, Chase","https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80","High speed cinematic night pursuit through futuristic Neo-Tokyo","CINEMATIC 8K ACTION ENGINE: [SUBJECT: Neon-lit hypercar drifting through rainy neon alleyways]. [ACTION: Sparks flying as a robotic enforcement drone swoops down]. [CAMERA: Low angle tracking shot, anamorphic lens 35mm f/1.4].","Low tracking 35mm lens, speed ramp","blurry, low quality, artifacts","Runway Gen-3, Kling AI","00-08s: Alley drift\\n08-20s: Drone dive\\n20-30s: Neon explosion"`,
      `"SATISFYING 3D KINETIC SCULPTURE","ASMR & Satisfying","free","16:9","ASMR, Kinetic, Marble, Relaxing","https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80","Hypnotic wooden and brass marble machine looping endlessly","HYPER-DETAILED 4K ASMR: [SUBJECT: Polished brass marbles rolling down complex wooden helical ramps, bouncing softly on tuned silicone pads in perfect rhythm]. [CAMERA: Macro 85mm lens, shallow depth of field, warm cozy studio lighting].","Motorized macro slider, slow 45-degree orbit","jittery, grainy, unnatural physics","Midjourney v6, Luma Dream Machine","00-10s: Brass elevator lift\\n10-25s: Spiral bounce cascade\\n25-30s: Chime finale"`
    ].join('\r\n');
  },

  syncGoogleSheet: async (customUrl = null) => {
    const settings = db.getSettings();
    const urlToUse = (customUrl || settings.googleSheetUrl || '').trim();
    if (!urlToUse) {
      throw new Error('No Google Sheet URL provided. Please enter your Google Sheet link or publish URL.');
    }

    const exportUrl = convertGoogleSheetUrl(urlToUse);
    console.log(`[GoogleSheetSync] Connecting to: ${exportUrl}`);

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'PromptVault-Sync-Engine/1.0',
        'Accept': 'text/csv, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet (${response.status}: ${response.statusText}). Please verify the sheet is set to "Anyone with the link can view" or "Published to the web".`);
    }

    const csvText = await response.text();
    if (!csvText || !csvText.trim()) {
      throw new Error('The downloaded Google Sheet is empty.');
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('Google Sheet must contain at least 1 header row and 1 prompt data row.');
    }

    const headerRow = rows[0];
    const colMap = mapHeaders(headerRow);

    if (colMap.title === undefined && colMap.masterPrompt === undefined) {
      throw new Error('Could not find "Title" or "Master Prompt" column in Google Sheet header.');
    }

    const existingPrompts = readJson(PROMPTS_FILE, []);
    let categories = readJson(CATEGORIES_FILE, []);
    let createdCount = 0;
    let updatedCount = 0;
    let categoriesAdded = 0;
    const newPromptsList = [...existingPrompts];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const title = colMap.title !== undefined ? (row[colMap.title] || '').trim() : '';
      const masterPrompt = colMap.masterPrompt !== undefined ? (row[colMap.masterPrompt] || '').trim() : '';
      const description = colMap.description !== undefined ? (row[colMap.description] || '').trim() : '';

      if (!title && !masterPrompt) continue; // Skip completely empty line

      const promptTitle = title || (masterPrompt.slice(0, 50) + '...');
      const catName = (colMap.category !== undefined && row[colMap.category] ? row[colMap.category].trim() : '') || 'General Prompts';

      // Auto-detect and auto-create category if new
      let existingCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!existingCat) {
        existingCat = {
          id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: catName,
          icon: getEmojiForCategory(catName)
        };
        categories.push(existingCat);
        categoriesAdded++;
      }

      const tierVal = colMap.tier !== undefined ? (row[colMap.tier] || '').toLowerCase().trim() : '';
      const tier = (tierVal === 'free') ? 'free' : 'premium';

      const aspect = colMap.aspect !== undefined && row[colMap.aspect] ? row[colMap.aspect].trim() : '16:9';
      
      // Parse tags (comma separated)
      let tags = [];
      if (colMap.tags !== undefined && row[colMap.tags]) {
        tags = row[colMap.tags].split(',').map(t => t.trim()).filter(Boolean);
      }

      // Parse tools (comma separated)
      let tools = ['Runway Gen-3', 'Kling AI'];
      if (colMap.tools !== undefined && row[colMap.tools]) {
        const parsedTools = row[colMap.tools].split(',').map(t => t.trim()).filter(Boolean);
        if (parsedTools.length > 0) tools = parsedTools;
      }

      const thumbnail = (colMap.thumbnail !== undefined && row[colMap.thumbnail]) ? 
        row[colMap.thumbnail].trim() : 
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

      const camera = colMap.camera !== undefined ? (row[colMap.camera] || '').trim() : '';
      const negativePrompt = colMap.negativePrompt !== undefined ? (row[colMap.negativePrompt] || '').trim() : '';
      const beats = colMap.beats !== undefined ? (row[colMap.beats] || '').trim() : '';

      // Check if prompt exists (match by Title case-insensitive)
      const existingIndex = newPromptsList.findIndex(p => p.title.toLowerCase() === promptTitle.toLowerCase());
      
      if (existingIndex !== -1) {
        // Smart merge / update existing prompt
        newPromptsList[existingIndex] = {
          ...newPromptsList[existingIndex],
          title: promptTitle,
          category: existingCat.name,
          tier,
          aspect,
          tags: tags.length ? tags : newPromptsList[existingIndex].tags,
          thumbnail: thumbnail || newPromptsList[existingIndex].thumbnail,
          description: description || newPromptsList[existingIndex].description,
          masterPrompt: masterPrompt || newPromptsList[existingIndex].masterPrompt,
          camera: camera || newPromptsList[existingIndex].camera,
          negativePrompt: negativePrompt || newPromptsList[existingIndex].negativePrompt,
          tools,
          beats: beats || newPromptsList[existingIndex].beats,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        updatedCount++;
      } else {
        // Create brand new prompt
        const newPrompt = {
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          title: promptTitle,
          category: existingCat.name,
          tier,
          aspect,
          tags,
          thumbnail,
          description,
          masterPrompt: masterPrompt || description,
          camera,
          negativePrompt,
          tools,
          beats,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        newPromptsList.unshift(newPrompt);
        createdCount++;
      }
    }

    // Save categories and prompts
    writeJson(CATEGORIES_FILE, categories);
    writeJson(PROMPTS_FILE, newPromptsList);

    const stats = {
      totalInSheet: rows.length - 1,
      createdCount,
      updatedCount,
      categoriesAdded,
      totalPromptsNow: newPromptsList.length,
      syncedAt: new Date().toISOString()
    };

    db.updateSettings({
      googleSheetUrl: urlToUse,
      lastSyncedAt: stats.syncedAt,
      lastSyncStats: stats
    });

    console.log(`[GoogleSheetSync] Success! Added ${createdCount}, Updated ${updatedCount}, New Categories: ${categoriesAdded}`);
    return stats;
  }
};

// ─────────────────────────────────────────────────────────────
// URL CONVERTER, CSV PARSER & HELPERS
// ─────────────────────────────────────────────────────────────
function convertGoogleSheetUrl(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();

  // If already a direct CSV export or pub link with output=csv
  if (url.includes('output=csv') || url.includes('/export?format=csv')) {
    return url;
  }

  // Handle standard edit link: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const id = match[1];
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gidParam}`;
  }

  return url;
}

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }
  return rows;
}

function mapHeaders(headerRow) {
  const map = {};
  headerRow.forEach((col, idx) => {
    const clean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['title', 'prompttitle', 'name', 'heading'].includes(clean)) map.title = idx;
    else if (['category', 'cat', 'categories', 'genre'].includes(clean)) map.category = idx;
    else if (['tier', 'access', 'plan', 'type', 'freeorpremium'].includes(clean)) map.tier = idx;
    else if (['aspect', 'aspectratio', 'ratio'].includes(clean)) map.aspect = idx;
    else if (['tags', 'tag', 'keywords', 'labels'].includes(clean)) map.tags = idx;
    else if (['thumbnail', 'thumbnailurl', 'image', 'imageurl', 'cover', 'pic'].includes(clean)) map.thumbnail = idx;
    else if (['description', 'desc', 'summary', 'about'].includes(clean)) map.description = idx;
    else if (['masterprompt', 'prompt', 'generativeprompt', 'mainprompt', 'fullprompt'].includes(clean)) map.masterPrompt = idx;
    else if (['camera', 'cameramotion', 'lens', 'angle'].includes(clean)) map.camera = idx;
    else if (['negativeprompt', 'negative', 'negativeprompts'].includes(clean)) map.negativePrompt = idx;
    else if (['tools', 'tool', 'aitools', 'model', 'models'].includes(clean)) map.tools = idx;
    else if (['beats', 'timeline', 'storybeats', 'structure'].includes(clean)) map.beats = idx;
  });
  return map;
}

function getEmojiForCategory(name) {
  if (!name) return '📁';
  const lower = name.toLowerCase();
  if (lower.includes('animal') || lower.includes('pet') || lower.includes('cat') || lower.includes('dog') || lower.includes('wildlife')) return '🐾';
  if (lower.includes('anime') || lower.includes('manga') || lower.includes('japan')) return '⛩️';
  if (lower.includes('art') || lower.includes('paint') || lower.includes('draw')) return '🎨';
  if (lower.includes('asmr') || lower.includes('satisfy')) return '🫧';
  if (lower.includes('comedy') || lower.includes('funny') || lower.includes('meme')) return '😂';
  if (lower.includes('craft') || lower.includes('diy') || lower.includes('build')) return '🔨';
  if (lower.includes('emotion') || lower.includes('inspir') || lower.includes('moti')) return '🌟';
  if (lower.includes('sci-fi') || lower.includes('scifi') || lower.includes('space') || lower.includes('fantasy') || lower.includes('cyber')) return '🚀';
  if (lower.includes('food') || lower.includes('cook') || lower.includes('chef') || lower.includes('recipe')) return '🍳';
  if (lower.includes('nature') || lower.includes('forest') || lower.includes('plant') || lower.includes('ocean')) return '🌿';
  if (lower.includes('sport') || lower.includes('action') || lower.includes('fitness') || lower.includes('gym')) return '⚡';
  if (lower.includes('horror') || lower.includes('dark') || lower.includes('ghost') || lower.includes('thriller')) return '👻';
  if (lower.includes('fashion') || lower.includes('beauty') || lower.includes('style') || lower.includes('model')) return '👗';
  if (lower.includes('tech') || lower.includes('ai') || lower.includes('robot') || lower.includes('code') || lower.includes('gaming')) return '🤖';
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('racing') || lower.includes('auto')) return '🏎️';
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('drone') || lower.includes('city')) return '✈️';
  if (lower.includes('music') || lower.includes('audio') || lower.includes('song')) return '🎵';
  if (lower.includes('money') || lower.includes('finance') || lower.includes('crypto') || lower.includes('business')) return '💰';
  if (lower.includes('portrait') || lower.includes('photo') || lower.includes('cinematic')) return '📸';
  return '📁';
}

initializeDatabase();

module.exports = db;
