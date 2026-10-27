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

// MongoDB Cloud Persistence Schema
const storeSchema = new mongoose.Schema({ key: { type: String, unique: true }, data: mongoose.Schema.Types.Mixed });
let Store;
try {
  Store = mongoose.model('Store', storeSchema);
} catch (e) {
  Store = mongoose.model('Store');
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
  lastSyncStats: null
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Connect to MongoDB Atlas if MONGO_URI is set
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
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
    })
    .catch(err => {
      console.warn('⚠️ MongoDB Atlas connection notice (using local storage fallback):', err.message);
    });
}

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

  // Seed Prompts
  let prompts = readJson(PROMPTS_FILE, []);
  if (prompts.length === 0) {
    prompts = [
      {
        id: 'p_1',
        title: 'ULTRA MASTER PROMPT — 30-SECOND VIRAL WEDDING MYSTERY VIDEO ENGINE',
        category: 'Fantasy & Sci-Fi',
        tier: 'premium',
        aspect: '16:9',
        tags: ['Sci-Fi', 'Mystery', 'Cinematic', 'Viral Hook'],
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        description: 'High-suspense cinematic wedding reveal where the groom discovers a futuristic anomaly. Built for maximum retention and cliffhangers.',
        masterPrompt: `CINEMATIC 8K SHORT FILM ENGINE: [SUBJECT: Hyper-realistic luxury cathedral wedding, glamorous atmosphere, gentle floating dust particles in volumetric stained glass god-rays]. [ACTION: The bride reaches for the groom's hand, camera slow push-in macro shot on her fingertips glowing with ethereal cybernetic pulse circuitry]. [CAMERA: Arri Alexa 65, Cooke Anamorphic 35mm lens, shallow depth of field, f/1.4, cinematic slow motion 60fps ramped to 24fps]. [ATMOSPHERE: Suspenseful, hyper-detailed skin texture, reflective silk gown, tear glistening in 8k clarity]. [LIGHTING: Dramatic chiaroscuro with cyan & golden backlight accents].`,
        camera: 'Arri Alexa 65 Anamorphic 35mm, slow push-in to extreme macro focus pull',
        negativePrompt: 'blurry, cartoon, 3d render look, lowres, deformed hands, extra fingers, jittery motion, artifacts',
        tools: ['Runway Gen-3', 'Kling AI', 'Luma Dream Machine'],
        beats: '00-05s: Grand cathedral entrance & eye contact hook\n05-18s: Hand reach & slow-motion ring reveal\n18-30s: Cybernetic glow cliffhanger payoff',
        updatedAt: '2026-10-24'
      },
      {
        id: 'p_2',
        title: '30-SEC VIRAL 3D CGI CEMENT CRAFT & GARDEN DECOR TRANSFORMATION',
        category: 'DIY & Crafts',
        tier: 'free',
        aspect: '16:9',
        tags: ['Oddly Satisfying', 'DIY', 'Crafts', 'ASMR'],
        thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        description: 'Extremely satisfying macro transformation video showing liquid cement turning into a luxury miniature koi pond waterfall.',
        masterPrompt: `HYPER-DETAILED ASMR CRAFT VIDEO: [SUBJECT: Hands in sleek silicone gloves pouring smooth pastel pearl-grey quick-set cement into an intricate silicone floral sculpture mold]. [ACTION: Fluid dynamics ultra-detailed, air bubbles rising and bursting in micro-detail. Fast cut to clean demolding with satisfying crisp edges and water cascading into a miniature illuminated fountain]. [CAMERA: Macro 100mm f/2.8 lens, top-down 45-degree angle, crystal clear studio lighting, crisp textures of stone and water droplets].`,
        camera: 'Canon 100mm Macro f/2.8, smooth motorized slider glide',
        negativePrompt: 'grainy, low resolution, messy borders, dull colors, unnatural liquid motion',
        tools: ['Kling AI', 'Midjourney v6', 'Luma Dream Machine'],
        beats: '00-06s: Cement pour ASMR & bubble burst\n06-20s: Fast-motion demold & moss assembly\n20-30s: Water pump turned on & glowing lights reveal',
        updatedAt: '2026-10-22'
      },
      {
        id: 'p_3',
        title: 'VIRAL MACRO WILDLIFE & BEACH CREATURE BEHAVIOR ENGINE',
        category: 'Animal & Pets',
        tier: 'premium',
        aspect: '16:9',
        tags: ['Wildlife', 'Macro', '4K BBC Style', 'Nature'],
        thumbnail: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
        description: 'BBC Planet Earth style hyper-realistic macro wildlife sequence capturing a tiny golden hermit crab crafting a shell home from beach crystals.',
        masterPrompt: `BBC EARTH STYLE 8K CINEMATOGRAPHY: [SUBJECT: A tiny iridescent translucent hermit crab cautiously exploring wet golden beach sand glistening under golden hour sunset]. [ACTION: Micro waves wash over the shoreline with microscopic foam bubbles; the crab carefully inspects a polished sea glass fragment with delicate twitching antennae]. [CAMERA: Phantom Flex 4K high-speed camera, probe macro lens at sand level, natural golden hour sunlight, hyper-crisp reflections in wet sand].`,
        camera: 'Laowa 24mm Probe Lens, ground-level horizontal tracking',
        negativePrompt: 'fake cgi look, plastic texture, washed out colors, unstable frame',
        tools: ['Sora AI', 'Kling AI', 'Runway Gen-3'],
        beats: '00-08s: Giant wave crashing in slow motion & crab emerges\n08-22s: Ant-level inspection of shell crystal\n22-30s: Perfect fit & crab walks into sunset',
        updatedAt: '2026-10-20'
      },
      {
        id: 'p_4',
        title: 'MASTER PROMPT — VIRAL 3D ENGINEERING CUTAWAY EXPLAINER',
        category: 'Art & Animation',
        tier: 'premium',
        aspect: '16:9',
        tags: ['Engineering', 'Cutaway', '3D Tech', 'Explainer'],
        thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        description: 'Complex mechanical cutaway animation of a futuristic hypersonic jet engine showing combustion airflow in glowing neon thermal layers.',
        masterPrompt: `HYPER-TECHNICAL 3D CAD CINEMATIC: [SUBJECT: Futuristic scramjet engine floating in high-tech dark minimalist hangar, pristine titanium and carbon fiber exterior]. [ACTION: Seamless cross-section cutaway splits open with mechanical precision, revealing internal turbine blades spinning and supersonic air compression with glowing blue and orange thermo-fluid dynamics]. [CAMERA: Smooth 360-degree orbital camera pan, isometric to close-up perspective, subtle depth of field blur, cinematic raytraced reflections].`,
        camera: 'Cinematic 360 orbital camera motion, smooth mechanical rack-focus',
        negativePrompt: 'simplistic 2d cartoon, jittery cutaway, unrealistic physics',
        tools: ['Runway Gen-3', 'Seedance 2.0', 'Blender AI'],
        beats: '00-06s: Sleek exterior hover shot\n06-18s: Multi-layer mechanical peel & combustion cycle\n18-30s: Full thrust burst & speed particle trail',
        updatedAt: '2026-10-19'
      },
      {
        id: 'p_5',
        title: '30-SEC CINEMATIC UNDERDOG BASEBALL HERO REVERSAL ENGINE',
        category: 'Sports & Action',
        tier: 'free',
        aspect: '16:9',
        tags: ['Sports', 'Emotional', 'Slow-Motion', 'Underdog'],
        thumbnail: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=800&q=80',
        description: 'High-emotion bottom-of-the-ninth stadium drama. Rain poured down as the unlikely hitter steps up for the game-winning home run.',
        masterPrompt: `HOLLYWOOD SPORTS DRAMA CINEMA: [SUBJECT: Heavy rain pouring down in a massive floodlit stadium at midnight, intense crowd roar in slow motion]. [ACTION: Young exhausted baseball batter takes a deep breath, water droplets dripping from helmet visor. Pitcher throws 100mph fastball, slow-motion bullet time bat swing connects with explosive kinetic water spray]. [CAMERA: Phantom high-speed 1000fps camera, intense close-up on focused eyes to wide stadium blast]. [COLOR: High-contrast teal and orange cinema grade].`,
        camera: 'Speed-ramped 1000fps to 24fps dynamic whip pan',
        negativePrompt: 'flat lighting, blurry faces, distorted bat, unnatural rain physics',
        tools: ['Kling AI', 'Runway Gen-3'],
        beats: '00-08s: Rain drops on helmet & pitcher windup\n08-20s: Bullet-time ball approach & explosive contact\n20-30s: Ball sailing over stadium lights & crowd erupts',
        updatedAt: '2026-10-18'
      },
      {
        id: 'p_6',
        title: 'ULTRA MASTER PROMPT — RAW SAVANNA COMEDY INVENTION FAIL ENGINE',
        category: 'Comedy & Entertainment',
        tier: 'premium',
        aspect: '16:9',
        tags: ['Comedy', 'Viral Reels', 'Animals', 'Slapstick'],
        thumbnail: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=800&q=80',
        description: 'Clever slapstick animation where a witty meerkat attempts to build an elaborate bamboo catapult that hilariously backfires into a mud puddle.',
        masterPrompt: `PIXAR-STYLE 3D COMEDY SHORT: [SUBJECT: An expressive, determined meerkat wearing makeshift aviator goggles and a toolbelt in the golden African savanna]. [ACTION: The meerkat pulls a vine to launch a giant melon catapult; the bamboo arm snaps forward, tangles with his tail, and launches him gently in an arc into a tranquil mud bath next to a bewildered baby elephant]. [EXPRESSION: Hilarious wide-eyed realization before launch, comical splash with cartoon sound wave physics].`,
        camera: 'Wide shot into fast comical whip-zoom on meerkat face',
        negativePrompt: 'photorealistic blood, scary, grim, ugly textures, stuttering movement',
        tools: ['Seedance 2.0', 'Kling AI', 'Midjourney v6'],
        beats: '00-07s: Serious technical blueprint inspection\n07-19s: Catapult release & comical tail tangle\n19-30s: Mud puddle splash & elephant giggles',
        updatedAt: '2026-10-17'
      }
    ];
    writeJson(PROMPTS_FILE, prompts);
    console.log('✓ Prompts database initialized');
  }
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
