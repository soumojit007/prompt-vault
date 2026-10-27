/**
 * Master Prompt Library - Core Application Logic
 * Role-Based Access:
 * - Admin: Full access to add, edit, and delete master prompts via Admin Panel.
 * - Approved VIP Members: Full 1-click access and copy on all Free & Premium master engines.
 * - Regular Users / Guests: Access to Free prompts; Premium prompts are locked pending Admin approval.
 */

// Initial Seed Data (Fallback if offline)
const DEFAULT_PROMPTS = [
  {
    id: 'p-1',
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
    id: 'p-2',
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
    id: 'p-3',
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
    id: 'p-4',
    title: 'MASTER PROMPT — VIRAL 3D ENGINEERING CUTAWAY EXPLAINER',
    category: 'Tools & AI',
    tier: 'free',
    aspect: '16:9',
    tags: ['Engineering', '3D Cutaway', 'Explainer', 'Educational'],
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'Futuristic animated mechanical engineering explosion diagram showing internal turbofan jet engine operation with glowing kinetic pressure vectors.',
    masterPrompt: `TECHNICAL 3D MECHANICAL ANIMATION: [SUBJECT: Hyper-detailed cross-section cutaway of a next-generation ceramic titanium aircraft turbofan engine]. [ACTION: Outer casing smoothly splits open in mechanical symmetry, glowing emerald fuel injection streams ignite in slow motion, holographic telemetry metrics float around rotating titanium turbine blades]. [CAMERA: Orthographic technical camera revolving 360 degrees, smooth rotational inertia, crisp studio rim light].`,
    camera: '360-degree rotational turntable shot, focal length 50mm, infinite DOF',
    negativePrompt: 'amateur, inaccurate mechanics, messy explosions, chaotic motion, low polygon',
    tools: ['Runway Gen-3', 'Luma Dream Machine'],
    beats: '00-06s: Engine idle hum & casing cutaway\n06-20s: Slow 360 rotation & internal chamber ignition\n20-30s: Full thrust acceleration & telemetry HUD fade',
    updatedAt: '2026-10-18'
  },
  {
    id: 'p-5',
    title: 'HYPER-REALISTIC LUXURY JAPANESE STREET FOOD NOODLE TOSS',
    category: 'Food & Cooking',
    tier: 'premium',
    aspect: '9:16',
    tags: ['Street Food', '9:16 Reels', 'ASMR', 'Culinary'],
    thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    description: 'High-octane Tokyo night market chef executing an ultra-slow motion flaming wok noodle toss with flying chili flakes and glowing embers.',
    masterPrompt: `CULINARY 1000FPS SLOW MOTION: [SUBJECT: Master street food chef in traditional charcoal apron tossing handmade ramen noodles over a roaring kerosene wok burner at midnight in Shinjuku]. [ACTION: Noodles arc into the air surrounded by glowing amber flame licks, sesame seeds, glistening chili oil droplets, and aromatic steam billowing in backlighting]. [CAMERA: RED V-Raptor 8K at 960fps, 50mm f/1.2 lens, shallow depth of field, neon Tokyo street reflections].`,
    camera: 'RED V-Raptor 8K high speed 960fps, low angle tilted up',
    negativePrompt: 'burnt textures, artificial CGI sheen, distorted hands, flickering light',
    tools: ['Kling AI', 'Runway Gen-3'],
    beats: '00-05s: Oil sizzle macro sound & chef focus\n05-18s: Mega noodle toss in 960fps slow-motion arc\n18-30s: Flame burst illumination & bowl landing',
    updatedAt: '2026-10-15'
  },
  {
    id: 'p-6',
    title: 'ATMOSPHERIC HALLOWEEN MYSTERY NEON WALKTHROUGH',
    category: 'Fantasy & Sci-Fi',
    tier: 'free',
    aspect: '16:9',
    tags: ['Halloween', 'Atmospheric', 'Neon Horror', 'Cinematic'],
    thumbnail: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?auto=format&fit=crop&w=800&q=80',
    description: 'First-person POV cinematic walkthrough of an over-the-top suburban Halloween mansion illuminated by 50,000 synchronized purple and pumpkin orange lights.',
    masterPrompt: `FIRST-PERSON POV CINEMATIC IMMERSIVE: [SUBJECT: Atmospheric walk through a grand Victorian suburban yard on foggy Halloween evening]. [ACTION: Floating glowing Jack-o-lanterns flicker in misty trees, synchronized purple laser fog sweeps the lawn, giant friendly skeleton animatronic eyes softly ignite with warm neon amber]. [CAMERA: Steadicam gimbal smooth floating camera, 24mm wide angle, low ISO night cinematography, authentic wet asphalt light reflections].`,
    camera: 'Smooth floating Ronin 4D gimbal at eye-level walking pace',
    negativePrompt: 'shaky footage, gore, grainy noise, low dynamic range',
    tools: ['Runway Gen-3', 'Sora AI', 'Kling AI'],
    beats: '00-08s: Sidewalk gate approach & mist reveal\n08-20s: Synchronized pumpkin lighting cascade\n20-30s: Grand porch reveal & smoke blast payoff',
    updatedAt: '2026-10-12'
  }
];

// Default Category Definitions
let CATEGORIES = [
  { name: 'All Prompts', icon: '✨', key: 'all' },
  { name: 'Animal & Pets', icon: '🐾', key: 'Animal & Pets' },
  { name: 'Art & Animation', icon: '🎨', key: 'Art & Animation' },
  { name: 'ASMR & Satisfying', icon: '🫧', key: 'ASMR & Satisfying' },
  { name: 'Comedy & Entertainment', icon: '😂', key: 'Comedy & Entertainment' },
  { name: 'DIY & Crafts', icon: '🔨', key: 'DIY & Crafts' },
  { name: 'Emotional & Inspirational', icon: '🌟', key: 'Emotional & Inspirational' },
  { name: 'Fantasy & Sci-Fi', icon: '🚀', key: 'Fantasy & Sci-Fi' },
  { name: 'Food & Cooking', icon: '🍳', key: 'Food & Cooking' },
  { name: 'Nature & Wildlife', icon: '🌿', key: 'Nature & Wildlife' },
  { name: 'Sports & Action', icon: '⚡', key: 'Sports & Action' },
  { name: 'Historical & Nostalgia', icon: '🏛️', key: 'Historical & Nostalgia' },
  { name: 'Tools & AI', icon: '🤖', key: 'Tools & AI' }
];

// App State
let promptsState = [];
let currentCategory = 'all';
let currentTier = 'all';
let searchQuery = '';
let currentSort = 'newest';
let activePromptForModal = null;

// Initialize Application
async function initApp() {
  // Sync current user session
  if (window.Auth) {
    await Auth.fetchCurrentUser();
    Auth.updateNavbarAuthUI();
    setupAdminHeroBadge();
  }

  // Load live database categories & prompts
  await loadCategories();
  await loadPrompts();

  // Setup UI event listeners
  setupEventListeners();
}

// Display Admin button in hero if current user is Admin
function setupAdminHeroBadge() {
  const heroActions = document.getElementById('heroActionsContainer');
  if (heroActions && window.Auth && Auth.isAdmin()) {
    if (!document.getElementById('heroAdminShortcutBtn')) {
      const adminBtn = document.createElement('a');
      adminBtn.id = 'heroAdminShortcutBtn';
      adminBtn.href = 'admin.html';
      adminBtn.className = 'btn btn-primary';
      adminBtn.style.background = 'linear-gradient(135deg, #FA0505 0%, #B91C1C 100%)';
      adminBtn.style.boxShadow = '0 0 16px rgba(250, 5, 5, 0.4)';
      adminBtn.innerHTML = '<span>⚡</span> Admin Control Panel';
      heroActions.appendChild(adminBtn);
    }
  }
}

// Load Categories from Database API
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        CATEGORIES = [
          { name: 'All Prompts', icon: '✨', key: 'all' },
          ...data.map(c => ({
            name: c.name,
            icon: c.icon || '🎬',
            key: c.name
          }))
        ];
      }
    }
  } catch (err) {
    console.warn('Could not fetch categories from server, using defaults.', err);
  }
}

// Load Prompts from Database API with Auth Header
async function loadPrompts() {
  try {
    const headers = window.Auth ? Auth.getAuthHeader() : {};
    const res = await fetch('/api/prompts', { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        promptsState = data;
      } else {
        promptsState = [...DEFAULT_PROMPTS];
      }
    } else {
      promptsState = [...DEFAULT_PROMPTS];
    }
  } catch (err) {
    console.warn('Could not connect to /api/prompts, using fallback.', err);
    promptsState = [...DEFAULT_PROMPTS];
  }

  renderCategoryPills();
  renderPrompts();
  updateStats();
}

// Render Category Pills (Horizontal Multi-Line Wrap)
function renderCategoryPills() {
  const container = document.getElementById('categoryScroll');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const count = cat.key === 'all' 
      ? promptsState.length 
      : promptsState.filter(p => p.category === cat.key).length;

    const isActive = currentCategory === cat.key ? 'active' : '';
    const displayName = cat.key === 'all' ? 'All Categories' : cat.name;

    return `
      <button class="category-pill ${isActive}" data-cat="${cat.key}">
        <span>${escapeHtml(displayName)}</span>
        <span class="cat-count">(${count})</span>
      </button>
    `;
  }).join('');

  // Add click listeners
  container.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.getAttribute('data-cat');
      updateHeadlines();
      renderCategoryPills();
      renderPrompts();
    });
  });

  updateHeadlines();
}

// Update Active Category Headline & Count
function updateHeadlines() {
  const heading = document.getElementById('activeCategoryHeading');
  const sub = document.getElementById('activeCategorySubheading');
  const filtered = getFilteredPrompts();

  if (heading) {
    heading.textContent = currentCategory === 'all' ? 'All Prompts' : currentCategory;
  }
  if (sub) {
    sub.textContent = `${filtered.length} prompt${filtered.length === 1 ? '' : 's'}`;
  }
}

// Filter and search prompts with dynamic sort
function getFilteredPrompts() {
  let list = promptsState.filter(p => {
    // Category match
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    
    // Tier match
    const matchTier = currentTier === 'all' || p.tier === currentTier;

    // Search query match
    const query = searchQuery.trim().toLowerCase();
    const matchSearch = !query || 
      p.title.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query))) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));

    return matchCat && matchTier && matchSearch;
  });

  // Apply sorting
  if (currentSort === 'newest') {
    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  } else if (currentSort === 'oldest') {
    list.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
  } else if (currentSort === 'az') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return list;
}

// Helper: Check if prompt is locked for current visitor
function isPromptLocked(prompt) {
  if (prompt.tier === 'free') return false;
  if (!window.Auth) return true;
  if (Auth.isAdmin() || Auth.isPaid()) return false;
  return prompt.isLocked !== false;
}

// Render Prompts Grid
function renderPrompts() {
  const grid = document.getElementById('promptsGrid');
  const countTag = document.getElementById('promptsCountTag');
  if (!grid) return;

  const filtered = getFilteredPrompts();
  if (countTag) {
    countTag.textContent = `Showing ${filtered.length} of ${promptsState.length} Master Prompts`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No Master Prompts Found</h3>
        <p style="color: var(--text-muted); margin: 8px 0 16px;">Try adjusting your search terms or category filter.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const locked = isPromptLocked(item);
    return `
      <article class="prompt-card" onclick="openPromptDetail('${item.id}')">
        <div class="prompt-card-media">
          <img class="prompt-card-img" src="${item.thumbnail}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'">
          <div class="prompt-card-overlay">
            <div class="card-top-badges">
              <span class="aspect-badge">📐 ${item.aspect || '16:9'}</span>
              <span class="tier-badge ${item.tier}">
                ${item.tier === 'free' ? '🎁 FREE' : (locked ? '🔒 VIP LOCKED' : '⭐ VIP UNLOCKED')}
              </span>
            </div>
            <div class="card-bottom-tags">
              ${(item.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="prompt-card-body">
          <span class="card-category">${escapeHtml(item.category)}</span>
          <h3 class="prompt-card-title">${escapeHtml(item.title)}</h3>
          <p class="prompt-card-desc">${escapeHtml(item.description)}</p>
          <div class="prompt-card-footer">
            <span class="card-date">🕒 ${item.updatedAt || 'Recent'}</span>
            <button class="card-btn" onclick="event.stopPropagation(); openPromptDetail('${item.id}')">
              ${item.tier === 'free' ? 'Copy Prompt →' : (locked ? '🔒 Unlock VIP →' : 'Master Engine →')}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Reset filters
window.resetFilters = function() {
  currentCategory = 'all';
  currentTier = 'all';
  searchQuery = '';
  currentSort = 'newest';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const filterSearch = document.getElementById('promptsFilterSearch');
  if (filterSearch) filterSearch.value = '';
  const sortSelect = document.getElementById('promptsSortSelect');
  if (sortSelect) sortSelect.value = 'newest';

  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-type') === 'all');
  });

  updateHeadlines();
  renderCategoryPills();
  renderPrompts();
};

window.handleSortChange = function(e) {
  currentSort = e.target.value;
  renderPrompts();
};

window.applySearchFilter = function() {
  const input = document.getElementById('promptsFilterSearch');
  if (input) {
    searchQuery = input.value.trim();
    renderPrompts();
    updateHeadlines();
  }
};

// Open Prompt Detail Modal
window.openPromptDetail = function(id) {
  const prompt = promptsState.find(p => p.id === id);
  if (!prompt) return;

  activePromptForModal = prompt;
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('detailModalBody');
  if (!modal || !body) return;

  const locked = isPromptLocked(prompt);
  const isAdmin = window.Auth && Auth.isAdmin();

  let promptContentHtml = '';
  let footerButtonsHtml = '';

  if (locked) {
    // 🔒 Locked View for unauthorized users
    promptContentHtml = `
      <div class="prompt-locked-wrapper">
        <div class="prompt-code-block prompt-locked-blurred">
          <div class="prompt-code-header">
            <span class="prompt-code-title">🎬 Master Generative Engine Prompt</span>
          </div>
          <div class="prompt-content-text">${escapeHtml(prompt.masterPrompt || 'CINEMATIC 8K VIDEO ENGINE: [SUBJECT: Master prompt hidden for VIP members...]')}</div>
        </div>
        <div class="prompt-locked-overlay">
          <div class="locked-shield-icon">🔒</div>
          <h3 style="font-size: 20px; margin-bottom: 6px;">VIP Approved Members Only</h3>
          <p style="color: var(--text-muted); font-size: 13.5px; max-width: 480px; margin-bottom: 16px;">
            This multi-stage viral video prompt and cinematic parameters are reserved for approved VIP members.
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            <button class="btn btn-primary" onclick="openPricingModal()">⭐ Get VIP Membership</button>
            ${!window.Auth || !Auth.isLoggedIn() ? '<a href="login.html" class="btn btn-secondary">Sign In / Register</a>' : ''}
          </div>
        </div>
      </div>

      <!-- Technical Specifications (Masked) -->
      <div class="specs-grid">
        <div class="spec-item">
          <div class="spec-label">🎥 Camera & Lens Motion</div>
          <div class="spec-value" style="color: var(--text-muted); font-style: italic;">🔒 Locked for VIP members</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">⚡ Negative Prompt</div>
          <div class="spec-value" style="color: var(--text-muted); font-style: italic;">🔒 Locked for VIP members</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🛠️ Recommended AI Video Tools</div>
          <div class="spec-value">${(prompt.tools || ['Runway Gen-3', 'Kling AI']).join(', ')}</div>
        </div>
      </div>
    `;

    footerButtonsHtml = `
      <div style="display: flex; gap: 10px; margin-top: 24px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="closeModals()">Close</button>
        <button class="btn btn-primary" onclick="openPricingModal()">⭐ Upgrade to Unlock</button>
      </div>
    `;
  } else {
    // ⭐ Unlocked View (Free prompts OR Approved VIP / Admin)
    promptContentHtml = `
      <!-- Master Prompt Box with Copy Button -->
      <div class="prompt-code-block">
        <div class="prompt-code-header">
          <span class="prompt-code-title">🎬 Master Generative Engine Prompt</span>
          <button class="btn btn-primary" style="padding: 6px 16px; font-size: 13px;" onclick="copyActivePrompt()">
            📋 Copy Master Prompt
          </button>
        </div>
        <div class="prompt-content-text" id="activePromptCode">${escapeHtml(prompt.masterPrompt)}</div>
      </div>

      <!-- Technical Specifications -->
      <div class="specs-grid">
        <div class="spec-item">
          <div class="spec-label">🎥 Camera & Lens Motion</div>
          <div class="spec-value">${escapeHtml(prompt.camera || 'Cinematic wide lens with smooth slow-motion rack focus')}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">⚡ Negative Prompt</div>
          <div class="spec-value">${escapeHtml(prompt.negativePrompt || 'blurry, distorted, low quality, cartoon, artifacts')}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🛠️ Recommended AI Video Tools</div>
          <div class="spec-value">${(prompt.tools || ['Runway Gen-3', 'Kling AI', 'Luma']).join(', ')}</div>
        </div>
      </div>

      <!-- Scene Breakdown / Beats -->
      ${prompt.beats ? `
        <div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-top: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 6px;">
            ⏱️ 30-Second Scene Breakdown / Timing Beats
          </div>
          <pre style="font-family: inherit; font-size: 13px; color: var(--text-muted); white-space: pre-wrap;">${escapeHtml(prompt.beats)}</pre>
        </div>
      ` : ''}
    `;

    footerButtonsHtml = `
      <div style="display: flex; gap: 10px; margin-top: 24px; justify-content: flex-end; flex-wrap: wrap;">
        ${isAdmin ? `
          <button class="btn btn-secondary" onclick="editPrompt('${prompt.id}')">✏️ Edit (Admin)</button>
          <button class="btn btn-secondary" style="color: #F87171; border-color: rgba(248, 113, 113, 0.4);" onclick="deletePrompt('${prompt.id}')">🗑️ Delete (Admin)</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="closeModals()">Close</button>
        <button class="btn btn-primary" onclick="copyActivePrompt()">📋 Quick Copy</button>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="detail-media-wrap">
      <img class="detail-media-img" src="${prompt.thumbnail}" alt="${escapeHtml(prompt.title)}" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'">
    </div>

    <div class="detail-meta-row">
      <span class="tier-badge ${prompt.tier}">
        ${prompt.tier === 'free' ? '🎁 FREE PROMPT' : (locked ? '🔒 VIP LOCKED' : '⭐ PREMIUM MASTER ENGINE')}
      </span>
      <span class="aspect-badge">📐 ${prompt.aspect || '16:9'}</span>
      <span style="color: var(--primary); font-weight: 700;">📂 ${escapeHtml(prompt.category)}</span>
      <span style="color: var(--text-faint); font-size: 13px;">Updated: ${prompt.updatedAt || 'Recently'}</span>
    </div>

    <h2 style="font-size: 22px; margin-bottom: 12px; line-height: 1.3;">${escapeHtml(prompt.title)}</h2>
    <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 14.5px;">${escapeHtml(prompt.description)}</p>

    ${promptContentHtml}
    ${footerButtonsHtml}
  `;

  modal.classList.add('active');
};

// Copy prompt text
window.copyActivePrompt = function() {
  if (!activePromptForModal) return;

  if (isPromptLocked(activePromptForModal)) {
    openPricingModal();
    return;
  }

  navigator.clipboard.writeText(activePromptForModal.masterPrompt).then(() => {
    showToast('✨ Master Prompt copied to clipboard!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = activePromptForModal.masterPrompt;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('✨ Master Prompt copied to clipboard!');
  });
};

// Delete Prompt (Admin Only)
window.deletePrompt = async function(id) {
  if (!window.Auth || !Auth.isAdmin()) {
    alert('Access Denied. Only the Administrator can delete prompts.');
    return;
  }

  if (!confirm('Are you sure you want to permanently delete this master prompt from the database?')) return;

  try {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeader()
    });

    if (res.ok) {
      showToast('🗑️ Master prompt deleted successfully.');
      closeModals();
      await loadPrompts();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to delete prompt.');
    }
  } catch (err) {
    alert('Network error while deleting prompt.');
  }
};

// Edit Prompt (Admin Only)
window.editPrompt = function(id) {
  if (!window.Auth || !Auth.isAdmin()) {
    alert('Access Denied. Only the Administrator can edit prompts.');
    return;
  }

  // Redirect Admin to the Admin Panel prompt editor
  window.location.href = `admin.html?edit=${encodeURIComponent(id)}`;
};

// Live Payment Settings
let currentPaymentSettings = {
  upiId: '6289357399@upi',
  payeeName: 'PromptVault Creator',
  vipPrice: '499',
  whatsappNumber: '+91 6289357399',
  upiQrImage: ''
};
let vipScreenshotBase64 = null;

async function fetchCurrentPaymentSettings() {
  try {
    const res = await fetch('/api/payment-settings');
    if (res.ok) {
      currentPaymentSettings = await res.json();
    }
  } catch (err) {}
}

// Open VIP Pricing / Payout Modal
window.openPricingModal = async function() {
  const modal = document.getElementById('pricingModal');
  const statusBox = document.getElementById('vipUserStatusBox');
  const waBtn = document.getElementById('vipContactAdminBtn');
  if (!modal) return;

  await fetchCurrentPaymentSettings();

  const upiIdEl = document.getElementById('vipModalUpiIdText');
  const payeeEl = document.getElementById('vipModalPayeeTag');
  const priceEl = document.getElementById('vipModalPriceTag');
  const qrImg = document.getElementById('vipModalQrImg');

  if (upiIdEl) upiIdEl.textContent = currentPaymentSettings.upiId || '6289357399@upi';
  if (payeeEl) payeeEl.textContent = `Payee: ${currentPaymentSettings.payeeName || 'PromptVault Creator'}`;
  if (priceEl) priceEl.innerHTML = `₹${currentPaymentSettings.vipPrice || '499'} <span style="font-size: 13px; color: var(--text-muted); font-weight: 400;">(30 Days Plan)</span>`;

  if (qrImg) {
    if (currentPaymentSettings.upiQrImage) {
      qrImg.src = currentPaymentSettings.upiQrImage;
    } else {
      const qrData = encodeURIComponent(`upi://pay?pa=${currentPaymentSettings.upiId || '6289357399@upi'}&pn=${currentPaymentSettings.payeeName || 'PromptVault'}&am=${currentPaymentSettings.vipPrice || '499'}&cu=INR`);
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
    }
  }

  const user = window.Auth ? Auth.getUser() : null;
  const cleanPhone = (currentPaymentSettings.whatsappNumber || '916289357399').replace(/[^0-9]/g, '');

  if (user) {
    const statusText = user.role === 'admin' 
      ? 'Administrator'
      : (user.status === 'active_paid' ? '⭐ Active VIP Member (30 Days)' : (user.status === 'pending' ? '🕒 Pending Verification' : 'Free User'));

    if (statusBox) {
      statusBox.innerHTML = `
        <div style="font-size: 13.5px; margin-bottom: 4px;">
          Account: <b>${escapeHtml(user.email)}</b>
        </div>
        <div style="font-size: 12.5px; color: var(--text-muted);">
          Status: <span style="font-weight:700; color: ${user.status === 'active_paid' ? '#10B981' : '#F59E0B'};">${statusText}</span>
        </div>
      `;
    }

    if (waBtn) {
      const msg = encodeURIComponent(`Hi Admin, I have an account on PromptVault (${user.email}). I want to confirm my UPI payment of ₹${currentPaymentSettings.vipPrice || '499'} for the 30 Days VIP Plan.`);
      waBtn.href = `https://wa.me/${cleanPhone}?text=${msg}`;
      waBtn.innerHTML = `<span>💬</span> Confirm on WhatsApp (${currentPaymentSettings.whatsappNumber || '+91 6289357399'})`;
    }
  } else {
    if (statusBox) {
      statusBox.innerHTML = `
        <div style="font-size: 13.5px; margin-bottom: 4px;">
          Browsing as: <b>Guest</b>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
          Please sign in or register so your payment can be linked to your account.
        </p>
        <a href="login.html?tab=signup" class="btn btn-primary" style="padding: 6px 16px; font-size: 12px; display: inline-block;">
          Sign Up / Login First →
        </a>
      `;
    }

    if (waBtn) {
      const msg = encodeURIComponent(`Hi Admin, I want to get the 30 Days VIP Plan on PromptVault.`);
      waBtn.href = `https://wa.me/${cleanPhone}?text=${msg}`;
      waBtn.innerHTML = `<span>💬</span> Contact WhatsApp (${currentPaymentSettings.whatsappNumber || '+91 6289357399'})`;
    }
  }

  modal.classList.add('active');
};

// Copy VIP UPI ID to clipboard
window.copyVipUpiId = function() {
  const upiId = (document.getElementById('vipModalUpiIdText')?.textContent || '6289357399@upi').trim();
  navigator.clipboard.writeText(upiId).then(() => {
    showToast('✨ UPI ID copied: ' + upiId);
  }).catch(() => {
    alert('UPI ID: ' + upiId);
  });
};

// Handle Payment Screenshot Upload
window.handleVipScreenshotPick = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const nameEl = document.getElementById('vipFileName');
  if (nameEl) nameEl.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (evt) => {
    vipScreenshotBase64 = evt.target.result;
    const preview = document.getElementById('vipProofPreview');
    if (preview) {
      preview.src = vipScreenshotBase64;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
};

// Submit Payment for Verification
window.handleVipPaymentSubmit = async function(e) {
  e.preventDefault();

  if (!window.Auth || !Auth.isLoggedIn()) {
    alert('Please sign in or create an account first so your VIP activation can be tied to your email!');
    window.location.href = 'login.html?tab=signup';
    return;
  }

  const paymentRef = document.getElementById('vipRefInput').value.trim();
  const btn = document.getElementById('vipSubmitVerifyBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch('/api/payment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Auth.getAuthHeader() },
      body: JSON.stringify({
        paymentRef,
        paymentScreenshot: vipScreenshotBase64,
        plan: '30_days'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('🎉 Payment submitted! Admin will verify your email shortly.');
      const statusBox = document.getElementById('vipUserStatusBox');
      if (statusBox) {
        statusBox.innerHTML = `
          <div style="color: #10B981; font-weight: 700; margin-bottom: 4px;">
            ✅ Verification Details Submitted!
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            Reference: <b>${escapeHtml(paymentRef)}</b>. The Administrator will approve your account.
          </div>
        `;
      }
      btn.textContent = '✅ Submitted';
      setTimeout(() => closeModals(), 2500);
    } else {
      alert(data.error || 'Failed to submit payment verification.');
      btn.disabled = false;
      btn.textContent = '🚀 Submit Payment for VIP Verification';
    }
  } catch (err) {
    alert('Server connection error.');
    btn.disabled = false;
    btn.textContent = '🚀 Submit Payment for VIP Verification';
  }
};

// Close all active modals
window.closeModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  activePromptForModal = null;
};

// Toast notification
window.showToast = function(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

// Update Stats
function updateStats() {
  const totalCount = document.getElementById('totalPromptsCount');
  const catCount = document.getElementById('totalCatsCount');
  if (totalCount) totalCount.textContent = `${promptsState.length}+ Master Prompts`;
  if (catCount) catCount.textContent = `${CATEGORIES.length - 1} Categories`;
}

// Setup Event Listeners
function setupEventListeners() {
  // Search input live filter
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) searchClear.style.display = searchQuery ? 'block' : 'none';
      renderPrompts();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      renderPrompts();
    });
  }

  // Filter section search input & live typing
  const filterSearch = document.getElementById('promptsFilterSearch');
  if (filterSearch) {
    filterSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      const navInput = document.getElementById('searchInput');
      if (navInput) navInput.value = searchQuery;
      renderPrompts();
      updateHeadlines();
    });

    filterSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applySearchFilter();
      }
    });
  }

  // Type buttons (All / Free / Premium)
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTier = btn.getAttribute('data-type');
      renderPrompts();
      updateHeadlines();
    });
  });

  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme_preference', next);
    });
  }

  // Restore theme
  const savedTheme = localStorage.getItem('theme_preference');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Close modals on escape key or backdrop click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModals();
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initApp);
