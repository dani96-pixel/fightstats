// main.js — Navegación, home page, lista de eventos

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────

function navigate(page, id = null) {
  const hash = id ? `#${page}/${id}` : `#${page}`;
  window.location.hash = hash;
}

function router() {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, id] = hash.split('/');
  // Google Analytics: registrar navegación por hash
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_path: '/' + hash,
      page_title: page
    });
  }
  
  // Ocultar todas las páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Actualizar nav activo
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  // Mostrar página correcta
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
window.addEventListener('DOMContentLoaded', () => {
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
    const res = await fetch('data/stats.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const g = data.global;

    el.innerHTML = `
      <div class="stat-block">
        <div class="stat-num">${g.accuracy.toFixed(1)}%</div>
        <div class="stat-label">Accuracy global</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">${g.total_fights}</div>
        <div class="stat-label">Peleas analizadas</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">${g.correct_predictions}</div>
        <div class="stat-label">Predicciones correctas</div>
      </div>
    `;
  } catch {
    el.innerHTML = `
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">Accuracy global</div></div>
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">Peleas analizadas</div></div>
      <div class="stat-block"><div class="stat-num">—</div><div class="stat-label">Correctas</div></div>
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

    const upcoming = data.events.find(e => e.status === 'upcoming');
    if (!upcoming) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No hay eventos próximos anunciados.</p>';
      return;
    }

    el.innerHTML = buildEventCard(upcoming);
    el.querySelector('.event-card').addEventListener('click', () => navigate('event', upcoming.id));
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No se pudo cargar el próximo evento.</p>';
  }
}

// ─────────────────────────────────────────────
// EVENTS PAGE
// ─────────────────────────────────────────────

async function renderEvents() {
  const container = document.getElementById('events-list');
  container.innerHTML = '<div class="loading">Cargando eventos</div>';

  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.events.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);">No hay eventos disponibles.</p>';
      return;
    }

    // Ordenar: más recientes primero
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
        <p>No se pudo cargar la lista de eventos. Intenta recargar la página.</p>
      </div>`;
  }
}

function buildEventCard(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

  const statusLabel = {
    completed: 'Completado',
    upcoming:  'Próximo',
  }[ev.status] || ev.status;

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
          <div class="event-location">${ev.fights_analyzed > 0 ? `${ev.fights_analyzed} peleas analizadas` : 'Análisis próximamente'}</div>
        </div>
      </div>
      <div class="event-card-right">
        <span class="status-badge ${ev.status}">${statusLabel}</span>
        ${rightContent}
      </div>
    </div>
  `;
}
