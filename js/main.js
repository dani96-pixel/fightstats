// main.js — Navigation, home page, events list (i18n-aware)

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────

function navigate(page, id = null) {
  const hash = id ? `#${page}/${id}` : `#${page}`;
  window.location.hash = hash;
}

function router() {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, id] = hash.split('/');

  // Google Analytics
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_path: '/' + hash,
      page_title: page
    });
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Update active nav
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  // Show correct page
  switch (page) {
    case 'home':
      document.getElementById('page-home').classList.add('active');
      renderHome();
      break;
    case 'events':
      document.getElementById('page-events').classList.add('active');
      renderEvents();
      break;
    case 'event':
      document.getElementById('page-event').classList.add('active');
      if (id) renderEvent(id);
      break;
    case 'track-record':
      document.getElementById('page-track-record').classList.add('active');
      renderTrackRecord();
      break;
    case 'about':
      document.getElementById('page-about').classList.add('active');
      break;
    default:
      document.getElementById('page-home').classList.add('active');
      renderHome();
  }

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n first, then route
  await initI18n();
  setupNavListeners();
  router();
});

function setupNavListeners() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // Logo → home
  document.querySelector('.logo').addEventListener('click', () => navigate('home'));
}

// ─────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────

async function renderHome() {
  await Promise.all([
    renderHomeStats(),
    renderNextEvent(),
  ]);
}

async function renderHomeStats() {
  const el = document.getElementById('home-stats');
  if (!el) return;

  try {
    const res = await fetch(localizeDataPath('data/stats.json'));
    if (!res.ok) throw new Error();
    const data = await res.json();
    const g = data.global;

    el.innerHTML = `
      <div class="stat-block">
        <div class="stat-num">${g.accuracy.toFixed(1)}%</div>
        <div class="stat-label">${t('stat_accuracy')}</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">${g.total_fights}</div>
        <div class="stat-label">${t('stat_fights')}</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">${g.correct_predictions}</div>
        <div class="stat-label">${t('stat_correct')}</div>
      </div>
    `;
  } catch {
    el.innerHTML = `
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">${t('stat_accuracy')}</div></div>
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">${t('stat_fights')}</div></div>
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">${t('stat_correct_short')}</div></div>
    `;
  }
}

async function renderNextEvent() {
  const el = document.getElementById('home-next-event');
  if (!el) return;

  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error();
    const data = await res.json();

    const upcomingAll = data.events.filter(e => e.status === 'upcoming');
    const upcoming = upcomingAll.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (!upcoming) {
      el.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">${t('home_no_upcoming')}</p>`;
      return;
    }

    el.innerHTML = buildEventCard(upcoming);
    el.querySelector('.event-card').addEventListener('click', () => navigate('event', upcoming.id));
  } catch {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">${t('home_load_error')}</p>`;
  }
}

// ─────────────────────────────────────────────
// EVENTS PAGE
// ─────────────────────────────────────────────

async function renderEvents() {
  const container = document.getElementById('events-list');
  container.innerHTML = `<div class="loading">${t('events_loading')}</div>`;

  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.events.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);">${t('events_empty')}</p>`;
      return;
    }

    // Sort: most recent first
    const sorted = [...data.events].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(e => buildEventCard(e)).join('');

    container.querySelectorAll('.event-card').forEach(card => {
      const id = card.dataset.eventId;
      card.addEventListener('click', () => {
        navigate('event', id);
      });
    });

  } catch {
    container.innerHTML = `
      <div class="error-state">
        <p>${t('events_error')}</p>
      </div>`;
  }
}

function buildEventCard(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString(getDateLocale(), { month: 'short' }).toUpperCase();

  const statusLabel = t('status_' + ev.status);

  let fightsLabel;
  if (ev.fights_analyzed > 0) {
    fightsLabel = ev.fights_analyzed === 1
      ? t('event_fights_analyzed_one')
      : t('event_fights_analyzed', { count: ev.fights_analyzed });
  } else {
    fightsLabel = t('event_analysis_soon');
  }

  const rightContent = `<span class="event-arrow">→</span>`;

  return `
    <div class="event-card" data-event-id="${ev.id}" data-status="${ev.status}">
      <div class="event-card-left">
        <div class="event-date-block">
          <div class="month">${month}</div>
          <div class="day">${day}</div>
        </div>
        <div class="event-info">
          <div class="event-name">${ev.name}</div>
          <div class="event-location">${fightsLabel}</div>
        </div>
      </div>
      <div class="event-card-right">
        <span class="status-badge ${ev.status}">${statusLabel}</span>
        ${rightContent}
      </div>
    </div>
  `;
}