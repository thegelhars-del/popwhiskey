/* ============================================================
 *  SHARED CHROME — nav + footer injected on every page.
 *  EDIT THE NAV IN ONE PLACE: the NAV_ITEMS list just below.
 * ============================================================ */
var NAV_ITEMS = [
  { label: 'About',          href: '/' },
  { label: 'Dispatches',     href: '/dispatches/' },
  { label: 'The March',      href: '/march' },
  { label: 'The Membership', href: '/membership' },
  { label: 'The Ladies&rsquo; Auxiliary', href: '/auxiliary' },
  { label: 'Wall of Shame',  href: '/shame' },
  { label: 'Aspirancy',      href: '/aspirancy' },
  { label: 'Events',         href: '/events' },
  { label: 'The Open',       href: '/open' },
  { label: 'Oracle',         href: '/oracle' },
  { label: 'Cellar',         href: '/cellar' },
  { label: 'Join',           href: '/join' },
  { label: 'Inner Sanctum',  href: '/members/' }
];
function buildChrome() {
  var here = location.pathname.replace(/index\.html$/, '') || '/';
  var navLinks = NAV_ITEMS.map(function (it) {
    var target = it.href.replace(/index\.html$/, '') || '/';
    var active = (target === here) ? ' class="active"' : '';
    return '<li><a href="' + it.href + '"' + active + ' onclick="closeNav()">' + it.label + '</a></li>';
  }).join('');
  var nav = document.createElement('nav');
  nav.id = 'navbar';
  nav.innerHTML =
    '<a href="/" class="nav-brand">PWSOW</a>' +
    '<ul class="nav-links" id="nav-links">' + navLinks + '</ul>' +
    '<button class="nav-toggle" id="nav-toggle" onclick="toggleNav()" aria-label="Menu">' +
    '<span></span><span></span><span></span></button>';
  document.body.insertBefore(nav, document.body.firstChild);

  var footer = document.createElement('footer');
  footer.innerHTML =
    '<div class="footer-name">Pop Whiskey Society of Wisconsin</div>' +
    '<div class="footer-motto">In Aqua Vitae Veritas</div>' +
    '<ul class="footer-links">' + navLinks.replace(/ onclick="closeNav\(\)"/g, '') + '</ul>' +
    '<div class="footer-copy">&copy; 2025 Pop Whiskey Society of Wisconsin &middot; Wausau, WI &middot; Est. 2019</div>';
  document.body.appendChild(footer);
}
document.addEventListener('DOMContentLoaded', buildChrome);

// ─── GATE ─────────────────────────────────────────────────────
function checkGate() {
  const input = document.getElementById('gate-input').value.toLowerCase().trim();
  const error = document.getElementById('gate-error');
  if (input === 'peterman1') {
    document.getElementById('gate').classList.add('hidden');
    document.body.style.overflow = '';
  } else {
    error.textContent = 'The Society does not recognize that passphrase.';
    document.getElementById('gate-input').value = '';
    setTimeout(() => { error.textContent = ''; }, 3000);
  }
}
var _gi = document.getElementById('gate-input');
if (_gi) _gi.addEventListener('keydown', function(e){ if (e.key === 'Enter') checkGate(); });
// gate disabled

// ─── NAV ──────────────────────────────────────────────────────
window.addEventListener('scroll', function() {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});
function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
}
function closeNav() {
  document.getElementById('nav-links').classList.remove('open');
}

// ─── BYLAWS ACCORDION ─────────────────────────────────────────
function toggleBylaw(btn) {
  const body = btn.nextElementSibling;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.bylaw-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.bylaw-header').forEach(b => b.classList.remove('open'));
  if (!isOpen) {
    body.classList.add('open');
    btn.classList.add('open');
  }
}

// ─── RSVP MODAL ───────────────────────────────────────────────
function openRsvp(eventName) {
  document.getElementById('modal-event-name').textContent = eventName;
  document.getElementById('rsvp-modal').classList.add('active');
}
function closeRsvp() {
  document.getElementById('rsvp-modal').classList.remove('active');
}
var _rm = document.getElementById('rsvp-modal');
if (_rm) _rm.addEventListener('click', function(e){ if (e.target === this) closeRsvp(); });

// ─── ORACLE SLOT MACHINE ─────────────────────────────────────
const oracleWhiskeys = [
  // ── SCOTCH: Speyside ──
  { name: 'Glenfarclas 12yr', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Sherried', reelCharacter: 'Rich & Indulgent',
    notes: 'The Oracle speaks: indulgence is not a sin tonight, it is a sacrament. The sherry cask has spoken. Let dried fruit and dark spice carry you where logic cannot follow.' },
  { name: 'Balvenie DoubleWood 12yr', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Double Cask', reelCharacter: 'Honey & Fruit',
    notes: 'The Oracle speaks: you stand at a crossroads. Two casks shaped this spirit, and two paths lie before you. Choose the sweeter one. You will not regret it.' },
  { name: 'Glenfiddich 15yr', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Solera Vatted', reelCharacter: 'Honey & Fruit',
    notes: 'The Oracle speaks: layers upon layers have brought you here. The solera vat rewards the patient. Tonight, let accumulated wisdom pour freely.' },
  { name: 'Macallan 18yr', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Sherried', reelCharacter: 'Rich & Indulgent',
    notes: 'The Oracle speaks: tonight calls for majesty. The Macallan 18 is not a casual pour. It is a coronation in a glass. Treat the occasion as royalty demands.' },
  { name: 'Aberlour A\'bunadh', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Cask Strength', reelCharacter: 'Dark Chocolate & Cherry',
    notes: 'The Oracle speaks: cast aside the training wheels. Full strength, full flavour, full commitment. The cask has given everything. You must do the same.' },
  { name: 'Glenlivet 18yr', region: 'Speyside, Scotland', reelOrigin: 'Speyside', reelStyle: 'Sherried', reelCharacter: 'Tropical & Floral',
    notes: 'The Oracle speaks: elegance requires no announcement. The Glenlivet 18 enters quietly and leaves a lasting impression. Be the whiskey tonight.' },

  // ── SCOTCH: Islay ──
  { name: 'Ardbeg 10yr', region: 'Islay, Scotland', reelOrigin: 'Islay', reelStyle: 'Peated', reelCharacter: 'Smoke & Brine',
    notes: 'The Oracle speaks: abandon caution. The medicinal smoke and brine of Ardbeg is for those who meet the night without flinching. You were chosen for a reason.' },
  { name: 'Laphroaig Quarter Cask', region: 'Islay, Scotland', reelOrigin: 'Islay', reelStyle: 'Peated', reelCharacter: 'Smoke & Brine',
    notes: 'The Oracle speaks: there is a storm coming. Let the iodine and seaweed of Laphroaig be your anchor. This is whiskey for those who do not seek shelter.' },
  { name: 'Lagavulin 16yr', region: 'Islay, Scotland', reelOrigin: 'Islay', reelStyle: 'Peated', reelCharacter: 'Smoke & Dried Fruit',
    notes: 'The Oracle speaks: patience is its own reward. Sixteen years of waiting produced this majesty. Whatever you are waiting for, it too shall arrive. Sip slowly.' },
  { name: 'Bruichladdich Classic Laddie', region: 'Islay, Scotland', reelOrigin: 'Islay', reelStyle: 'Unpeated', reelCharacter: 'Citrus & Malt',
    notes: 'The Oracle speaks: defy expectations. An unpeated Islay? Heresy, they said. Genius, you will say. The maverick path was always yours.' },

  // ── SCOTCH: Highland ──
  { name: 'Oban 14yr', region: 'West Highland, Scotland', reelOrigin: 'Highland', reelStyle: 'Lightly Peated', reelCharacter: 'Sea Salt & Honey',
    notes: 'The Oracle speaks: seek the in-between. Oban lives where Highland meets coast, honey and brine in harmony. Tonight, find your own middle ground.' },
  { name: 'Glenmorangie 10yr', region: 'Highland, Scotland', reelOrigin: 'Highland', reelStyle: 'Bourbon Cask', reelCharacter: 'Vanilla & Citrus',
    notes: 'The Oracle speaks: do not mistake gentleness for weakness. The tall stills of Glenmorangie create a spirit of rare delicacy. Be both gentle and mighty tonight.' },
  { name: 'Dalmore 15yr', region: 'Highland, Scotland', reelOrigin: 'Highland', reelStyle: 'Sherried', reelCharacter: 'Orange & Dark Chocolate',
    notes: 'The Oracle speaks: the stag stands proud upon the label and so shall you. Marmalade and cocoa await. This is a dram for declarations, not whispers.' },

  // ── SCOTCH: Lowland & Campbeltown ──
  { name: 'Auchentoshan Three Wood', region: 'Lowland, Scotland', reelOrigin: 'Lowland', reelStyle: 'Triple Cask', reelCharacter: 'Toffee & Plum',
    notes: 'The Oracle speaks: triple distilled, triple casked, triple blessed. The Lowlands speak softly, but their words are honeyed. Listen closely tonight.' },
  { name: 'Springbank 10yr', region: 'Campbeltown, Scotland', reelOrigin: 'Campbeltown', reelStyle: 'Lightly Peated', reelCharacter: 'Maritime & Nutty',
    notes: 'The Oracle speaks: from the smallest whiskey town comes the biggest character. Salt air and barley malt conspire. Do not underestimate the underdog tonight.' },

  // ── BOURBON ──
  { name: 'Woodford Reserve', region: 'Versailles, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Cherry & Spice',
    notes: 'The Oracle speaks: tonight is for conversation. The cherry and spice of Woodford invites dialogue, disagreement, and ultimately, accord.' },
  { name: 'Maker\'s Mark', region: 'Loretto, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Wheated Bourbon', reelCharacter: 'Vanilla & Caramel',
    notes: 'The Oracle speaks: do not overthink it. Maker\'s Mark reminds us that excellence need not be complicated. Pour. Enjoy. Repeat.' },
  { name: 'Buffalo Trace', region: 'Frankfort, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Vanilla & Caramel',
    notes: 'The Oracle speaks: the mighty buffalo carved trails through the wilderness. Tonight, you too shall forge a new path. This dram marks the beginning.' },
  { name: 'Wild Turkey 101', region: 'Lawrenceburg, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'High Proof Bourbon', reelCharacter: 'Bold Spice & Oak',
    notes: 'The Oracle speaks: 101 proof is not a suggestion, it is a declaration of intent. The bold are rewarded. The meek get water.' },
  { name: 'Elijah Craig Small Batch', region: 'Bardstown, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Oak & Vanilla',
    notes: 'The Oracle speaks: the reverend who charred the first barrel did so by accident. Happy accidents await you tonight. Keep your glass ready.' },
  { name: 'Four Roses Single Barrel', region: 'Lawrenceburg, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Berry & Baking Spice',
    notes: 'The Oracle speaks: a single barrel, a singular moment. Each bottle is unique, just as each night is unrepeatable. Savour this one.' },
  { name: 'Knob Creek 9yr', region: 'Clermont, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Toasted Oak & Maple',
    notes: 'The Oracle speaks: boldness has a flavour. It tastes of charred oak and sweet maple. Knob Creek does not whisper. Neither should you.' },
  { name: 'Angel\'s Envy', region: 'Louisville, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Port Finished Bourbon', reelCharacter: 'Cherry & Vanilla',
    notes: 'The Oracle speaks: even angels weep for what they cannot taste. The port finish adds a celestial sweetness. You are more fortunate than you know.' },
  { name: 'Blanton\'s Single Barrel', region: 'Frankfort, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Caramel & Citrus',
    notes: 'The Oracle speaks: the jockey atop the bottle rides toward glory. Follow where it leads. Tonight, you are the favourite to win.' },
  { name: 'Evan Williams Single Barrel', region: 'Bardstown, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Honey & Leather',
    notes: 'The Oracle speaks: some treasures hide behind modest labels. Evan Williams proves that substance need not shout. The quiet ones run deep.' },
  { name: 'George Dickel Bottled in Bond', region: 'Tullahoma, Tennessee', reelOrigin: 'Tennessee', reelStyle: 'Tennessee Whiskey', reelCharacter: 'Butterscotch & Mineral',
    notes: 'The Oracle speaks: the chill charcoal mellowing has smoothed the way. Cross the Tennessee line tonight and discover what Southern patience yields.' },
  { name: 'Russell\'s Reserve 10yr', region: 'Lawrenceburg, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Bourbon', reelCharacter: 'Toffee & Dried Fruit',
    notes: 'The Oracle speaks: the Russells have been at this for generations. Ten years in the barrel, a lifetime of craft. Respect the elders tonight.' },

  // ── RYE ──
  { name: 'Rittenhouse Rye BiB', region: 'Bardstown, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Rye', reelCharacter: 'Pepper & Cinnamon',
    notes: 'The Oracle speaks: there is fire on the horizon. Rye pepper crackles on the palate like embers. Rittenhouse is the spark that lights the evening.' },
  { name: 'Bulleit Rye', region: 'Lawrenceburg, Indiana', reelOrigin: 'Indiana', reelStyle: 'Rye', reelCharacter: 'Cherry & Spice',
    notes: 'The Oracle speaks: the frontier spirit lives in every sip. Rye and spice, the original rebel grain. Raise a glass to the unconventional path.' },
  { name: 'WhistlePig 10yr', region: 'Shoreham, Vermont', reelOrigin: 'Vermont', reelStyle: 'Rye', reelCharacter: 'Caramel & Dill',
    notes: 'The Oracle speaks: from the Green Mountains comes liquid audacity. Ten years of Vermont winters forged this bold rye. Warmth comes to those who wait.' },
  { name: 'Sazerac Rye', region: 'Frankfort, Kentucky', reelOrigin: 'Kentucky', reelStyle: 'Rye', reelCharacter: 'Anise & Pepper',
    notes: 'The Oracle speaks: New Orleans pours this for a reason. The Sazerac cocktail demands it. But tonight, sip it neat and hear the jazz play itself.' },
  { name: 'High West Double Rye', region: 'Park City, Utah', reelOrigin: 'Utah', reelStyle: 'Blended Rye', reelCharacter: 'Mint & Cinnamon',
    notes: 'The Oracle speaks: two ryes blended on a mountaintop. The elevation changes everything. Let the alpine air of Park City fill your glass.' },
  { name: 'Pikesville Rye', region: 'Baltimore, Maryland', reelOrigin: 'Maryland', reelStyle: 'Rye', reelCharacter: 'Rich Spice & Caramel',
    notes: 'The Oracle speaks: Maryland once ruled the rye world. Pikesville carries that torch with grace and fire. Old traditions burn brightest tonight.' },

  // ── IRISH ──
  { name: 'Redbreast 12yr', region: 'Midleton, Ireland', reelOrigin: 'Ireland', reelStyle: 'Single Pot Still', reelCharacter: 'Honey & Fruit',
    notes: 'The Oracle speaks: the pot still is Ireland\'s gift to the world. Creamy, fruity, impossibly smooth. Redbreast is the robin that sings at twilight.' },
  { name: 'Green Spot', region: 'Midleton, Ireland', reelOrigin: 'Ireland', reelStyle: 'Single Pot Still', reelCharacter: 'Apple & Toasted Barley',
    notes: 'The Oracle speaks: a green daub on the barrel marked this for greatness. Orchard fruit and toasted grain intertwine. Ireland at its most charming.' },
  { name: 'Teeling Single Grain', region: 'Dublin, Ireland', reelOrigin: 'Ireland', reelStyle: 'Wine Finished', reelCharacter: 'Tropical & Vanilla',
    notes: 'The Oracle speaks: Dublin\'s newest distillery honors the old ways with new tricks. Wine cask magic transforms grain into gold. The Emerald Isle surprises.' },
  { name: 'Writers\' Tears Copper Pot', region: 'Carlow, Ireland', reelOrigin: 'Ireland', reelStyle: 'Blended', reelCharacter: 'Honey & Green Apple',
    notes: 'The Oracle speaks: Irish poets wept not from sorrow but from beauty. This blend weeps honey and apple. Let prose, not logic, guide you tonight.' },
  { name: 'Tyrconnell 10yr Madeira', region: 'Cooley, Ireland', reelOrigin: 'Ireland', reelStyle: 'Madeira Finished', reelCharacter: 'Raisin & Spice',
    notes: 'The Oracle speaks: from the cool Cooley Peninsula, a malt kissed by Madeira wine. The underdog of Irish whiskey punches with quiet elegance tonight.' },

  // ── JAPANESE ──
  { name: 'Nikka From the Barrel', region: 'Yoichi/Miyagikyo, Japan', reelOrigin: 'Japan', reelStyle: 'Blended', reelCharacter: 'Oak & Marmalade',
    notes: 'The Oracle speaks: East meets West in a flask of perfection. Nikka\'s barrel-proof blend cuts through pretension like a katana. Precision is your mantra tonight.' },
  { name: 'Hakushu 12yr', region: 'Hakushu, Japan', reelOrigin: 'Japan', reelStyle: 'Lightly Peated', reelCharacter: 'Herbal & Green',
    notes: 'The Oracle speaks: from the Japanese Alps, a forest in a glass. Bamboo, mint, and gentle smoke. The mountain hermit whispers wisdom. Be still and listen.' },
  { name: 'Suntory Toki', region: 'Osaka, Japan', reelOrigin: 'Japan', reelStyle: 'Blended', reelCharacter: 'Citrus & Floral',
    notes: 'The Oracle speaks: toki means time, and time has revealed this blend\'s gentle nature. Light, bright, and effortless. Not every evening demands heaviness.' },
  { name: 'Hibiki Harmony', region: 'Osaka, Japan', reelOrigin: 'Japan', reelStyle: 'Blended Harmony', reelCharacter: 'Rose & Honey',
    notes: 'The Oracle speaks: harmony is not the absence of conflict but its resolution. Every sip reconciles malt and grain, youth and age. Peace awaits.' },
  { name: 'Yamazaki 12yr', region: 'Shimamoto, Japan', reelOrigin: 'Japan', reelStyle: 'Single Malt', reelCharacter: 'Peach & Cinnamon',
    notes: 'The Oracle speaks: the first Japanese single malt distillery still reigns supreme. Peach and gentle spice bow to craftsmanship. Tonight, honour the pioneer.' },

  // ── OTHER WORLD ──
  { name: 'Crown Royal Northern Harvest', region: 'Gimli, Canada', reelOrigin: 'Canada', reelStyle: 'Rye', reelCharacter: 'Spice & Ripe Pear',
    notes: 'The Oracle speaks: the frozen prairies of Manitoba yielded a rye that stunned the world. Northern grit, southern charm. The underestimated shall inherit the evening.' },
  { name: 'Kavalan Solist Vinho Barrique', region: 'Yilan, Taiwan', reelOrigin: 'Taiwan', reelStyle: 'Wine Cask', reelCharacter: 'Tropical & Chocolate',
    notes: 'The Oracle speaks: from the subtropical isle of Taiwan, a malt that defies geography. Mango, dark chocolate, and sheer audacity. The new world has arrived.' },
  { name: 'Amrut Fusion', region: 'Bangalore, India', reelOrigin: 'India', reelStyle: 'Single Malt', reelCharacter: 'Barley & Tropical Fruit',
    notes: 'The Oracle speaks: fusion is not compromise, it is alchemy. Indian and Scottish barley unite in Bangalore\'s heat. Boundaries are meant to be crossed.' },
  { name: 'Penderyn Madeira', region: 'Brecon Beacons, Wales', reelOrigin: 'Wales', reelStyle: 'Madeira Finished', reelCharacter: 'Honey & Dried Fruit',
    notes: 'The Oracle speaks: from the green valleys of Wales, a golden spirit kissed by Madeira. The dragon on the label guards a treasure. Claim it tonight.' },
  { name: 'Starward Nova', region: 'Melbourne, Australia', reelOrigin: 'Australia', reelStyle: 'Wine Cask', reelCharacter: 'Red Berry & Caramel',
    notes: 'The Oracle speaks: red wine barrels under the Melbourne sun created this antipodean marvel. The Southern Cross points to bold new horizons. Follow the stars.' }
];

let oracleUsed = [];
let slotSpinning = false;

// ── Web Audio API Sounds ──
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function generateTick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch(e) {}
}

function generateClunk() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    // Add a click layer
    const noise = ctx.createOscillator();
    const ng = ctx.createGain();
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(600, ctx.currentTime);
    noise.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
    ng.gain.setValueAtTime(0.1, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.06);
  } catch(e) {}
}

function generateChime() {
  try {
    const ctx = getAudioCtx();
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.8);
    });
  } catch(e) {}
}

// ── Reel Icons ──
const reelIcons = {
  // Origins
  'Speyside': '\u{1F3F0}', 'Islay': '\u{1F32A}', 'Highland': '\u{26F0}', 'Lowland': '\u{1F33F}',
  'Campbeltown': '\u{2693}', 'Kentucky': '\u{1F434}', 'Tennessee': '\u{1F3B5}', 'Indiana': '\u{1F33E}',
  'Ireland': '\u{2618}', 'Japan': '\u{26E9}', 'Canada': '\u{1F341}', 'Taiwan': '\u{1F30A}',
  'India': '\u{2728}', 'Wales': '\u{1F409}', 'Australia': '\u{2B50}', 'Vermont': '\u{1F332}',
  'Utah': '\u{1F3D4}', 'Maryland': '\u{1F980}',
  // Styles
  'Sherried': '\u{1F377}', 'Peated': '\u{1F525}', 'Bourbon': '\u{1F943}', 'Double Cask': '\u{1F6E2}',
  'Solera Vatted': '\u{1F3FA}', 'Cask Strength': '\u{1F4A5}', 'Bourbon Cask': '\u{1FAD7}',
  'Lightly Peated': '\u{1F4A8}', 'Triple Cask': '\u{2728}', 'Unpeated': '\u{1F343}',
  'Single Malt': '\u{1F451}', 'High Proof Bourbon': '\u{26A1}', 'Port Finished Bourbon': '\u{1F347}',
  'Wheated Bourbon': '\u{1F33E}', 'Rye': '\u{1F336}', 'Blended Rye': '\u{1F500}',
  'Single Pot Still': '\u{2697}', 'Wine Finished': '\u{1F377}', 'Blended': '\u{1F91D}',
  'Madeira Finished': '\u{1F347}', 'Blended Harmony': '\u{1F3B6}', 'Wine Cask': '\u{1F377}',
  'Tennessee Whiskey': '\u{1F3B8}',
  // Characters
  'Rich & Indulgent': '\u{1F36B}', 'Honey & Fruit': '\u{1F36F}', 'Smoke & Brine': '\u{1F32B}',
  'Dark Chocolate & Cherry': '\u{1F352}', 'Tropical & Floral': '\u{1F33A}', 'Smoke & Dried Fruit': '\u{1F525}',
  'Citrus & Malt': '\u{1F34B}', 'Sea Salt & Honey': '\u{1F30A}', 'Vanilla & Citrus': '\u{1F33C}',
  'Orange & Dark Chocolate': '\u{1F34A}', 'Toffee & Plum': '\u{1F36C}', 'Maritime & Nutty': '\u{2693}',
  'Cherry & Spice': '\u{1F352}', 'Vanilla & Caramel': '\u{1F36E}', 'Bold Spice & Oak': '\u{1F332}',
  'Oak & Vanilla': '\u{1FAB5}', 'Berry & Baking Spice': '\u{1FAD0}', 'Toasted Oak & Maple': '\u{1F341}',
  'Cherry & Vanilla': '\u{1F338}', 'Caramel & Citrus': '\u{2728}', 'Honey & Leather': '\u{1F36F}',
  'Butterscotch & Mineral': '\u{1F48E}', 'Toffee & Dried Fruit': '\u{1F36C}',
  'Pepper & Cinnamon': '\u{1F336}', 'Caramel & Dill': '\u{1F33F}', 'Anise & Pepper': '\u{2B50}',
  'Mint & Cinnamon': '\u{1F343}', 'Rich Spice & Caramel': '\u{1F525}',
  'Apple & Toasted Barley': '\u{1F34E}', 'Tropical & Vanilla': '\u{1F334}', 'Honey & Green Apple': '\u{1F34F}',
  'Raisin & Spice': '\u{1F347}', 'Oak & Marmalade': '\u{1F34A}', 'Herbal & Green': '\u{1F33F}',
  'Citrus & Floral': '\u{1F338}', 'Rose & Honey': '\u{1F339}', 'Peach & Cinnamon': '\u{1F351}',
  'Spice & Ripe Pear': '\u{1F350}', 'Tropical & Chocolate': '\u{1F36B}', 'Barley & Tropical Fruit': '\u{1F334}',
  'Honey & Dried Fruit': '\u{1F36F}', 'Red Berry & Caramel': '\u{1F353}'
};

// ── Reel Population ──
function getReelValues(key) {
  const vals = [...new Set(oracleWhiskeys.map(w => w[key]))];
  for (let i = vals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  return vals;
}

function populateReel(stripId, values) {
  const strip = document.getElementById(stripId);
  strip.innerHTML = '';
  const allVals = [];
  for (let r = 0; r < 4; r++) {
    values.forEach(v => allVals.push(v));
  }
  allVals.forEach(val => {
    const div = document.createElement('div');
    div.className = 'reel-symbol';
    const icon = reelIcons[val] || '\u{1F943}';
    div.innerHTML = '<span class="sym-icon">' + icon + '</span><span class="sym-text">' + val + '</span>';
    strip.appendChild(div);
  });
  return allVals;
}

// ── Main Pull Lever Function ──
function pullLever() {
  if (slotSpinning) return;
  slotSpinning = true;

  const machine = document.getElementById('slot-machine');
  const lever = document.getElementById('slot-lever');
  const btn = document.getElementById('slot-spin-btn');
  const resultEl = document.getElementById('slot-result');

  machine.classList.remove('jackpot');
  btn.disabled = true;

  // Lever animation
  if (lever) {
    lever.classList.remove('released');
    lever.classList.add('pulling');
    setTimeout(() => {
      lever.classList.remove('pulling');
      lever.classList.add('released');
    }, 300);
  }

  // Pick a whiskey
  if (oracleUsed.length === oracleWhiskeys.length) oracleUsed = [];
  const available = oracleWhiskeys.filter((_, i) => !oracleUsed.includes(i));
  const pick = available[Math.floor(Math.random() * available.length)];
  const idx = oracleWhiskeys.indexOf(pick);
  oracleUsed.push(idx);

  // Clear result
  resultEl.innerHTML = '<p class="slot-result-prompt" style="opacity:0.4;">The Oracle deliberates...</p>';

  // Get symbol height based on current reel
  const reelEl = document.getElementById('reel-1');
  const symbolH = reelEl.querySelector('.reel-symbol').offsetHeight;
  const reelH = reelEl.offsetHeight;
  const visibleSymbols = Math.round(reelH / symbolH);
  const centerOffset = Math.floor(visibleSymbols / 2);

  // Populate reels with target values in position
  const reelConfigs = [
    { stripId: 'reel-strip-1', key: 'reelOrigin', target: pick.reelOrigin },
    { stripId: 'reel-strip-2', key: 'reelStyle', target: pick.reelStyle },
    { stripId: 'reel-strip-3', key: 'reelCharacter', target: pick.reelCharacter }
  ];

  reelConfigs.forEach(cfg => {
    const values = getReelValues(cfg.key);
    // Ensure target is at a good landing position
    const targetIdx = values.indexOf(cfg.target);
    if (targetIdx > 0) {
      values.splice(targetIdx, 1);
      values.unshift(cfg.target);
    }
    const allVals = populateReel(cfg.stripId, values);
    // Store landing info
    const strip = document.getElementById(cfg.stripId);
    // Find the target in the third repetition for nice spin distance
    const valsPerSet = values.length;
    const landIdx = valsPerSet * 2; // Target is at index 0 of each set, so third set start
    cfg.landPosition = (landIdx - centerOffset) * symbolH;
    cfg.totalSymbols = allVals.length;
    cfg.symbolHeight = symbolH;
  });

  // Start spinning all reels
  const spinDuration = 1800;
  const staggerDelay = 500;

  reelConfigs.forEach((cfg, reelIdx) => {
    const strip = document.getElementById(cfg.stripId);
    const totalH = cfg.totalSymbols * cfg.symbolHeight;

    // Reset position
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';

    // Start fast spin animation
    let startTime = null;
    let tickTimer = 0;
    const spinSpeed = totalH / 0.5; // pixels per second for fast spin
    let currentY = 0;
    let spinning = true;

    const stopTime = spinDuration + (reelIdx * staggerDelay);

    function spinFrame(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const dt = elapsed - tickTimer;

      if (spinning) {
        // Fast continuous scroll
        currentY = (elapsed / 1000) * spinSpeed;
        currentY = currentY % totalH;
        strip.style.transform = `translateY(-${currentY}px)`;

        // Tick sound every ~150ms
        if (dt > 150) {
          generateTick();
          tickTimer = elapsed;
        }

        if (elapsed >= stopTime) {
          spinning = false;
          // Transition to final position
          strip.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
          strip.style.transform = `translateY(-${cfg.landPosition}px)`;
          generateClunk();

          // If last reel, reveal result
          if (reelIdx === 2) {
            setTimeout(() => {
              revealResult(pick);
            }, 700);
          }
          return;
        }
      }

      if (spinning) {
        requestAnimationFrame(spinFrame);
      }
    }

    requestAnimationFrame(spinFrame);
  });
}

// ── Reveal Result ──
function revealResult(pick) {
  const machine = document.getElementById('slot-machine');
  const resultEl = document.getElementById('slot-result');
  const btn = document.getElementById('slot-spin-btn');

  machine.classList.add('jackpot');
  generateChime();

  resultEl.innerHTML = `
    <div class="slot-result-name reveal">${pick.name}</div>
    <div class="slot-result-region reveal">${pick.region}</div>
    <p class="slot-result-notes reveal">${pick.notes}</p>
  `;

  setTimeout(() => {
    slotSpinning = false;
    btn.disabled = false;
  }, 800);
}

// ── Initialize Reels on Page Load ──
function initSlotReels() {
  if (!document.getElementById('reel-strip-1')) return;
  const configs = [
    { stripId: 'reel-strip-1', key: 'reelOrigin' },
    { stripId: 'reel-strip-2', key: 'reelStyle' },
    { stripId: 'reel-strip-3', key: 'reelCharacter' }
  ];
  configs.forEach(cfg => {
    const values = getReelValues(cfg.key);
    populateReel(cfg.stripId, values);
    // Position strip so middle symbol is centered
    const strip = document.getElementById(cfg.stripId);
    const symbolH = strip.querySelector('.reel-symbol')?.offsetHeight || 60;
    const reelH = strip.parentElement.offsetHeight || 180;
    const centerOffset = Math.floor((reelH / symbolH) / 2);
    const startIdx = Math.floor(Math.random() * values.length) + values.length;
    strip.style.transform = `translateY(-${(startIdx - centerOffset) * symbolH}px)`;
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlotReels);
} else {
  initSlotReels();
}

// ─── RECOMMENDATIONS ──────────────────────────────────────────
function toggleRec(btn) {
  const expanded = btn.nextElementSibling;
  const isOpen = expanded.classList.contains('open');
  document.querySelectorAll('.rec-expanded').forEach(e => e.classList.remove('open'));
  document.querySelectorAll('.rec-expand-btn').forEach(b => b.textContent = b.textContent.replace('▴', '▾'));
  if (!isOpen) {
    expanded.classList.add('open');
    btn.textContent = btn.textContent.replace('▾', '▴');
  }
}

// ─── AUDIENCE FORM ────────────────────────────────────────────
var _af = document.getElementById('audience-form');
if (_af) _af.addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  }).then(response => {
    document.getElementById('audience-form-wrap').style.display = 'none';
    document.getElementById('audience-confirm').style.display = 'block';
    form.reset();
  }).catch(error => {
    document.getElementById('audience-form-wrap').style.display = 'none';
    document.getElementById('audience-confirm').style.display = 'block';
  });
});

// ─── SCROLL ANIMATIONS ────────────────────────────────────────
// Scroll animations - desktop only (causes iOS crashes)
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.champion-frame, .event-card, .rec-card, .offender-card, .stat-box').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

function openBio(id) {
  document.getElementById('bio-modal-' + id).classList.add('active');
  // gate disabled
}
function closeBio(id) {
  document.getElementById('bio-modal-' + id).classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('bio-modal')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});


/* ═══ CHAPTER MAP INITIALIZATION ═════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

  /* ── Initialize Leaflet Map (desktop only — phones get the static image to avoid iOS memory crashes) ── */
  if (document.getElementById('map-container') && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var map = L.map('map-container', {
      center: [40, -95],
      zoom: 4,
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    /* Custom gold SVG marker icon */
    var goldIcon = L.divIcon({
      className: 'gold-marker-icon',
      html: '<svg class="gold-marker-pin" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M12 0 C5.373 0 0 5.373 0 12 c0 9 12 24 12 24 s12-15 12-24 C24 5.373 18.627 0 12 0z" fill="#d4a530" stroke="#9a6f1e" stroke-width="1"/>'
        + '<circle cx="12" cy="11" r="4.5" fill="#2a0e00" opacity="0.5"/>'
        + '<circle cx="12" cy="11" r="2.5" fill="#fdf5ea" opacity="0.9"/>'
        + '</svg>',
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -34]
    });

    /* Chapter data */
    var chapters = [
      { lat: 44.9591, lng: -89.6301, name: 'Wausau, WI', detail: 'Founding Chapter &middot; Headquarters' },
      { lat: 44.0247, lng: -88.5426, name: 'Oshkosh, WI', detail: 'Oshkosh Chapter &middot; Home of the Stooges' },
      { lat: 44.5236, lng: -89.5746, name: 'Stevens Point, WI', detail: 'Stevens Point Chapter' },
      { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN', detail: 'Twin Cities Chapter' },
      { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA', detail: 'West Coast Chapter &middot; Captain: Hot Rod' },
      { lat: 40.7128, lng: -74.0060, name: 'New York, NY', detail: 'New York Area Chapter &middot; President: Neil Doherty' },
      { lat: 32.7767, lng: -96.7970, name: 'Dallas, TX', detail: 'Texas Chapter &middot; THE Captain: Jeff Deviney' },
      { lat: 38.9784, lng: -76.4922, name: 'Annapolis, MD', detail: 'Historical &middot; The Birthplace Gathering, 2018' }
    ];

    chapters.forEach(function(ch) {
      L.marker([ch.lat, ch.lng], { icon: goldIcon })
        .addTo(map)
        .bindPopup(
          '<span class="popup-title">' + ch.name + '</span>'
          + '<span class="popup-detail">' + ch.detail + '</span>'
        );
    });
  }


  /* ═══ MEMBERS-ONLY SECTION INTERACTIONS ═════════════════════════════ */

  /* Gallery lightbox - click outside to close */
  var lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeGallery();
      }
    });
  }

  /* Close lightbox on Escape key */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeGallery();
    }
  });

});

/* ── Gallery Lightbox Functions ── */
function openGallery(el, caption) {
  var lightbox = document.getElementById('gallery-lightbox');
  var captionEl = document.getElementById('lightbox-caption');
  var imageArea = document.getElementById('lightbox-image-area');

  /* Check if the gallery item has an actual image */
  var img = el.querySelector('img');
  if (img) {
    imageArea.innerHTML = '<img loading="lazy" decoding="async" src="' + img.src + '" alt="' + caption + '">';
  } else {
    imageArea.innerHTML = '<span style="font-family:\'Cinzel\',serif; font-size:0.7rem; letter-spacing:0.2em; color:rgba(212,165,48,0.4); text-transform:uppercase; padding:3rem;">Photo Coming Soon</span>';
  }

  captionEl.textContent = caption;
  lightbox.classList.add('active');
  // gate disabled
}

function closeGallery() {
  var lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ── Document Accordion Toggle ── */
function toggleMemberDoc(el) {
  var body = el.nextElementSibling;
  var isOpen = el.classList.contains('open');

  /* Close all other open items in this accordion */
  var accordion = el.closest('.member-docs-accordion');
  if (accordion) {
    var allHeaders = accordion.querySelectorAll('.member-doc-header');
    allHeaders.forEach(function(h) {
      h.classList.remove('open');
      h.nextElementSibling.classList.remove('open');
    });
  }

  /* Toggle the clicked item */
  if (!isOpen) {
    el.classList.add('open');
    body.classList.add('open');
  }
}

// ═══ MEMBERS GATE ═══════════════════════════════════════════════════
function openMembersGate() {
  // Check if already unlocked this session
  if (sessionStorage.getItem('membersUnlocked') === 'true') {
    document.getElementById('members-area').style.display = '';
    setTimeout(function() {
      document.getElementById('members-area').scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return;
  }
  document.getElementById('members-gate').classList.add('active');
  document.getElementById('members-gate-input').focus();
}

function closeMembersGate() {
  document.getElementById('members-gate').classList.remove('active');
  document.getElementById('members-gate-input').value = '';
  document.getElementById('members-gate-error').textContent = '';
}

function checkMembersGate() {
  var input = document.getElementById('members-gate-input').value.toLowerCase().trim();
  var error = document.getElementById('members-gate-error');
  if (input === 'innersanctum!!!@gtrf2') {
    sessionStorage.setItem('membersUnlocked', 'true');
    closeMembersGate();
    document.getElementById('members-area').style.display = '';
    setTimeout(function() {
      document.getElementById('members-area').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    error.textContent = 'The Inner Sanctum does not recognize that passphrase.';
    document.getElementById('members-gate-input').value = '';
    setTimeout(function() { error.textContent = ''; }, 3000);
  }
}

// Enter key support for members gate
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('members-gate').classList.contains('active')) {
    checkMembersGate();
  }
  if (e.key === 'Escape' && document.getElementById('members-gate').classList.contains('active')) {
    closeMembersGate();
  }
});


function toggleMembersPassword() {
  var input = document.getElementById('members-gate-input');
  var btn = document.getElementById('members-pw-toggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    input.type = 'password';
    btn.textContent = 'SHOW';
  }
}

/* ═══ PROBATIONARY ROSTER ═════════════════════════════════════════════════
   To add a new pledge: copy one object below, paste it after the last
   entry, and fill in the fields.

   Photo: drop a compressed JPEG into the popwhiskey/ folder (filename
   convention: bw<firstname>.jpg) and reference its filename in `image`.
   Source PNGs in the folder are working artwork and are too large to
   load directly — always use a compressed copy.

   To prepare a portrait from a source PNG, run from popwhiskey/:

     python -c "from PIL import Image;        i=Image.open('bw<name>.PNG').convert('L');        w,h=i.size; i=i.resize((600,int(h*600/w)),Image.LANCZOS);        i.convert('RGB').save('bw<name>.jpg','JPEG',quality=80,optimize=True)"

   `standing` must be one of:
     'Probationary' | 'Secret Probationary' | 'Double Secret Probationary'
   ═════════════════════════════════════════════════════════════════ */
const probationaryRoster = [
  // Mr. Jordan Steltenpohl was inducted at the Great Northern Open on
  // 11 July 2026 and now sits on the Membership roll as an Associate Member.
  // He is therefore no longer an aspirant. Do not restore him here.
  {
    image: 'bwpayton.jpg',
    name: 'Mr. Payton Marki',
    region: 'Originally of Missouri, presently of Milwaukee',
    sponsor: 'Mr. Matt Lange',
    recognizedDate: '2023',
    standing: 'Secret Probationary',
    commodoreObserves: 'Mr. Marki has been a pledge of this Society since 2023, and the Commodore wishes it understood that this is not an oversight. It has been open to him to press his case at any hour of any of those three years. He has not pressed it. He appears, so far as anyone has been able to establish, to be entirely content. The membership has turned this over at length and remains unable to account for it, and the Commodore has stopped pretending he can. Mr. Marki is to be married upon the tenth of October, which may go some distance toward explaining the preoccupation. It does not excuse it.'
  },
  // ── The Boys from Ohio, and their father ──────────────────────────
  // `sponsor: null` renders the Society's standing non-disclosure.
  // `image: null` renders the awaited-likeness cameo.
  {
    image: '/images/thomas-kavanagh.jpg',
    focus: 'center 22%',   // landscape source — keep the head in frame
    name: 'Mr. Thomas Kavanagh',
    region: 'Of Columbus, Ohio &mdash; some 640 miles distant',
    sponsor: null,
    recognizedDate: '2020',
    standing: 'Double Secret Probationary',
    commodoreObserves: 'Mr. Kavanagh gave his word upon the instant the question was put to him, and this Society admired the performance greatly at the time. He has since attended nothing. The Commodore continues to hold the word in the highest regard and has begun quietly to hope that it might one day arrive accompanied by the man.'
  },
  {
    image: '/images/john-kavanagh.jpg',
    focus: 'center 22%',   // landscape source — keep the head in frame
    name: 'Mr. John Kavanagh',
    region: 'Of Columbus, Ohio &mdash; some 640 miles distant',
    sponsor: null,
    recognizedDate: '2020',
    standing: 'Double Secret Probationary',
    commodoreObserves: 'Mr. Kavanagh pronounced his brother’s pledge to be smoke, said so to his brother’s face, and was proven entirely correct — a vindication somewhat undercut by his own absence on the very same afternoon. The Society has entered the prediction as sound. The Society has entered the predictor’s whereabouts separately.'
  },
  {
    image: null,
    name: 'Mr. Paul Kavanagh',
    region: 'Of Columbus, Ohio &middot; father to Thomas and John',
    sponsor: null,
    recognizedDate: '2026',
    standing: 'Probationary',
    commodoreObserves: 'Mr. Kavanagh regarded an arithmetic that had defeated this Society for six years and proposed, without ceremony, that we should simply drive to him. The Commodore has reviewed the proposal at length and been unable to locate the flaw in it, which is not a sensation this office is accustomed to. That it fell to the father to arrange what the sons could not has been noted, and shall go on being noted.'
  }
];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function renderProbationaryRoster() {
  const container = document.getElementById('probationary-roster');
  if (!container) return;

  if (!probationaryRoster.length) {
    container.outerHTML = '<p class="roster-empty">The Society has, at present, no aspirants under formal recognition.</p>';
    return;
  }

  container.innerHTML = probationaryRoster.map(p => {
    const standingSlug = p.standing.toLowerCase().replace(/\s+/g, '-');

    // No likeness on file — the Archivist has been informed and is waiting.
    const portrait = p.image
      ? `<img loading="lazy" decoding="async" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="pledge-photo"${p.focus ? ` style="object-position:${escapeHtml(p.focus)}"` : ''}>`
      : `<div class="pledge-photo pledge-photo--awaited" role="img" aria-label="No likeness on file for ${escapeHtml(p.name)}">
           <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
             <circle cx="40" cy="36" r="17" stroke="rgba(212,165,48,0.45)" stroke-width="1.2" fill="rgba(212,165,48,0.06)"/>
             <path d="M11 100 C11 74 24 62 40 62 C56 62 69 74 69 100 Z" stroke="rgba(212,165,48,0.45)" stroke-width="1.2" fill="rgba(212,165,48,0.06)"/>
           </svg>
           <span class="pledge-photo-awaited-note">Likeness awaited</span>
         </div>`;

    // The Society is under no obligation to disclose a sponsor, and often doesn't.
    const sponsor = p.sponsor
      ? escapeHtml(p.sponsor)
      : '<span class="pledge-undisclosed">The Society does not say</span>';

    return `
    <article class="pledge-card">
      <div class="pledge-photo-wrap">
        ${portrait}
        <div class="pledge-stamp pledge-stamp--${standingSlug}">${escapeHtml(p.standing)}</div>
      </div>
      <div class="pledge-info">
        <div class="pledge-name">${escapeHtml(p.name)}</div>
        <!-- region is author-written and may carry entities (&mdash;), so it is
             inserted raw. It comes from the array above, never from a visitor. -->
        <div class="pledge-region">${p.region}</div>
        <dl class="pledge-meta">
          <dt>Sponsor</dt><dd>${sponsor}</dd>
          <dt>Recognized</dt><dd>${escapeHtml(p.recognizedDate)}</dd>
          <dt>Standing</dt><dd>${escapeHtml(p.standing)}</dd>
        </dl>
        <div class="pledge-observation">
          <span class="pledge-observation-label">The Commodore observes</span>
          <p>&ldquo;${escapeHtml(p.commodoreObserves)}&rdquo;</p>
        </div>
      </div>
    </article>
  `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', renderProbationaryRoster);




/* ═══ RECENT PROCEEDINGS + THE PAIRING ORACLE ════════════════════════════
   The living-content layer on the front page.

   Both read plain JSON files that the Gazette Engine rewrites and commits:
       /content/dispatches.json   — the lead item and the short dispatches
       /content/pairings.json     — Sir Reginald's pre-written verdicts

   To change what the front page says, edit those files. No code changes.

   The Oracle makes NO network request when a visitor consults it — the whole
   batch of verdicts is fetched once on page load and picked from in the
   browser. Clicking it costs nothing.

   Every function below returns early when its container is absent, because
   app.js is loaded on every page of the site.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── The band ──────────────────────────────────────────────────────── */
function renderProceedings() {
  var host = document.getElementById('proceedings-grid');
  if (!host) return;

  fetch('/content/dispatches.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('dispatches ' + r.status); return r.json(); })
    .then(function (data) {
      var lead = data.lead;
      var items = data.dispatches || [];

      var leadHtml = '';
      if (lead) {
        leadHtml =
          '<article class="lead-card rise">' +
            countdownMarkup(lead) +
            '<div class="lead-kicker">' + escapeHtml(lead.kicker || 'Of Recent Note') + '</div>' +
            '<h3 class="lead-title">' + escapeHtml(lead.title) + '</h3>' +
            '<div class="lead-byline">' + escapeHtml(lead.byline || 'The Society') +
              (lead.dateline ? '<span class="lead-dateline">' + escapeHtml(lead.dateline) + '</span>' : '') +
            '</div>' +
            '<p class="lead-standfirst">' + escapeHtml(lead.standfirst || '') + '</p>' +
            (lead.href ? '<a class="lead-more" href="' + escapeHtml(lead.href) + '">Read the dispatch</a>' : '') +
          '</article>';
      }

      var cards = items.map(function (d, i) {
        var notice = (d.kind === 'notice');
        return '<article class="dispatch-card rise' + (notice ? ' is-notice' : '') + '" style="transition-delay:' + (i * 90) + 'ms">' +
            countdownMarkup(d, 'countdown-sm') +
            (d.byline ? '<div class="dispatch-card-byline">' + escapeHtml(d.byline) + '</div>' : '') +
            '<h4 class="dispatch-card-title">' + escapeHtml(d.title) + '</h4>' +
            '<p class="dispatch-card-body">' + escapeHtml(d.body || '') + '</p>' +
            (d.href ? '<a class="dispatch-card-link" href="' + escapeHtml(d.href) + '">' +
                        escapeHtml(d.linkText || 'Read on') + '</a>' : '') +
          '</article>';
      }).join('');

      host.innerHTML =
        leadHtml +
        '<div class="proceedings-rail">' +
          '<div class="rail-head">Short Dispatches</div>' +
          cards +
          buildOracleShell() +
        '</div>';

      initPairingOracle();
      initReveals();
    })
    .catch(function (err) {
      // Nothing to show is better than something broken — retire the band.
      console.warn('Proceedings unavailable:', err);
      var section = document.getElementById('proceedings');
      if (section) section.remove();
    });
}

/* ── The Pairing Oracle ────────────────────────────────────────────── */
function buildOracleShell() {
  return '' +
    '<div class="oracle-box">' +
      '<div class="oracle-head">The Pairing Oracle</div>' +
      '<div class="oracle-sub">Sir Reginald Hiccupsworth III presides</div>' +
      '<div class="oracle-stage" id="oracle-stage">' +
        '<p class="oracle-idle">Put a pop and a whiskey before him and he shall rule upon the pairing. He has never once declined to.</p>' +
      '</div>' +
      '<button class="oracle-btn" id="oracle-btn" type="button">Consult the Oracle</button>' +
    '</div>';
}

var oraclePairings = [];
var oracleRecent = [];

function initPairingOracle() {
  var btn = document.getElementById('oracle-btn');
  if (!btn) return;

  fetch('/content/pairings.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('pairings ' + r.status); return r.json(); })
    .then(function (data) {
      oraclePairings = data.verdicts || [];
      if (!oraclePairings.length) throw new Error('no verdicts');
      btn.addEventListener('click', consultOracle);
    })
    .catch(function (err) {
      console.warn('Oracle unavailable:', err);
      var box = btn.closest('.oracle-box');
      if (box) box.remove();
    });
}

/* Picks at random, avoiding anything shown in the last third of the batch,
   so a visitor clicking repeatedly does not see the same verdict twice. */
function pickPairing() {
  var memory = Math.max(1, Math.floor(oraclePairings.length / 3));
  var pool = oraclePairings.filter(function (p) { return oracleRecent.indexOf(p.id) === -1; });
  if (!pool.length) { oracleRecent = []; pool = oraclePairings; }

  var pick = pool[Math.floor(Math.random() * pool.length)];
  oracleRecent.push(pick.id);
  while (oracleRecent.length > memory) oracleRecent.shift();
  return pick;
}

function consultOracle() {
  var stage = document.getElementById('oracle-stage');
  var btn = document.getElementById('oracle-btn');
  if (!stage || !btn) return;

  var pick = pickPairing();

  stage.classList.add('is-turning');
  btn.disabled = true;

  setTimeout(function () {
    stage.innerHTML =
      '<div class="oracle-pairing">' +
        escapeHtml(pick.pop) +
        '<span class="oracle-amp">with</span>' +
        escapeHtml(pick.whiskey) +
      '</div>' +
      '<div class="oracle-verdict">' + escapeHtml(pick.verdict) + '</div>' +
      '<p class="oracle-ruling">&ldquo;' + escapeHtml(pick.ruling) + '&rdquo;' +
        '<span class="oracle-attrib">Sir Reginald Hiccupsworth III &middot; Chief Critic</span>' +
      '</p>';
    stage.classList.remove('is-turning');
    btn.disabled = false;
    btn.textContent = 'Consult him again';
  }, 260);
}

/* ── The archive (dispatches/index.html) ───────────────────────────── */
function renderDispatchArchive() {
  var list = document.getElementById('archive-list');
  if (!list) return;

  fetch('/content/dispatches.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('dispatches ' + r.status); return r.json(); })
    .then(function (data) {
      var items = data.archive || [];
      if (!items.length) {
        list.innerHTML = '<p class="archive-intro">The record stands empty. It will not remain so.</p>';
        return;
      }
      list.innerHTML = items.map(function (a) {
        return '<a class="archive-item" href="' + escapeHtml(a.href) + '">' +
            '<div class="archive-item-kicker">' + escapeHtml(a.kicker || 'Dispatch') + '</div>' +
            '<div class="archive-item-title">' + escapeHtml(a.title) + '</div>' +
            '<div class="archive-item-meta">' + escapeHtml(a.byline || 'The Society') +
              (a.dateDisplay ? ' &middot; ' + escapeHtml(a.dateDisplay) : '') + '</div>' +
            '<div class="archive-item-standfirst">' + escapeHtml(a.standfirst || '') + '</div>' +
          '</a>';
      }).join('');
    })
    .catch(function (err) {
      console.warn('Archive unavailable:', err);
      list.innerHTML = '<p class="archive-intro">The record is momentarily out of reach. The Archivist has been notified and is, as ever, unsurprised.</p>';
    });
}

document.addEventListener('DOMContentLoaded', renderProceedings);
document.addEventListener('DOMContentLoaded', renderDispatchArchive);


/* ═══ THE WIRE ═══════════════════════════════════════════════════════════
   A persistent crawl across the top of EVERY page — the Society's running
   intelligence. Items come from the "wire" array in /content/dispatches.json.

   It is deliberately unhurried: a slow, continuous scroll that pauses when
   hovered or focused, and stops dead for anyone who has asked their system
   for reduced motion. At the right-hand end sits the Council lamp, which
   pulses and never resolves into anything.
   ═══════════════════════════════════════════════════════════════════════ */

var WIRE_SECONDS_PER_ITEM = 7;   // higher = slower crawl

function buildWire() {
  if (document.getElementById('the-wire')) return;

  var bar = document.createElement('div');
  bar.id = 'the-wire';
  bar.setAttribute('role', 'complementary');
  bar.setAttribute('aria-label', 'Society wire');
  bar.innerHTML =
    '<div class="wire-label">The Wire</div>' +
    '<div class="wire-window"><div class="wire-track" id="wire-track"></div></div>' +
    '<div class="wire-lamp" title="The Council of Elders is in session. It does not stop.">' +
      '<span class="wire-lamp-dot"></span>' +
      '<span class="wire-lamp-text">The Council is sitting<small>In session &middot; always</small></span>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);
  document.body.classList.add('has-wire');

  applyCouncilStatus();

  fetch('/content/dispatches.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('wire ' + r.status); return r.json(); })
    .then(function (data) {
      var items = data.wire || [];
      if (!items.length) throw new Error('no wire items');

      var one = items.map(function (w) {
        var body = escapeHtml(w.text);
        var piece = w.href
          ? '<a class="wire-item" href="' + escapeHtml(w.href) + '">' + body + '</a>'
          : '<span class="wire-item">' + body + '</span>';
        return piece + '<span class="wire-sep">&#10022;</span>';
      }).join('');

      var track = document.getElementById('wire-track');
      // The run is printed twice so the loop is seamless at -50%.
      track.innerHTML = '<div class="wire-run">' + one + '</div><div class="wire-run" aria-hidden="true">' + one + '</div>';
      track.style.animationDuration = (items.length * WIRE_SECONDS_PER_ITEM) + 's';
    })
    .catch(function (err) {
      console.warn('The Wire is dark:', err);
      bar.remove();
      document.body.classList.remove('has-wire');
    });
}

/* ═══ SCROLL REVEALS ═════════════════════════════════════════════════════
   Cards rise into place as they are reached. Anything already on screen at
   load is shown immediately, so nothing is ever stuck invisible.
   ═══════════════════════════════════════════════════════════════════════ */
function initReveals() {
  var targets = document.querySelectorAll('.rise');
  if (!targets.length) return;

  var showAll = function () {
    targets.forEach(function (el) { el.classList.add('is-risen'); });
  };

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) { showAll(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-risen'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });

  // Failsafe. The animation is a flourish; the content is not optional. If the
  // observer has not fired within two seconds — a background tab, a prerender,
  // an engine that throttles observers on hidden documents — show everything
  // anyway. Content must never be left invisible waiting on a nicety.
  setTimeout(showAll, 2000);
}

/* ═══ THE COUNTDOWN ══════════════════════════════════════════════════════
   Days remaining until a dated event. Recomputed on every load, so the
   front page is literally different tomorrow.
   ═══════════════════════════════════════════════════════════════════════ */
function daysUntil(iso) {
  if (!iso) return null;
  var parts = iso.split('-');
  var target = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

/* Renders either a live countdown (item.countdownTo) or a fixed figure
   (item.stat = {n, word}). Works on the lead card and on dispatch cards. */
function countdownMarkup(item, extraClass) {
  var n, word;

  if (item.stat && item.stat.n) {
    n = escapeHtml(String(item.stat.n));
    word = item.stat.word || '';
  } else {
    var d = daysUntil(item.countdownTo);
    if (d === null || d < 0) return '';
    if (d > 1)        { n = d; word = 'days ' + (item.countdownLabel || ''); }
    else if (d === 1) { n = 1; word = 'day ' + (item.countdownLabel || ''); }
    else              { n = '&#10022;'; word = 'the day is upon us'; }
  }

  return '<div class="lead-countdown' + (extraClass ? ' ' + extraClass : '') + '">' +
           '<span class="countdown-n">' + n + '</span>' +
           '<span class="countdown-word">' + escapeHtml(word.trim()) + '</span>' +
         '</div>';
}

document.addEventListener('DOMContentLoaded', buildWire);


/* ═══ THE COUNCIL'S STATUS ═══════════════════════════════════════════════
   The lamp is not always green. The Council sits, adjourns, and reconvenes,
   and the beacon reports whichever it is presently doing.

   Two sources, in order of authority:

     1. An override set by the Commodore (POST /api/council from the control
        page at /members/council). This wins while it lasts.
     2. AUTO — derived from the clock. The state is seeded from the current
        half-hour block, so every visitor on earth sees the SAME state at the
        same moment, and it changes on its own through the day. Randomising
        per-visitor would mean the Council was sitting and not sitting at
        once, which is a liberty even this Society will not take.
   ═══════════════════════════════════════════════════════════════════════ */

var COUNCIL_PRESENTATION = {
  sitting:   { label: 'The Council is sitting', sub: 'In session',           cls: 'is-sitting' },
  convening: { label: 'The Council is convening', sub: 'Members are arriving', cls: 'is-convening' },
  risen:     { label: 'The Council has risen',  sub: 'Adjourned &middot; no ruling given', cls: 'is-risen-council' }
};

/* Deterministic, clock-seeded. Same answer for everyone, changes every 30 min.
   Weighted so the Council is most often sitting — it is, after all, the joke
   that the thing never quite stops. */
function councilAutoStatus(now) {
  var block = Math.floor((now || Date.now()) / (30 * 60 * 1000));
  // cheap integer hash so consecutive blocks do not march in a pattern
  var h = block * 2654435761 % 4294967296;
  h = (h ^ (h >>> 13)) >>> 0;
  var r = (h % 100);
  if (r < 55) return 'sitting';
  if (r < 78) return 'convening';
  return 'risen';
}

function paintCouncilLamp(status) {
  var lamp = document.querySelector('.wire-lamp');
  var text = document.querySelector('.wire-lamp-text');
  if (!lamp || !text) return;

  var p = COUNCIL_PRESENTATION[status] || COUNCIL_PRESENTATION.sitting;
  lamp.classList.remove('is-sitting', 'is-convening', 'is-risen-council');
  lamp.classList.add(p.cls);
  lamp.setAttribute('title', p.label);
  text.innerHTML = escapeHtml(p.label) + '<small>' + p.sub + '</small>';
}

function applyCouncilStatus() {
  // Paint the clock-derived state immediately so the lamp is never blank,
  // then let an override from the Worker correct it if one exists.
  paintCouncilLamp(councilAutoStatus());

  fetch('/api/council', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      var s = data.status;
      paintCouncilLamp(s && s !== 'auto' ? s : councilAutoStatus());
    })
    .catch(function () { /* no Worker (static preview) — the clock stands. */ });

  // Re-evaluate every few minutes so a long-open tab keeps up.
  setInterval(applyCouncilStatusQuietly, 4 * 60 * 1000);
}

function applyCouncilStatusQuietly() {
  fetch('/api/council', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var s = data && data.status;
      paintCouncilLamp(s && s !== 'auto' ? s : councilAutoStatus());
    })
    .catch(function () { paintCouncilLamp(councilAutoStatus()); });
}
