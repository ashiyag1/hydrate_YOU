/* ═══════════════════════════════════════════
   FLOWSTATE — Shared JavaScript
   • localStorage persistence
   • AI-powered daily quotes (Anthropic API)
   • Toast notifications
   • Ripple effects
   • Shared nav active state
═══════════════════════════════════════════ */

'use strict';

// ── STORAGE HELPERS ──────────────────────────────────────────────
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem('fs_' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem('fs_' + key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  del(key) { localStorage.removeItem('fs_' + key); }
};

// ── DATE HELPERS ──────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtTime = () => {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
};

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(msg, type = 'default', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  const icons = { success: '✓', error: '✕', default: '💧' };
  t.className = 'toast ' + (type !== 'default' ? type : '');
  t.innerHTML = `<span>${icons[type] || '·'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── RIPPLE ────────────────────────────────────────────────────────
function addRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple-el';
  const size = Math.max(rect.width, rect.height) * 2;
  const x = (e?.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e?.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
  r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  el.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

// ── QUOTES ENGINE ─────────────────────────────────────────────────
// Large local bank (never runs out, seeded by day-of-year for consistency)
const QUOTES_BANK = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" },
  { text: "To keep the body in good health is a duty, otherwise we shall not be able to keep our minds strong and clear.", author: "Buddha" },
  { text: "He who has health has hope; and he who has hope has everything.", author: "Thomas Carlyle" },
  { text: "An apple a day keeps the doctor away. A glass of water makes it sweeter.", author: "Unknown" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
  { text: "The first wealth is health.", author: "Ralph Waldo Emerson" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Augusta F. Kantra" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { text: "Water is the driving force of all nature.", author: "Leonardo da Vinci" },
  { text: "Thousands have lived without love, not one without water.", author: "W.H. Auden" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The body achieves what the mind believes.", author: "Unknown" },
  { text: "Movement is medicine.", author: "Unknown" },
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The human body is the best picture of the human soul.", author: "Ludwig Wittgenstein" },
  { text: "To ensure good health: eat lightly, breathe deeply, live moderately, cultivate cheerfulness.", author: "William Londen" },
  { text: "If you don't make time for your wellness, you will be forced to make time for your illness.", author: "Unknown" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Your future self is watching you right now through your memories.", author: "Aubrey de Grey" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Good things come to those who sweat.", author: "Unknown" },
  { text: "Hydration is the foundation of every health goal you have.", author: "Unknown" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "You are enough, a thousand times enough.", author: "Unknown" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Strength does not come from the body. It comes from the will of the soul.", author: "Gandhi" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin" },
  { text: "Your health is an investment, not an expense.", author: "Unknown" },
  { text: "Every morning is a new beginning. Take a deep breath and start again.", author: "Unknown" },
  { text: "Self-care is not selfish. You cannot pour from an empty cup.", author: "Unknown" },
  { text: "The calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Be patient with yourself. Self-growth is tender; it's holy ground.", author: "Stephen Covey" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The quieter you become, the more you are able to hear.", author: "Rumi" },
  { text: "Within you, there is a stillness and sanctuary to which you can retreat at any time.", author: "Herman Hesse" },
  { text: "One step at a time is all it takes to get you there.", author: "Emily Dickinson" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "You don't need a new year to make a change. Just a new day.", author: "Unknown" },
  { text: "Nurture your mind with great thoughts; to believe in the heroic makes heroes.", author: "Benjamin Disraeli" },
  { text: "Life is not about waiting for the storm to pass but learning to dance in the rain.", author: "Vivian Greene" },
  { text: "Everything you need is already inside you.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "A year from now you will wish you had started today.", author: "Karen Lamb" },
];

function getDailyQuoteLocal() {
  const day = Math.floor(Date.now() / 86400000); // days since epoch
  return QUOTES_BANK[day % QUOTES_BANK.length];
}

async function fetchAIQuote(forceRefresh = false) {
  const cacheKey = 'quote_' + today();
  if (!forceRefresh) {
    const cached = Store.get(cacheKey);
    if (cached) return cached;
  }

  // Try Anthropic API for a fresh unique quote
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Give me one inspiring quote about health, wellness, water, habits, mindfulness, or personal growth from a real famous person (author, scientist, philosopher, athlete, leader). 
Return ONLY a JSON object: {"text":"quote here","author":"Full Name","category":"health|habits|mindfulness|motivation"}
Make it feel calming and motivating. Do NOT repeat: ${JSON.stringify(Store.get('recent_quotes') || []).slice(0,200)}`
        }]
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      const raw = data.content.map(b => b.text || '').join('');
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.text && parsed.author) {
        Store.set(cacheKey, parsed);
        // Track recent to avoid repeats
        const recent = Store.get('recent_quotes') || [];
        recent.unshift(parsed.text.slice(0,50));
        Store.set('recent_quotes', recent.slice(0, 30));
        return parsed;
      }
    }
  } catch (e) { /* fallback below */ }

  // Fallback to local bank
  const fallback = getDailyQuoteLocal();
  Store.set(cacheKey, fallback);
  return fallback;
}

async function renderQuoteBanner(containerId, showRefresh = true) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<div class="quote-text quote-loading" style="color:rgba(255,255,255,0.4);font-style:italic">Loading today's quote…</div>`;

  const q = await fetchAIQuote();

  el.innerHTML = `
    ${showRefresh ? `<button class="quote-refresh" id="quoteRefreshBtn" title="New quote">↻</button>` : ''}
    <div class="quote-text">${q.text}</div>
    <div class="quote-author">— ${q.author}</div>
    ${q.category ? `<div class="quote-tag">✦ ${q.category}</div>` : ''}
  `;

  if (showRefresh) {
    document.getElementById('quoteRefreshBtn')?.addEventListener('click', async () => {
      el.innerHTML = `<div class="quote-text quote-loading" style="color:rgba(255,255,255,0.4);font-style:italic">Finding a new quote…</div>`;
      Store.del('quote_' + today());
      const q2 = await fetchAIQuote(true);
      el.innerHTML = `
        <button class="quote-refresh" id="quoteRefreshBtn" title="New quote">↻</button>
        <div class="quote-text">${q2.text}</div>
        <div class="quote-author">— ${q2.author}</div>
        ${q2.category ? `<div class="quote-tag">✦ ${q2.category}</div>` : ''}
      `;
      document.getElementById('quoteRefreshBtn')?.addEventListener('click', () => location.reload());
    });
  }
}

// ── NAV ACTIVE STATE ──────────────────────────────────────────────
function initNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', initNav);
