const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Data rows for Prompts sheet
const headers = [
  'Title',
  'Category',
  'Tier',
  'Aspect',
  'Tags',
  'Thumbnail',
  'Description',
  'MasterPrompt',
  'Camera',
  'NegativePrompt',
  'Tools',
  'Beats'
];

const sampleData = [
  {
    Title: 'ULTRA MASTER PROMPT — 30-SEC CYBERPUNK CHASE',
    Category: 'Sci-Fi & Cyberpunk',
    Tier: 'premium',
    Aspect: '16:9',
    Tags: 'Cyberpunk, Neon, 8K, Chase, Hypercar',
    Thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    Description: 'High speed cinematic night pursuit through futuristic Neo-Tokyo with glowing neon reflections.',
    MasterPrompt: 'CINEMATIC 8K ACTION ENGINE: [SUBJECT: Neon-lit hypercar drifting through rainy neon alleyways in 2088 Neo-Tokyo]. [ACTION: Sparks flying from wet asphalt as a robotic enforcement drone swoops down from skyscrapers with cyan spotlights]. [CAMERA: Low angle tracking shot, Cooke Anamorphic lens 35mm f/1.4, volumetric fog, motion blur, 60fps ramp to 24fps]. [LIGHTING: Vibrant pink and cyan chiaroscuro backlight].',
    Camera: 'Low angle anamorphic 35mm tracking push-in, fast pan',
    NegativePrompt: 'blurry, low quality, artifacts, cartoon, 3d render look, distorted reflections',
    Tools: 'Runway Gen-3, Kling AI, Luma Dream Machine',
    Beats: '00-08s: Alley drift & neon reflections\n08-20s: Drone dive with searchlight sweep\n20-30s: Speed boost & cliffhanger turn'
  },
  {
    Title: 'HYPER-REALISTIC ASMR LIQUID CEMENT SCULPTURE',
    Category: 'DIY & Crafts',
    Tier: 'free',
    Aspect: '16:9',
    Tags: 'ASMR, Oddly Satisfying, Cement, Crafts',
    Thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    Description: 'Satisfying macro craft video showing smooth liquid cement poured into a geometric silicone mold.',
    MasterPrompt: 'HYPER-DETAILED ASMR CRAFT VIDEO: [SUBJECT: Hands in sleek silicone gloves pouring smooth pastel pearl-grey quick-set cement into an intricate silicone floral sculpture mold]. [ACTION: Fluid dynamics ultra-detailed, air bubbles rising and bursting in micro-detail. Fast cut to clean demolding with satisfying crisp edges and water cascading into a miniature illuminated fountain]. [CAMERA: Macro 100mm f/2.8 lens, top-down 45-degree angle, crystal clear studio lighting, crisp textures of stone and water droplets].',
    Camera: 'Canon 100mm Macro f/2.8, motorized slider glide',
    NegativePrompt: 'grainy, low resolution, messy borders, dull colors, unnatural liquid motion',
    Tools: 'Kling AI, Midjourney v6',
    Beats: '00-06s: Cement pour ASMR & bubble burst\n06-20s: Fast-motion demold & moss assembly\n20-30s: Water pump turned on & glowing lights reveal'
  },
  {
    Title: 'ANIME SHONEN EPIC ENERGY CLASH SHORT',
    Category: 'Anime & Manga',
    Tier: 'premium',
    Aspect: '16:9',
    Tags: 'Anime, Ufotable, Energy Clash, Shonen, 4K',
    Thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    Description: 'Dynamic high-octane anime energy duel with Ufotable style particle effects and dramatic impact frames.',
    MasterPrompt: 'UFOTABLE-STYLE ANIME SAKUGA MASTERPIECE: [SUBJECT: Two fierce elemental warriors charging towards each other over shattered floating island ruins]. [ACTION: Fiery crimson dragon aura clashing against azure lightning blade. Impact frames, dynamic camera rotation, intense kinetic particle bursts]. [STYLE: Modern cinematic anime, vibrant hand-drawn ink line weight, high-contrast digital lighting, 4K crisp line art].',
    Camera: '360-degree rotational whip-pan around energy clash point',
    NegativePrompt: 'choppy framerate, flat lighting, 3d puppet motion, low resolution, blurry lines',
    Tools: 'Midjourney v6, Seedance 2.0, Kling AI',
    Beats: '00-05s: Eye zoom & energy aura charge\n05-18s: Sprint & mid-air leap collision\n18-30s: Energy shockwave & cliffhanger explosion'
  },
  {
    Title: 'MACRO NATURE — EMERALD CHAMELEON TONGUE STRIKE',
    Category: 'Nature & Wildlife',
    Tier: 'free',
    Aspect: '9:16',
    Tags: 'Wildlife, Macro, 4K, 1000fps, National Geographic',
    Thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    Description: 'Super slow-motion 1000fps macro capture of a neon-green chameleon catching a droplet on a dew-covered leaf.',
    MasterPrompt: 'NATIONAL GEOGRAPHIC 8K ULTRA SLOW-MOTION: [SUBJECT: Hyper-detailed neon emerald chameleon perched on a vibrant rain-drenched tropical palm leaf]. [ACTION: Camera zooms into its swivel turret eyes; tongue fires in 1000fps ultra slow-motion, capturing water droplets floating like jewels in golden morning sunbeams]. [LIGHTING: Natural dappled rainforest sunlight, crystal-clear scale texture].',
    Camera: 'Phantom Flex 4K at 1000fps, 105mm macro lens',
    NegativePrompt: 'blurry, out of focus, artificial colors, stutter, deformed eyes',
    Tools: 'Runway Gen-3, Luma Dream Machine',
    Beats: '00-07s: Eye focus swivel & muscle tension\n07-16s: 1000fps tongue ballistic launch\n16-30s: Tongue retract & droplet splash in slow motion'
  }
];

// Create Prompts Worksheet
const promptRows = [headers];
sampleData.forEach(row => {
  promptRows.push(headers.map(h => row[h] || ''));
});

const wsPrompts = XLSX.utils.aoa_to_sheet(promptRows);

// Set column widths for comfortable viewing in Excel
wsPrompts['!cols'] = [
  { wch: 36 }, // Title
  { wch: 22 }, // Category
  { wch: 10 }, // Tier
  { wch: 10 }, // Aspect
  { wch: 30 }, // Tags
  { wch: 45 }, // Thumbnail
  { wch: 45 }, // Description
  { wch: 60 }, // MasterPrompt
  { wch: 35 }, // Camera
  { wch: 35 }, // NegativePrompt
  { wch: 25 }, // Tools
  { wch: 35 }  // Beats
];

// Instructions Worksheet
const instructionRows = [
  ['PROMPTVAULT — GOOGLE SHEETS & EXCEL UPLOAD FORMAT GUIDE'],
  [''],
  ['COLUMN NAME', 'REQUIRED?', 'ACCEPTED VALUES', 'DESCRIPTION & INSTRUCTIONS'],
  ['Title', 'YES (Required)', 'Text', 'The main title of the prompt. Matches existing prompts to update or creates new ones.'],
  ['Category', 'Optional', 'Any Name (e.g. Sci-Fi, Anime, Art)', 'Category name. If you type a new category that does not exist, PromptVault automatically creates it with an icon!'],
  ['Tier', 'Optional', 'free OR premium', 'Set to "free" for public view, or "premium" for VIP paid members only (locked engine). Default: premium.'],
  ['Aspect', 'Optional', '16:9, 9:16, 1:1, 4:3', 'Aspect ratio tag displayed on the prompt card. Default: 16:9.'],
  ['Tags', 'Optional', 'Comma-separated keywords', 'e.g., "Cyberpunk, Neon, 8K". Used for library search and filter tags.'],
  ['Thumbnail', 'Optional', 'Image URL (https://...)', 'URL of the prompt preview image. If empty, a high-quality fallback image is automatically assigned.'],
  ['Description', 'Optional', 'Short 1-2 sentence text', 'Quick summary displayed on the prompt card in the library.'],
  ['MasterPrompt', 'YES (Required)', 'Multiline Generative Prompt', 'The full, multi-stage generative AI prompt that users copy to Runway, Kling, Midjourney, etc.'],
  ['Camera', 'Optional', 'Camera motion / lens specs', 'Camera lens, movement, focal length (e.g. 35mm anamorphic, slow push-in, orbital pan).'],
  ['NegativePrompt', 'Optional', 'Excluded keywords', 'Negative prompt terms (e.g. blurry, low quality, artifacts, deformed).'],
  ['Tools', 'Optional', 'Comma-separated AI tools', 'e.g., "Runway Gen-3, Kling AI, Midjourney v6, Luma".'],
  ['Beats', 'Optional', 'Timeline structure', 'Optional second-by-second pacing breakdown (e.g. 00-08s: Intro, 08-20s: Climax).'],
  [''],
  ['HOW TO UPLOAD TO GOOGLE SHEETS:'],
  ['1. Open Google Sheets (https://sheets.google.com).'],
  ['2. Click File > Import > Upload, and select this PromptVault_Template.xlsx file.'],
  ['3. Edit or add rows in the "Prompts" tab.'],
  ['4. Click "Share" (top-right) > change General Access from "Restricted" to "Anyone with the link can view".'],
  ['5. Paste your Google Sheet URL into PromptVault Admin (http://localhost:3000/admin.html) and click "Sync Prompts Now"!']
];

const wsInstructions = XLSX.utils.aoa_to_sheet(instructionRows);
wsInstructions['!cols'] = [
  { wch: 20 },
  { wch: 18 },
  { wch: 30 },
  { wch: 75 }
];

// Build Workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsPrompts, 'Prompts');
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

// Save files
const projectXlsx = path.join(__dirname, 'PromptVault_Template.xlsx');
const projectCsv = path.join(__dirname, 'PromptVault_Template.csv');
const desktopDir = path.dirname(__dirname); // c:\Users\soumo\OneDrive\Desktop
const desktopXlsx = path.join(desktopDir, 'PromptVault_Template.xlsx');

XLSX.writeFile(wb, projectXlsx);
console.log('✓ Created:', projectXlsx);

// Also generate CSV of Prompts sheet
const csvContent = XLSX.utils.sheet_to_csv(wsPrompts);
fs.writeFileSync(projectCsv, csvContent, 'utf8');
console.log('✓ Created:', projectCsv);

// Copy to Desktop root for easy 1-click access
try {
  fs.copyFileSync(projectXlsx, desktopXlsx);
  console.log('✓ Copied to Desktop:', desktopXlsx);
} catch (e) {
  console.log('Note on desktop copy:', e.message);
}
